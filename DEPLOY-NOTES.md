# Floobiverse tab: how it is served, and how to put the old version back

Written 14 November 2026, when the new (v4) Floobiverse page went live.

## How the tab works

The Floobiverse tab on floobcreative.com (`/welcome-to-the-floobiverse`) is a Wix page with the
Wix menu at the top and the Wix footer at the bottom. In between sits one "Embed a site" box
(Wix calls it HTML iframe, element ID `html1`). That box shows a page hosted free on GitHub Pages,
built from the `main` branch of this repository.

- New page (live now): `https://quietlysmart.github.io/floobiverse-intro-thai/floobiverse/`
  (the `floobiverse/` folder in this repository: the v4 page without its own top bar).
- Old page (still online, untouched): `https://quietlysmart.github.io/floobiverse-intro-thai/`
  (the files at the root of this repository). Git tag `live-before-v4-2026-11-14` marks this exact version.
- Vercel is not involved. The old Vercel project `floobiverse-intro-thai` has not deployed since mid-2026
  and the Wix page does not use it.

To make the new page scroll like a normal page under the Wix menu, the embed box is sized to fill the
screen below the menu. That is done by a small snippet in Wix: Dashboard > Settings > Custom Code >
Head > **"Floobiverse embed height"** (all pages, Essential). It only acts while the embed box points
at an address containing `/floobiverse/`, so it does nothing to the old page.

## Old embed settings (exactly as they were before the switch)

- What to add: Website address
- Website address: `https://quietlysmart.github.io/floobiverse-intro-thai/`
- "What's in the embed?": `Meet Floob and all his friends`
- Desktop size: stretched to full width, 901 px tall (unchanged by the switch)
- Mobile size: 320 x 569 px (unchanged by the switch)

## To put the old version back (one change)

1. Open the Wix editor and go to the FLOOBIVERSE page.
2. Click the big embedded page once or twice until the "Change Website Address" button appears.
3. Replace the address with `https://quietlysmart.github.io/floobiverse-intro-thai/` and press Update.
4. Press Publish.

That is all. The old page comes back at its old size, because the height snippet switches itself off
when the address no longer contains `/floobiverse/`. Optional tidy-up: you can also turn off or delete
the "Floobiverse embed height" snippet in Custom Code, but leaving it on does no harm.

## To change the new page later

Edit `v4/` on the `floobiverse-v4` branch, then copy it into `floobiverse/` on `main` without the top
bar (the header element removed, `class="no-bar"` on the `<html>` tag, and `target="_top"` on links to
floobcreative.com so they open the whole site rather than inside the box). Push `main`; GitHub Pages
updates in about a minute.
