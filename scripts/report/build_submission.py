from pathlib import Path
import json, html
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Preformatted
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.graphics.shapes import Drawing, Rect, String, Line

out=Path('output/pdf');out.mkdir(parents=True,exist_ok=True)
styles=getSampleStyleSheet()
for n in ['Title','Heading1','Heading2']:styles[n].textColor=colors.black
styles['Normal'].fontName='Times-Roman';styles['Normal'].fontSize=11;styles['Normal'].leading=15;styles['Normal'].spaceAfter=9
styles['Title'].fontName='Times-Bold';styles['Title'].fontSize=25;styles['Title'].leading=30
styles['Heading1'].fontSize=18;styles['Heading1'].leading=23
styles.add(ParagraphStyle(name='CellText',parent=styles['Normal'],fontSize=9,leading=12,spaceAfter=0))
styles.add(ParagraphStyle(name='CaptionText',parent=styles['Normal'],fontSize=9,leading=12,spaceBefore=6,spaceAfter=10))
styles.add(ParagraphStyle(name='CodeText',fontName='Courier',fontSize=8,leading=12))
story=[];source=[]
def p(t,style='Normal'):
 story.append(Paragraph(t,styles[style]));source.append(t)
def h(t):p(t,'Heading2')
def page(t):
 if story:story.append(PageBreak())
 p(t,'Heading1')
def table(caption,headers,rows,widths):
 p(caption,'CaptionText')
 data=[[Paragraph(html.escape(str(v)),styles['CellText']) for v in row] for row in [headers]+rows]
 t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
 t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e8edf2')),('GRID',(0,0),(-1,-1),.5,colors.HexColor('#d9d9d9')),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
 story.append(t);story.append(Spacer(1,10));source.extend([' | '.join(map(str,r)) for r in [headers]+rows])

page('Week 4 Assignment and Graduation Project Report')
p('SkillStream','Title');p('Technical course learning platform')
story.append(Spacer(1,24))
p('ALTINBAS UNIVERSITY<br/>Department of Software Engineering<br/>Graduation Project | Academic year 2026-2027')
p('Prepared by: MUNTHER ISKENDER<br/>Student number: 210513647<br/>Instructor: Dr. F. Kuzey Edes Huyal<br/>Revision: 2 November 2026')
h('Document scope')
p('Part A presents the Week 4 assignment. Part B consolidates the project definition, requirements, Week 3 design and Chapter 4 implementation record. The original Week 4 acceptance workflow is registration and login, linked to FR-01. Later local extensions are reported separately.')
p('This review copy uses an academic report layout. Alignment with the official university template remains to be confirmed before submission. No new repository upload or university submission has been performed for this revision.')
h('Contents')
p('Part A: weekly scope, activities, results and progress.<br/>Part B: 1 Introduction; 2 Requirements and planning; 3 System design; 4 Implementation and development process; Appendices A through F; References.')

page('Part A Week 4 Assignment')
h('A1 Selected requirement and coding activities')
p('The selected requirement is FR-01. A student or teacher registers using a name, email and password, then signs in and retrieves the same account through a protected profile endpoint. Duplicate registration, short passwords, incorrect credentials and unauthenticated access must be rejected. Public registration does not create administrators.')
p('The prototype added a Node.js HTTP server, SQLite account storage, request validation, salted scrypt password hashing, signed session tokens and an HTML/CSS/JavaScript interface. It implements the presentation-to-API-to-storage flow planned during Week 3, using a smaller local stack than the proposed React/Express/PostgreSQL deployment.')
table('Table A1 Week 4 deliverables and evidence',['Deliverable','Project evidence'],[
['Working prototype','Registration, login and protected profile in src/server.js.'],['Meaningful source history','584b9e2 authentication prototype; 88e9c6e complete local-platform update.'],['GitHub Issue','Issue #4 records the scope; it was opened retrospectively on 2 November 2026.'],['Preliminary verification','Seven authentication cases in Figure 4.1 and Table 4.2.'],['Development Stage 1','Section 4.5 and docs/weekly-progress/week04.md.'],['Run instructions','README.md; npm start; http://localhost:3000.'],['Cumulative report','Part B includes the previous definition/design and actual implementation.']],[140,340])
p('Table A1 maps every Week 4 deliverable to the current source, evidence or report section. Issue #4 is explicitly dated as retrospective because it was opened after the prototype work.')
h('A2 Progress and next step')
p('The implementation record is dated 31 October 2026. Verification was repeated on 2 November 2026. The current local version also supports courses, lessons and role workspaces. These additions are distinguished from the original authentication acceptance scope and are committed and pushed in 88e9c6e. GitHub Issue #4 records the Week 4 prototype scope; it was created on 2 November 2026 retrospectively, after implementation.')
p('Next step for Week 5: complete interactive browser acceptance of course publishing, student enrolment and learning progress; capture those authentic screens; and measure the full catalog page against NFR-01. SQLite remains the local demonstration store unless the instructor requires migration to the Week 3 proposal. The localhost API timing below is supporting evidence only, not proof of the page-level target.')

