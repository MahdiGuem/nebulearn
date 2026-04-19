# Nebulearn - AI-Powered Learning Platform

**Nebulearn** is an intelligent learning management system that transforms educational content into interactive learning experiences using AI. Built with Next.js, PostgreSQL, and Google's Gemini AI.

---

## IMPORTANT NOTICE: Private Tutor Chatbot

> **FEATURE STATUS: IMPLEMENTED BUT NOT DEMONSTRATED**
>
> The **AI Private Tutor Chatbot** feature has been **fully implemented** and is functional in the codebase. However, due to **time constraints and technical issues during the demo recording**, this feature was not showcased in the final presentation video.
>
> ### What Was Implemented:
> - ✅ Full RAG-based chat interface (`/student/classes/[classId]/chat`)
> - ✅ Context-aware responses using class documents
> - ✅ Student weakness personalization
> - ✅ Chat history persistence
> - ✅ Source document references
> - ✅ Real-time message streaming
>
> ### How to Access:
> 1. Log in as a student
> 2. Navigate to any enrolled class
> 3. Click the **"Ask AI"** button (or visit `/student/classes/{classId}/chat`)
>
> The chatbot allows students to ask questions about their study materials and receive personalized answers based on their documents and identified weaknesses.

---

## Features

### Core Learning Flow (Space Theme)
- **Nebulas (Classes)**: Classes are displayed as beautiful nebula cards
- **Planets (Tracks)**: Learning tracks shown as planets in orbit
- **Moons (Lessons)**: Individual lessons as collectible moons
- **AI Quiz Generator**: Upload PDFs and automatically generate quizzes

### AI-Powered Features
| Feature | Status | Description |
|---------|--------|-------------|
| **PDF Processing** | Active | Upload PDFs, extract text, generate embeddings |
| **Quiz Generation** | Active | RAG-based quiz creation from documents |
| **Weakness Tracking** | Active | Tracks student weaknesses and strengths per class |
| **Private Tutor Chatbot** | implemented* | AI chatbot with document context (see notice above) |
| **Gamification** | Active | XP, levels, streaks, achievements |

### User Roles
- **Teachers**: Create classes, upload materials, track student progress
- **Students**: Join classes, complete lessons, earn XP, chat with AI tutor

---

## Architecture

### Tech Stack
- **Frontend**: Next.js 16.2, React 19, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Google Gemini (Flash for text, Embedding-2 for vectors)
- **Storage**: Supabase Storage for PDFs
- **Background Jobs**: Inngest for async processing
- **Authentication**: NextAuth.js with credentials provider

### Data Flow
```
PDF Upload → Text Extraction → Chunking → Embeddings (384-dim) → PostgreSQL
                                      ↓
Student Question → Embedding → Similarity Search → RAG Context → AI Response
```

### Key Directories
```
/app
  /api                    # API routes
  /student                # Student-facing pages
    /classes/[classId]  # Class, tracks, chat
    /lessons/[lessonId] # Lesson completion
  /teacher                # Teacher dashboard
/lib
  /ai/services          # Quiz generator, chat retriever, embedder
  /ai/utils             # PDF extraction, chunking
  /inngest/functions    # Background processing
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ with pgvector extension
- Supabase account (for storage)
- Google AI API key

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nebulearn"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_KEY="your-service-key"

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY="your-api-key"

# NextAuth
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/nebulearn.git
cd nebulearn

# Install dependencies
pnpm install

# Set up database
npx prisma migrate dev
npx prisma generate

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Scenarios available in the submission youtube link
---

## 🛠️ Development Notes

### Implemented Features
- ✅ Next.js 16 with App Router
- ✅ PostgreSQL with pgvector (384-dim embeddings)
- ✅ NextAuth v5 authentication
- ✅ Prisma ORM with generated client
- ✅ Inngest background job processing
- ✅ RAG pipeline (PDF → chunks → embeddings → retrieval)
- ✅ AI quiz generation with diverse chunk selection
- ✅ Weakness tracking system
- ✅ Gamification (XP, levels, streaks)
- ✅ Student/teacher role-based access

### Known Limitations
- Image extraction from PDFs is stubbed (returns empty array)
- Lesson recommendations table exists but not actively used
- No WebSocket real-time updates (uses polling)

---

## License

MIT License - See LICENSE file for details

---

## Acknowledgments

- Google Gemini AI for embeddings and text generation
- Vercel AI SDK for streaming responses
- Supabase for storage infrastructure
- Next.js team for the amazing framework

---

**Built with for the nebulearn project**
