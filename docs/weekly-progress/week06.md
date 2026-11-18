# Week 6 | SkillStream testing and validation

## Student report sheet
Munther Iskender (210513647) | Software Engineering | Altınbaş University
Instructor: Dr. F. Kuzey Edes Huyal | Test date: 18 November 2026
Repository: https://github.com/munthermohammed064-pixel/skillstream-learning-platform
Project: SkillStream, a learning platform for technical courses. Tested revision: 2ae4870.

## Testing methodology
On Windows with Node.js v22.23.2, five existing JavaScript verification suites exercised authentication, courses, platform operations, live updates and the demonstration course. Isolated SQLite records made it possible to check what was actually saved. HTTP tests used separate teacher and student accounts so the same operation could be checked with different permissions. The demo fetched a WebM file and decoded it with FFmpeg.

## Validation and testing results
Each case below records the input, expected outcome and observed result. The suite name in parentheses identifies the corresponding log in evidence/week-06/.
T01 | Accounts, FR-01 (week4). Register a valid student. Expected HTTP 201. Observed 201 and one saved account. PASS.
T02 | Authentication, FR-01 (week4). Sign in with an incorrect password. Expected HTTP 401. Observed 401. PASS.
T03 | Password storage, NFR-02 (week4). Inspect the registered account. Expected a hash distinct from the submitted password. Observed storedPasswordIsHash=true. PASS.
T04 | Course publication, FR-03 (courses). Open the student catalog before and after the owner publishes a draft. Expected course count 0 then 1. Observed 0 then 1. PASS.
T05 | Enrollment, FR-04 (courses). Submit the same student enrollment twice. Expected HTTP 201 then 409 and one enrolled student. Observed both responses and a count of one. PASS.
T06 | Lesson progress, FR-05 (platform). Complete one of two lessons at position 25. Expected 50% completion. Observed 50% in the student library and one completed lesson in the teacher view. PASS.
T07 | Progress boundary, FR-05 (platform). Submit playback position -2. Expected HTTP 400. Observed 400. PASS.
T08 | Protected media, FR-05 (platform). Request bytes 4-11 and then bytes 999-1000 from the short test file. Expected HTTP 206 with ftypisom, then 416. Both assertions passed.
T09 | Coursework integration (demo). Download the demo video, submit student work and grade it as the teacher. Expected a decodable video and retrievable learning records. FFmpeg decode and coursework assertions passed.

## Results and limitations
All five suites exited successfully. The platform suite passed 90 HTTP checks and retained records after SQLite was closed and reopened. The live-update suite confirmed recipient isolation and account revocation. Error responses in T02, T05, T07 and T08 were expected. No failing assertion required an application fix. T10 | Catalog rendering, NFR-01. Expected three visible titles with fonts ready within 2000 ms. Edge on unthrottled localhost took 268 ms on first navigation and 85-144 ms on five repeats. PASS locally. External network conditions remain unmeasured.

T11 | Native video, FR-05. Enroll through the student catalog and open the JavaScript course. Expected decoded frames and advancing playback. Edge played 1.03 seconds, decoded 29 frames at 1280 x 720 and reported zero media errors. PASS. Measurements: evidence/week-06/browser.json.

## Development Stage 4 and weekly log
18 November 2026. Objective: validate the teacher-to-student workflow and its failure boundaries. The main decision was to check both the HTTP response and the resulting library or database record. T05 illustrates why: a conflict response alone would not establish that the second request left the enrollment count unchanged.
Evidence: evidence/week-06/{week4,courses,platform,realtime,demo}.txt. Reproduce with node scripts/verify-NAME.js for each of the five names. Run from the repository root with Node.js and FFmpeg available. The test sources and recorded revision identify the assertions behind each result.
Week 7: repeat installation and verification from a fresh checkout, document prerequisites, and capture the browser workflow from publication through saved progress. Measure catalog page load under a stated network profile.

