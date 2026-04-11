# Learning Management System (LMS)

A production-ready Learning Management System built with Next.js, TypeScript, Supabase, and TailwindCSS.

## Features

- **OTP Authentication**: Phone-based OTP login with Supabase Auth
- **Course Management**: Create, publish, and manage courses
- **Lesson System**: Video and text-based lessons with progress tracking
- **Quiz System**: Multiple choice quizzes with scoring and passing grades
- **Enrollment System**: Free and paid course enrollments
- **Progress Tracking**: Automatic progress calculation per lesson and course
- **Certificate Generation**: Auto-generated certificates on course completion

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth with OTP
- **Validation**: Zod

## Project Structure

```
lms-app/
├── src/
│   ├── app/
│   │   ├── api/                 # API Routes
│   │   │   ├── auth/
│   │   │   │   ├── otp/send/    # Send OTP
│   │   │   │   ├── otp/verify/  # Verify OTP
│   │   │   │   ├── register/    # Register user
│   │   │   │   └── me/          # Get current user
│   │   │   ├── courses/         # Course CRUD
│   │   │   ├── lessons/         # Lesson CRUD
│   │   │   ├── enrollments/     # Enrollment management
│   │   │   ├── progress/        # Progress tracking
│   │   │   └── quiz/            # Quiz system
│   │   ├── login/               # Login page
│   │   ├── dashboard/           # Dashboard page
│   │   ├── courses/             # Courses list & detail
│   │   ├── lessons/             # Lesson view
│   │   ├── quiz/                # Quiz view
│   │   ├── globals.css          # Global styles
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Home page
│   ├── components/              # Reusable components
│   ├── lib/
│   │   ├── supabase.ts          # Supabase clients
│   │   ├── validation.ts        # Zod schemas
│   │   └── utils.ts             # Utility functions
│   └── types/
│       └── database.ts          # TypeScript types
├── database/
│   └── schema.sql               # PostgreSQL schema
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── README.md
```

## Setup Instructions

### 1. Clone and Install

```bash
cd lms-app
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Copy the SQL schema from `database/schema.sql`
3. Open the Supabase SQL Editor and run the schema
4. Get your project credentials from Settings > API:
   - Project URL
   - Anon Key
   - Service Role Key (for admin operations)

### 3. Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Authentication Flow

1. User enters phone number on `/login`
2. OTP code is sent via API (mock in development)
3. User enters OTP code to verify
4. If new user: complete profile with name and email
5. If existing user: redirected to dashboard

## Database Schema

### Core Tables

- **users**: User profiles linked to Supabase Auth
- **courses**: Course information with status (DRAFT/PUBLISHED/ARCHIVED)
- **lessons**: Course lessons with ordering
- **quizzes**: Quizzes linked to courses/lessons
- **questions** & **choices**: Quiz questions and answers
- **enrollments**: User course enrollments with progress
- **lesson_progress**: Individual lesson completion tracking
- **quiz_attempts**: Quiz submission history
- **certificates**: Auto-generated certificates
- **otp_codes**: OTP codes for phone verification

### Key Features

- **RLS Policies**: Row Level Security for data protection
- **Triggers**: Automatic progress calculation and certificate generation
- **Indexes**: Optimized queries for performance

## API Endpoints

### Auth
- `POST /api/auth/otp/send` - Send OTP to phone
- `POST /api/auth/otp/verify` - Verify OTP code
- `POST /api/auth/register` - Complete profile registration
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course (Instructor/Admin)
- `GET /api/courses/[id]` - Get course details
- `PATCH /api/courses/[id]` - Update course
- `DELETE /api/courses/[id]` - Delete course

### Lessons
- `GET /api/lessons?courseId=` - List lessons
- `POST /api/lessons` - Create lesson
- `GET /api/lessons/[id]` - Get lesson
- `PATCH /api/lessons/[id]` - Update lesson
- `DELETE /api/lessons/[id]` - Delete lesson

### Enrollments
- `GET /api/enrollments` - List my enrollments
- `POST /api/enrollments` - Enroll in course

### Progress
- `POST /api/progress` - Mark lesson complete
- `GET /api/progress/[courseId]` - Get course progress

### Quiz
- `GET /api/quiz/[id]` - Get quiz
- `POST /api/quiz/submit` - Submit quiz answers

## User Roles

- **STUDENT**: Can enroll in courses, track progress, take quizzes
- **INSTRUCTOR**: Can create and manage own courses
- **ADMIN**: Can manage all courses and users

## Business Logic

1. **Free Courses**: Accessible without enrollment
2. **Paid Courses**: Require enrollment (payment integration ready)
3. **Free Lessons**: Preview available before enrollment
4. **Progress**: Auto-calculated from completed lessons
5. **Certificates**: Generated when course progress reaches 100%
6. **Quiz**: Passing score configurable per quiz

## Deployment

1. Push to GitHub
2. Connect to Vercel or similar platform
3. Add environment variables in deployment settings
4. Deploy

## License

MIT

# webtest_practise
