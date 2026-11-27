# Week 9 final technical audit

On 27 November 2026 the application at commit e85783d was cloned into a fresh directory on the same Windows host. The application source shipped with this portfolio is identical to that tested revision. The demonstration used Node.js 22.23.2, local SQLite, FFmpeg and Microsoft Edge 158.

| Check | Observed result | Evidence |
|---|---|---|
| Installation | Generated and decoded the sample video, then seeded three courses and nine lessons. | media.txt, seed.txt |
| Core workflow | A student authenticated, enrolled in JavaScript, opened the lesson and played the video. At 1.46 seconds the browser reported 40 frames at 1280 × 720 and zero media errors. | browser.json, lesson-playback.png |
| Tests | All five suites passed. The platform suite verified 90 HTTP checks and database reopen persistence. The demo suite also checked submission, grading and progress. | week4.txt, courses.txt, platform.txt, realtime.txt, demo.txt |
| Catalog timing | First load 256 ms. Five repeat loads ranged from 89 to 129 ms. The measurement ended after three titles appeared, fonts loaded and two animation frames elapsed. | browser.json, student-catalog.png |
| Repository review | Public repository page returned HTTP 200. Searches of locally available Git history for common credential filenames, private key headers and selected GitHub/AWS token formats returned no matches. This limited scan cannot certify the absence of all secrets. | Git filename history and pattern searches |
| Architecture | Browser requests reach the Node server. Course and enrollment logic use SQLite. The media handler serves authorized local files. | Figure 8.1 and src/server.js, src/platform.js, src/realtime.js |

The evidence files are under evidence/week-09. The audit used one host and unthrottled localhost. The original normal-network performance requirement remains partially verified.
