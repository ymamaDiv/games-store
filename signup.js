const form = document.getElementById("signup-form");
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

  const fullName = form.fullName.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;

  if (password !== confirmPassword) {
    showMessage("Passwords do not match.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account...";

  try {
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, confirmPassword }),
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.message || "Sign up failed. Please try again.", "error");
      return;
    }

    showMessage(data.message, "success");
    form.reset();
  } catch {
    showMessage(
      "Could not reach the server. Run \"npm start\" in the GamesStore folder, then open this page using the URL shown in the terminal.",
      "error"
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Account";
  }
});
