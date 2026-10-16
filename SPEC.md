You are helping me (Fred) build "myCSD tracker", a small mobile-first web app. I'm a self-taught developer and I'm learning as I build, so explain things simply and don't skip steps.

FOLDERS
- Safe2Save folder = READ-ONLY reference. Never edit, move, or delete anything in it.
- myCSD folder = where you build everything new.

WHAT THE APP IS
USM students earn "myCSD points" from activities (clubs, college, university, national level). Points are counted per sidang (2 semesters). My seniors say the minimum to aim for is 300 per sidang. The app's message: "Get to action, be aware, this is how much you have right now."

TECH RULES
- Vanilla HTML/CSS/JS, same style as Safe2Save. No Node.js, no npm, no build step.
- Tailwind through its CDN script is OK. Supabase JS through CDN.
- Supabase for database + Google sign-in. Only the public anon key goes in the frontend. Never use or ask for the service key.
- Mobile first, clean modern look (a refresh of the Safe2Save style, not a copy). Reuse the Safe2Save theme system where it fits.
- Final hosting is Cloudflare Pages (static files) at mycsd.javanmyna.fyi, plus a Goatcounter script tag.

SAFETY RULES
- Row Level Security ON for every table. Each user can only read and write their own rows (user_id = auth.uid()).
- Show user-typed text (like activity names) with textContent, never innerHTML.
- Don't invent myCSD rules or point values. Users type their own points.

SETTINGS (keep all in one config file, easy to edit)
- Default target: 300 (user can change it)
- Default D-Day: 2027-07-18 (end of Semester 2 exams). Users can pick their own date because some courses, like medical, differ. Presets: end of Sem 1 = 2027-02-07, end of Sem 2 = 2027-07-18, or a custom date.
- Sidang name: 2026/2027

DATA
- activities: id, user_id, sidang, name, points, level (college / club / university / national), date, created_at
- settings: user_id, target, dday, sidang
Write the SQL (tables + RLS policies) as text for me to run myself in Supabase. Do not run it.

HOME SCREEN
- Big total points for the current sidang, and progress toward the target (e.g. "120 / 300, 40%").
- Random message by % of target:
  Under 25%: "Work on it bro!" / "Pick one event this week. Just one."
  25-74%: "Keep up the momentum." / "Good progress. Don't slow down now."
  75-99%: "So close. One or two more activities." / "Finish strong."
  100%+: "Target reached. Anything extra is a bonus."
- Pace line under it: remaining = target - total; weeks left = days until D-Day divided by 7, rounded up; per week = remaining divided by weeks left, rounded up. Example: "You need 180 more. 14 weeks left, about 13 a week."
  If target is reached, hide the pace line. If D-Day has passed, say the sidang has ended.
- D-Day countdown (days left).

WORK IN SMALL STEPS. Stop after each step and wait for my "ok".
Step 0: Look through the Safe2Save folder. Read ONLY what you need: the Supabase setup, login code, theme files, the add/list transaction code, and the clipboard export. In 15 lines or fewer, tell me what you plan to reuse and what you'll drop (recurring transactions and projections are dropped). Wait for ok.
Step 1: Set up the myCSD folder with a simple file structure.
Step 2: Home screen with fake data (progress, messages, pace line, D-Day).
Step 3: Give me the Supabase SQL (tables + RLS).
Step 4: Google sign-in.
Step 5: Add activity form + activity list, connected to Supabase.
Step 6: Settings screen (target, D-Day presets/custom date).
Step 7: Clipboard export, final polish, and short notes on deploying to Cloudflare Pages + Goatcounter.

NOT IN THIS VERSION: leaderboard, comparing with other users, info page.

SAVE MY CREDITS (I have a small token budget)
- Read only the files you need. Don't re-read files you've already seen.
- Don't print whole files back to me. Show only what changed.
- Keep replies short. No thinking/reasoning mode for simple edits.
- If something fails twice, stop and tell me what you think is wrong instead of trying again and again.

MY LEARNING HABITS
After each step:
- Update README.md with what the project is and how to run it.
- Add a short entry to done.md: the programming fundamentals I used in this step, in plain language.
- Add to questions.md any questions I asked during the step, with the answers.
