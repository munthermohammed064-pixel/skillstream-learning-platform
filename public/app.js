const $ = (selector) => document.querySelector(selector);
const form = $('#account-form');
const tabs = [...document.querySelectorAll('.tab')];
let mode = 'register';
let currentUser = null;
let currentView = 'courses';
let courses = [];
let requestNumber = 0;
let noticeTimer;
let editingCourseId = null;
const clientId = crypto.randomUUID();

function setMode(next) {
  mode = next;
  tabs.forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  $('#name-fields').hidden = mode === 'login';
  $('#name-fields')
    .querySelectorAll('input')
    .forEach((input) => {
      input.required = mode === 'register';
    });
  $('#role-field').hidden = mode === 'login';
  form.elements.password.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  $('#submit-button').textContent = mode === 'login' ? 'Sign in' : 'Create account';
  $('#message').hidden = true;
}
function authMessage(text) {
  $('#message').textContent = text;
  $('#message').className = 'message error';
  $('#message').hidden = false;
}
function notify(text) {
  clearTimeout(noticeTimer);
  $('#notice').textContent = text;
  $('#notice').hidden = false;
  noticeTimer = setTimeout(() => {
    $('#notice').hidden = true;
  }, 5000);
}
function signOut() {
  requestNumber++;
  stopOffers();
  classRequest++;
  lessonRequest++;
  window.dispatchEvent(new Event('workspace-ended'));
  currentUser = null;
  sessionStorage.removeItem('skillstream-token');
  document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
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
    headers: {
      'X-Client-ID': clientId,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401 && currentUser) {
      signOut();
      authMessage('Your session has ended. Please sign in again.');
    }
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
  return openClassroom(course.course_id);
}
function renderCourses() {
  const search = $('#course-search').value.trim().toLowerCase();
  const category = $('#category-filter').value;
  const filtered = courses.filter(
    (course) =>
      (!category || course.category === category) &&
      `${course.title} ${course.description} ${course.teacher_name}`.toLowerCase().includes(search),
  );
  const list = $('#course-list');
  list.replaceChildren();
  $('#course-count').textContent = String(courses.length).padStart(2, '0');
  if (!filtered.length) {
    const empty = element('div', 'empty-state');
    empty.append(
      element('span', 'empty-index', '—'),
      element(
        'h3',
        '',
        search || category
          ? 'No matching courses.'
          : currentUser.role === 'teacher'
            ? 'Your first course starts here.'
            : currentView === 'learning'
              ? 'A little room for something new.'
              : 'The next course is on its way.',
      ),
    );
    empty.append(
      element(
        'p',
        '',
        search || category
          ? 'Try another search or category.'
          : currentUser.role === 'teacher'
            ? 'Create a draft, then publish it when you are ready.'
            : currentView === 'learning'
              ? 'Explore the catalog to find your first course.'
              : 'Published courses will appear here.',
      ),
    );
    if (currentView === 'learning' && !search && !category) {
      const button = element('button', 'text-button', 'Explore courses →');
      button.onclick = () => showView('courses');
      empty.append(button);
    }
    list.append(empty);
    return;
  }
  const continuing =
    !search && !category && currentUser.role === 'student'
      ? filtered.find((c) => c.enrolled && c.progress_percent > 0 && c.progress_percent < 100)
      : null;
  if (continuing) {
    const feature = element('section', 'continue-card');
    const copy = element('div');
    copy.append(
      element('p', 'section-kicker', 'CONTINUE LEARNING'),
      element('h2', '', continuing.title),
    );
    const progress = element('progress');
    progress.max = 100;
    progress.value = continuing.progress_percent;
    progress.setAttribute('aria-label', 'Course completion');
    copy.append(progress, element('p', 'course-meta', `${continuing.progress_percent}% complete`));
    const resume = element('button', 'primary-button', 'Continue learning →');
    resume.onclick = () => openCourse(continuing);
    feature.append(copy, resume);
    list.append(feature);
  }
  filtered.forEach((course, index) => {
    const row = element('article', 'course-row');
    const categories = [
      'Software Engineering',
      'Web Development',
      'Mobile Development',
      'Data Science & AI',
      'Cybersecurity',
      'Cloud & DevOps',
      'Databases',
      'Networking & Systems',
    ];
    const symbols = ['{ }', '</>', 'App', 'AI', 'Key', 'Cloud', 'SQL', 'Net'];
    const theme = Math.max(0, categories.indexOf(course.category));
    const cover = element('div', `course-cover cover-${theme}`);
    cover.setAttribute('aria-hidden', 'true');
    cover.append(
      element('span', 'cover-symbol', symbols[theme]),
      element('span', 'cover-label', course.category),
    );
    row.append(cover);
    const info = element('div', 'course-info');
    info.append(
      element('span', 'course-category', course.category),
      element('h3', '', course.title),
      element('p', 'course-description', course.description),
    );
    info.append(
      element(
        'p',
        'course-meta',
        currentUser.role === 'teacher'
          ? `${course.student_count} ${course.student_count === 1 ? 'student' : 'students'}`
          : `By ${course.teacher_name}`,
      ),
    );
    info.append(element('p', 'course-meta', `${course.lesson_count || 0} lessons`));
    const actions = element('div', 'course-actions');
    const button = element('button', 'secondary-button');
    if (currentUser.role === 'teacher' || currentUser.role === 'admin') {
      const manage = element('button', 'text-button', 'Manage course →');
      manage.onclick = () => openCourse(course);
      actions.append(manage);
      actions.append(
        element(
          'span',
          `course-status ${course.status}`,
          course.status === 'published' ? 'Published' : 'Draft',
        ),
      );
      button.textContent = course.status === 'published' ? 'Unpublish' : 'Publish course';
      button.onclick = async () => {
        button.disabled = true;
        try {
          await api(`/api/courses/${course.course_id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: course.status === 'published' ? 'draft' : 'published' }),
          });
          await loadCourses();
        } catch (error) {
          notify(error.message);
          button.disabled = false;
        }
      };
    } else if (course.enrolled || currentView === 'learning') {
      actions.append(element('span', 'course-status', 'Enrolled'));
      info.append(
        element(
          'p',
          'progress-label',
          `${course.progress_percent}% complete · ${course.completed_count}/${course.lesson_count} lessons`,
        ),
      );
      button.textContent = 'Continue learning';
      button.onclick = () => openCourse(course);
    } else {
      button.textContent = 'Enroll in course';
      button.onclick = async () => {
        button.disabled = true;
        try {
          await api(`/api/courses/${course.course_id}/enroll`, { method: 'POST' });
          notify('Added to My learning.');
          await loadCourses();
        } catch (error) {
          notify(error.message);
          button.disabled = false;
        }
      };
    }
    if (currentUser.role === 'student') {
      const preview = element('button', 'text-button', 'Course details');
      preview.onclick = () => openCourse(course);
      const save = element('button', 'text-button', course.saved ? 'Saved ✓' : 'Save for later');
      save.onclick = async () => {
        save.disabled = true;
        try {
          await api(`/api/courses/${course.course_id}/save`, {
            method: course.saved ? 'DELETE' : 'PUT',
          });
          await loadCourses();
        } catch (error) {
          notify(error.message);
          save.disabled = false;
        }
      };
      actions.append(preview, save);
    }
    actions.append(button);
    row.append(info, actions);
    list.append(row);
  });
}
async function loadCourses(silent = false) {
  const number = ++requestNumber;
  if (silent !== true)
    $('#course-list').replaceChildren(element('p', 'loading-state', 'Loading courses…'));
  try {
    const result = await api(
      currentView === 'learning'
        ? '/api/enrollments'
        : currentView === 'saved'
          ? '/api/saved'
          : '/api/courses',
    );
    if (number !== requestNumber || !currentUser) return;
    courses = result.courses;
    const selected = $('#category-filter').value;
    $('#category-filter').replaceChildren(new Option('All categories', ''));
    [...new Set(courses.map((course) => course.category))]
      .sort()
      .forEach((category) => $('#category-filter').add(new Option(category, category)));
    $('#category-filter').value = [...$('#category-filter').options].some(
      (option) => option.value === selected,
    )
      ? selected
      : '';
    renderCourses();
  } catch (error) {
    if (number !== requestNumber || !currentUser) return;
    if (silent === true) {
      notify(error.message);
      return;
    }
    const box = element('div', 'empty-state');
    box.append(element('h3', '', 'Could not load your courses.'), element('p', '', error.message));
    const retry = element('button', 'secondary-button', 'Try again');
    retry.onclick = () => loadCourses();
    box.append(retry);
    $('#course-list').replaceChildren(box);
    $('#course-count').textContent = '—';
  }
}
function showView(view) {
  currentView = view;
  document.body.classList.remove('studio-wide');
  const teacher = currentUser.role === 'teacher';
  document.querySelectorAll('.nav-item').forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  if (handleExtraView(view)) return;
  $('#page-kicker').textContent =
    view === 'profile' ? 'Your details' : teacher ? 'Teaching workspace' : 'Student workspace';
  $('#page-title').textContent =
    view === 'profile'
      ? 'Account.'
      : view === 'learning'
        ? 'My learning.'
        : teacher
          ? 'Your courses.'
          : 'Keep learning.';
  $('#new-course').hidden = !teacher || view === 'profile';
  $('#courses-view').hidden = view === 'profile';
  $('#profile-view').hidden = view !== 'profile';
  if (view === 'profile') {
    requestNumber++;
    const details = $('#profile-details');
    details.replaceChildren();
    const entries = [
      ['Name', `${currentUser.first_name} ${currentUser.last_name}`],
      ['Email', currentUser.email],
      ['Role', currentUser.role],
      [
        'Member since',
        new Date(currentUser.created_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      ],
    ];
    entries.forEach(([label, value]) => {
      const row = element('div');
      row.append(element('dt', '', label), element('dd', '', value));
      details.append(row);
    });
    renderAccountForms();
  } else {
    $('#course-search').value = '';
    $('#category-filter').value = '';
    $('#overview-label').textContent = teacher
      ? 'Courses created'
      : view === 'learning'
        ? 'Courses enrolled'
        : 'Available courses';
    $('#overview-note').textContent = teacher
      ? 'Good teaching begins with something worth sharing.'
      : view === 'learning'
        ? `Your space to pick up where you left off, ${currentUser.first_name}.`
        : `Find something worth your time, ${currentUser.first_name}.`;
    $('#list-title').textContent = teacher
      ? 'Course library'
      : view === 'learning'
        ? 'Your library'
        : 'The catalog';
    loadCourses();
    if (view === 'saved') {
      $('#page-title').textContent = 'Saved for later.';
      $('#overview-label').textContent = 'Saved courses';
      $('#list-title').textContent = 'Your shortlist';
    }
  }
}
function showWorkspace(user) {
  currentUser = user;
  $('#landing').hidden = true;
  $('#auth-shell').hidden = true;
  $('#workspace').hidden = false;
  $('#workspace-role').textContent = user.role[0].toUpperCase() + user.role.slice(1);
  $('#sidebar-name').textContent = `${user.first_name} ${user.last_name}`;
  $('#user-initials').textContent = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  $('#courses-nav').textContent = user.role === 'teacher' ? 'My courses' : 'Explore courses';
  $('#learning-nav').hidden = user.role !== 'student';
  configureWorkspace(user);
  form.elements.password.value = '';
  showView(user.role === 'admin' ? 'promotions' : 'courses');
  window.dispatchEvent(new Event('workspace-ready'));
}
tabs.forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  $('#submit-button').disabled = true;
  $('#message').hidden = true;
  try {
    const result = await api(`/api/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    sessionStorage.setItem('skillstream-token', result.token);
    showWorkspace(result.user);
    $('#page-title').focus();
  } catch (error) {
    authMessage(error.message);
  } finally {
    $('#submit-button').disabled = false;
  }
});
$('#sign-out').addEventListener('click', signOut);
document
  .querySelectorAll('.nav-item')
  .forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
$('#course-search').addEventListener('input', renderCourses);
$('#category-filter').addEventListener('change', renderCourses);
$('#new-course').addEventListener('click', () =>
  editCourse(null).catch((error) => notify(error.message)),
);
document
  .querySelectorAll('.close-dialog')
  .forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
$('#course-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.target.querySelector('[type="submit"]');
  button.disabled = true;
  $('#course-error').textContent = '';
  try {
    await api(editingCourseId ? `/api/courses/${editingCourseId}` : '/api/courses', {
      method: editingCourseId ? 'PATCH' : 'POST',
      body: JSON.stringify(Object.fromEntries(new FormData(event.target))),
    });
    $('#course-dialog').close();
    notify(editingCourseId ? 'Course updated.' : 'Draft saved.');
    if (currentView === 'classroom' && editingCourseId) await openClassroom(editingCourseId);
    else await loadCourses();
  } catch (error) {
    $('#course-error').textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

tabs.forEach((tab, index) =>
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    setMode(tabs[next].dataset.mode);
    tabs[next].focus();
  }),
);
