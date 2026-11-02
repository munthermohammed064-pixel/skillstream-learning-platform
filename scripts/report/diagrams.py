from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon
from reportlab.lib import colors

def box(d,x,y,w,title,rows):
 height=42+len(rows)*17
 d.add(Rect(x,y-height,w,height,fillColor=colors.HexColor('#f4f6f9'),strokeColor=colors.HexColor('#b9c3cf'),radius=5))
 d.add(String(x+12,y-23,title,fontName='Helvetica-Bold',fontSize=11,fillColor=colors.HexColor('#26374e')))
 for i,t in enumerate(rows):d.add(String(x+12,y-46-i*17,t,fontName='Helvetica',fontSize=8.5))
 return height
def arrow(d,x,y,xx,yy,label=''):
 d.add(Line(x,y,xx,yy,strokeColor=colors.HexColor('#647b96')))
 if xx!=x:
  sign=1 if xx>x else -1
  d.add(Polygon([xx,yy,xx-sign*6,yy+3,xx-sign*6,yy-3],fillColor=colors.HexColor('#647b96')))
 else:d.add(Polygon([xx,yy,xx-3,yy+6,xx+3,yy+6],fillColor=colors.HexColor('#647b96')))
 if label:d.add(String((x+xx)/2+5,(y+yy)/2+8,label,fontName='Helvetica',fontSize=8))

def architecture():
 d=Drawing(480,390)
 box(d,5,375,145,'Presentation',['Public welcome page','Student / Teacher / Admin','app.js / learning.js / live.js'])
 box(d,190,375,280,'Application boundary',['server.js: HTTP and authentication','platform.js: course and learning rules','realtime.js: authenticated SSE notifications'])
 arrow(d,150,320,190,320,'HTTP')
 box(d,190,200,150,'SQLite',['Users and admin mapping','Courses and enrolments','Lessons and progress','Assignments and questions'])
 box(d,365,200,110,'Local files',['Protected videos','Session signing key','Private demo access'])
 arrow(d,265,282,265,200,'SQL');arrow(d,415,282,415,200,'Authorised access')
 arrow(d,190,260,80,260,'SSE invalidation');arrow(d,80,260,80,282)
 return d

def roles():
 d=Drawing(480,400)
 for y,title,rows in [(385,'Student',['Browse and save courses','Enrol and watch lessons','Notes, progress, submissions']), (250,'Teacher',['Create and publish own courses','Manage lessons and assignments','Grade and answer questions']), (115,'Admin',['Manage account availability','Moderate course publication','Manage offers and announcements'])]:
  box(d,5,y,135,title,[]);box(d,205,y,265,'Permitted workflows',rows);arrow(d,140,y-25,205,y-25)
 return d

def er():
 d=Drawing(480,440)
 box(d,5,425,140,'users',['PK user_id','UNIQUE email','role / password_hash'])
 box(d,325,425,150,'courses',['PK course_id','FK teacher_id -> users','title / category / status'])
 box(d,165,280,150,'enrollments',['PK enrollment_id','FK user_id / course_id','UNIQUE user + course'])
 box(d,325,140,150,'lessons',['PK lesson_id','FK course_id','content / video_file'])
 box(d,5,140,190,'progress and notes',['PK (user_id, lesson_id)','FK users and lessons','completion / position / note'])
 arrow(d,145,380,325,380,'1 teacher : many courses')
 arrow(d,80,332,165,240,'1 : many');arrow(d,400,332,315,240,'1 : many')
 arrow(d,400,332,400,140,'1 : many')
 arrow(d,80,332,80,140,'1 : many')
 arrow(d,325,85,195,85,'1 lesson : many records')
 return d

def sequence():
 d=Drawing(480,440)
 xs=[45,175,310,440]
 for x,t in zip(xs,['Browser','HTTP / Auth','SQLite','Token signer']):
  d.add(String(x,418,t,textAnchor='middle',fontName='Helvetica-Bold',fontSize=10))
  d.add(Line(x,402,x,15,strokeColor=colors.HexColor('#c9d0d8'),strokeDashArray=[3,3]))
 steps=[(0,1,'Register fields',375),(1,2,'Validate, hash and insert',330),(2,1,'Account record',285),(1,3,'Sign account claims',240),(3,1,'Signed JWT',195),(1,0,'201 profile and token',150),(0,1,'GET /api/me + Bearer',105),(1,0,'200 matching profile',60)]
 for a,b,t,y in steps:arrow(d,xs[a],y,xs[b],y,t)
 return d

def add_pages(page,p,h,story):
 page('Appendix A Detailed Architecture')
 p('The following original diagrams describe the implemented local version, including extensions beyond the original Week 4 authentication scope. They are derived from the current source rather than from the earlier proposed technology stack.')
 story.append(architecture());p('Figure A.1 Component architecture of the local SkillStream prototype.','CaptionText')
 p('The HTTP application is the access boundary for database records and media. SSE sends authenticated update hints to the browser. Local signing keys and account access files are private runtime files, not public application assets.')
 page('Appendix B Role Workflows')
 story.append(roles());p('Figure B.1 Role-to-workflow map for the current prototype.','CaptionText')
 p('This responsibility diagram shows the main permitted actions rather than a formal UML use-case specification. Teacher actions are restricted to owned courses; student lesson access depends on enrolment. Administrator provisioning is separate from public registration.')
 page('Appendix C Core Data Relationships')
 story.append(er());p('Figure C.1 Core entity relationship diagram with keys and cardinalities.','CaptionText')
 p('Users and courses are connected through enrolments. A teacher owns many courses, and a course contains many lessons. Progress and notes each use a composite user/lesson key. This diagram focuses on the learning core; the full schema also includes admin_users, saved_courses, assignments, submissions, questions and promotions.')
 page('Appendix D Authentication Sequence')
 story.append(sequence());p('Figure D.1 Successful registration followed by an authenticated profile request.','CaptionText')
 p('The API validates the registration input before creating the user record. Password hashing occurs before storage. The token signer is a logical responsibility inside the server, not an external service. Invalid input and duplicate email terminate the flow with 400 and 409 respectively; an absent or invalid session on the protected route returns 401. Login reuses the stored hash and token issuance responsibilities.')
