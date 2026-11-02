document.querySelectorAll('[data-enter]').forEach(
  (button) =>
    (button.onclick = () => {
      $('#landing').hidden = true;
      $('#auth-shell').hidden = false;
      setMode(button.dataset.enter);
      form.elements.email.focus();
    }),
);
if (currentUser) $('#landing').hidden = true;
fetch('/api/courses')
  .then((response) => response.json())
  .then(({ courses }) => {
    if (!Array.isArray(courses)) return;
    for (const course of courses.slice(0, 3)) {
      const card = element('article', 'course-row');
      const tones = {
        'Web Development': '1',
        Databases: '6',
        'Software Engineering': '0',
        'Data Science & AI': '3',
        Cybersecurity: '4',
        'Cloud & DevOps': '5',
      };
      const cover = element('div', `course-cover cover-${tones[course.category] || '0'}`);
      cover.setAttribute('aria-hidden', 'true');
      cover.append(
        element('span', 'cover-symbol', course.category === 'Databases' ? 'SQL' : '{ }'),
        element('span', 'cover-label', course.category),
      );
      const info = element('div', 'course-info');
      info.append(
        element('span', 'course-category', course.category),
        element('h3', '', course.title),
        element('p', 'course-description', course.description),
      );
      const meta = element('p', 'welcome-course-meta', `${course.lesson_count || 0} lessons`);
      info.append(meta);
      const actions = element('div', 'course-actions');
      const button = element('button', 'secondary-button', 'Explore course →');
      button.onclick = () => {
        $('#landing').hidden = true;
        $('#auth-shell').hidden = false;
        setMode('register');
        form.elements.email.focus();
      };
      actions.append(button);
      card.append(cover, info, actions);
      $('#public-courses').append(card);
    }
  })
  .catch(() => {
    $('#public-courses').append(
      element('p', 'course-meta', 'Courses will appear when the catalog is available.'),
    );
  });
