import { z } from 'zod';

// Auth validation
export const loginSchema = z.object({
  phone: z.string().min(10).max(15).regex(/^\+?[\d\s-]+$/, 'Invalid phone number'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6).regex(/^\d+$/, 'Code must be 6 digits'),
});

export const completeProfileSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
});

// Course validation
export const createCourseSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().max(5000).optional(),
  is_paid: z.boolean().optional().default(false),
  price: z.number().min(0).optional().default(0),
});

export const updateCourseSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  is_paid: z.boolean().optional(),
  price: z.number().min(0).optional(),
});

// Lesson validation
export const createLessonSchema = z.object({
  course_id: z.string().uuid(),
  title: z.string().min(3).max(255),
  content: z.string().max(50000).optional(),
  video_url: z.string().url().optional().or(z.literal('')),
  is_free: z.boolean().optional().default(false),
  duration_minutes: z.number().min(0).optional().default(0),
});

export const updateLessonSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  content: z.string().max(50000).optional(),
  video_url: z.string().url().optional().or(z.literal('')),
  is_free: z.boolean().optional(),
  duration_minutes: z.number().min(0).optional(),
  order_index: z.number().min(0).optional(),
});

// Quiz validation
export const createQuizSchema = z.object({
  course_id: z.string().uuid(),
  lesson_id: z.string().uuid().optional(),
  title: z.string().min(3).max(255),
  description: z.string().max(2000).optional().nullable(),
  passing_score: z.number().min(0).max(100).optional().default(70),
  time_limit_minutes: z.number().min(1).max(180).optional().nullable(),
  max_attempts: z.number().min(1).max(10).optional().nullable(),
});

// Question validation
export const createQuestionSchema = z.object({
  quiz_id: z.string().uuid(),
  question: z.string().min(10).max(1000),
  explanation: z.string().max(2000).optional(),
  points: z.number().min(1).max(100).optional().default(1),
});

// Choice validation
export const createChoiceSchema = z.object({
  text: z.string().min(1).max(500),
  is_correct: z.boolean().default(false),
});

// Submit quiz validation
export const submitQuizSchema = z.object({
  quiz_id: z.string().uuid(),
  answers: z.array(
    z.object({
      question_id: z.string().uuid(),
      selected_choice_id: z.string().uuid(),
    })
  ).min(1),
});

// Progress validation
export const markLessonCompleteSchema = z.object({
  lesson_id: z.string().uuid(),
  course_id: z.string().uuid(),
});

// Enrollment validation
export const enrollSchema = z.object({
  course_id: z.string().uuid(),
});

// Types from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type CreateChoiceInput = z.infer<typeof createChoiceSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
export type MarkLessonCompleteInput = z.infer<typeof markLessonCompleteSchema>;
export type EnrollInput = z.infer<typeof enrollSchema>;
