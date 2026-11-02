// Streams contain invalidation hints, never lesson content, answers, or grades.
// Each recipient reloads data through the normal permission-checked API.
function createRealtime({ db, getUser }) {
  const clients = new Set();
  let revision = 0;
  let promotionTimer;
  const get = (sql, id) => db.prepare(sql).get(id);

  function attach(req, res) {
    const user = getUser(req);
    if (!user) return false;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();
    const client = { req, res, user };
    clients.add(client);
    res.write(`event: ready\ndata: ${JSON.stringify({ revision })}\n\n`);
    const heartbeat = setInterval(() => {
      if (!getUser(req)) {
        res.write('event: session-ended\ndata: {}\n\n');
        res.end();
      } else res.write(': heartbeat\n\n');
    }, 15000);
    heartbeat.unref();
    res.once('close', () => {
      clearInterval(heartbeat);
      clients.delete(client);
    });
    return true;
  }

  function changed(req, url, actor) {
    if (url.pathname.startsWith('/api/admin/promotions')) schedulePromotions();
    if (!clients.size) return;
    const route = url.pathname;
    if (route === '/api/auth/login') return;
    let topic = 'courses',
      courseId = null,
      privateUser = null;
    let global = false;
    let limitedParticipants = false,
      targetUser = null;
    const course = route.match(/^\/api\/courses\/([^/]+)(?:\/([^/]+))?/);
    const lesson = route.match(/^\/api\/lessons\/([^/]+)(?:\/([^/]+))?/);
    if (route.startsWith('/api/admin/promotions')) {
      topic = 'promotions';
      global = true;
    } else if (route.startsWith('/api/admin/users')) {
      topic = 'people';
      global = true;
    } else if (route === '/api/auth/register') {
      topic = 'people';
      global = true;
    } else if (route.startsWith('/api/me')) {
      topic = 'profile';
      privateUser = actor?.user_id;
    } else if (course) {
      courseId = course[1];
      topic =
        {
          lessons: 'lessons',
          assignments: 'assignments',
          questions: 'discussion',
          enroll: 'enrollments',
          save: 'library',
        }[course[2]] || 'courses';
      if (topic === 'library') privateUser = actor?.user_id;
      global = topic === 'courses';
    } else if (lesson) {
      courseId = get('SELECT course_id FROM lessons WHERE lesson_id=?', lesson[1])?.course_id;
      topic = lesson[2] === 'progress' ? 'progress' : lesson[2] === 'note' ? 'notes' : 'lessons';
      if (topic === 'notes') privateUser = actor?.user_id;
    } else if (route.startsWith('/api/assignments/')) {
      courseId = get(
        'SELECT course_id FROM assignments WHERE assignment_id=?',
        route.split('/')[3],
      )?.course_id;
      topic = 'assignments';
      limitedParticipants = route.endsWith('/submit');
    } else if (route.startsWith('/api/submissions/')) {
      const submission = get(
        'SELECT a.course_id,s.user_id FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id WHERE s.submission_id=?',
        route.split('/')[3],
      );
      courseId = submission?.course_id;
      targetUser = submission?.user_id;
      limitedParticipants = true;
      topic = 'assignments';
    } else if (route.startsWith('/api/questions/')) {
      courseId = get(
        'SELECT course_id FROM questions WHERE question_id=?',
        route.split('/')[3],
      )?.course_id;
      topic = 'discussion';
    } else if (route === '/api/courses') global = true;
    else return;

    const courseOwner =
      courseId && get('SELECT teacher_id FROM courses WHERE course_id=?', courseId)?.teacher_id;
    const event = {
      topic,
      course_id: courseId,
      origin: String(req.headers['x-client-id'] || '').slice(0, 80),
      revision: ++revision,
    };
    for (const client of clients) {
      const user = getUser(client.req);
      if (!user) {
        // A password change renews this tab's token in the response. Other tabs sign out.
        if (!(
          topic === 'profile' &&
          event.origin &&
          client.req.headers['x-client-id'] === event.origin
        ))
          client.res.write('event: session-ended\ndata: {}\n\n');
        client.res.end();
        continue;
      }
      let allowed = privateUser ? user.user_id === privateUser : global;
      if (global && topic === 'people') allowed = user.role === 'admin';
      if (global && topic === 'promotions') allowed = ['admin', 'student'].includes(user.role);
      if (!privateUser && !global) {
        allowed =
          user.role === 'admin' ||
          user.user_id === actor?.user_id ||
          user.user_id === courseOwner ||
          user.user_id === targetUser;
        if (!allowed && !limitedParticipants && courseId && topic !== 'progress')
          allowed = !!db
            .prepare('SELECT 1 FROM enrollments WHERE course_id=? AND user_id=?')
            .get(courseId, user.user_id);
      }
      if (allowed) {
        if (client.res.writableLength > 65536) client.res.end();
        else client.res.write(`id: ${revision}\nevent: change\ndata: ${JSON.stringify(event)}\n\n`);
      }
    }
  }
  function schedulePromotions() {
    clearTimeout(promotionTimer);
    const now = new Date().toISOString();
    const next = db
      .prepare(
        `SELECT MIN(boundary) AS at FROM (
      SELECT starts_at AS boundary FROM promotions WHERE enabled=1
      UNION ALL SELECT ends_at FROM promotions WHERE enabled=1
    ) WHERE boundary > ?`,
      )
      .get(now)?.at;
    if (!next) return;
    promotionTimer = setTimeout(
      () => {
        try {
          changed({ headers: {} }, new URL('/api/admin/promotions', 'http://localhost'), null);
        } catch {
          clearTimeout(promotionTimer);
        }
      },
      Math.min(2147483647, Math.max(25, Date.parse(next) - Date.now() + 20)),
    );
    promotionTimer.unref();
  }
  schedulePromotions();
  function close() {
    clearTimeout(promotionTimer);
    for (const client of clients) client.res.end();
    clients.clear();
  }
  return { attach, changed, close };
}
module.exports = { createRealtime };
