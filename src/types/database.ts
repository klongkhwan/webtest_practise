export type UserRole = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED';

export interface User {
  id: string;
  auth_id: string;
  email: string;
  phone: string | null;
  full_name: string;
  role: UserRole;
  is_phone_verified: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  status: CourseStatus;
  is_paid: boolean;
  price: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  instructor?: User;
  lessons?: Lesson[];
  lessons_count?: number;
  enrollments_count?: number;
  enrollments?: { count: number }[];
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  order_index: number;
  is_free: boolean;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  quiz?: Quiz | null;
  progress?: LessonProgress | null;
}

export interface Quiz {
  id: string;
  course_id: string;
  lesson_id: string | null;
  title: string;
  description: string | null;
  passing_score: number;
  time_limit_minutes: number | null;
  max_attempts: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  questions?: Question[];
  questions_count?: number;
  course?: { id: string; title: string };
  lesson?: { id: string; title: string; course?: { id: string; title: string } };
}

export interface Question {
  id: string;
  quiz_id: string;
  question: string;
  explanation: string | null;
  order_index: number;
  points: number;
  created_at: string;
  choices?: Choice[];
}

export interface Choice {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  order_index: number;
  created_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  progress_percent: number;
  enrolled_at: string;
  completed_at: string | null;
  course?: Course;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  is_completed: boolean;
  completed_at: string | null;
  last_accessed_at: string;
  watch_time_seconds: number;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  max_score: number;
  percentage: number;
  is_passed: boolean;
  started_at: string;
  submitted_at: string | null;
  time_spent_seconds: number;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_choice_id: string | null;
  is_correct: boolean;
  points_earned: number;
  answered_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_id: string | null;
  certificate_number: string;
  issued_at: string;
  pdf_url: string | null;
  course?: Course;
}

export interface OtpCode {
  id: string;
  phone: string;
  code: string;
  expires_at: string;
  is_used: boolean;
  used_at: string | null;
  attempt_count: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// Form Input Types
export interface LoginInput {
  phone: string;
}

export interface VerifyOtpInput {
  phone: string;
  code: string;
}

export interface CompleteProfileInput {
  full_name: string;
  email: string;
}

export interface CreateCourseInput {
  title: string;
  description?: string;
  is_paid?: boolean;
  price?: number;
}

export interface UpdateCourseInput {
  title?: string;
  description?: string;
  status?: CourseStatus;
  is_paid?: boolean;
  price?: number;
}

export interface CreateLessonInput {
  course_id: string;
  title: string;
  content?: string;
  video_url?: string;
  is_free?: boolean;
  duration_minutes?: number;
}

export interface CreateQuizInput {
  course_id: string;
  lesson_id?: string;
  title: string;
  description?: string;
  passing_score?: number;
  time_limit_minutes?: number;
  max_attempts?: number;
}

export interface CreateQuestionInput {
  quiz_id: string;
  question: string;
  explanation?: string;
  points?: number;
  choices: CreateChoiceInput[];
}

export interface CreateChoiceInput {
  text: string;
  is_correct: boolean;
}

export interface SubmitQuizInput {
  quiz_id: string;
  answers: {
    question_id: string;
    selected_choice_id: string;
  }[];
}

export interface MarkLessonCompleteInput {
  lesson_id: string;
  course_id: string;
}

// Supabase Database type for type-safe operations
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      courses: {
        Row: Course;
        Insert: Omit<Course, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Course, 'id' | 'created_at'>>;
      };
      lessons: {
        Row: Lesson;
        Insert: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Lesson, 'id' | 'created_at'>>;
      };
      quizzes: {
        Row: Quiz;
        Insert: Omit<Quiz, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Quiz, 'id' | 'created_at'>>;
      };
      questions: {
        Row: Question;
        Insert: Omit<Question, 'id' | 'created_at'>;
        Update: Partial<Omit<Question, 'id' | 'created_at'>>;
      };
      choices: {
        Row: Choice;
        Insert: Omit<Choice, 'id' | 'created_at'>;
        Update: Partial<Omit<Choice, 'id' | 'created_at'>>;
      };
      enrollments: {
        Row: Enrollment;
        Insert: Omit<Enrollment, 'id' | 'enrolled_at' | 'completed_at'>;
        Update: Partial<Omit<Enrollment, 'id' | 'enrolled_at'>>;
      };
      lesson_progress: {
        Row: LessonProgress;
        Insert: Omit<LessonProgress, 'id' | 'completed_at' | 'last_accessed_at'>;
        Update: Partial<Omit<LessonProgress, 'id'>>;
      };
      quiz_attempts: {
        Row: QuizAttempt;
        Insert: Omit<QuizAttempt, 'id' | 'started_at' | 'submitted_at'>;
        Update: Partial<Omit<QuizAttempt, 'id' | 'started_at'>>;
      };
      answers: {
        Row: Answer;
        Insert: Omit<Answer, 'id' | 'answered_at'>;
        Update: Partial<Omit<Answer, 'id' | 'answered_at'>>;
      };
      certificates: {
        Row: Certificate;
        Insert: Omit<Certificate, 'id' | 'issued_at'>;
        Update: Partial<Omit<Certificate, 'id' | 'issued_at'>>;
      };
      otp_codes: {
        Row: OtpCode;
        Insert: Omit<OtpCode, 'id' | 'created_at' | 'used_at'>;
        Update: Partial<Omit<OtpCode, 'id' | 'created_at'>>;
      };
    };
  };
}
