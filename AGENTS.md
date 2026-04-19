<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Space Theme (Frontend Only)

Backend schema stays unchanged. Only frontend labels and visuals use the space theme:

| Backend | Frontend Label |
|--------|---------------|
| Class | Nebula |
| Track | Planet |
| Lesson | Moon |

**Visual mappings:**
- Classes display as nebula cards (colored clouds)
- Tracks display as planets
- Lessons display as moons (collectible items)

**API routes remain unchanged** - e.g., `/api/classes`, `/api/tracks/:trackId/lessons` (don't rename routes)
