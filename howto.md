# LMS Flow Guide (Updated)

เอกสารนี้อัปเดตจากสถานะโค้ดล่าสุดของโปรเจ็ค โดยตัด flow OTP ออกแล้ว และสรุปการทำงานของระบบตั้งแต่เริ่มใช้งานจนจบคอร์สและออกใบประกาศ

## ภาพรวมบทบาทผู้ใช้

ระบบมี 3 role หลัก:

- `ADMIN` — จัดการผู้ใช้ทุกคน, จัดการคอร์ส, อนุมัติ/เปลี่ยนสถานะคอร์ส, เข้าถึง Admin Panel และ Instructor Panel
- `INSTRUCTOR` — สร้างและจัดการ course, lesson, quiz ของตัวเอง
- `STUDENT` — ลงเรียน, เรียน lesson, ทำ quiz, ดู certificate

ค่า default ตอน register คือ `STUDENT`

---

## สิทธิ์ที่เห็นบน sidebar

อ้างอิงจาก `src/components/AppLayout.tsx`

- ทุกคนเห็น: `Dashboard`, `Courses`, `Profile`
- `INSTRUCTOR` และ `ADMIN` เห็นเพิ่ม: `Instructor`
- `ADMIN` เห็นเพิ่ม: `Admin Panel`

> หมายเหตุ: sidebar จะปรับตาม `user.role` ที่โหลดมาจากตาราง `users`

---

## Auth Flow ปัจจุบัน

ตอนนี้ระบบใช้ **email/password** เป็นหลัก

### สมัครสมาชิก

หน้า `src/app/register/page.tsx`

1. ผู้ใช้กรอก
   - full name
   - email
   - phone
   - password
   - confirm password
   - ยอมรับ terms
2. frontend เรียก `supabase.auth.signUp({ email, password })`
3. ถ้าสำเร็จ จะเรียก `POST /api/auth/register`
4. API สร้าง profile ลงตาราง `users`
5. สมัครสำเร็จแล้ว redirect ไป `/dashboard`

### ล็อกอิน

หน้า `src/app/login/page.tsx`

1. ผู้ใช้กรอก email + password
2. frontend เรียก `POST /api/auth/login`
3. backend ใช้ `supabase.auth.signInWithPassword`
4. backend หา profile จากตาราง `users` ด้วย `auth_id`
5. ถ้าสำเร็จจะเข้า `/dashboard`

### Session / Protected Route

`src/components/AppLayout.tsx` จะทำหน้าที่:

1. โหลด user จาก `localStorage` ก่อน
2. revalidate session กับ Supabase
3. ถ้าไม่มี session จะ redirect ไป `/login`
4. ถ้ามี session จะ fetch profile จาก `/api/auth/me`
5. render layout, sidebar, topbar และ content

---

## Flow ทั้งระบบตั้งแต่เริ่มจนจบ

### 1) สร้าง ADMIN คนแรก

วิธีสร้างได้ 2 แบบ:

- สมัครปกติ แล้วไปเปลี่ยน role ใน database เป็น `ADMIN`
- หรือสร้างผ่าน Supabase dashboard แล้ว insert ลง `users`

หน้าที่:
- จัดการ user
- อนุมัติ / publish course
- เข้าถึงทุกหน้า

---

### 2) สร้าง INSTRUCTOR

- สมัครด้วยฟอร์ม register ปกติ
- role จะเป็น `STUDENT` ก่อน
- จากนั้นเปลี่ยน role เป็น `INSTRUCTOR` ผ่าน Admin Panel หรือ database

หน้าที่:
- สร้าง course
- เพิ่ม lesson
- สร้าง quiz และ questions

---

### 3) สร้าง STUDENT

- สมัครปกติ
- role จะเป็น `STUDENT` อัตโนมัติ

หน้าที่:
- ลงเรียน course
- เรียน lesson
- ทำ quiz
- รับ certificate

---

## Course Creation Flow

### 4) INSTRUCTOR สร้าง Course

หน้า instructor panel เช่น:
- `/instructor`
- `/instructor/courses/[id]`
- `/instructor/quiz/[id]`

course ใหม่มักเริ่มต้นเป็น `DRAFT`

จากนั้นจะมีข้อมูลหลักเช่น:
- title
- description
- is_paid
- price
- status

---

### 5) ADMIN Publish Course

ADMIN จะเปลี่ยนสถานะ course จาก `DRAFT` เป็น `PUBLISHED`

ผลลัพธ์:
- course จะเริ่มมองเห็นในหน้า courses
- student สามารถ enroll ได้

