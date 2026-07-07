# LinkedIn Slop Filter

A tiny Chrome extension that hides the shittiest low-effort, AI-generated **"slop"** posts on your LinkedIn feed — the "I'm humbled to announce 🚀 / success isn't about talent, it's about consistency / Agree? 👇" garbage.

It runs Chrome's **built-in on-device model** (Gemini Nano). Every post is judged locally on your machine. **Nothing is ever sent to a server** — no API key, no account, no network calls, no tracking.

![status: works on my feed, YMMV](https://img.shields.io/badge/status-works%20on%20my%20feed-brightgreen) ![license: AGPL--3.0](https://img.shields.io/badge/license-AGPL--3.0-blue) ![runs: 100%25%20local](https://img.shields.io/badge/runs-100%25%20local-informational)

---

## What it does

- Scans posts as you scroll your feed.
- Scores each one 0–10 for "slop" and **collapses anything that scores ≥ 7**, replacing it with a slim bar:
  `🫥 Hidden AI slop · score 9/10 · "generic, vague, engagement bait"  [Show anyway]`
- A little pill in the bottom-right corner toggles it on/off and shows how many posts it hid.
- Deliberately **conservative**: it only hides the obvious offenders. A real person's short/casual post, a job listing, a genuine question, or a technical note stays visible even if it's punchy. The whole design weighs *"does this contain any concrete specific detail?"* heaviest, because that — not em-dashes or rocket emoji — is what actually separates slop from a real human writing quickly.

## Requirements

The built-in model is fairly new, so you need:

- **Google Chrome 138 or newer** (desktop — Mac, Windows, or Linux).
- A machine that can run the model: roughly **8 GB+ RAM**, **~4 GB free disk** for the one-time model download, and a non-metered connection for that first download.
- On older Chrome you may need to enable two flags, then restart Chrome:
  - `chrome://flags/#prompt-api-for-gemini-nano` → **Enabled**
  - `chrome://flags/#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**

Not supported on Chrome for Android/iOS, or on Chromium builds without the model.

## Install (unpacked — 60 seconds)

This isn't on the Chrome Web Store; you load it as an unpacked extension.

1. **Download this repo**: green **Code** button → **Download ZIP**, then unzip it. (Or `git clone` it.)
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the unzipped `linkedin-slop-filter` folder.
5. Open [linkedin.com/feed](https://www.linkedin.com/feed/). You'll see a grey **"Slop filter: off"** pill in the bottom-right.
6. **Click the pill.** The first time, it downloads the model (progress shows in the pill — a few minutes, once ever). After that it turns green and starts hiding slop as you scroll.

That's it. The on/off state is remembered.

## How it decides (the prompt)

The classifier is one prompt, grounded in what people actually complain about online (broetry line breaks, "thrilled to announce," engagement bait, buzzwords) — but with one crucial twist that every source agrees on: those surface tells are unreliable on their own because real humans use them too. So the **deciding factor is specificity**: any real numbers, names, technical detail, an actual problem, or a genuine question drags the score down hard. Generic advice that could apply to anyone scores high.

The full prompt lives in [`content.js`](content.js) (`buildPrompt`). Tweak it, change the `THRESHOLD`, and reload the extension.

## Limitations (honest ones)

- **It's a small model.** Gemini Nano is a few-billion-parameter on-device model. It's good at "does this match the slop register," not at proving a post was AI-written. Expect the occasional miss or false hide — hit **Show anyway** and move on.
- **It can't detect provenance.** A lazy AI post that someone hand-edited to add a real anecdote will (correctly) pass — at that point it isn't low-effort slop anymore.
- **LinkedIn changes its markup constantly.** If it stops hiding anything, the post selectors in `content.js` (`POST_SELECTOR`, `TEXT_SELECTORS`) probably need updating. PRs welcome.
- Scores wobble run-to-run; the model is non-deterministic.

## Privacy

There is no backend. The extension requests **no permissions** beyond running on `linkedin.com`, makes **zero network requests**, and stores only a single on/off flag in your browser's `localStorage`. Read [`content.js`](content.js) — it's ~200 lines.

## License

[GNU AGPL-3.0](LICENSE). Copyleft: if you modify it and run it as a service, you must publish your source. Do whatever you like with it otherwise — fork it, improve the prompt, point it at Twitter/X.

## Contributing

Issues and PRs welcome — especially: better post selectors when LinkedIn breaks them, prompt improvements with example posts that fool the current one, and a Firefox port.