page('Part B Graduation Project Report')
p('1 Introduction','Heading1')
h('1.1 Problem and project objectives')
p('SkillStream is a web-based platform for technical courses. The project addresses separated workflows for administrators, teachers and students: teachers maintain their own course material, students discover and follow lessons, and administrators control accounts and publication. The system uses role-based permissions to separate these responsibilities, following the role model described by Sandhu et al. [5]. The problem statement is based on the approved project definition, not on an external user survey.')
p('The objectives are to separate Admin, Teacher and Student permissions; support course publishing; let students enrol and follow lessons; persist learning progress; and provide account and course moderation. Requirement IDs connect these objectives to implementation and evidence.')
h('1.2 Scope and assumptions')
p('The current educational scope covers technical subjects only. Payments, live video broadcasting, certificates, assignment-file attachments, email recovery and cloud video processing are outside the local prototype. Lessons may use pre-recorded video stored locally. Project constraints include a nine-week academic schedule, a small student team and free/open-source development tools. Assumptions are that users have a modern browser, teachers provide supported video files, and each account has one role; administrators are provisioned separately instead of through public registration.')
h('1.3 Development approach')
p('The work progresses through requirements, architecture, a functioning prototype, verification and report updates. This follows established software-engineering and requirements-engineering practice [2-4,6]. The Week 4 handout requires an observable workflow and authentic evidence [1]. This cumulative revision retains the Week 1-2 project definition and requirements, the Week 3 design and the Week 4 implementation record. Later local platform features are distinguished from the first authentication milestone.')
p('The nine-week semester constrains the project. The initial plan placed UI/UX design in Week 4 and authentication in Week 5; the later instructor brief instead requires a first working prototype in Week 4 [1]. This report follows that later brief and records FR-01 as the Week 4 acceptance goal.')
page('1.4 Updated Project Milestones')
table('Table 1.1 Original nine-week roadmap and current local status',['Week','Planned milestone','Status at this revision'],[['1','Project definition','Completed; problem, objectives and references retained.'],['2','Requirements and planning','Completed; FR-01–FR-05 and NFR-01–NFR-02 retained.'],['3','System design','Completed; architecture, data and workflow design documented.'],['4','First working prototype (later instructor brief)','FR-01 implemented and verified; original Week 4 UI work is reflected in the current interface.'],['5','Authentication and roles','Implemented locally; student/teacher registration and separate admin provisioning.'],['6','Course management','Implemented locally; teacher publishing and admin moderation.'],['7','Learning features','Implemented locally; catalogue, enrolment, lessons and progress.'],['8','Testing and refinement','Partially complete; isolated HTTP and persistence suites pass; full-page performance and browser acceptance remain open.'],['9','Final delivery','In progress; official-template alignment and university submission remain outstanding.']],[55,175,230])
p('Table 1.1 retains the initial nine-week plan while updating each status to the current local prototype. The instructor’s later Week 4 brief changes the immediate milestone to a demonstrable prototype; weeks 5–7 features are described as local implementation, not as evidence of when each feature was completed.')

