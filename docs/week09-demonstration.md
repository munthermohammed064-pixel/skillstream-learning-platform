# Final demonstration and career portfolio

## Eight-minute demonstration

| Time | Action and evidence |
|---|---|
| 0:00–1:00 | Introduce the instructor who publishes a technical lesson and the student who needs to find it, enroll and return to it. Open the student catalog. |
| 1:00–2:00 | Show Figure 8.1. Trace a request from the browser through the Node.js handlers to SQLite. Explain why the lesson file lives on disk and why the server checks enrollment before serving it. |
| 2:00–5:00 | Start with a fresh demo student. Find the JavaScript course, enroll, select Continue learning and play the first video. Mark a lesson complete, reopen the course and show the saved progress. Use a second prepared student if the first is already enrolled. |
| 5:00–6:30 | Open the platform test output and identify the database reopen check. Explain the initial fresh-clone failure: the seed expected a video excluded from Git. Show the generator and the corrected installation order. |
| 6:30–8:00 | Show the final browser measurements, README and installation guide. Explain the limits of localhost timing and propose a repeatable network-profile test. |

Backup visuals are in the Week 9 evidence directory. Open student-catalog.png and lesson-playback.png locally if playback fails during the live demonstration.

## Technical pitch

A technical instructor needs to publish a course, and a student needs to get from discovering it to watching a lesson and picking up where they left off. SkillStream connects those steps in one local application. The browser uses JavaScript, while a Node.js server handles account and course requests. SQLite keeps enrollment and learning records between sessions. Keeping the stack small made it practical to run the demonstration on a single laptop.

One problem surfaced when testing a fresh clone. A course referred to a lesson video that existed on the development machine but was missing from the repository. The solution was to generate the sample video before creating the demonstration courses and document that order. The final checks cover permissions, protected media and whether records survive reopening the database. The browser check goes one step further by enrolling a student and checking that the video actually decodes frames. The next improvement I would test is catalog loading on a slower connection, using the same visible-course measurement as on localhost.

## CV project entry

**SkillStream | Software engineering graduation project**  
Developed a role-based technical learning platform with JavaScript, Node.js and SQLite, connecting course publication, enrollment, protected video delivery and persistent progress. Validated the local build with 90 HTTP checks and a database reopen test. [Source and portfolio](https://github.com/munthermohammed064-pixel/skillstream-learning-platform/tree/codex/week-09-final).

## LinkedIn draft

For my software engineering graduation project, I worked on SkillStream, a platform for instructors teaching technical courses and students learning from them. The part I wanted to get right was the handoff from enrollment to a working lesson: the server checks access to the video, while SQLite keeps the student's progress for the next visit.

A fresh installation caught something my development machine hid. The demo course was there, but its video was missing. Generating the video before seeding the course fixed the setup. I checked the result in a browser by enrolling in the course and measuring decoded video frames. That experience changed what I look for in a test: an HTTP success response alone cannot tell me what the learner saw.

My next step would be to repeat the catalog measurements under a controlled network profile. [Project and verification evidence](https://github.com/munthermohammed064-pixel/skillstream-learning-platform/tree/codex/week-09-final).

Suggested post attachments: the implemented architecture diagram and the final student lesson screenshot.
