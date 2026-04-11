# 🎯 Project: Learning Management System (LMS) with OTP Authentication

## 🧩 Objective

Build a full-stack Learning Management System (LMS) with:

* Course management
* Lesson learning
* Quiz system
* Enrollment & progress tracking
* Certificate generation
* Phone-based OTP authentication

The system must be scalable, modular, and production-ready.

---

# 🧱 Tech Stack

## Frontend

* Next.js (App Router)
* TypeScript
* Tailwind CSS

## Backend

* Next.js API Routes OR Express / NestJS
* PostgreSQL (Supabase recommended)

---

# 👥 Roles

* ADMIN
* INSTRUCTOR
* STUDENT

---

# 🔐 Authentication System (OTP-based)

## Features

* Register with phone number
* Send OTP
* Verify OTP
* Optional: Login with OTP (2FA)

---

## OTP Flow

Register → Input phone → Send OTP → Verify OTP → Account Activated

---

# 🧩 Core Modules

## 1. Authentication

* Register (email + password + phone)
* Login
* Send OTP
* Verify OTP
* Get current user

---

## 2. User Management

* CRUD users
* Assign roles
* Phone verification status

---

## 3. Course Management

* Create course
* Update course
* Publish / unpublish

---

## 4. Lesson Management

* Add lessons to course
* Order lessons
* Support text + video

---

## 5. Quiz System

* Create quiz
* Add questions
* Multiple choices
* Submit answers
* Calculate score

---

## 6. Enrollment

* Enroll student
* Prevent duplicate enroll
* Track status

---

## 7. Progress Tracking

* Track lesson completion
* Calculate percentage
* Update enrollment.progress

---

## 8. Certificate

* Generate when course completed (progress = 100%)

---

# 🔌 API Design

## Auth

POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

## OTP

POST   /api/otp/send
POST   /api/otp/verify

## Users

GET    /api/users
GET    /api/users/:id
PATCH  /api/users/:id
DELETE /api/users/:id

## Courses

POST   /api/courses
GET    /api/courses
GET    /api/courses/:id
PATCH  /api/courses/:id
DELETE /api/courses/:id

## Lessons

POST   /api/lessons
GET    /api/lessons?courseId=
PATCH  /api/lessons/:id
DELETE /api/lessons/:id

## Quiz

POST   /api/quizzes
GET    /api/quizzes/:courseId

## Questions

POST   /api/questions
GET    /api/questions?quizId=

## Enrollment

POST   /api/enroll
GET    /api/enrollments

## Progress

POST   /api/progress/lesson
GET    /api/progress/course/:id

## Quiz Submit

POST   /api/quiz/submit

---

# 🧠 Business Logic

## OTP Send

* Generate 6-digit code
* Expire in 5 minutes
* Save to DB
* Mock SMS (console.log)

## OTP Verify

* Check code match
* Check not expired
* Mark as used
* Update user.is_phone_verified = true

## Progress Calculation

* completedLessons / totalLessons * 100

## Quiz Submission

* Compare answers
* Calculate score
* Save attempt

## Certificate Generation

* If progress == 100 → create certificate

---

# 🎨 Frontend Pages

/login
/register
/otp-verify
/dashboard
/courses
/courses/[id]
/learn/[courseId]/lesson/[lessonId]
/quiz/[quizId]
/admin

---

# 🔁 User Flow

## Student

Register → OTP Verify → Login → Enroll → Learn → Complete Lesson → Quiz → Certificate

## Instructor

Login → Create Course → Add Lesson → Add Quiz → Publish

## Admin

Login → Manage Users → Manage Courses

---

# 🧱 Folder Structure

/src
/app
/components
/lib
/services
/types

---

# 🔒 Security Best Practices

* OTP expires in 5 minutes
* OTP can be used once only
* Rate limit OTP requests
* Hash OTP before storing (optional advanced)
* Validate all inputs

---

# 🚀 Development Notes

* Use UUID for all IDs
* Use timestamps for tracking
* Use foreign keys with cascade delete
* Add indexes for performance
* Separate business logic from API layer

---

# 🎯 Goal

This system should:

* Simulate real-world LMS
* Support multiple roles
* Have full CRUD operations
* Include authentication + OTP
* Be ready for UI/API/Performance testing in future
