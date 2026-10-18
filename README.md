# myCSD tracker

A minimalist, mobile-first tracker for USM students following myCSD points for the current sidang.

Live site: https://mycsd.javanmyna.fyi

## Features

- Record activities per sidang with a name, points, category, and date.
- Categories: Club, University, National, Webinars, Misc, and Unsure.
- Mark points as unknown when you do not have the value yet. Unknown points are stored as null, count as 0, and appear as `?` in the activity list.
- Mark an activity Confirmed or leave it Unconfirmed. Totals count both, and the home screen labels a total as approximate when it includes unconfirmed activities or unknown points.
- Edit or delete past activities.
- See the current-sidang total, progress toward your target, a D-Day countdown, and message-style quotes.
- Demo mode saves activities and settings in this browser only, with a persistent reminder and a Google sign-in option.
- Export all activities and settings as JSON version 3.
- Import an export from the menu: paste JSON or choose a .json file, preview new, duplicate, and invalid counts, then confirm. Import accepts versions 1–3 and only adds rows.
- A faint `<.` credit mark sits at the bottom of each app page, and the settings page has a creator lightbox with a copyable domain.
- Google sign-in keeps each account's data private and synced across devices.

## Tech stack

Plain HTML, CSS, and vanilla JavaScript with no build step and no npm dependencies. Supabase provides Google authentication and Postgres with row-level security. The site is hosted on Cloudflare Pages.

## Run locally

From this folder, start a static server:

    python -m http.server 8000

Then open http://localhost:8000. Google sign-in needs a localhost or HTTPS origin; demo mode works without signing in.

## Early access

This is early-access software. Features may change and bugs are possible. Report issues at https://github.com/JavanMyna/myCSD/issues.

Never commit secrets. `js/config.js` holds only the public anon key; service-role keys and OAuth client secrets belong in the provider dashboards.
