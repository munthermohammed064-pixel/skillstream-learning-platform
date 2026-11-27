# Week 7 reproducibility and integration

Munther Iskender | 210513647 | SkillStream
Altinbas University | Software Engineering | Dr. F. Kuzey Edes Huyal
27 November 2026

## Method and installation
A fresh local Git clone of revision 1f4597d was created with --no-local. The tester was the project developer using automated commands on the same Windows machine. An independent peer and a second operating system were unavailable. Node.js 22.23.2 and FFmpeg 9.0 were present. Python with Pillow generated the sample media. Follow docs/installation.md for the exact installation, configuration, sample data, launch and verification commands.

## Table 7.1 Reproducibility outcomes
R01 Clone. Expected a separate repository. Observed a successful fresh clone without private runtime data. PASS.
R02 Dependencies. Expected built-in Node modules without npm packages. Authentication, course, platform and event suites executed successfully. PASS. There is no compilation step.
R03 Configuration. Expected automatic local SQLite and secret setup. The demo setup created local accounts and records after the media prerequisite was supplied. PASS after correction.
R04 Start. The integration suites start real local HTTP servers and receive expected API responses. Standalone manual browser acceptance in this fresh clone remains a separate check.
R05 Main use case. The demo suite downloads and decodes video, enrolls a learner, records progress and notes, submits coursework, grades it and records a reply. See demo.txt for the actual outcome.
R06 Tests. Authentication, courses, platform and realtime suites exited zero. The platform suite includes 90 HTTP checks and database reopen persistence. The demo outcome is preserved in evidence/week-07/demo.txt.

## Integration and Development Stage 5
Objective: make account, course, media, learning and live-update components reproducible from source. The browser communicates with server.js through HTTP. platform.js checks course rules and writes SQLite records. realtime.js publishes authorized change hints. Local video is served through protected routes. These components retain the existing single-process architecture.

The initial clean-clone attempt to run seed-demo.js failed because data/demo-media/javascript-functions.webm was missing. Diagnosis: Git excludes the local data folder, while the README described demonstration content as already prepared. Correction: the README now links a complete installation guide and explains that the video must be generated before courses are seeded. The guide identifies Python, Pillow, FFmpeg and Windows fonts as sample-media requirements. Runtime operation itself needs Node.js. Retest output is stored alongside the initial failure in evidence/week-07/.

## Results and next steps
This test supports reproducibility on the tested Windows host using a fresh repository and locally generated data. A peer installation, Linux/macOS media generation and an external deployment remain future validation. Week 8 should focus on final demonstration preparation and remaining integration issues.

## Answers for supervisor review
1. Reproducibility means another developer can obtain the same working system using documented source, prerequisites and commands.
2. Node.js runs the app. Git obtains source. Python, Pillow, FFmpeg and Windows fonts generate the optional sample video.
3. Browser requests reach the HTTP server, learning rules run in platform.js, SQLite saves results, and event hints refresh authorized clients.
4. Clone the documented branch, check Node, start the app, and generate media before seeding demonstration courses.
5. Missing sample media blocked seeding. The corrected guide specifies the required command order.
6. Isolated authentication tests and real HTTP integration suites validate persisted records, permissions, media and coursework.
7. A download has source and documentation. Runtime data and demonstration credentials are generated locally.
8. Peer setup and broader operating-system validation would improve the final demonstration.

## Evidence and references
evidence/week-07 contains actual terminal output. Consult package.json and docs/installation.md for dependencies and commands.
Course source: Graduation Project Week 7 Program, supplied by the instructor, 2026-2027.
Official technical references: https://nodejs.org/download/release/v22.23.2/docs/api/sqlite.html and https://ffmpeg.org/ffmpeg.html.
