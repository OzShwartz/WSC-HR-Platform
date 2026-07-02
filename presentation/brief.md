# Presentation Brief - Talent Intelligence Platform

Prompt/brief for generating the interview presentation deck. Paste this whole file into a fresh Claude session (or use it directly in this one) to generate the deck.

## Format

- **Single self-contained HTML file**, slide-deck style (one `<section>` per slide, full-viewport, keyboard left/right or click to navigate - no external build step, opens directly in a browser).
- 16:9, presentation-safe font sizes (readable from the back of a room).
- **WSC Sports brand, exactly as used in the rest of this project:**
  - Ink / text: `#0B0B0B`
  - Accent (use sparingly - underlines, active states, key numbers, progress dots): `#D0F200`
  - Background: white / `#fafafa`, generous whitespace, no gradients or stock-photo clutter
  - Logo file: `brand/wsc-sports-logo.svg` (place top-left or centered on title slide only)
  - Typography: system sans-serif stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`), confident weight on headlines, plenty of whitespace - same visual language as `output/JOB001_report.html` in this repo, which already nails the WSC look.
- Visual-first: every slide should work even if no one reads the body text - headline + one visual (screenshot, number, or diagram) carries the slide.

## Audience & Tone

Mixed panel - technical and non-technical reviewers in the same room. Every slide needs a **one-line plain-language takeaway** a non-technical person gets instantly, *plus* enough concrete substance (real numbers, real screenshots, real architecture) that a technical reviewer doesn't feel talked down to. No jargon walls of text. Confident, present-tense ("this is what it does" not "this is what it would do").

## Length

10–12 slides, ~10–15 minutes talking time. Title, Agenda, Summary, and the Demo slide are non-negotiable - everything else can flex.

## Slide-by-Slide Outline

1. **Title** - "Talent Intelligence Platform" · WSC Sports logo · your name · role applied for (AI Solution Manager) · one-line tagline: *"Turning conference attendance into a queryable, explainable talent pool."*
2. **Agenda** - short bullet list of what's coming (Problem → Solution → How it works → Demo → Results → What's next).
3. **The Problem** - plain-language framing, no tech: conferences generate leads that vanish; when a role opens, recruiters start from zero every time; not every attendee is actually relevant (signal-to-noise).
4. **The Solution** - one sentence + a simple visual flow: `Conference → Capture → Score → Match → Recruiter Action`.
5. **How Scoring Works** - transparent, not a black box. Visual of the sub-scores (Skills, Experience, Title, Industry, Mutual Connections, Conference Relevance) and the signal-vs-noise "domain relevance gate" - the core differentiator (a DevOps conference attracts recruiters/vendors too, and the system tells them apart).
6. **AI's Role** - the one principle worth stating explicitly for this role: *AI explains, it never decides the score.* Deterministic engine is the source of truth; AI narrates it in plain language with a confidence score attached to every claim. This is the credibility slide for a technical reviewer.
7. **Demo** - see "Demo Slide" section below.
8. **Results - Proof, Not a Pitch** - real numbers from an actual run (see "Real Data to Embed" below). This is the slide that proves the signal-vs-noise claim isn't theoretical.
9. **What's Built vs. What's Next** - brief, shows scope discipline: working pipeline + API + full app today; roadmap items (real LinkedIn/HubSpot/Comeet integration, auth, CI/CD) explicitly deferred and why.
10. **Why This Matters to HR** - the Executive Summary, condensed to slide form: time saved, conference ROI, no more re-searching people you already met.
11. **Summary / Closing** - 3 key takeaways, thank-you, contact/repo link.
12. *(Backup, only if asked)* - architecture diagram slide for a deep technical question.

## Demo Slide - Needs a Decision

Requested: live link/QR + real screenshots + concrete numbers, all on one slide.

- **Screenshots + numbers**: ready now - this project already has real ones (Dashboard, Candidate Pool, Job Detail with the score-breakdown drawer, WSC Team reverse-connections view, dark mode). Use fresh ones taken from the running app, not mockups.
- **QR to a live link**: blocked until this is deployed somewhere public - right now it only runs on `localhost`, which nobody else in the room can reach. Pick one:
  - **Skip the QR** - present live via screen-share instead, no public deployment needed.
  - **Deploy temporarily** (e.g. frontend on Vercel, API on Render/Railway) so the QR actually resolves - adds deployment work before the presentation is ready.

## Real Data to Embed (pulled live from the running system - don't invent numbers)

- 75 conference attendees captured across 4 conferences, evaluated against 5 open roles.
- For **JOB001 (Senior ML Engineer)** specifically: 75 evaluated → **4 Strong Match, 12 Potential Match, 29 Low Priority, 30 Do Not Contact.** (This is the single best "proof" number - out of 75 people who showed up, the system confidently rules out 30 as noise and surfaces 4 as strong.)
- Top candidate example: **Lucas Evans - 75.8/100, Strong Match, Senior ML Engineer**, with a real "warm intro" suggestion (mutual WSC connection) the system generated on its own.
- Repo: `https://github.com/OzShwartz/WSC-HR-Platform`

## Deliverable

Output one file: `presentation/deck.html`. It should open directly in a browser with no build step and be presentable full-screen immediately.
