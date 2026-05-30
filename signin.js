const form = document.getElementById("signin-form");
const messageEl = document.getElementById("form-message");
const submitBtn = document.getElementById("submit-btn");

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = `form-message form-message--${type}`;
  messageEl.hidden = false;
}

function hideMessage() {
  messageEl.hidden = true;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMessage();

  const email = form.email.value.trim();
  const password = form.password.value;

  if (!email || !password) {
    showMessage("Email and password are required.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Signing in...";

  try {
    const res = await fetch("/api/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.message || "Sign in failed. Please try again.", "error");
      return;
    }

    localStorage.setItem("lugx_user", JSON.stringify(data.user));
    showMessage(`Welcome back, ${data.user.fullName}! Redirecting...`, "success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);
  } catch {
    showMessage(
      "Could not reach the server. Run \"npm start\" in the GamesStore folder, then open this page using the URL shown in the terminal.",
      "error"
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Sign In";
  }
});