page('2 Requirements and Planning')
p('Table 2.1 preserves the original functional IDs and describes current local behaviour. These statuses apply to a prototype and do not imply production readiness.')
table('Table 2.1 Functional requirement traceability',['ID','Requirement','Current local implementation'],[
['FR-01','Registration and login with role access.','Student/teacher self-registration; admin provisioned separately.'],
['FR-02','Admin manages users and moderates courses.','Disable/enable accounts and course moderation.'],
['FR-03','Teachers create, edit and publish courses and lessons.','Ownership checks, course/lesson editing and protected video.'],
['FR-04','Students browse and enrol in courses.','Catalogue, search, filtering and unique enrolment.'],
['FR-05','Students watch lessons and track progress.','Authorised local video, playback position and completion.']],[45,220,215])
table('Table 2.2 Non-functional requirements',['ID','Requirement','Verification status'],[
['NFR-01','Project target: catalog page loads in under two seconds under normal network conditions.','30 warm localhost GET /api/courses responses: p50 15.47 ms, p95 16.88 ms, max 17.48 ms; 3 courses. API only; page-level target remains unverified.'],
['NFR-02','Passwords are hashed before storage [7].','Salted scrypt; stored-hash assertion passes.']],[65,205,210])
p('Additional local features include saved courses, private notes, text assignments, grading, course questions, offers and live update notifications. They support the demonstration but do not replace the documented core requirement IDs. NFR-01 is a project-defined threshold; page-level performance methods such as Web Vitals are distinct from the API-only timing reported here [8]. The fuller testing and validation stage remains separate from Week 4 preliminary verification [1].')

page('3 System Design')
h('3.1 Proposed architecture and implemented mapping')
p('The Week 3 proposal used presentation, application/authentication and persistence layers. React, Express, PostgreSQL and external video storage were proposed technologies. PostgreSQL supports a relational approach [9], and React organises interfaces as components [10]. Those selections describe the plan, not the current local implementation.')
d=Drawing(480,145)
for x,label,sub in [(0,'Browser','HTML / CSS / JavaScript'),(165,'Application','HTTP / auth / platform'),(330,'Persistence','SQLite / local media')]:
 d.add(Rect(x,65,145,65,fillColor=colors.HexColor('#f3f5f7'),strokeColor=colors.HexColor('#aeb6c0')))
 d.add(String(x+72,104,label,textAnchor='middle',fontName='Helvetica-Bold',fontSize=11))
 d.add(String(x+72,83,sub,textAnchor='middle',fontName='Helvetica',fontSize=8))
for x in [145,310]:d.add(Line(x,97,x+20,97,strokeColor=colors.black))
d.add(String(240,35,'Browser requests pass through server validation and access checks.',textAnchor='middle',fontName='Helvetica',fontSize=9))
story.append(d);p('Figure 3.1 Original diagram of the current local implementation layers.','CaptionText')
p('Figure 3.1 shows logical responsibilities in one local application. The browser calls the HTTP API; the application validates identity and permissions before reading or writing SQLite records or serving protected media. The boxes are not separately deployed services.')
h('3.2 Data and enrolment flow')
p('Teachers own courses; courses contain ordered lessons. Enrolments join students to courses. Progress and private notes belong to a student and lesson. Assignments have student submissions and grades; questions belong to courses. Server checks enforce ownership and enrolment, including media access.')
p('For enrolment, the browser sends an authenticated request for a published course. The API validates the session and existing enrolment, inserts a record and returns success. Duplicate enrolment returns HTTP 409. One local process simplifies demonstration, but does not establish cloud scalability or PostgreSQL deployment behaviour.')

page('4 Implementation and Development Process')
h('4.1 Implementation overview')
p('The Week 4 core implements the account portion of FR-01: student/teacher registration, sign-in, persistent records, password hashing and a protected profile endpoint. The original acceptance scope did not include administrator setup or course workflows. Section 4.6 describes the later local expansion.')
h('4.2 Development environment and technologies')
table('Table 4.1 Actual implementation technologies',['Component','Technology and reason'],[
['Runtime','JavaScript; Node.js v22.23.2 for the 2 November rerun. The historical evidence recorded v24.13.1.'],
['API and UI','Built-in node:http, HTML, CSS and browser JavaScript. No React or Express runtime dependency.'],
['Persistence','node:sqlite with SQLite 3.51.3; isolated temporary databases for checks [11].'],
['Password storage','node:crypto scrypt with random per-account salts and timing-safe comparison [12].'],
['Session','HMAC-SHA256 JWT with one-hour expiry and protected-route user/session validation.'],
['Development tools','Windows 11 Pro 10.0.26200; PowerShell 7.6.5; npm 10.9.8; Git 2.53.0.windows.1; GitHub. Local databases and secrets are excluded from Git.']],[110,370])
p('Earlier environment notes record unavailable PostgreSQL tools and a Docker engine that was not running. Built-in HTTP and SQLite made the first workflow runnable locally. This preserves the logical layers but explicitly diverges from the Week 3 technology proposal. The report does not claim that React, Express or PostgreSQL has been implemented.')

