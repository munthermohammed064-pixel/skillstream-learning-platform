from pathlib import Path
from PIL import Image as PILImage
from reportlab.platypus import Image

def add_screenshots(page,p,story):
    items=[
        ('teacher-courses.png','Teacher course workspace','The teacher workspace displays three courses, a New course control and category/search controls. The visible cards include JavaScript and SQL. This image establishes the rendered teacher interface, not successful course creation or publishing.'),
        ('teacher-account.png','Teacher account and settings','The supplied capture shows the teacher demonstration email and role, editable personal details and empty password fields. It documents the authenticated account interface; it does not prove a password change was submitted.'),
        ('student-workspace.png','Student course discovery','The student workspace displays a course announcement, carousel controls, three available courses and links to learning, saved courses and account pages. The Live label is visible, but a still image alone cannot prove realtime delivery.'),
        ('student-account.png','Student profile','The profile displays Demo Learner, the demonstration email, student role and membership date. It documents the rendered student session and profile, supplementing the API authentication checks. It does not record the registration or login steps themselves.'),
    ]
    for i,(name,title,description) in enumerate(items,1):
        page('Appendix E '+title)
        path=Path('evidence/week-04/screenshots')/name
        with PILImage.open(path) as image: width,height=image.size
        story.append(Image(str(path),width=480,height=480*height/width))
        p(f'Figure E.{i} {title} captured by the student from the local prototype.','CaptionText')
        p(description)
        p('Source: original student-supplied screenshot received on 2 November 2026. The image is reproduced without changing its interface content. The capture shows the later local prototype, rather than the historical authentication-only interface.','CaptionText')
