let categoryPromise;
let classData = null,
  selectedLesson = null,
  classTab = 'lessons',
  classRequest = 0,
  lessonRequest = 0,
  editorHandler = null;
let returnView = 'courses';
let openSubmissionAssignmentId = null;
const jsonRequest = (path, method, body) => api(path, { method, body: JSON.stringify(body) });
const roleName = (role) => role[0].toUpperCase() + role.slice(1);
const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    : 'No deadline';
function action(text, handler, style = 'secondary-button') {
  const button = element('button', style, text);
  button.type = 'button';
  button.onclick = () =>
    Promise.resolve()
      .then(() => handler(button))
      .catch((error) => notify(error.message));
  return button;
}
function field(label, name, value = '', type = 'text', options = {}) {
  const wrapper = element('label', '', label),
    input = element(type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input');
  input.name = name;
  if (type !== 'textarea' && type !== 'select') input.type = type;
  if (type === 'select')
    (options.choices || []).forEach(([value, text]) => input.add(new Option(text, value)));
  if (type === 'checkbox') input.checked = !!value;
  else if (type !== 'file') input.value = value ?? '';
  if (type !== 'file' && type !== 'select' && type !== 'checkbox') input.defaultValue = value ?? '';
  if (options.required) input.required = true;
  if (options.max) input.maxLength = options.max;
  if (options.min !== undefined) input.min = options.min;
  if (options.limit !== undefined) input.max = options.limit;
  if (options.accept) input.accept = options.accept;
  if (type === 'textarea') input.rows = options.rows || 5;
  wrapper.append(input);
  return wrapper;
}
function openEditor(title, fields, save) {
  $('#editor-title').textContent = title;
  $('#editor-fields').replaceChildren(...fields);
  $('#editor-error').textContent = '';
  $('#editor-save').textContent = 'Save';
  editorHandler = save;
  $('#editor-dialog').showModal();
}
$('#editor-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('#editor-save').disabled = true;
  $('#editor-error').textContent = '';
  try {
    await editorHandler(new FormData(event.target));
    $('#editor-dialog').close();
  } catch (error) {
    $('#editor-error').textContent = error.message;
  } finally {
    $('#editor-save').disabled = false;
    $('#editor-save').textContent = 'Save';
  }
});
function categories() {
  if (!categoryPromise)
    categoryPromise = api('/api/categories').catch((error) => {
      categoryPromise = null;
      throw error;
    });
  return categoryPromise;
}
async function editCourse(course) {
  const { categories: values } = await categories();
  editingCourseId = course?.course_id || null;
  const form = $('#course-form');
  form.reset();
  form.elements.category.replaceChildren(...values.map((value) => new Option(value, value)));
  if (course) {
    form.elements.title.value = course.title;
    form.elements.description.value = course.description;
    form.elements.category.value = course.category;
  }
  $('#course-dialog-title').textContent = course ? 'Edit course' : 'New technical course';
  form.querySelector('[type="submit"]').textContent = course ? 'Save changes' : 'Save draft';
  $('#course-error').textContent = '';
  $('#course-dialog').showModal();
}
function configureWorkspace(user) {
  $('#saved-nav').hidden = user.role !== 'student';
  $('#promotions-nav').hidden = user.role !== 'admin';
  $('#people-nav').hidden = user.role !== 'admin';
  if (user.role === 'admin') $('#courses-nav').textContent = 'Course moderation';
}
function handleExtraView(view) {
  classRequest++;
  lessonRequest++;
  stopOffers();
  $('#classroom-view').hidden = true;
  $('#admin-view').hidden = true;
  $('#new-offer').hidden = true;
  $('#offers').hidden = true;
  $('#profile-view')
    .querySelectorAll('.account-forms')
    .forEach((node) => node.remove());
  if (['promotions', 'people'].includes(view)) {
    requestNumber++;
    $('#courses-view').hidden = true;
    $('#profile-view').hidden = true;
    $('#admin-view').hidden = false;
    $('#new-course').hidden = true;
    $('#page-kicker').textContent = 'Administration';
    $('#page-title').textContent = view === 'promotions' ? 'Offers & news.' : 'People.';
    $('#new-offer').hidden = view !== 'promotions';
    if (view === 'promotions') loadAdminOffers();
    else loadPeople();
    return true;
  }
  if (view === 'classroom') {
    $('#courses-view').hidden = true;
    $('#profile-view').hidden = true;
    $('#classroom-view').hidden = false;
    $('#new-course').hidden = true;
    return true;
  }
  if (currentUser.role === 'admin' && view === 'courses') {
    $('#courses-view').hidden = false;
    $('#profile-view').hidden = true;
    $('#new-course').hidden = true;
    $('#page-kicker').textContent = 'Administration';
    $('#page-title').textContent = 'Course moderation.';
    $('#overview-label').textContent = 'Courses';
    $('#overview-note').textContent = 'Review course content and publication status.';
    $('#list-title').textContent = 'All technical courses';
    loadCourses();
    return true;
  }
  if (currentUser.role === 'student' && view === 'courses') loadStudentOffers();
  return false;
}
function renderAccountForms() {
  const box = element('div', 'account-forms');
  const names = element('form', 'settings-form');
  names.append(
    element('h2', '', 'Personal details'),
    field('First name', 'first_name', currentUser.first_name, 'text', { required: true, max: 100 }),
    field('Last name', 'last_name', currentUser.last_name, 'text', { required: true, max: 100 }),
  );
  const save = element('button', 'secondary-button', 'Save details');
  save.type = 'submit';
  names.append(save);
  names.onsubmit = async (event) => {
    event.preventDefault();
    save.disabled = true;
    try {
      const result = await jsonRequest('/api/me', 'PATCH', Object.fromEntries(new FormData(names)));
      currentUser = result.user;
      $('#sidebar-name').textContent = `${currentUser.first_name} ${currentUser.last_name}`;
      $('#user-initials').textContent = (
        currentUser.first_name[0] + currentUser.last_name[0]
      ).toUpperCase();
      showView('profile');
      notify('Details updated.');
    } catch (error) {
      notify(error.message);
    } finally {
      save.disabled = false;
    }
  };
  const password = element('form', 'settings-form');
  password.append(
    element('h2', '', 'Change password'),
    field('Current password', 'current_password', '', 'password', { required: true, max: 128 }),
    field('New password · 8–128 characters', 'password', '', 'password', {
      required: true,
      max: 128,
    }),
  );
  password.elements.current_password.autocomplete = 'current-password';
  password.elements.password.autocomplete = 'new-password';
  password.elements.password.minLength = 8;
  const change = element('button', 'secondary-button', 'Update password');
  change.type = 'submit';
  password.append(change);
  password.onsubmit = async (event) => {
    event.preventDefault();
    change.disabled = true;
    try {
      const result = await jsonRequest(
        '/api/me/password',
        'PUT',
        Object.fromEntries(new FormData(password)),
      );
      sessionStorage.setItem('skillstream-token', result.token);
      window.dispatchEvent(new Event('session-renewed'));
      password.reset();
      notify('Password updated. Other sessions have ended.');
    } catch (error) {
      notify(error.message);
    } finally {
      change.disabled = false;
    }
  };
  box.append(names, password);
  $('#profile-view').append(box);
}
async function openClassroom(id) {
  if (currentView !== 'classroom')
    returnView =
      currentView === 'learning' ? 'learning' : currentView === 'saved' ? 'saved' : 'courses';
  if (classData?.course.course_id !== id) {
    classTab = 'lessons';
    selectedLesson = null;
    openSubmissionAssignmentId = null;
  }
  currentView = 'classroom';
  handleExtraView('classroom');
  const number = ++classRequest;
  $('#page-title').textContent = 'Course.';
  $('#page-kicker').textContent = 'Technical learning';
  $('#classroom-view').replaceChildren(element('p', 'loading-state', 'Loading course…'));
  try {
    const result = await api(`/api/courses/${id}`);
    if (number !== classRequest || !currentUser) return;
    classData = result;
    renderClassroom();
  } catch (error) {
    if (number !== classRequest) return;
    $('#classroom-view').replaceChildren(
      action('← Back to courses', () => showView(returnView)),
      element('p', 'empty-state', error.message),
    );
  }
}
function renderClassroom() {
  const { course, can_manage, can_learn, lessons } = classData;
  const root = $('#classroom-view');
  root.replaceChildren();
  $('#page-title').textContent = course.title;
  $('#page-kicker').textContent = course.category;
  root.append(
    action(
      '← Back to courses',
      () => {
        classData = null;
        showView(returnView);
      },
      'text-button',
    ),
  );
  const intro = element('div', 'course-introduction');
  if (can_learn) {
    const wide = action('Wide view', (button) => {
      const expanded = document.body.classList.toggle('studio-wide');
      button.textContent = expanded ? 'Standard view' : 'Wide view';
      button.setAttribute('aria-pressed', String(expanded));
    });
    wide.setAttribute('aria-pressed', String(document.body.classList.contains('studio-wide')));
    root.append(wide);
  }

  intro.append(
    element('p', '', course.description),
    element('span', 'course-meta', `By ${course.teacher_name} · ${course.student_count} enrolled`),
  );
  const tools = element('div', 'inline-actions');
  if (can_manage) {
    tools.append(
      action('Edit course', () => editCourse(course)),
      action('Add lesson', () => editLesson()),
      action('Add assignment', () => editAssignment()),
    );
  } else if (!can_learn)
    tools.append(
      action(
        'Enroll in course',
        async (button) => {
          button.disabled = true;
          try {
            await api(`/api/courses/${course.course_id}/enroll`, { method: 'POST' });
            await openClassroom(course.course_id);
          } finally {
            button.disabled = false;
          }
        },
        'primary-button',
      ),
    );
  intro.append(tools);
  root.append(intro);
  if (!can_learn) {
    const preview = element('div', 'curriculum-preview');
    preview.append(element('h2', '', 'Course outline'));
    if (!lessons.length) preview.append(element('p', 'empty-state', 'Lessons are being prepared.'));
    lessons.forEach((lesson, index) =>
      preview.append(
        element('p', 'preview-lesson', `${String(index + 1).padStart(2, '0')}   ${lesson.title}`),
      ),
    );
    root.append(preview);
    return;
  }
  const nav = element('div', 'class-tabs');
  nav.setAttribute('role', 'tablist');
  ['lessons', 'assignments', 'discussion', ...(can_manage ? ['students'] : [])].forEach((tab) => {
    const button = action(
      roleName(tab),
      () => {
        classTab = tab;
        lessonRequest++;
        renderClassroom();
      },
      classTab === tab ? 'class-tab active' : 'class-tab',
    );
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(classTab === tab));
    nav.append(button);
  });
  root.append(nav);
  const body = element('div', 'class-body');
  root.append(body);
  if (classTab === 'lessons') renderLessons(body);
  else if (classTab === 'assignments') renderAssignments(body);
  else if (classTab === 'discussion') renderDiscussion(body);
  else renderStudents(body);
}
function renderLessons(root) {
  const { lessons, can_manage, course, progress } = classData;
  if (!lessons.length) {
    root.append(
      element(
        'div',
        'empty-state',
        can_manage
          ? 'Add your first lesson to get started.'
          : 'The teacher has not added lessons yet.',
      ),
    );
    return;
  }
  if (!lessons.some((lesson) => lesson.lesson_id === selectedLesson))
    selectedLesson = (
      lessons.find(
        (lesson) =>
          !classData.progress.some((item) => item.lesson_id === lesson.lesson_id && item.completed),
      ) || lessons[0]
    ).lesson_id;
  const layout = element('div', 'lesson-layout'),
    nav = element('nav', 'lesson-nav'),
    viewer = element('section', 'lesson-viewer');
  nav.setAttribute('aria-label', 'Course lessons');
  if (!can_manage) {
    const complete = progress.filter(
      (item) => item.completed && lessons.some((l) => l.lesson_id === item.lesson_id),
    ).length;
    nav.append(element('p', 'progress-label', `${complete} of ${lessons.length} complete`));
    const bar = element('progress');
    bar.max = lessons.length;
    bar.value = complete;
    bar.setAttribute('aria-label', 'Course completion');
    nav.append(bar);
  }
  lessons.forEach((lesson, index) => {
    const done = progress.some((item) => item.lesson_id === lesson.lesson_id && item.completed);
    const button = action(
      `${done ? '✓' : String(index + 1).padStart(2, '0')}  ${lesson.title}`,
      () => {
        selectedLesson = lesson.lesson_id;
        renderLessonsReplace();
      },
      lesson.lesson_id === selectedLesson ? 'lesson-link active' : 'lesson-link',
    );
    button.dataset.lessonId = lesson.lesson_id;
    if (lesson.lesson_id === selectedLesson) button.setAttribute('aria-current', 'step');
    nav.append(button);
  });
  layout.append(nav, viewer);
  root.append(layout);
  loadLesson(selectedLesson, viewer);
  function renderLessonsReplace() {
    lessonRequest++;
    root.replaceChildren();
    renderLessons(root);
  }
}
async function loadLesson(id, root) {
  const number = ++lessonRequest;
  root.append(element('p', 'loading-state', 'Loading lesson…'));
  try {
    const result = await api(`/api/lessons/${id}`);
    if (number !== lessonRequest || currentView !== 'classroom') return;
    root.replaceChildren();
    const lesson = result.lesson;
    root.append(element('h2', 'lesson-title', lesson.title));
    if (classData.can_manage) {
      const tools = element('div', 'inline-actions');
      tools.append(
        action('Edit lesson / video', () => editLesson(lesson)),
        action('Archive lesson', async () => {
          if (!confirm('Archive this lesson? The course must be unpublished first.')) return;
          await api(`/api/lessons/${id}`, { method: 'DELETE' });
          selectedLesson = null;
          await openClassroom(classData.course.course_id);
        }),
      );
      root.append(tools);
    }
    let video = null;
    if (lesson.video_url) {
      video = element('video', 'lesson-video');
      video.controls = true;
      video.preload = 'metadata';
      video.playsInline = true;
      video.src = lesson.video_url;
      video.setAttribute('aria-label', lesson.title);
      root.append(video);
      let savedAt = 0;
      const userId = currentUser.user_id;
      const savePosition = () => {
        if (
          currentUser?.user_id !== userId ||
          currentUser.role !== 'student' ||
          !Number.isFinite(video.currentTime)
        )
          return;
        api(`/api/lessons/${id}/progress`, {
          method: 'PUT',
          body: JSON.stringify({ position: video.currentTime }),
        }).catch((error) => {
          if (currentUser) notify(error.message);
        });
      };
      video.addEventListener('loadedmetadata', () => {
        if (result.progress.position && Number.isFinite(video.duration))
          video.currentTime = Math.min(result.progress.position, Math.max(0, video.duration - 1));
      });
      video.addEventListener('timeupdate', () => {
        if (Date.now() - savedAt > 10000) {
          savedAt = Date.now();
          savePosition();
        }
      });
      video.addEventListener('pause', savePosition);
      video.addEventListener('error', () =>
        notify('Video unavailable or the video link expired. Reopen this lesson to try again.'),
      );
    }
    if (lesson.content) root.append(renderLessonText(lesson.content));
    else if (!video) root.append(element('p', 'course-meta', 'Lesson content is being prepared.'));
    if (currentUser.role === 'student') {
      let completed = !!result.progress.completed;
      const toggle = action(
        completed ? 'Completed ✓' : 'Mark as complete',
        async (button) => {
          button.disabled = true;
          try {
            await jsonRequest(`/api/lessons/${id}/progress`, 'PUT', { completed: !completed });
            completed = !completed;
            const existing = classData.progress.find((item) => item.lesson_id === id);
            if (existing) existing.completed = Number(completed);
            else classData.progress.push({ lesson_id: id, completed: Number(completed) });
            button.textContent = completed ? 'Completed ✓' : 'Mark as complete';
            syncLessonProgress();
            notify(completed ? 'Lesson completed.' : 'Lesson marked incomplete.');
          } finally {
            button.disabled = false;
          }
        },
        'primary-button',
      );
      root.append(toggle);
      const index = classData.lessons.findIndex((l) => l.lesson_id === id);
      if (index < classData.lessons.length - 1)
        root.append(
          action(
            'Next lesson →',
            () => {
              selectedLesson = classData.lessons[index + 1].lesson_id;
              renderClassroom();
            },
            'text-button next-lesson',
          ),
        );
    }
    const note = element('form', 'note-form');
    note.append(
      element('h3', '', 'Private notes'),
      field('Your notes for this lesson', 'body', result.note, 'textarea', { max: 12000, rows: 4 }),
    );
    const save = element('button', 'secondary-button', 'Save notes');
    save.type = 'submit';
    note.append(save);
    note.onsubmit = async (event) => {
      event.preventDefault();
      save.disabled = true;
      try {
        await jsonRequest(`/api/lessons/${id}/note`, 'PUT', {
          body: new FormData(note).get('body'),
        });
        markFormSaved(note);
        notify('Notes saved.');
      } catch (error) {
        notify(error.message);
      } finally {
        save.disabled = false;
      }
    };
    root.append(note);
  } catch (error) {
    if (number === lessonRequest)
      root.replaceChildren(
        element('p', 'empty-state', error.message),
        action('Try again', () => loadLesson(id, root)),
      );
  }
}
function editLesson(lesson = null) {
  let lessonId = lesson?.lesson_id || null;
  const fields = [
    field('Title', 'title', lesson?.title || '', 'text', { required: true, max: 160 }),
    field('Lesson text', 'content', lesson?.content || '', 'textarea', { max: 30000, rows: 9 }),
    ...(lesson
      ? [
          field('Lesson order', 'position', lesson.position, 'number', {
            required: true,
            min: 1,
            limit: 10000,
          }),
        ]
      : []),
    field('Video · MP4 / WebM · up to 100 MB', 'video', '', 'file', {
      accept: 'video/mp4,video/webm',
    }),
  ];
  openEditor(lesson ? 'Edit lesson' : 'New lesson', fields, async (data) => {
    const file = data.get('video');
    if (file?.size > 100 * 1024 * 1024) throw new Error('Video limit is 100 MB.');
    const payload = {
      title: data.get('title'),
      content: data.get('content'),
      ...(lesson ? { position: Number(data.get('position')) } : {}),
    };
    if (lessonId) await jsonRequest(`/api/lessons/${lessonId}`, 'PATCH', payload);
    else {
      const result = await jsonRequest(
        `/api/courses/${classData.course.course_id}/lessons`,
        'POST',
        payload,
      );
      lessonId = result.lesson.lesson_id;
    }
    if (file?.size) {
      $('#editor-save').textContent = 'Uploading video…';
      const response = await fetch(`/api/lessons/${lessonId}/video`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('skillstream-token')}`,
          'X-Client-ID': clientId,
          'Content-Type':
            file.type || (file.name.toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4'),
        },
        body: file,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(`Lesson saved; video upload failed: ${result.error}`);
    }
    selectedLesson = lessonId;
    classTab = 'lessons';
    await openClassroom(classData.course.course_id);
    notify('Lesson saved.');
  });
}
function syncLessonProgress() {
  const complete = classData.progress.filter(
    (item) => item.completed && classData.lessons.some((l) => l.lesson_id === item.lesson_id),
  ).length;
  const nav = $('.lesson-nav');
  if (!nav) return;
  const label = nav.querySelector('.progress-label'),
    bar = nav.querySelector('progress');
  if (label) label.textContent = `${complete} of ${classData.lessons.length} complete`;
  if (bar) bar.value = complete;
  nav.querySelectorAll('[data-lesson-id]').forEach((button) => {
    const index = classData.lessons.findIndex(
      (lesson) => lesson.lesson_id === button.dataset.lessonId,
    );
    const done = classData.progress.some(
      (item) => item.lesson_id === button.dataset.lessonId && item.completed,
    );
    button.textContent = `${done ? '✓' : String(index + 1).padStart(2, '0')}  ${classData.lessons[index].title}`;
  });
}
function localDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function editAssignment(assignment = null) {
  openEditor(
    assignment ? 'Edit assignment' : 'New assignment',
    [
      field('Title', 'title', assignment?.title || '', 'text', { required: true, max: 160 }),
      field('Instructions', 'instructions', assignment?.instructions || '', 'textarea', {
        required: true,
        max: 12000,
      }),
      field('Deadline · optional', 'due_at', localDate(assignment?.due_at), 'datetime-local'),
    ],
    async (data) => {
      const payload = {
        title: data.get('title'),
        instructions: data.get('instructions'),
        due_at: data.get('due_at') ? new Date(data.get('due_at')).toISOString() : null,
      };
      await jsonRequest(
        assignment
          ? `/api/assignments/${assignment.assignment_id}`
          : `/api/courses/${classData.course.course_id}/assignments`,
        assignment ? 'PATCH' : 'POST',
        payload,
      );
      classTab = 'assignments';
      await openClassroom(classData.course.course_id);
      notify('Assignment saved.');
    },
  );
}
async function renderAssignments(root) {
  const courseId = classData.course.course_id;
  root.append(element('p', 'loading-state', 'Loading assignments…'));
  try {
    const { assignments } = await api(`/api/courses/${courseId}/assignments`);
    if (
      currentView !== 'classroom' ||
      classTab !== 'assignments' ||
      classData.course.course_id !== courseId
    )
      return;
    root.replaceChildren();
    if (!assignments.length) {
      root.append(element('div', 'empty-state', 'No assignments yet.'));
      return;
    }
    assignments.forEach((assignment) => {
      const item = element('article', 'assignment-card');
      item.append(
        element('h3', '', assignment.title),
        element('p', 'course-meta', formatDate(assignment.due_at)),
        element('p', 'assignment-instructions', assignment.instructions),
      );
      if (classData.can_manage) {
        const tools = element('div', 'inline-actions');
        tools.append(
          action('Edit assignment', () => editAssignment(assignment)),
          action('Review submissions', () => renderSubmissions(assignment, item)),
        );
        item.append(tools);
        if (openSubmissionAssignmentId === assignment.assignment_id)
          renderSubmissions(assignment, item);
      } else {
        const graded =
          assignment.submission?.score !== null && assignment.submission?.score !== undefined;
        const expired = assignment.due_at && Date.parse(assignment.due_at) < Date.now();
        if (graded)
          item.append(
            element('p', 'grade-result', `${assignment.submission.score}/100`),
            element(
              'p',
              'lesson-content',
              assignment.submission.feedback || 'No written feedback.',
            ),
          );
        const form = element('form', 'submission-form');
        form.append(
          field('Your answer', 'body', assignment.submission?.body || '', 'textarea', {
            required: true,
            max: 20000,
            rows: 6,
          }),
        );
        const button = element(
          'button',
          'secondary-button',
          graded
            ? 'Graded'
            : expired
              ? 'Deadline passed'
              : assignment.submission
                ? 'Update submission'
                : 'Submit assignment',
        );
        button.type = 'submit';
        button.disabled = graded || expired;
        form.querySelector('textarea').readOnly = graded || expired;
        form.append(button);
        if (assignment.submission)
          form.append(
            element(
              'p',
              'course-meta',
              `Submitted ${formatDate(assignment.submission.submitted_at)}`,
            ),
          );
        form.onsubmit = async (event) => {
          event.preventDefault();
          button.disabled = true;
          try {
            await jsonRequest(`/api/assignments/${assignment.assignment_id}/submit`, 'PUT', {
              body: new FormData(form).get('body'),
            });
            await renderAssignments(root);
            notify('Assignment submitted.');
          } catch (error) {
            notify(error.message);
            button.disabled = false;
          }
        };
        item.append(form);
      }
      root.append(item);
    });
  } catch (error) {
    root.replaceChildren(element('p', 'empty-state', error.message));
  }
}
async function renderSubmissions(assignment, item) {
  openSubmissionAssignmentId = assignment.assignment_id;
  item.querySelector('.submissions')?.remove();
  const box = element('section', 'submissions');
  box.append(element('p', 'loading-state', 'Loading submissions…'));
  item.append(box);
  try {
    const { submissions } = await api(`/api/assignments/${assignment.assignment_id}/submissions`);
    box.replaceChildren();
    if (!submissions.length) box.append(element('p', 'course-meta', 'No submissions yet.'));
    submissions.forEach((submission) => {
      const form = element('form', 'review-form');
      form.append(
        element('h3', '', submission.student_name),
        element('p', 'course-meta', formatDate(submission.submitted_at)),
        element('p', 'lesson-content', submission.body),
        field('Score / 100', 'score', submission.score ?? '', 'number', {
          required: true,
          min: 0,
          limit: 100,
        }),
        field('Feedback', 'feedback', submission.feedback, 'textarea', { max: 5000, rows: 3 }),
      );
      const button = element('button', 'secondary-button', 'Save grade');
      button.type = 'submit';
      form.append(button);
      form.onsubmit = async (event) => {
        event.preventDefault();
        button.disabled = true;
        try {
          const data = new FormData(form);
          await jsonRequest(`/api/submissions/${submission.submission_id}`, 'PATCH', {
            score: Number(data.get('score')),
            feedback: data.get('feedback'),
          });
          markFormSaved(form);
          notify('Grade saved.');
        } catch (error) {
          notify(error.message);
        } finally {
          button.disabled = false;
        }
      };
      box.append(form);
    });
  } catch (error) {
    box.replaceChildren(element('p', 'form-error', error.message));
  }
}
async function renderDiscussion(root) {
  const id = classData.course.course_id;
  root.append(element('p', 'loading-state', 'Loading questions…'));
  try {
    const { questions } = await api(`/api/courses/${id}/questions`);
    if (
      currentView !== 'classroom' ||
      classTab !== 'discussion' ||
      classData.course.course_id !== id
    )
      return;
    root.replaceChildren();
    if (currentUser.role === 'student') {
      const form = element('form', 'question-form');
      form.append(
        field('Ask your teacher', 'body', '', 'textarea', { required: true, max: 3000, rows: 3 }),
      );
      const button = element('button', 'secondary-button', 'Post question');
      button.type = 'submit';
      form.append(button);
      form.onsubmit = async (event) => {
        event.preventDefault();
        button.disabled = true;
        try {
          await jsonRequest(`/api/courses/${id}/questions`, 'POST', {
            body: new FormData(form).get('body'),
          });
          await renderDiscussion(root);
        } catch (error) {
          notify(error.message);
          button.disabled = false;
        }
      };
      root.append(form);
    }
    if (!questions.length) root.append(element('p', 'empty-state', 'No questions yet.'));
    questions.forEach((question) => {
      const item = element('article', 'question-card');
      item.append(
        element('p', 'course-meta', `${question.author} · ${formatDate(question.created_at)}`),
        element('p', 'lesson-content', question.body),
      );
      if (question.answer) item.append(element('p', 'teacher-answer', question.answer));
      if (classData.can_manage) {
        const form = element('form');
        form.append(
          field('Teacher reply', 'answer', question.answer, 'textarea', {
            required: true,
            max: 6000,
            rows: 3,
          }),
        );
        const button = element('button', 'secondary-button', 'Save reply');
        button.type = 'submit';
        form.append(button);
        form.onsubmit = async (event) => {
          event.preventDefault();
          button.disabled = true;
          try {
            await jsonRequest(`/api/questions/${question.question_id}`, 'PATCH', {
              answer: new FormData(form).get('answer'),
            });
            await renderDiscussion(root);
          } catch (error) {
            notify(error.message);
            button.disabled = false;
          }
        };
        item.append(form);
      }
      root.append(item);
    });
  } catch (error) {
    root.replaceChildren(element('p', 'empty-state', error.message));
  }
}
async function renderStudents(root) {
  const id = classData.course.course_id;
  root.append(element('p', 'loading-state', 'Loading students…'));
  try {
    const { students } = await api(`/api/courses/${id}/students`);
    if (currentView !== 'classroom' || classTab !== 'students' || classData.course.course_id !== id)
      return;
    root.replaceChildren();
    if (!students.length)
      root.append(element('p', 'empty-state', 'No students have enrolled yet.'));
    students.forEach((student) => {
      const row = element('article', 'person-row');
      row.append(
        element('strong', '', `${student.first_name} ${student.last_name}`),
        element(
          'span',
          'course-meta',
          `${student.completed_count}/${student.lesson_count} lessons · ${student.lesson_count ? Math.round((student.completed_count / student.lesson_count) * 100) : 0}%`,
        ),
      );
      root.append(row);
    });
  } catch (error) {
    root.replaceChildren(element('p', 'empty-state', error.message));
  }
}

let offers = [],
  offerIndex = 0,
  offerTimer = null,
  offerPaused = false,
  offerHover = false,
  offerRequest = 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function stopOffers() {
  clearTimeout(offerTimer);
  offerTimer = null;
  offerRequest++;
}
function scheduleOffer() {
  clearTimeout(offerTimer);
  if (
    offers.length > 1 &&
    !offerPaused &&
    !offerHover &&
    !reducedMotion.matches &&
    !document.hidden &&
    currentUser?.role === 'student' &&
    currentView === 'courses' &&
    !$('#offers').contains(document.activeElement)
  )
    offerTimer = setTimeout(() => {
      offerIndex = (offerIndex + 1) % offers.length;
      renderOffer();
    }, 7000);
}
function renderOffer() {
  offers = offers.filter(
    (offer) =>
      (!offer.ends_at || Date.parse(offer.ends_at) > Date.now()) &&
      (!offer.starts_at || Date.parse(offer.starts_at) <= Date.now()),
  );
  if (!offers.length) {
    $('#offers').hidden = true;
    stopOffers();
    return;
  }
  offerIndex %= offers.length;
  const offer = offers[offerIndex],
    root = $('#offer-card');
  root.replaceChildren();
  $('#offers').hidden = currentView !== 'courses' || currentUser?.role !== 'student';
  const badge = element(
    'div',
    'offer-badge',
    offer.discount_percent ? `${offer.discount_percent}%` : 'News',
  );
  const copy = element('div', 'offer-copy');
  copy.append(
    element(
      'p',
      'section-kicker',
      offer.discount_percent ? 'Technical course offer' : 'From SkillStream',
    ),
    element('h2', '', offer.title),
  );
  if (offer.body) copy.append(element('p', '', offer.body));
  if (offer.ends_at)
    copy.append(element('span', 'course-meta', `Until ${formatDate(offer.ends_at)}`));
  if (offer.course_id)
    copy.append(action('View course →', () => openClassroom(offer.course_id), 'text-button'));
  root.append(badge, copy);
  $('#offer-position').textContent = `${offerIndex + 1} / ${offers.length}`;
  $('#offer-pause').textContent = reducedMotion.matches ? 'Manual' : offerPaused ? 'Play' : 'Pause';
  $('#offer-pause').disabled = reducedMotion.matches || offers.length < 2;
  $('#offer-pause').setAttribute(
    'aria-label',
    offerPaused ? 'Start automatic offers' : 'Pause automatic offers',
  );
  $('#offer-previous').disabled = offers.length < 2;
  $('#offer-next').disabled = offers.length < 2;
  scheduleOffer();
}
async function loadStudentOffers() {
  const number = ++offerRequest;
  try {
    const result = await api('/api/promotions');
    if (number !== offerRequest || currentUser?.role !== 'student' || currentView !== 'courses')
      return;
    if (JSON.stringify(offers) === JSON.stringify(result.promotions)) {
      if (offers.length && $('#offers').hidden) renderOffer();
      return;
    }
    const id = offers[offerIndex]?.promotion_id;
    offers = result.promotions;
    offerIndex = Math.max(
      0,
      offers.findIndex((offer) => offer.promotion_id === id),
    );
    renderOffer();
  } catch (error) {
    if (number === offerRequest) {
      $('#offers').hidden = true;
      notify(error.message);
    }
  }
}
$('#offer-previous').onclick = () => {
  if (offers.length) {
    offerIndex = (offerIndex - 1 + offers.length) % offers.length;
    renderOffer();
  }
};
$('#offer-next').onclick = () => {
  if (offers.length) {
    offerIndex = (offerIndex + 1) % offers.length;
    renderOffer();
  }
};
$('#offer-pause').onclick = () => {
  offerPaused = !offerPaused;
  renderOffer();
};
$('#offers').addEventListener('pointerenter', () => {
  offerHover = true;
  clearTimeout(offerTimer);
});
$('#offers').addEventListener('pointerleave', () => {
  offerHover = false;
  scheduleOffer();
});
$('#offers').addEventListener('focusin', () => clearTimeout(offerTimer));
$('#offers').addEventListener('focusout', () => setTimeout(scheduleOffer, 0));
document.addEventListener('visibilitychange', () =>
  document.hidden ? clearTimeout(offerTimer) : scheduleOffer(),
);
reducedMotion.addEventListener('change', scheduleOffer);
setInterval(() => {
  if (currentUser?.role === 'student' && currentView === 'courses' && !document.hidden)
    loadStudentOffers();
}, 30000);
function offerStatus(offer) {
  if (!offer.enabled) return 'Paused';
  if (offer.ends_at && Date.parse(offer.ends_at) <= Date.now()) return 'Ended';
  if (offer.starts_at && Date.parse(offer.starts_at) > Date.now()) return 'Scheduled';
  return 'Active';
}
async function loadAdminOffers() {
  const root = $('#admin-view');
  root.replaceChildren(element('p', 'loading-state', 'Loading offers…'));
  try {
    const { promotions } = await api('/api/admin/promotions');
    if (currentView !== 'promotions') return;
    root.replaceChildren();
    root.append(
      element(
        'p',
        'admin-hint',
        'Offers are announcements. Checkout and payment processing are not enabled.',
      ),
    );
    if (!promotions.length)
      root.append(element('p', 'empty-state', 'Create your first offer or announcement.'));
    promotions.forEach((offer) => {
      const row = element('article', 'admin-offer');
      const copy = element('div');
      copy.append(
        element(
          'span',
          'course-category',
          `${offer.discount_percent ? offer.discount_percent + '% off' : 'Announcement'} · ${offerStatus(offer)}`,
        ),
        element('h3', '', offer.title),
        element('p', 'course-description', offer.body),
        element(
          'p',
          'course-meta',
          `${offer.course_title || 'All technical courses'} · ${offer.starts_at ? formatDate(offer.starts_at) : 'Starts now'} → ${offer.ends_at ? formatDate(offer.ends_at) : 'No end date'}`,
        ),
      );
      const tools = element('div', 'inline-actions');
      tools.append(
        action('Edit', () => editOffer(offer)),
        action(offer.enabled ? 'Pause' : 'Enable', async (button) => {
          button.disabled = true;
          try {
            await jsonRequest(`/api/admin/promotions/${offer.promotion_id}`, 'PATCH', {
              enabled: !offer.enabled,
            });
            await loadAdminOffers();
          } finally {
            button.disabled = false;
          }
        }),
      );
      row.append(copy, tools);
      root.append(row);
    });
  } catch (error) {
    root.replaceChildren(
      element('p', 'empty-state', error.message),
      action('Try again', loadAdminOffers),
    );
  }
}
async function editOffer(offer = null) {
  const { courses } = await api('/api/courses');
  openEditor(
    offer ? 'Edit offer' : 'New offer or announcement',
    [
      field('Title', 'title', offer?.title || '', 'text', { required: true, max: 100 }),
      field('Message', 'body', offer?.body || '', 'textarea', { max: 240, rows: 3 }),
      field(
        'Discount % · use 0 for announcements',
        'discount_percent',
        offer?.discount_percent || 0,
        'number',
        { required: true, min: 0, limit: 90 },
      ),
      field('Course', 'course_id', offer?.course_id || '', 'select', {
        choices: [
          ['', 'All technical courses'],
          ...courses.map((course) => [course.course_id, course.title]),
        ],
      }),
      field('Starts · optional', 'starts_at', localDate(offer?.starts_at), 'datetime-local'),
      field('Ends · optional', 'ends_at', localDate(offer?.ends_at), 'datetime-local'),
      field('Enabled', 'enabled', offer ? !!offer.enabled : true, 'checkbox'),
    ],
    async (data) => {
      const payload = {
        title: data.get('title'),
        body: data.get('body'),
        discount_percent: Number(data.get('discount_percent')),
        course_id: data.get('course_id') || null,
        enabled: data.get('enabled') === 'on',
        starts_at: data.get('starts_at') ? new Date(data.get('starts_at')).toISOString() : null,
        ends_at: data.get('ends_at') ? new Date(data.get('ends_at')).toISOString() : null,
      };
      await jsonRequest(
        offer ? `/api/admin/promotions/${offer.promotion_id}` : '/api/admin/promotions',
        offer ? 'PUT' : 'POST',
        payload,
      );
      await loadAdminOffers();
      notify('Offer saved.');
    },
  );
}
$('#new-offer').onclick = () => editOffer().catch((error) => notify(error.message));
async function loadPeople() {
  const root = $('#admin-view');
  const oldSearch = root.querySelector('input[type=search]');
  const previousSearch = oldSearch?.value || '';
  const hadFocus = document.activeElement === oldSearch;
  root.replaceChildren(element('p', 'loading-state', 'Loading people…'));
  try {
    const { users } = await api('/api/admin/users');
    if (currentView !== 'people') return;
    root.replaceChildren();
    const search = element('input');
    search.type = 'search';
    search.value = previousSearch;
    search.placeholder = 'Search name or email';
    search.setAttribute('aria-label', 'Search people');
    const rows = element('div');
    root.append(search, rows);
    const render = () => {
      rows.replaceChildren();
      const filtered = users.filter((user) =>
        `${user.first_name} ${user.last_name} ${user.email}`
          .toLowerCase()
          .includes(search.value.trim().toLowerCase()),
      );
      if (!filtered.length) rows.append(element('p', 'empty-state', 'No matching accounts.'));
      filtered.forEach((user) => {
        const row = element('article', 'person-row');
        const copy = element('div');
        copy.append(
          element('strong', '', `${user.first_name} ${user.last_name}`),
          element(
            'p',
            'course-meta',
            `${user.email} · ${roleName(user.role)} · ${user.disabled ? 'Disabled' : 'Active'}`,
          ),
        );
        row.append(copy);
        if (user.role !== 'admin')
          row.append(
            action(user.disabled ? 'Enable account' : 'Disable account', async (button) => {
              if (
                !user.disabled &&
                !confirm(`Disable ${user.first_name}'s account? Their sessions will end.`)
              )
                return;
              button.disabled = true;
              try {
                await jsonRequest(`/api/admin/users/${user.user_id}`, 'PATCH', {
                  disabled: !user.disabled,
                });
                await loadPeople();
              } catch (error) {
                button.disabled = false;
                throw error;
              }
            }),
          );
        rows.append(row);
      });
    };
    search.oninput = render;
    render();
    if (hadFocus) search.focus({ preventScroll: true });
  } catch (error) {
    root.replaceChildren(
      element('p', 'empty-state', error.message),
      action('Try again', loadPeople),
    );
  }
}

function renderLessonText(content) {
  const wrapper = element('div', 'lesson-content lesson-prose');
  const pattern = /```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g;
  let index = 0,
    match;
  while ((match = pattern.exec(content))) {
    if (match.index > index)
      wrapper.append(element('div', 'prose-text', content.slice(index, match.index).trim()));
    const block = element('div', 'code-block'),
      pre = element('pre'),
      code = element('code', '', match[1].replace(/\n$/, ''));
    pre.append(code);
    block.append(
      action(
        'Copy code',
        async () => {
          await navigator.clipboard.writeText(code.textContent);
          notify('Code copied.');
        },
        'copy-code',
      ),
      pre,
    );
    wrapper.append(block);
    index = pattern.lastIndex;
  }
  if (index < content.length)
    wrapper.append(element('div', 'prose-text', content.slice(index).trim()));
  return wrapper;
}