page('4.3 Prototype Implementation')
h('Registration and login workflow')
p('Registration receives first name, last name, email, password and a student/teacher role. The API validates input, rejects duplicate email, generates an account ID, hashes the password with a random salt and stores the account. A public profile and signed token are returned; the password hash is not sent to the browser.')
p('Login looks up the account and compares the password against the stored hash. The browser then supplies a Bearer token to GET /api/me, which validates the session and returns the matching profile. JWT is a compact format for claims [13]; the server checks its signature and expiry rather than trusting unverified identity data.')
h('Authentic technical evidence')
r=json.loads(Path('tmp/pdfs/verification.json').read_text(encoding='utf-8-sig'))
lines=['Run: 2 November 2026 | Node.js '+r['runtime'],'Command: node scripts/verify-week4.js','Database: SQLite :memory:','']
for i in r['results']:lines.append(f"{i['id']}  HTTP {i['status']}  {'PASS' if i['pass'] else 'FAIL'}  {i['check']}")
lines+=['',f"databaseRecordCount: {r['databaseRecordCount']}",f"storedPasswordIsHash: {str(r['storedPasswordIsHash']).lower()}"]
story.append(Preformatted('\n'.join(lines),styles['CodeText']))
p('Figure 4.1 Actual authentication verification output transcribed from the captured JSON, with no passwords or tokens.','CaptionText')
p('Figure 4.1 establishes response statuses, account count and the stored-hash assertion. This script invokes request handlers with an isolated in-memory database. It is technical output, not a browser screenshot or browser end-to-end recording.')

page('4.3 Preliminary Verification (continued)')
table('Table 4.2 Authentication checks repeated on 2 November 2026',['ID','Input or action','Expected','Observed'],[
['P01','Valid student registration','201; account/token','201; pass'],['P02','Login with registered credentials','200; same account','200; pass'],['P03','Protected profile with token','200; matching profile','200; pass'],['P04','Duplicate email registration','409; no duplicate','409; pass'],['P05','Password shorter than 8 characters','400; reject','400; pass'],['P06','Incorrect password','401; reject','401; pass'],['P07','Protected profile without token','401; reject','401; pass']],[35,215,145,85])
p('Table 4.2 records the seven preliminary acceptance cases. The database assertion also confirms one account remains and that the stored password is a scrypt hash. These checks do not replace the full Week 6 validation stage [1].')
h('Supplementary current local verification')
p('The platform suite passed 90 real HTTP checks covering roles, courses, lessons, private notes, progress, enrolment, protected media/ranges, assignments, grading, questions, offers and account changes. It confirmed persistence after closing and reopening SQLite. The realtime suite passed stream authentication, recipient isolation, automatic offer expiry and session revocation checks. These outputs were captured on 2 November 2026.')
p('The course HTTP suite also passed creation, publishing, owner permissions, enrolment and duplicate prevention. The demo suite passed idempotent setup, protected video download and FFmpeg decoding, progress, notes, assignment submission, grading and instructor reply.')
p('These suites establish API and persistence behaviour. They do not verify browser layout, native video playback, real-user accessibility or concurrent-load capacity. A separate local timing run made 30 warm authenticated GET /api/courses requests against the three-course demo catalog: p50 15.47 ms, p95 16.88 ms, maximum 17.48 ms. This measures only the loopback API response after JSON parsing. It excludes browser rendering, static resources and normal network conditions; therefore it does not establish the full-page NFR-01 target. The measurement procedure and raw summary are preserved in evidence/week-04/catalog-performance.md and catalog-performance.json.')

