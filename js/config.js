// App defaults and browser-safe Supabase settings live here.
window.MYCSD_CONFIG = {
  // Supabase connection: fill in the project URL and PUBLIC anon key only.
  // Never put the Supabase service role key or any secret in this file.
  supabase: {
    projectUrl: "https://lmnpmcopzunvbnauepql.supabase.co",
    publicAnonKey: "sb_publishable_p6JQ67SgcQhEjQZ20wz5tA_u51Ocw_S"
  },

  target: 300,
  dday: "2027-07-18",
  sidang: "2026/2027",
  messageStyle: "motivational",

  // TEMPORARY: fake points until activities are connected in Step 5.
  fakeTotal: 120
};
