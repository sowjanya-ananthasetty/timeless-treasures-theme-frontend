const ADMIN_SESSION_KEY = "timeless_treasures_admin_session";

/* DEVELOPMENT ONLY credentials. Replace this entire flow with server authentication in production. */
const DEV_ADMIN_USERNAME = "admin@timelesstreasures.in";
const DEV_ADMIN_PASSWORD = "admin123";

if (localStorage.getItem(ADMIN_SESSION_KEY) === "active") location.replace("admin.html");

document.getElementById("show-password").addEventListener("change", event => {
  document.getElementById("login-password").type = event.target.checked ? "text" : "password";
});
document.getElementById("login-form").addEventListener("submit", event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  const error = document.getElementById("login-error");
  if (data.username === DEV_ADMIN_USERNAME && data.password === DEV_ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_SESSION_KEY, "active");
    location.replace("admin.html");
    return;
  }
  error.textContent = "The development credentials are not valid.";
});