page('4.4 Technical Challenges and Solutions')
h('Persistence differed from the original plan')
p('Problem: the earlier development record reports unavailable PostgreSQL tooling and a non-running Docker engine. Diagnosis: the planned database service could not be established in that environment. Attempted solution: use built-in SQLite and HTTP modules for the first persistent account workflow. Outcome: local operation and repeatable verification were possible; PostgreSQL integration remains incomplete. Evidence: commit 584b9e2 and the Week 4 development log.')
h('Historical documentation and the expanded prototype')
p('Problem: old Week 4 notes list courses and administrator setup as unimplemented, while the current working tree includes those features. Diagnosis: compare the historical acceptance scope against the current source and tests. Solution: preserve the original scope and describe local additions separately. Outcome: the report avoids presenting earlier limitations as current facts or attributing local additions to a historical commit.')
h('Evidence boundaries')
p('The original evidence records restricted loopback access during its initial run. Later isolated suites now exercise real HTTP requests; this does not turn the old handler output into browser evidence. Four original screenshots supplied by the student are reproduced in Appendix E. They show the student and teacher workspaces and account screens. Interactive browser acceptance remains outstanding; the authoring tool did not execute those UI actions.')
p('The current source and local-platform extensions are pushed in commit 88e9c6e on the observed branch docs/week3-architecture; the branch name reflects earlier repository history. GitHub Issue #4 was opened on 2 November 2026 retrospectively to record the Week 4 scope, not before implementation. The combined report PDF remains local and has not been uploaded to GitHub or the university. The local application demonstrates project workflows, but its tests do not constitute a production security audit.')

page('4.5 Development Process Stage 1')
table('Table 4.3 Stage 1 implementation record',['Field','Record'],[
['Date','31 October 2026 implementation record; 2 November 2026 verification/report revision.'],['Objective','Demonstrate the Week 4 FR-01 registration and login workflow.'],['Functionality','Validation, local users, salted hashes, signed sessions and protected profile.'],['Decision','Built-in Node.js HTTP/SQLite/crypto for a runnable local prototype; explicitly record the stack deviation.'],['Problem and solution','Planned database service unavailable in the earlier environment; use SQLite and document its limits.'],['Related commits','584b9e2 authentication; 26ecce4 documentation; 52fa283 student/teacher workspaces.'],['Evidence','Figure 4.1, Table 4.2, four student-supplied interface captures, local HTTP/persistence/realtime verification, and GitHub Issue #4 (opened retrospectively on 2 November 2026).'],['Next step','Week 5 browser acceptance of publishing, enrollment and progress; authentic captures; full-page NFR-01 timing. Keep SQLite locally unless the instructor requires migration.']],[110,370])
p('Table 4.3 records the original FR-01 implementation milestone and points to repeatable verification. The current student-supplied screenshots show later workspaces; they are not presented as screenshots of the 31 October authentication-only interface.')
h('4.6 Current limitations and next steps')
p('Later local work adds publishing, enrolment, lessons, protected video, progress, notes, saved courses, written assignments, grades, questions, admin account management, offers and live update notifications. The frontend includes a public welcome page and role workspaces. These additions remain local and are not all attributed to the first authentication commit.')
p('Payments, live video broadcasting and certificates are outside scope. Assignment attachments, email recovery, cloud media processing and PostgreSQL migration are not implemented. Student-supplied screenshots document rendered interfaces in Appendix E. Full interactive browser acceptance and the complete-page catalogue timing requirement remain unverified. The local extensions are already represented by remote commit 88e9c6e; the report PDF is kept local for transfer to the official template.')

from diagrams import add_pages
add_pages(page,p,h,story)

from screenshots import add_screenshots
add_screenshots(page,p,story)

