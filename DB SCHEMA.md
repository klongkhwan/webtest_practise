# 🗄️ Database Schema (PostgreSQL)

## Users

* id (uuid)
* email (unique)
* password
* phone (unique)
* role
* is_phone_verified (boolean)
* created_at

## Courses

* id
* title
* description
* status (DRAFT / PUBLISHED)
* created_by
* created_at

## Lessons

* id
* course_id
* title
* content
* video_url
* order_index

## Quizzes

* id
* course_id
* title

## Questions

* id
* quiz_id
* question
* correct_answer

## Choices

* id
* question_id
* text
* is_correct

## Enrollments

* id
* user_id
* course_id
* status
* progress
* UNIQUE(user_id, course_id)

## Lesson Progress

* id
* user_id
* lesson_id
* completed

## Quiz Attempts

* id
* user_id
* quiz_id
* score
* submitted_at

## Answers

* id
* attempt_id
* question_id
* selected_choice_id

## Certificates

* id
* user_id
* course_id
* issued_at

## OTP Codes

* id
* phone
* code
* expires_at
* used
* created_at

---
