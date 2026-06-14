#!/usr/bin/env python3
"""Generate courses 04-08 lessons."""
import os

BASE = "/workspace/elearning-egypt-medications/courses"
TEMPLATE = """# {title_en}
# {title_ar}

| | |
|---|---|
| **Duration** | 90 minutes |
| **Lesson ID** | {lid} |
| **Prerequisites** | {prereq} |

---

## Learning objectives

After completing this lesson, you will be able to:

{objectives}

---

{body}

---

## Key takeaways

> 📌 **Key Takeaways — {lid}**
{takeaways}

---

## Lesson Quiz (10 questions)

{quiz}

---

## References

{refs}
{next}
"""

def obj(items): return "\n".join(f"{i}. {x}" for i,x in enumerate(items,1))
def tk(items): return "\n".join(f"> - {x}" for x in items)
def qz(qs):
    s=""
    for i,(q,o,a) in enumerate(qs,1):
        s+=f"**Q{i}.** {q}\n"+"".join(f"- {chr(97+j)}) {x}{' ✓' if j==a else ''}\n" for j,x in enumerate(o))+"\n"
    return s
def write(course,fname,d):
    p=os.path.join(BASE,course,"lessons",fname)
    os.makedirs(os.path.dirname(p),exist_ok=True)
    with open(p,"w",encoding="utf-8") as f: f.write(TEMPLATE.format(**d).strip()+"\n")

ALL=[]
def add(course,fname,lid,te,ta,ob,body,tkw,qz,refs,nxt="",pre="See course overview"):
    ALL.append((course,fname,dict(lid=lid,title_en=te,title_ar=ta,objectives=obj(ob),body=body,
        takeaways=tk(tkw),quiz=qz(qz),refs="\n".join(f"{i}. {r}" for i,r in enumerate(refs,1)),next=nxt,prereq=pre)))

# Import course 04 definitions from separate logic - inline below
exec(open(os.path.join(os.path.dirname(__file__),"course04_data.py")).read())
exec(open(os.path.join(os.path.dirname(__file__),"course05_data.py")).read())
exec(open(os.path.join(os.path.dirname(__file__),"course06_data.py")).read())
exec(open(os.path.join(os.path.dirname(__file__),"course07_data.py")).read())
exec(open(os.path.join(os.path.dirname(__file__),"course08_data.py")).read())

for c,f,d in ALL: write(c,f,d)
print(f"Generated {len(ALL)} lessons (courses 04-08)")
