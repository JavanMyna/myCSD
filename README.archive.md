> Archived original README, dated 2026-10-18.

myCSD tracker

A minimalist mobile-first tracker for USM students to see their myCSD points for the current sidang. Activities and settings are stored in Supabase. Settings are private to the signed-in account and follow it across browsers.

Project files
index.html is the sign-in screen and minimal home screen after sign-in.
menu.html is the plain menu opened from the home gear, including data export.
add-activity.html contains the activity form.
activities.html lists and deletes activities for the current sidang.
settings.html contains message style, target, D-Day, sidang, and sign-out controls.
privacy.html and terms.html are the short legal pages.
css/style.css contains the black minimal style.
favicon/ contains the browser tab icon, Apple touch icon, Android home-screen icons, and web manifest. Each HTML page links to them.
js/config.js contains app defaults and the Supabase project URL and public anon key settings.
js/auth.js creates the Supabase browser client and handles Google sign-in, sessions, and sign-out.
js/settings-store.js loads, migrates, and saves settings through Supabase.
js/activity-data.js sends activity requests to Supabase without a user_id; database row security controls ownership.
js/export-data.js reads the signed-in user's data through row security and copies version 1 JSON to the clipboard.
js/app.js calculates the current sidang total from activities and shows the home message and D-Day.
js/add-activity.js checks and saves activity form values.
js/activities-list.js loads and deletes current-sidang activities.
js/menu.js protects the menu, copies exports, and handles sign-out.
js/settings.js loads, validates, and saves account settings.
supabase/schema.sql is the SQL to run manually in Supabase.
SPEC.md is the original project brief.
done.md has completed-step learning notes.
questions.md records questions and answers.

How to run locally for Google sign-in
Google sign-in does not work from a file address opened by double-clicking index.html. Use Python's built-in static server instead.

Open PowerShell in the folder that contains the myCSD folder, then run:
    py -m http.server 8000 --directory myCSD

If Windows says py is not recognized, try:
    python -m http.server 8000 --directory myCSD

Keep that PowerShell window open and open this address in your browser:
    http://localhost:8000/

Google and Supabase setup
Follow these steps in order. The Google and Supabase dashboard labels below match their current consoles and may change over time.

1. Google Cloud
Open https://console.cloud.google.com/ and use the project picker at the top to create a Google Cloud project.
Open the navigation menu, choose Google Auth Platform, then Branding. If asked, choose Get started. Enter the app name myCSD tracker, a user support email, and a developer contact email, then save.
Open Audience and choose External. External is the audience for sign-in from any Google Account.
Open Data Access, choose Add or remove scopes, and request only openid, email, and profile. Save the scope list.
Open Audience and choose Publish app so the publishing status is In production. This makes the app available to Google Accounts generally instead of only test users. Google may still ask for branding verification or show an unverified-app notice in some cases.
Open Clients, choose Create client, and select Web application. Give the client a name. Add these Authorized JavaScript origins:
    http://localhost:8000
    https://mycsd.javanmyna.fyi
Finish creating the client. You will add the Supabase callback URI in step 2.

2. Supabase Google provider
In the Supabase dashboard, open Authentication, then Sign In / Providers, then Google. Turn on Google sign-in and copy the callback URL shown on that page.
Return to Google Auth Platform, open Clients, and select the Web application client you created. Under Authorized redirect URIs, add the exact Supabase callback URL you copied. Save.
Copy the Google client ID and Google client secret into the Google provider settings in Supabase only, then save the provider settings.

3. Supabase URL settings
In the Supabase dashboard, open Authentication, then URL Configuration.
Set Site URL to:
    https://mycsd.javanmyna.fyi/
Add these Redirect URLs:
    http://localhost:8000/**
    https://mycsd.javanmyna.fyi/
The local wildcard allows Google sign-in to return to pages served from the local preview.

Before testing, open js/config.js and enter the Supabase project URL and public anon key from your Supabase project API settings. The public anon key is intended for browser use and is protected by the row policies you added.

4. Secret warning
The Google client secret goes only in the Supabase dashboard's Google provider settings. Never put it in code, files, GitHub, or this chat. Never put the Supabase service role key in browser code or share it. Only the public anon key belongs in js/config.js.

Step 6 database checks
The project already has the settings table. In Supabase, open SQL Editor, choose New query, paste the complete block below, and click Run. This adds the target and sidang checks. Do not run the rest of schema.sql again on this existing project.

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'settings_target_range_check'
          AND conrelid = 'public.settings'::regclass
      ) THEN
        ALTER TABLE public.settings
          ADD CONSTRAINT settings_target_range_check CHECK (target BETWEEN 1 AND 5000);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'settings_sidang_length_check'
          AND conrelid = 'public.settings'::regclass
      ) THEN
        ALTER TABLE public.settings
          ADD CONSTRAINT settings_sidang_length_check
          CHECK (char_length(btrim(sidang)) BETWEEN 1 AND 20);
      END IF;
    END $$;

Settings load from the signed-in user's settings row. The first successful load creates that row if needed. If this browser still has older local settings and the account has no row, those values are migrated first. Later changes are saved to Supabase and follow the account.

Export
From the menu, choose Export my data. The app copies a plain JSON document with version 1, every activity visible to the signed-in account across all sidangs, and that account's settings. There is no import feature.

Short manual test list
Sign in with your first Google account and add an activity. Confirm the home total includes its points and Activities shows the row.
Add activities under different sidang names by changing Settings, then confirm the home total and Activities list use only the selected sidang.
Delete an activity and confirm the browser asks Delete this activity? before removing it.
Choose Export my data and confirm the clipboard contains JSON with version 1, activities from all sidangs, and settings.
Sign out, then sign in with a SECOND Google account. Confirm its total is zero or its activity list says No activities yet, and it cannot see the first account's activity.
Change a setting on one device, sign in to the same account in another browser, and confirm the changed setting follows the account.
Open Privacy and Terms from the sign-in screen and from Settings. Replace CONTACT EMAIL HERE in privacy.html before launch.

Prepare Cloudflare Pages deployment
Push the myCSD repository to GitHub. In the Cloudflare dashboard, open Workers & Pages, choose Create application, choose Pages, then Import an existing Git repository.
Choose the myCSD repository and its production branch. This is a plain static site: set the build command to exit 0 and the build output directory to the repository root, a period. There is no package installation or build step. Deploy and check that the site opens at its pages.dev address.
In Pages, add the custom domain mycsd.javanmyna.fyi. Then confirm the production address is allowed in Supabase Authentication URL Configuration and in the Google OAuth client's authorized JavaScript origins.
Cloudflare's current static HTML guide: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/

GoatCounter
The GoatCounter script is in each HTML page and sends visits to the existing myna-dev.goatcounter.com site. If you use another GoatCounter site, replace the data-goatcounter endpoint in the HTML pages with that site's count endpoint.
GoatCounter setup reference: https://www.goatcounter.com/help/start

Official auth setup references
Supabase Google sign-in: https://supabase.com/docs/guides/auth/social-login/auth-google
Supabase redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
Google Auth Platform setup: https://support.google.com/cloud/answer/15544987
Google app audience and publishing status: https://support.google.com/cloud/answer/15549945
