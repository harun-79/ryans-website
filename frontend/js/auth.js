function setAuthState() {
  const auth = getAuth();
  const authStatus = document.getElementById('auth-status');
  const authActions = document.getElementById('auth-actions');

  if (!authStatus || !authActions) return;

  if (auth?.user) {
    authStatus.textContent = `Logged in as ${auth.user.name}`;
    authActions.innerHTML = '<button id="logout-btn">Logout</button>';
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      logout();
      window.location.reload();
    });
  } else {
    authStatus.textContent = 'Not logged in';
    authActions.innerHTML = '<a class="btn" href="/login.html">Login / Register</a>';
  }
}

async function submitRegister(event) {
  event.preventDefault();
  const payload = {
    name: document.getElementById('reg-name').value,
    email: document.getElementById('reg-email').value,
    password: document.getElementById('reg-password').value
  };

  const result = await api.register(payload);
  alert(result.message || 'Registration done');
}

async function submitLogin(event) {
  event.preventDefault();
  const payload = {
    email: document.getElementById('login-email').value,
    password: document.getElementById('login-password').value
  };

  const result = await api.login(payload);
  if (result.token) {
    saveAuth(result);
    window.location.href = '/gallery.html';
  } else {
    alert(result.message || 'Login failed');
  }
}

document.getElementById('register-form')?.addEventListener('submit', submitRegister);
document.getElementById('login-form')?.addEventListener('submit', submitLogin);
setAuthState();
