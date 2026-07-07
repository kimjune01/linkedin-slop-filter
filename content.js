/*
 * LinkedIn Slop Filter
 * Copyright (C) 2026  June Kim
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version. See the LICENSE file for details.
 *
 * Runs in the page's MAIN world so it can reach Chrome's built-in on-device
 * model (`LanguageModel`, Gemini Nano). No network, no chrome.* permissions.
 */
(() => {
  "use strict";

  const THRESHOLD = 7;                 // flag posts scoring >= this (0-10)
  const MIN_CHARS = 40;                // ignore very short / image-only posts
  const LS_KEY = "lsf_enabled";
  const cache = new Map();             // post text -> {slop, why}
  let session = null;
  let sessionPromise = null;
  let hiddenCount = 0;
  let queue = Promise.resolve();       // serialize model calls

  // --- The prompt (see README for the research behind it) --------------------
  const buildPrompt = (post) => `You are a filter that catches the SHITTIEST low-effort LinkedIn "slop" posts — the AI-generated / copy-pasted motivational garbage. Be strict: only flag the truly bad ones. A real person sharing a specific experience, a job posting, a genuine question, or a technical note is NOT slop even if it's short or casual.

Score the post 0-10 for SLOP, using these signals:

STRONG slop signals (each adds a lot):
- Pseudo-profound life lessons that are too vague to test ("success isn't about X, it's about Y", "let that sink in")
- Fake-humble / fake-excited openers: "humbled", "thrilled", "excited to announce", "had the pleasure of"
- Engagement bait: "Agree?", "Thoughts?", "Drop a comment", "UNPOPULAR OPINION", emoji bullet lists
- A tiny anecdote inflated into universal wisdom for everyone
- Buzzwords with no substance: hustle, grind, synergy, harness, unleash, leverage, mindset

The DECIDING factor — weigh this heaviest:
- Does the post contain ANY concrete specific detail? Real numbers, real names, technical specifics, an actual problem being solved, a genuine question. If YES -> score LOW even if the style is punchy. If it's all generic advice that could apply to anyone -> score HIGH.

Return ONLY JSON: {"slop": 0-10, "flag": true|false, "why": "<5 words>"}. Set flag=true only if slop >= ${THRESHOLD}.

POST:
"""${post}"""`;

  // --- Model plumbing --------------------------------------------------------
  async function ensureSession(userGesture = false) {
    if (session) return session;
    if (typeof LanguageModel === "undefined")
      throw new Error("This Chrome build has no built-in model (LanguageModel). See the README requirements.");
    const avail = await LanguageModel.availability();
    if (avail === "unavailable")
      throw new Error("Built-in model unavailable on this device.");
    if ((avail === "downloadable" || avail === "downloading") && !userGesture)
      throw new Error("needs-gesture");
    if (!sessionPromise) {
      sessionPromise = LanguageModel.create({
        monitor(m) {
          m.addEventListener("downloadprogress", (e) =>
            setPill(`Downloading model… ${Math.round(e.loaded * 100)}%`, "busy")
          );
        },
      });
    }
    session = await sessionPromise;
    return session;
  }

  async function scorePost(text) {
    const key = text.slice(0, 500);
    if (cache.has(key)) return cache.get(key);
    const base = await ensureSession();
    const clone = await base.clone(); // fresh context per post
    let raw;
    try {
      raw = await clone.prompt(buildPrompt(text));
    } finally {
      clone.destroy?.();
    }
    let parsed = null;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch (_) {}
    const result =
      parsed && typeof parsed.slop === "number"
        ? { slop: parsed.slop, why: String(parsed.why || "") }
        : { slop: 0, why: "unparseable" };
    cache.set(key, result);
    return result;
  }

  // --- Post detection --------------------------------------------------------
  // LinkedIn changes markup often; these are the current feed containers.
  const POST_SELECTOR = ".feed-shared-update-v2, .fie-impression-container";
  const TEXT_SELECTORS = [
    ".update-components-text",
    ".feed-shared-update-v2__description",
    ".update-components-update-v2__commentary",
  ];

  function getPostText(container) {
    for (const s of TEXT_SELECTORS) {
      const el = container.querySelector(s);
      if (el && el.innerText.trim().length > 0) return el.innerText.trim();
    }
    return "";
  }

  function collapse(container, result) {
    if (container.dataset.lsfCollapsed) return;
    container.dataset.lsfCollapsed = "1";
    container.classList.add("lsf-collapsed");

    const bar = document.createElement("div");
    bar.className = "lsf-bar";
    bar.innerHTML =
      `<span class="lsf-tag">🫥 Hidden AI slop</span>` +
      `<span class="lsf-score">score ${result.slop}/10</span>` +
      (result.why ? `<span class="lsf-why">${escapeHtml(result.why)}</span>` : "") +
      `<button class="lsf-show" type="button">Show anyway</button>`;
    bar.querySelector(".lsf-show").addEventListener("click", () => {
      container.classList.remove("lsf-collapsed");
      bar.remove();
    });
    container.parentNode.insertBefore(bar, container);

    hiddenCount++;
    setPill(`On · ${hiddenCount} hidden`, "on");
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  // --- Scanning --------------------------------------------------------------
  function scan() {
    if (!isEnabled()) return;
    const posts = document.querySelectorAll(POST_SELECTOR);
    posts.forEach((container) => {
      if (container.dataset.lsfSeen) return;
      const text = getPostText(container);
      if (!text || text.length < MIN_CHARS) return;
      container.dataset.lsfSeen = "1";
      // serialize so we only hit the model one post at a time
      queue = queue.then(async () => {
        try {
          const result = await scorePost(text);
          if (result.slop >= THRESHOLD) collapse(container, result);
        } catch (err) {
          if (String(err.message) === "needs-gesture") {
            setPill("Click to enable (one-time download)", "off");
            // leave post unmarked so it gets re-scanned after enable
            delete container.dataset.lsfSeen;
          } else {
            console.warn("[SlopFilter]", err.message);
          }
        }
      });
    });
  }

  let scanTimer = null;
  function scheduleScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 400);
  }

  // --- Floating toggle pill --------------------------------------------------
  let pill;
  function setPill(text, state) {
    if (!pill) return;
    pill.textContent = text;
    pill.dataset.state = state;
  }

  function buildPill() {
    pill = document.createElement("div");
    pill.id = "lsf-pill";
    pill.dataset.state = "off";
    pill.textContent = "Slop filter: off";
    pill.title = "LinkedIn Slop Filter — click to toggle";
    pill.addEventListener("click", async () => {
      if (isEnabled()) {
        setEnabled(false);
        setPill("Slop filter: off", "off");
        return;
      }
      setEnabled(true);
      setPill("Enabling…", "busy");
      try {
        await ensureSession(true); // this click is the required user gesture
        setPill(`On · ${hiddenCount} hidden`, "on");
        scan();
      } catch (err) {
        setEnabled(false);
        setPill("Unavailable — see README", "off");
        console.warn("[SlopFilter]", err.message);
      }
    });
    document.documentElement.appendChild(pill);
  }

  const isEnabled = () => localStorage.getItem(LS_KEY) === "1";
  const setEnabled = (v) => localStorage.setItem(LS_KEY, v ? "1" : "0");

  // --- Boot ------------------------------------------------------------------
  function boot() {
    buildPill();
    if (isEnabled()) {
      setPill("On · 0 hidden", "on");
      // resume without a gesture if the model is already downloaded
      ensureSession(false)
        .then(scan)
        .catch((err) => {
          if (String(err.message) === "needs-gesture")
            setPill("Click to re-enable", "off");
        });
    }
    const obs = new MutationObserver(scheduleScan);
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) boot();
  else window.addEventListener("DOMContentLoaded", boot);
})();
