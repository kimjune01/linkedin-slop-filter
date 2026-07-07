# 🧹 linkedin-slop-filter

<p align="center"><strong><em>Success isn't about talent. It's about not seeing this post.</em></strong></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue?style=for-the-badge" alt="License: AGPL-3.0"></a>
  <img src="https://img.shields.io/badge/runs-100%25%20local-brightgreen?style=for-the-badge" alt="100% local">
  <img src="https://img.shields.io/badge/model-Gemini%20Nano%20(on--device)-informational?style=for-the-badge" alt="On-device model">
  <img src="https://img.shields.io/badge/network%20calls-0-lightgrey?style=for-the-badge" alt="Zero network calls">
</p>

A Chrome extension that hides the shittiest low-effort, AI-generated **slop** on your LinkedIn feed — the "I'm humbled to announce 🚀 / hard work is a myth / Agree? 👇" garbage — before you have to read it.

Every post is judged by Chrome's **built-in on-device model** (Gemini Nano). No API key, no account, no server, no network calls, no tracking. The verdict happens on your machine and dies there.

## How it works

1. **Scan.** As you scroll, it reads each post's text.
2. **Score.** One local prompt rates it 0–10 for slop.
3. **Collapse.** Anything scoring ≥ 7 folds into a slim bar you can expand:

   > 🫥 Hidden AI slop · score 9/10 · *"generic, vague, engagement bait"* &nbsp; **[Show anyway]**

A pill in the bottom-right toggles it on/off and keeps a running count of what it hid.

The whole design is deliberately **conservative** — it only kills the obvious offenders. It weighs *"does this post contain any concrete specific detail?"* heaviest, because that (not em-dashes, not rocket emoji, not one-sentence-per-line) is what actually separates slop from a real person writing quickly. A short casual post, a job listing, a genuine question, or a technical note stays visible. A hand-edited AI post with a real anecdote in it stays visible too — at that point it isn't low-effort slop anymore.

## Why on-device

A slop filter has to run on *every post in your feed*, forever, for free. That's the one niche where a small-but-local model beats a good-but-paid API outright: zero marginal cost, zero latency to a server, and your feed never leaves the browser. Gemini Nano is weak at proving a post was AI-written — but it's plenty good at *"does this match the slop register,"* which is all the job needs.

## Requirements

- **Chrome 138+** on desktop (Mac / Windows / Linux). Not Android, iOS, or model-less Chromium builds.
- ~**8 GB RAM**, ~**4 GB free disk** for the one-time model download.
- On older Chrome, enable two flags and restart:
  - `chrome://flags/#prompt-api-for-gemini-nano` → **Enabled**
  - `chrome://flags/#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**

## Install (unpacked, ~60 seconds)

Not on the Web Store — you load it as an unpacked extension.

1. **Get the code:** green **Code** button → **Download ZIP**, then unzip. (Or `git clone` this repo.)
2. Open `chrome://extensions`.
3. Flip on **Developer mode** (top-right).
4. **Load unpacked** → pick the `linkedin-slop-filter` folder.
5. Open [linkedin.com/feed](https://www.linkedin.com/feed/). A grey **"Slop filter: off"** pill appears bottom-right.
6. **Click the pill.** First time, it downloads the model (progress shows in the pill, a few minutes, once ever). Then it goes green and starts sweeping as you scroll.

The on/off state is remembered.

## The prompt

The classifier is a single prompt in [`content.js`](content.js) (`buildPrompt`), grounded in what people actually complain about online — broetry line breaks, "thrilled to announce," engagement bait, buzzwords — but with the twist every source agrees on: those surface tells are unreliable alone, because humans use them too. So **specificity decides**. Any real number, name, technical detail, actual problem, or genuine question drags the score down hard; generic advice that could apply to anyone drives it up.

Want it stricter or looser? Change `THRESHOLD` in [`content.js`](content.js) and reload the extension.

## Honest limitations

- **It's a small model.** Expect the occasional miss or false hide. Hit **Show anyway** and move on.
- **It reads style, not provenance.** It can't *prove* a post was AI-written, and it isn't trying to.
- **LinkedIn reshuffles its markup constantly.** If it stops hiding anything, the selectors (`POST_SELECTOR`, `TEXT_SELECTORS` in [`content.js`](content.js)) need a refresh. PRs very welcome.
- **Scores wobble run-to-run** — the model is non-deterministic.

## Privacy

No backend. **No permissions beyond running on `linkedin.com`.** Zero network requests. The only thing it stores is one on/off flag in `localStorage`. The whole thing is ~200 lines of [`content.js`](content.js); read it.

## License

Copyright © 2026 June Kim. [AGPL-3.0](LICENSE). Copyleft: modify it and run it as a service, and you must publish your source. Fork it, sharpen the prompt, point it at Twitter/X — go wild.

## Contributing

Issues and PRs welcome, especially: fresher post selectors when LinkedIn breaks them, prompt improvements with example posts that beat the current one, and a Firefox port.

<sub><em>Thoughts? Drop a comment below. <a href="https://www.boredpanda.com/crap-on-linkedin-posts/">👇</a></em></sub>