---

### 6) INSTRUCTOR เพิ่ม Lessons

INSTRUCTOR เพิ่ม lesson เข้าใน course ที่ตัวเองดูแล

แต่ละ lesson อาจมี:
- title
- content
- video_url
- duration_minutes
- order_index
- is_free

---

### 7) INSTRUCTOR สร้าง Quiz และ Questions

ระบบ quiz รองรับ:
- quiz ต่อ course หรือ lesson
- questions
- choices
- passing score
- max attempts
- time limit

เมื่อ student ทำ quiz แล้ว ระบบจะเก็บผลใน `quiz_attempts`

---

## Student Learning Flow

### 8) STUDENT ลงเรียน Course

หน้า course detail:
- `/courses/[id]`

เมื่อกด enroll:
- เรียก `POST /api/enrollments`
- backend ตรวจ session และ user profile
- ตรวจว่า course มีสถานะ `PUBLISHED`
- ตรวจว่าเคย enroll แล้วหรือยัง
- สร้าง record ในตาราง `enrollments`

สถานะที่ได้:
- `status = ACTIVE`
- `progress_percent = 0`

---

### 9) STUDENT เรียน Lesson และกด Mark as Complete

เมื่อเรียนจบ lesson จะเรียก:
- `POST /api/progress`

backend ทำงานดังนี้:

1. ตรวจว่า user login อยู่
2. ตรวจว่า user มี enrollment ใน course นี้
3. ถ้า lesson นั้นมี quiz:
   - ต้องมี quiz attempt ที่ `is_passed = true` ก่อน
4. upsert ไปที่ `lesson_progress`
5. trigger ใน database จะคำนวณ progress ของ enrollment ใหม่อัตโนมัติ

ผลลัพธ์ที่อัปเดต:
- `lesson_progress`
- `enrollments.progress_percent`

---

## การจบคอร์สและออก Certificate

### 10) เมื่อ progress ครบ 100%

อ้างอิงจาก `src/app/api/progress/route.ts`

ถ้า:
- `progress_percent >= 100`
- และ `enrollment.status === 'ACTIVE'`

ระบบจะ:

1. เปลี่ยน enrollment เป็น `COMPLETED`
2. ตรวจว่า certificate มีอยู่แล้วหรือยัง
3. ถ้ายังไม่มี จะสร้าง certificate ใหม่

certificate ที่สร้างจะมี:
- `certificate_number`
- `issued_at`
- `user_id`
- `course_id`
- `enrollment_id`

---

### 11) STUDENT ดู Certificate

สามารถดู certificate ได้จากหน้า profile หรือหน้าที่เกี่ยวข้องกับ certificates

ตัวอย่างเส้นทางในโปรเจ็ค:
- `src/app/(app)/profile/page.tsx`
- `src/app/(app)/certificates/[id]/page.tsx`

---

## ลำดับที่ต้องทำจริงแบบสั้น

1. สร้าง ADMIN
2. สร้าง INSTRUCTOR
3. INSTRUCTOR สร้าง course
4. ADMIN publish course
5. INSTRUCTOR เพิ่ม lessons
6. INSTRUCTOR สร้าง quiz/questions
7. STUDENT สมัครและ login
8. STUDENT enroll course
9. STUDENT เรียน lesson และทำ quiz
10. STUDENT mark complete จนครบ
11. ระบบสร้าง certificate อัตโนมัติ

---

## จุดสำคัญของระบบปัจจุบัน

- ไม่มี OTP flow แล้ว
- Auth หลักคือ email/password
- การสร้าง profile แยกจาก Supabase Auth
- Progress และ certificate ถูกคำนวณ/สร้างจาก `POST /api/progress`
- Role ควบคุมสิทธิ์การเข้าถึงทั้ง UI และ API

---

## Reference ไฟล์สำคัญ

- `src/app/register/page.tsx`
- `src/app/login/page.tsx`
- `src/components/AppLayout.tsx`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/enrollments/route.ts`
- `src/app/api/progress/route.ts`
- `src/lib/supabase/server.ts`
- `database/schema.sql`

---

## หมายเหตุ

เอกสารนี้อัปเดตตามสถานะโค้ดล่าสุดในโปรเจ็คหลังจากตัด OTP ออกแล้ว หากมีการเปลี่ยน flow เพิ่มเติม เช่น เปลี่ยนจาก email/password เป็น SSO หรือเพิ่มระบบ reset password แบบใหม่ ควรอัปเดตเอกสารนี้อีกครั้ง