page('Appendix F Evidence Map and Reproducibility')
h('F.1 Requirement-to-evidence map')
table('Table F.1 Core requirement coverage and evidence boundaries',['ID','Implemented area','Repeatable evidence and what it establishes'],[
['FR-01','Registration, login, protected profile','verify:week4; Figure 4.1 and Table 4.2. Checks identity flow and expected rejection cases.'],
['FR-02','Admin account controls and course moderation','verify:platform and verify:realtime. Confirms API permissions and session revocation; no admin browser capture is included.'],
['FR-03','Teacher course and lesson management','verify:courses and verify:platform. Figure E.1 shows the teacher library only; it does not prove course editing or publishing.'],
['FR-04','Catalog, enrollment and saved courses','verify:courses and verify:platform. Figure E.3 shows the student discovery screen; it does not record an enrollment action.'],
['FR-05','Protected lessons and learning progress','verify:platform and verify:demo. Demo downloads/decodes the authored WebM and checks progress; native browser playback is not claimed.']],[45,145,270])
p('Table F.1 maps each original functional requirement to the implementation evidence that can be repeated. Student-supplied screenshots establish only the screens and content visible in each capture; API suites establish the tested server and persistence behavior. Neither is presented as evidence for interactions that were not captured or exercised.','CaptionText')
h('F.2 Reproducibility')
p('Repository: https://github.com/munthermohammed064-pixel/skillstream-learning-platform<br/>Observed branch: docs/week3-architecture (a pre-existing branch name). Current pushed commit: 88e9c6e, feat: complete local technical learning platform. Week 4 scope issue: https://github.com/munthermohammed064-pixel/skillstream-learning-platform/issues/4, created retrospectively on 2 November 2026. The combined review PDF is local and is not part of the repository.')
p('Start with npm start and open http://localhost:3000. Repeat verification with npm run verify:week4, npm run verify:courses, npm run verify:platform, npm run verify:realtime and npm run verify:demo. The scripts use isolated databases for verification. Private passwords, tokens, local databases and generated report renders are excluded from Git.')
p('Project material used: Week_1_and_2_Graduation_Project_Report.docx; project-report-week3.md; Week3_Submission.md; weekly-progress/week04.md; evidence/week-04/verification.md; current source files; and the original student-supplied screenshots. The report preserves earlier requirements while distinguishing proposed technologies from the implemented stack.')

page('References')
p('A numbered citation style is used throughout. Figures, diagrams, screenshots and test results are original project material or are cited at the point of discussion.')
for ref in [
'[1] F. K. E. Huyal, Graduation Project Week 4: First Working Prototype, Altinbas University, academic year 2026-2027. Course handout: graduation_project_week4.pdf.',
'[2] I. Sommerville, Software Engineering, 10th ed. Pearson, 2016.',
'[3] R. S. Pressman and B. R. Maxim, Software Engineering: A Practitioner\'s Approach, 9th ed. McGraw Hill, 2020.',
'[4] ISO/IEC/IEEE 29148:2018, Systems and software engineering — Life cycle processes — Requirements engineering, 2nd ed. ISO, 2018. Edition 3 was under development at the report revision date. https://www.iso.org/standard/72089.html (accessed 2 November 2026).',
'[5] R. S. Sandhu, E. J. Coyne, H. L. Feinstein and C. E. Youman, “Role-Based Access Control Models,” IEEE Computer, vol. 29, no. 2, pp. 38–47, 1996. https://csrc.nist.gov/csrc/media/projects/role-based-access-control/documents/sandhu96.pdf.',
'[6] K. Wiegers and J. Beatty, Software Requirements, 3rd ed. Microsoft Press, 2013.',
'[7] OWASP Foundation, Password Storage Cheat Sheet. https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html (accessed 2 November 2026).',
'[8] Google, Web Vitals. https://web.dev/articles/vitals (accessed 2 November 2026).',
'[9] PostgreSQL Global Development Group, About PostgreSQL. https://www.postgresql.org/about/ (accessed 2 November 2026).',
'[10] Meta Open Source, React Quick Start. https://react.dev/learn (accessed 2 November 2026).',
'[11] Node.js, SQLite documentation. https://nodejs.org/api/sqlite.html (accessed 2 November 2026).',
'[12] Node.js, Crypto documentation. https://nodejs.org/api/crypto.html (accessed 2 November 2026).',
'[13] M. Jones, J. Bradley and N. Sakimura, JSON Web Token (JWT), RFC 7519, May 2015. https://www.rfc-editor.org/rfc/rfc7519.']:p(ref)
def footer(c,d):
 c.setFont('Times-Roman',9);c.setFillColor(colors.HexColor('#555555'));c.drawRightString(A4[0]-48,28,str(d.page))
path=out/'SkillStream_Week4_Combined_Review.pdf'
SimpleDocTemplate(str(path),pagesize=A4,rightMargin=48,leftMargin=48,topMargin=44,bottomMargin=46,title='SkillStream Week 4 Assignment and Graduation Project Report',author='MUNTHER ISKENDER').build(story,onFirstPage=footer,onLaterPages=footer)
(out/'SkillStream_Week4_Combined_Review.md').write_text('\n\n'.join(source),encoding='utf-8')
print(path)
