# SVR Residential CMA — Southern Visions Real Estate

Client-facing CMA system for Doug Wilkes, Southern Visions Real Estate (svrealty.com).
Runs entirely on static hosting (GitHub Pages) — no server, no database.

## How it works

1. Open the **dashboard** (`index.html`). Click **+ New CMA** and fill in the form:
   client, property, financials, pricing tiers, comps, and market snapshot.
2. Click **Save & Generate Link**.
3. **Copy link** or **Email to client**. The client opens a personalized 24-page
   flipbook CMA in the browser — no app, no login.

Saved CMAs are listed on the dashboard with Open / Copy / Email / Edit / Duplicate /
Delete. They live in that browser's localStorage, so use **Export backup** to keep a
JSON copy and **Import backup** to move them to another machine.

## Two kinds of client link

| | Long link | Short link |
|---|---|---|
| Looks like | `cma.html#z=N4Igxg...` (~1,100 chars) | `cma.html?g=26426d1a...` (~78 chars) |
| Data lives | inside the link itself | in an unlisted gist on your GitHub |
| Needs setup | nothing | a GitHub token, once |
| Editing the CMA | the old link keeps the **old** numbers — resend | the **same link** shows the new numbers |
| Works forever | yes, even offline of GitHub | as long as the gist exists |

Long links are the default and need no setup. To turn on short links, click
**Short links: off** in the dashboard's top bar and paste a GitHub personal access
token with only the **`gist`** scope (github.com/settings/tokens → classic). The token
is stored in that browser alone and is never committed anywhere.

Unlisted gists are not searchable or listed publicly, but anyone holding the link can
read the report — the same model as an "anyone with the link" document. Don't post a
client link publicly.

## Client data never lives in this repo

The repo is public, so it contains **no client information and no live MLS share
links** — only the template, the dashboard, and brand assets. Each client's data
travels in their own link or unlisted gist. Opening `cma.html` directly shows a
clearly-labelled fictional sample.

Working copies of the tool with a real deal preloaded belong in `local/`, which is
gitignored.

## Files

| File | Purpose |
|---|---|
| `index.html` | **Dashboard** — form, saved-CMA list, link generator |
| `cma.html` | **Flipbook template** — renders a CMA from `?g=<gist>` or `#z=<blob>`; shows the fictional sample otherwise |
| `tool.html` | Interactive CMA & Market Report tool (React, single file) |
| `svr-cma-tool.jsx` | Source React component for the tool |
| `assets/` | Logo, signatures, headshots, client photos, resume pages 3–12, video thumbnail |

## Flipbook contents (24 pages)

Cover → agenda with autoplay intro video → About Doug → Team → playbook pages from the
SVR resume (fiduciary duties, commitments, mission, SVR resume ×2, photography, listing
process ×2, marketing plan, no-risk program) → subject property → market snapshot →
time vs. money → active / sold + pending / expired comps → price tiers → seller net
sheet → closing ask → back cover.

The net sheet computes deed stamps (0.37%), broker compensation, and 360-day-year
prorations from the target close date automatically.

## Local development

The YouTube embed and gist short links need `http(s)` — opening the files straight from
disk (`file://`) will show a video error. Run a local server instead:

```bash
python -m http.server 8000
```

## Contact

Doug Wilkes · Real Estate Agent — Sales & Development
C: 843-364-3346 · O: 803-359-9571 · dwilkes@svrealty.com
955 Old Cherokee Rd, Lexington, SC 29072
