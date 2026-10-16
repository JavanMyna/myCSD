myCSD tracker

A minimalist mobile-first tracker for USM students to see their myCSD points for the current sidang. Activities and their points are stored in Supabase. App settings stay in this browser's localStorage until Step 6.

Project files
index.html is the signed-out screen and minimal home screen after sign-in.
menu.html is the plain menu opened from the home gear.
add-activity.html contains the activity form.
activities.html lists and deletes activities for the current sidang.
settings.html contains message style, target, D-Day, sidang, and sign-out controls.
css/style.css contains the black minimal style.
js/config.js contains app defaults and the Supabase project URL and public anon key settings.
js/auth.js creates the Supabase browser client and handles Google sign-in, sessions, and sign-out.
js/settings-store.js keeps settings in localStorage for now.
js/activity-data.js sends activity requests to Supabase without a user_id; database row security controls ownership.
js/app.js calculates the current sidang total from activities and shows the home message and D-Day.
js/add-activity.js checks and saves activity form values.
js/activities-list.js loads and deletes current-sidang activities.
js/menu.js protects the menu and handles sign-out.
js/settings.js saves settings locally and handles sign-out.
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
The local wildcard allows the local preview URL, including the temporary total query value. The production entry is the exact home address.

Before testing, open js/config.js and enter the Supabase project URL and public anon key from your Supabase project API settings. The public anon key is intended for browser use and is protected by the row policies you added.

4. Secret warning
The Google client secret goes only in the Supabase dashboard's Google provider settings. Never put it in code, files, GitHub, or this chat. Never put the Supabase service role key in browser code or share it. Only the public anon key belongs in js/config.js.

Short manual test list
Sign in with your first Google account and add an activity. Confirm the home total includes its points and Activities shows the row.
Add activities under different sidang names by changing Settings, then confirm the home total and Activities list use only the selected sidang.
Delete an activity and confirm the browser asks Delete this activity? before removing it.
Open the home address with ?total=250 to check the temporary message test override.
Sign out, then sign in with a SECOND Google account. Confirm its total is zero or its activity list says No activities yet, and it cannot see the first account's activity.

Official setup references
Supabase Google sign-in: https://supabase.com/docs/guides/auth/social-login/auth-google
Supabase redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
Google Auth Platform setup: https://support.google.com/cloud/answer/15544987
Google app audience and publishing status: https://support.google.com/cloud/answer/15549945
