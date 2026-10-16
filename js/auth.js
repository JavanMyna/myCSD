// Supabase Auth client and Google sign-in live here.
(function () {
  "use strict";

  var config = window.MYCSD_CONFIG.supabase || {};
  var url = String(config.projectUrl || "");
  var publicKey = String(config.publicAnonKey || "");
  var configured = url.indexOf("https://") === 0 &&
    url.indexOf("PASTE_") === -1 &&
    publicKey.length > 20 &&
    publicKey.indexOf("PASTE_") === -1;
  var client = configured && window.supabase
    ? window.supabase.createClient(url, publicKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
    : null;

  function cleanOAuthReturnUrl() {
    var current = new URL(window.location.href);
    var authKeys = ["code", "state", "error", "error_code", "error_description"];
    var changed = false;
    authKeys.forEach(function (key) {
      if (current.searchParams.has(key)) {
        current.searchParams.delete(key);
        changed = true;
      }
    });
    if (current.hash) {
      current.hash = "";
      changed = true;
    }
    if (changed) window.history.replaceState({}, document.title, current.pathname + current.search);
  }

  function homeRedirectUrl() {
    var current = new URL(window.location.href);
    var redirect = new URL(".", current);
    var total = current.searchParams.get("total");
    if (total !== null) redirect.searchParams.set("total", total);
    return redirect.toString();
  }

  async function getSession() {
    if (!client) return null;
    var result = await client.auth.getSession();
    cleanOAuthReturnUrl();
    return result.data.session;
  }

  function onChange(callback) {
    if (!client) return null;
    return client.auth.onAuthStateChange(function (event, session) {
      cleanOAuthReturnUrl();
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") callback(session, event);
    });
  }

  async function signInWithGoogle() {
    if (!client) throw new Error("Add your Supabase project URL and public anon key in js/config.js first.");
    var result = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: homeRedirectUrl(),
        scopes: "openid email profile"
      }
    });
    if (result.error) throw result.error;
  }

  async function signOut() {
    if (!client) return;
    var result = await client.auth.signOut();
    if (result.error) throw result.error;
  }

  window.MYCSD_AUTH = {
    configured: Boolean(client),
    getClient: function () { return client; },
    getSession: getSession,
    onChange: onChange,
    signInWithGoogle: signInWithGoogle,
    signOut: signOut
  };
}());
