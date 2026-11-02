let liveController = null,
  liveGeneration = 0,
  refreshTimer = null;
let pendingTopics = new Set();
function liveStatus(text, state) {
  const node = $('#live-status');
  node.textContent = text;
  node.dataset.state = state;
}
function hasUnsavedWork() {
  if (document.querySelector('dialog[open]')) return true;
  return [...$('#workspace').querySelectorAll('form input,form textarea,form select')].some(
    (input) => {
      if (input.type === 'search') return false;
      if (input.type === 'checkbox') return input.checked !== input.defaultChecked;
      if (input.type === 'file') return !!input.files?.length;
      return input.value !== input.defaultValue && input.tagName !== 'SELECT';
    },
  );
}
function markFormSaved(form) {
  for (const input of form.elements) {
    if (input.type === 'checkbox') input.defaultChecked = input.checked;
    else if ('defaultValue' in input) input.defaultValue = input.value;
  }
}
function waitForReconnect(ms, signal) {
  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', finish);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    signal.addEventListener('abort', finish, { once: true });
  });
}
function stopLiveUpdates() {
  liveGeneration++;
  liveController?.abort();
  liveController = null;
  clearTimeout(refreshTimer);
  pendingTopics.clear();
  $('#live-update').hidden = true;
  liveStatus('Offline', 'offline');
}
async function startLiveUpdates() {
  stopLiveUpdates();
  if (!currentUser) return;
  const generation = liveGeneration,
    controller = new AbortController();
  liveController = controller;
  let connectedBefore = false,
    delay = 800;
  while (currentUser && !controller.signal.aborted && generation === liveGeneration) {
    const token = sessionStorage.getItem('skillstream-token');
    if (!token) return;
    try {
      liveStatus(connectedBefore ? 'Reconnecting' : 'Connecting', 'connecting');
      const response = await fetch('/api/events', {
        headers: { Authorization: `Bearer ${token}`, 'X-Client-ID': clientId },
        signal: controller.signal,
      });
      if (response.status === 401) {
        signOut();
        authMessage('Your session has ended. Please sign in again.');
        return;
      }
      if (!response.ok || !response.body) throw new Error('Live connection unavailable');
      const reader = response.body.getReader(),
        decoder = new TextDecoder();
      let buffer = '';
      try {
        while (!controller.signal.aborted) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buffer += decoder.decode(chunk.value, { stream: true });
          let boundary;
          while ((boundary = buffer.indexOf('\n\n')) !== -1) {
            const block = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            const event = block
              .split('\n')
              .find((line) => line.startsWith('event:'))
              ?.slice(6)
              .trim();
            const raw = block
              .split('\n')
              .filter((line) => line.startsWith('data:'))
              .map((line) => line.slice(5).trim())
              .join('\n');
            if (event === 'ready') {
              liveStatus('Live', 'connected');
              delay = 800;
              if (connectedBefore) queueLiveUpdate({ topic: 'reconnect' });
              connectedBefore = true;
            } else if (event === 'session-ended') {
              if (sessionStorage.getItem('skillstream-token') === token) {
                signOut();
                authMessage('Your session has ended. Please sign in again.');
              }
              return;
            } else if (event === 'change' && raw) {
              const change = JSON.parse(raw);
              if (change.origin !== clientId) queueLiveUpdate(change);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (controller.signal.aborted) return;
    }
    if (controller.signal.aborted || generation !== liveGeneration) return;
    liveStatus('Reconnecting', 'connecting');
    await waitForReconnect(delay, controller.signal);
    delay = Math.min(delay * 2, 8000);
  }
}
function queueLiveUpdate(change) {
  if (!currentUser) return;
  if (
    change.course_id &&
    currentView === 'classroom' &&
    classData?.course.course_id !== change.course_id &&
    change.topic !== 'courses'
  )
    return;
  if (change.topic === 'assignments' && currentUser.role === 'student')
    notify('Your coursework has been updated.');
  pendingTopics.add(change.topic);
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => applyLiveUpdates(false), 140);
}
async function applyLiveUpdates(force = false) {
  if (!currentUser || !pendingTopics.size) return;
  const playing = $('.lesson-video');
  const safeProgress =
    currentView === 'classroom' &&
    classTab === 'lessons' &&
    [...pendingTopics].every((topic) => topic === 'progress');
  if (
    !force &&
    !safeProgress &&
    (hasUnsavedWork() ||
      (currentView === 'classroom' &&
        playing &&
        !playing.paused &&
        [...pendingTopics].some((topic) => !['progress', 'notes'].includes(topic))))
  ) {
    $('#live-update').hidden = false;
    return;
  }
  const topics = new Set(pendingTopics);
  pendingTopics.clear();
  $('#live-update').hidden = true;
  try {
    if (topics.has('profile') || topics.has('reconnect')) {
      const result = await api('/api/me');
      currentUser = result.user;
      $('#sidebar-name').textContent = `${currentUser.first_name} ${currentUser.last_name}`;
      $('#user-initials').textContent = (
        currentUser.first_name[0] + currentUser.last_name[0]
      ).toUpperCase();
      if (currentView === 'profile') {
        showView('profile');
        return;
      }
    }
    if (currentView === 'promotions') {
      await loadAdminOffers();
      return;
    }
    if (currentView === 'people') {
      await loadPeople();
      return;
    }
    if (['courses', 'learning', 'saved'].includes(currentView)) {
      if (
        currentUser.role === 'student' &&
        currentView === 'courses' &&
        (topics.has('promotions') || topics.has('courses') || topics.has('reconnect'))
      )
        await loadStudentOffers();
      if ([...topics].some((topic) => !['promotions', 'notes', 'discussion'].includes(topic)))
        await loadCourses(true);
      return;
    }
    if (currentView === 'classroom' && classData) {
      const id = classData.course.course_id,
        result = await api(`/api/courses/${id}`);
      if (currentView !== 'classroom' || classData?.course.course_id !== id) return;
      classData = result;
      if (
        classTab === 'lessons' &&
        [...topics].every((topic) => ['progress', 'notes'].includes(topic))
      ) {
        syncLessonProgress();
        if (topics.has('notes') && selectedLesson) {
          const lesson = await api(`/api/lessons/${selectedLesson}`);
          const note = $('.note-form textarea');
          if (note && document.activeElement !== note) {
            note.value = lesson.note;
            note.defaultValue = lesson.note;
          }
        }
      } else renderClassroom();
    }
  } catch (error) {
    if (currentUser) {
      for (const topic of topics) pendingTopics.add(topic);
      $('#live-update').hidden = false;
      notify(error.message);
    }
  }
}
$('#apply-live-update').onclick = () => {
  if (document.querySelector('dialog[open]')) {
    notify('Save or close the editor before applying updates.');
    return;
  }
  if (
    hasUnsavedWork() &&
    !confirm('Show updates and replace unsaved fields with the saved version?')
  )
    return;
  applyLiveUpdates(true);
};
window.addEventListener('workspace-ready', startLiveUpdates);
window.addEventListener('workspace-ended', stopLiveUpdates);
window.addEventListener('session-renewed', startLiveUpdates);
window.addEventListener('online', () => {
  if (currentUser) startLiveUpdates();
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && currentUser) {
    pendingTopics.add('reconnect');
    applyLiveUpdates(false);
  }
});
if (currentUser) startLiveUpdates();

$('#submit-button').disabled = false;
if (sessionStorage.getItem('skillstream-token')) {
  $('#submit-button').disabled = true;
  api('/api/me')
    .then(({ user }) => showWorkspace(user))
    .catch((error) => {
      sessionStorage.removeItem('skillstream-token');
      authMessage(error.message);
    })
    .finally(() => {
      $('#submit-button').disabled = false;
    });
}
