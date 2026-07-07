# 🧹 linkedin-slop-filter

*Success isn't about talent. It's about not seeing this post.*

A Chrome extension that hides the shittiest low-effort, AI-generated slop on your LinkedIn feed (the "I'm humbled to announce 🚀 / hard work is a myth / Agree? 👇" garbage) before you have to read it.

Every post is judged by Chrome's built-in on-device model, [Gemini Nano](https://developer.chrome.com/docs/ai/prompt-api). No API key, no account, no server, no network calls, no tracking. The verdict happens on your machine and dies there. Licensed AGPL-3.0.

## How it works

As you scroll, it reads each post's text, scores it 0 to 10 for slop with one local prompt, and folds anything scoring 7 or higher into a slim bar you can expand: "🧹 Swept AI slop · score 9/10 · generic, vague, engagement bait · Show anyway". A pill in the bottom-right toggles it on and off, and keeps a running count of what it hid.

It's deliberately conservative: it only kills the obvious offenders. The one thing it weighs heaviest is whether a post contains any concrete specific detail, because that, not em-dashes or rocket emoji or one-sentence-per-line, is what actually separates slop from a real person writing quickly. A short casual post, a job listing, a genuine question, or a technical note stays visible. So does a hand-edited AI post with a real anecdote in it, because at that point it isn't low-effort slop anymore.

## Why on-device

A slop filter has to run on every post in your feed, forever, for free. That's the one niche where a small local model beats a good paid API outright: no marginal cost, no round trip to a server, and your feed never leaves the browser. Gemini Nano is weak at proving a post was AI-written, but it's plenty good at telling whether something matches the slop register, which is all the job needs.

## The one-time model download

Chrome ships the model's API, not its weights. The first time anything on your machine uses Gemini Nano, Chrome downloads it once (a few GB), caches it, and shares that one copy across every site and extension. So the first time you turn the filter on, you'll see download progress in the pill for a few minutes. After that it's instant, and if some other app already pulled the model down, you skip the wait entirely.

## Requirements

Chrome 138 or newer on desktop (Mac, Windows, or Linux, not Android or iOS). You'll want around 8 GB of RAM and 4 GB of free disk for the model. Recent Chrome runs this out of the box; only on older builds do you need to enable two flags and restart, setting `chrome://flags/#prompt-api-for-gemini-nano` to Enabled and `chrome://flags/#optimization-guide-on-device-model` to Enabled BypassPerfRequirement.

## Install

It's not on the Web Store, so you load it as an unpacked extension.

1. Get the code: the green Code button, then Download ZIP, then unzip it. Or clone the repo.
2. Open `chrome://extensions`.
3. Turn on Developer mode, top-right.
4. Click Load unpacked and pick the `linkedin-slop-filter` folder.
5. Open linkedin.com/feed. A grey "Slop filter: off" pill appears in the bottom-right.
6. Click the pill. The first time, it downloads the model (a few GB, once); after that it goes green and starts sweeping as you scroll. If your Chrome can't run the model, the pill says Unavailable instead of turning green.

The on/off state is remembered.

## The prompt

The classifier is a single prompt in `content.js` (`buildPrompt`), grounded in what people actually complain about online: [broetry](https://www.buzzfeednews.com/article/ryanmac/why-are-these-posts-taking-over-your-linkedin-feed-because) line breaks, "thrilled to announce," engagement bait, buzzwords. But those surface tells are unreliable alone, because humans use them too. So specificity decides: any real number, name, technical detail, actual problem, or genuine question drags the score down; generic advice that could apply to anyone drives it up. To make it stricter or looser, change `THRESHOLD` in `content.js` and reload the extension.

## Honest limitations

It's a small model, so expect the occasional miss or false hide. Hit Show anyway and move on. It reads style, not provenance; it can't prove a post was AI-written and isn't trying to. LinkedIn reshuffles its markup constantly, so if it stops hiding anything, the selectors (`POST_SELECTOR` and `TEXT_SELECTORS` in `content.js`) need a refresh, and PRs for that are very welcome. And scores wobble a little run-to-run, because the model is non-deterministic.

## Privacy

There's no backend. The extension asks for no permissions beyond running on linkedin.com, makes zero network requests, and stores one on/off flag in `localStorage`. The whole thing is about 200 lines of `content.js`; read it.

## License

Copyright © 2026 June Kim. AGPL-3.0. Copyleft: if you distribute a modified version, publish the source under the same license. Otherwise, fork it, sharpen the prompt, point it at Twitter. Go wild.

## Contributing

Issues and PRs welcome, especially fresher post selectors when LinkedIn breaks them, prompt improvements with example posts that beat the current one, and a Firefox port.

<sub>*Thoughts? Drop a comment below.* [👇](https://www.boredpanda.com/crap-on-linkedin-posts/)</sub>
