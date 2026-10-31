const $ = selector => document.querySelector(selector);
const form = $('#account-form');
const tabs = [...document.querySelectorAll('.tab')];
let mode = 'register';
let currentUser = null;
let currentView = 'courses';
let courses = [];
let requestNumber = 0;
let noticeTimer;

function setMode(next) {
  mode = next;
  tabs.forEach(tab => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  $('#name-fields').hidden = mode === 'login';
  $('#name-fields').querySelectorAll('input').forEach(input => { input.required = mode === 'register'; });
  $('#role-field').hidden = mode === 'login';
  form.elements.password.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  $('#submit-button').textContent = mode === 'login' ? 'Sign in' : 'Create account';
  $('#message').hidden = true;
}
function authMessage(text) { $('#message').textContent = text; $('#message').className = 'message error'; $('#message').hidden = false; }
function notify(text) {
  clearTimeout(noticeTimer);
  $('#notice').textContent = text;
  $('#notice').hidden = false;
  noticeTimer = setTimeout(() => { $('#notice').hidden = true; }, 5000);
}
function signOut() {
  requestNumber++;
  currentUser = null;
  sessionStorage.removeItem('skillstream-token');
  document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
  $('#workspace').hidden = true;
  $('#auth-shell').hidden = false;
  form.reset();
  setMode('login');
  form.elements.email.focus();
}
async function api(path, options = {}) {
  const token = sessionStorage.getItem('skillstream-token');
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401 && currentUser) { signOut(); authMessage('Your session has ended. Please sign in again.'); }
    throw new Error(result.error || 'Something went wrong. Please try again.');
  }
  return result;
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function openCourse(course) {
  $('#detail-category').textContent = course.category;
  $('#detail-title').textContent = course.title;
  $('#detail-teacher').textContent = `By ${course.teacher_name}`;
  $('#detail-description').textContent = course.description;
  $('#detail-dialog').showModal();
}
function renderCourses() {
  const search = $('#course-search').value.trim().toLowerCase();
  const category = $('#category-filter').value;
  const filtered = courses.filter(course => (!category || course.category === category) && `${course.title} ${course.description} ${course.teacher_name}`.toLowerCase().includes(search));
  const list = $('#course-list');
  list.replaceChildren();
  $('#course-count').textContent = String(courses.length).padStart(2, '0');
  if (!filtered.length) {
    const empty = element('div', 'empty-state');
    empty.append(element('span', 'empty-index', '—'), element('h3', '', search || category ? 'No matching courses.' : currentUser.role === 'teacher' ? 'Your first course starts here.' : currentView === 'learning' ? 'A little room for something new.' : 'The next course is on its way.'));
    empty.append(element('p', '', search || category ? 'Try another search or category.' : currentUser.role === 'teacher' ? 'Create a draft, then publish it when you are ready.' : currentView === 'learning' ? 'Explore the catalog to find your first course.' : 'Published courses will appear here.'));
    if (currentView === 'learning' && !search && !category) { const button = element('button', 'text-button', 'Explore courses →'); button.onclick = () => showView('courses'); empty.append(button); }
    list.append(empty);
    return;
  }
  filtered.forEach((course, index) => {
    const row = element('article', 'course-row');
    row.append(element('span', 'course-index', String(index + 1).padStart(2, '0')));
    const info = element('div', 'course-info');
    info.append(element('span', 'course-category', course.category), element('h3', '', course.title), element('p', 'course-description', course.description));
    info.append(element('p', 'course-meta', currentUser.role === 'teacher' ? `${course.student_count} ${course.student_count === 1 ? 'student' : 'students'}` : `By ${course.teacher_name}`));
    const actions = element('div', 'course-actions');
    const button = element('button', 'secondary-button');
    if (currentUser.role === 'teacher') {
      actions.append(element('span', `course-status ${course.status}`, course.status === 'published' ? 'Published' : 'Draft'));
      button.textContent = course.status === 'published' ? 'Unpublish' : 'Publish course';
      button.onclick = async () => {
        button.disabled = true;
        try { await api(`/api/courses/${course.course_id}`, { method: 'PATCH', body: JSON.stringify({ status: course.status === 'published' ? 'draft' : 'published' }) }); await loadCourses(); }
        catch (error) { notify(error.message); button.disabled = false; }
      };
    } else if (course.enrolled || currentView === 'learning') {
      actions.append(element('span', 'course-status', 'Enrolled'));
      button.textContent = 'View course';
      button.onclick = () => openCourse(course);
    } else {
      button.textContent = 'Enroll in course';
      button.onclick = async () => {
        button.disabled = true;
        try { await api(`/api/courses/${course.course_id}/enroll`, { method: 'POST' }); notify('Added to My learning.'); await loadCourses(); }
        catch (error) { notify(error.message); button.disabled = false; }
      };
    }
    actions.append(button);
    row.append(info, actions);
    list.append(row);
  });
}
async function loadCourses() {
  const number = ++requestNumber;
  $('#course-list').replaceChildren(element('p', 'loading-state', 'Loading courses…'));
  try {
    const result = await api(currentView === 'learning' ? '/api/enrollments' : '/api/courses');
    if (number !== requestNumber || !currentUser) return;
    courses = result.courses;
    const selected = $('#category-filter').value;
    $('#category-filter').replaceChildren(new Option('All categories', ''));
    [...new Set(courses.map(course => course.category))].sort().forEach(category => $('#category-filter').add(new Option(category, category)));
    $('#category-filter').value = [...$('#category-filter').options].some(option => option.value === selected) ? selected : '';
    renderCourses();
  } catch (error) {
    if (number !== requestNumber || !currentUser) return;
    const box = element('div', 'empty-state');
    box.append(element('h3', '', 'Could not load your courses.'), element('p', '', error.message));
    const retry = element('button', 'secondary-button', 'Try again'); retry.onclick = loadCourses; box.append(retry);
    $('#course-list').replaceChildren(box);
    $('#course-count').textContent = '—';
  }
}
function showView(view) {
  currentView = view;
  const teacher = currentUser.role === 'teacher';
  document.querySelectorAll('.nav-item').forEach(button => { const active = button.dataset.view === view; button.classList.toggle('active', active); if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
  $('#page-kicker').textContent = view === 'profile' ? 'Your details' : teacher ? 'Teaching workspace' : 'Student workspace';
  $('#page-title').textContent = view === 'profile' ? 'Account.' : view === 'learning' ? 'My learning.' : teacher ? 'Your courses.' : 'Keep learning.';
  $('#new-course').hidden = !teacher || view === 'profile';
  $('#courses-view').hidden = view === 'profile';
  $('#profile-view').hidden = view !== 'profile';
  if (view === 'profile') {
    requestNumber++;
    const details = $('#profile-details'); details.replaceChildren();
    const entries = [['Name', `${currentUser.first_name} ${currentUser.last_name}`], ['Email', currentUser.email], ['Role', teacher ? 'Teacher' : 'Student'], ['Member since', new Date(currentUser.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })]];
    entries.forEach(([label, value]) => { const row = element('div'); row.append(element('dt', '', label), element('dd', '', value)); details.append(row); });
  } else {
    $('#course-search').value = '';
    $('#category-filter').value = '';
    $('#overview-label').textContent = teacher ? 'Courses created' : view === 'learning' ? 'Courses enrolled' : 'Available courses';
    $('#overview-note').textContent = teacher ? 'Good teaching begins with something worth sharing.' : view === 'learning' ? `Your space to pick up where you left off, ${currentUser.first_name}.` : `Find something worth your time, ${currentUser.first_name}.`;
    $('#list-title').textContent = teacher ? 'Course library' : view === 'learning' ? 'Your library' : 'The catalog';
    loadCourses();
  }
}
function showWorkspace(user) {
  currentUser = user;
  $('#auth-shell').hidden = true;
  $('#workspace').hidden = false;
  $('#workspace-role').textContent = user.role === 'teacher' ? 'Teacher' : 'Student';
  $('#sidebar-name').textContent = `${user.first_name} ${user.last_name}`;
  $('#user-initials').textContent = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  $('#courses-nav').textContent = user.role === 'teacher' ? 'My courses' : 'Explore courses';
  $('#learning-nav').hidden = user.role !== 'student';
  form.elements.password.value = '';
  showView('courses');
}
tabs.forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
form.addEventListener('submit', async event => {
  event.preventDefault();
  $('#submit-button').disabled = true;
  $('#message').hidden = true;
  try {
    const result = await api(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    sessionStorage.setItem('skillstream-token', result.token);
    showWorkspace(result.user);
    $('#page-title').focus();
  } catch (error) { authMessage(error.message); }
  finally { $('#submit-button').disabled = false; }
});
$('#sign-out').addEventListener('click', signOut);
document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
$('#course-search').addEventListener('input', renderCourses);
$('#category-filter').addEventListener('change', renderCourses);
$('#new-course').addEventListener('click', () => { $('#course-form').reset(); $('#course-error').textContent = ''; $('#course-dialog').showModal(); });
document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$('#course-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.target.querySelector('[type="submit"]'); button.disabled = true;
  $('#course-error').textContent = '';
  try { await api('/api/courses', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.target))) }); $('#course-dialog').close(); notify('Draft saved.'); await loadCourses(); }
  catch (error) { $('#course-error').textContent = error.message; }
  finally { button.disabled = false; }
});
if (sessionStorage.getItem('skillstream-token')) {
  $('#submit-button').disabled = true;
  api('/api/me').then(({ user }) => showWorkspace(user)).catch(error => { sessionStorage.removeItem('skillstream-token'); authMessage(error.message); }).finally(() => { $('#submit-button').disabled = false; });
}
