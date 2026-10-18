Questions and answers

Steps 0–1: No questions were asked during these steps.
Step 2: No additional questions were asked. A past D-Day can be previewed by changing the configured date temporarily.
Step 2 (redo): No additional questions were asked.
Step 3: No additional questions were asked. The SQL file includes plain-language instructions for running it and checking row security and account privacy.
Step 4: No additional questions were asked. The local server command, Google Cloud setup, Supabase provider steps, and secret handling warning are in README.md.
Step 5: No additional questions were asked. README.md includes a manual test list, including a second Google account privacy check.
Step 6: No further questions were asked. The approved design was extended so failed reads cannot create defaults, and Supabase SQL checks protect target and sidang values.
Step 7: No additional questions were asked. The README lists how to export the version 1 JSON and prepare the static site for Cloudflare Pages and GoatCounter.
Follow-up: No additional questions were asked. Supabase JS is pinned to version 2.98.0 with its SHA-384 integrity hash, and page return events refresh signed-in data with a three-second throttle.
Step 8: Q: Keep export version 2 or bump it? A: Bumped to 3 because activities can now contain `points: null` and version 3 strips ownership fields; import accepts 1, 2, and 3. Q: What about legacy `college` rows? A: They import as `unsure`, with a preview count. Q: How much can one import contain? A: 1 MiB measured in bytes and 2000 activity rows, add-only with duplicates skipped.
