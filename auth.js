const AUTH_STORAGE_KEY = "lugx_user";

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function signOut() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.location.href = "index.html";
}

function renderNavAuth() {
  const containers = document.querySelectorAll("[data-nav-auth]");
  const user = getCurrentUser();

  containers.forEach((container) => {
    if (user) {
      container.innerHTML = `
        <span class="nav-user">Hi, ${escapeHtml(user.fullName.split(" ")[0])}</span>
        <button type="button" class="nav-link" data-sign-out>Sign Out</button>
      `;
      container.querySelector("[data-sign-out]")?.addEventListener("click", signOut);
    } else {
      container.innerHTML = `
        <a href="signin.html" class="nav-link">Sign In</a>
        <a href="signup.html" class="btn btn-nav">Sign Up</a>
      `;
    }
  });

  const welcomeEl = document.getElementById("welcome-banner");
  if (welcomeEl) {
    if (user) {
      welcomeEl.textContent = `Welcome back, ${user.fullName}! Ready to play?`;
      welcomeEl.hidden = false;
    } else {
      welcomeEl.hidden = true;
    }
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", renderNavAuth);
