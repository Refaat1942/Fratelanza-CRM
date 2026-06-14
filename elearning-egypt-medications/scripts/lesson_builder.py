#!/usr/bin/env python3
"""Build comprehensive lesson markdown from structured data."""
import os

BASE = "/workspace/elearning-egypt-medications/courses"

def build_lesson(meta):
    m = meta
    objs = "\n".join(f"{i}. {o}" for i, o in enumerate(m["objectives"], 1))
    quiz = ""
    for i, (q, opts, ans) in enumerate(m["quiz"], 1):
        quiz += f"**Q{i}.** {q}\n"
        for j, o in enumerate(opts):
            mark = " ✓" if j == ans else ""
            quiz += f"- {chr(97+j)}) {o}{mark}\n"
        quiz += "\n"
    takes = "\n".join(f"> - {t}" for t in m["takeaways"])
    refs = "\n".join(f"{i}. {r}" for i, r in enumerate(m["refs"], 1))
    next_line = f"\n*Next: {m['next']}*" if m.get("next") else ""
    course_end = f"\n*Course complete. Proceed to [{m['course_next']}]*" if m.get("course_next") else ""

    return f"""# {m['title_en']}
# {m['title_ar']}

| | |
|---|---|
| **Duration** | {m.get('duration', '90 minutes')} |
| **Lesson ID** | {m['lesson_id']} |
| **Prerequisites** | {m.get('prereq', 'See course overview')} |

---

## Learning objectives

After completing this lesson, you will be able to:

{objs}

---

{m['body']}

---

## Key takeaways

> 📌 **Key Takeaways — {m['lesson_id']}**
{takes}

---

## Lesson Quiz (10 questions)

{quiz}---

## References

{refs}{next_line}{course_end}
"""

def write_lesson(course, filename, meta):
    path = os.path.join(BASE, course, "lessons", filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(build_lesson(meta))
