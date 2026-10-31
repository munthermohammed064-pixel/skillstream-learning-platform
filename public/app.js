const form = document.querySelector('#account-form');
const tabs = [...document.querySelectorAll('.tab')];
const nameFields = document.querySelector('#name-fields');
const roleField = document.querySelector('#role-field');
const message = document.querySelector('#message');
const panel = document.querySelector('#account-panel');
const submitButton = document.querySelector('#submit-button');
let mode = 'register';

function setMode(nextMode) {
  mode = nextMode;
  tabs.forEach(tab => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  nameFields.hidden = mode === 'login';
  nameFields.querySelectorAll('input').forEach(input => { input.required = mode === 'register'; });
  roleField.hidden = mode === 'login';
  form.elements.password.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  submitButton.innerHTML = mode === 'login' ? 'Sign in <span aria-hidden="true">→</span>' : 'Create my account <span aria-hidden="true">→</span>';
  message.hidden = true;
}

function showMessage(text, kind) {
  message.textContent = text;
  message.className = `message ${kind}`;
  message.hidden = false;
}

function showAccount(user) {
  document.querySelector('#account-name').textContent = `${user.first_name} ${user.last_name}`;
  document.querySelector('#account-details').textContent = `${user.email} · ${user.role[0].toUpperCase()}${user.role.slice(1)}`;
  panel.hidden = false;
}

tabs.forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.mode)));

form.addEventListener('submit', async event => {
  event.preventDefault();
  message.hidden = true;
  submitButton.disabled = true;
  const data = Object.fromEntries(new FormData(form));
  try {
    const response = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Please try again.');
    sessionStorage.setItem('skillstream-token', result.token);
    showAccount(result.user);
    form.hidden = true;
    document.querySelector('.tabs').hidden = true;
    showMessage(mode === 'register' ? 'Account created and signed in successfully.' : 'You are signed in.', 'success');
  } catch (error) {
    showMessage(error.message || 'Could not connect to the server. Please try again.', 'error');
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelector('#sign-out').addEventListener('click', () => {
  sessionStorage.removeItem('skillstream-token');
  panel.hidden = true;
  form.hidden = false;
  document.querySelector('.tabs').hidden = false;
  showMessage('You have signed out.', 'success');
  setMode('login');
});

const savedToken = sessionStorage.getItem('skillstream-token');
if (savedToken) {
  fetch('/api/me', { headers: { Authorization: `Bearer ${savedToken}` } })
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(({ user }) => {
      showAccount(user);
      form.hidden = true;
      document.querySelector('.tabs').hidden = true;
    })
    .catch(() => sessionStorage.removeItem('skillstream-token'));
}
