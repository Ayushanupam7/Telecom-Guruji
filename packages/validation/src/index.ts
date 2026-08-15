import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  role: z.enum(['student', 'instructor']),
  preferredLanguage: z.enum(['en', 'hi', 'mr']).default('en'),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const courseCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(2, 'Category is required'),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'all_levels']).default('all_levels'),
  defaultLanguage: z.enum(['en', 'hi', 'mr']).default('en'),
  courseType: z.enum(['free', 'one_time_purchase', 'subscription']).default('free'),
  price: z.number().min(0, 'Price must be non-negative').default(0),
  currency: z.string().default('USD'),
});

export const moduleCreateSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(3, 'Module title required'),
  description: z.string().optional(),
  sequenceOrder: z.number().int().min(1),
  isFreePreview: z.boolean().default(false),
});

export const lessonCreateSchema = z.object({
  moduleId: z.string().uuid(),
  title: z.string().min(3, 'Lesson title required'),
  description: z.string().optional(),
  sequenceOrder: z.number().int().min(1),
  isFreePreview: z.boolean().default(false),
  isOptional: z.boolean().default(false),
});

export const contentBlockCreateSchema = z.object({
  lessonId: z.string().uuid(),
  blockType: z.enum(['TEXT', 'VIDEO', 'YOUTUBE', 'PDF', 'IMAGE', 'QUIZ', 'EMBED', 'CODE']),
  sequenceOrder: z.number().int().min(1),
  contentPayload: z.record(z.unknown()),
  isRequired: z.boolean().default(true),
});

export const quizSubmitSchema = z.object({
  attemptId: z.string().uuid(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedOptionIds: z.array(z.string().uuid()),
    })
  ),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
export type ModuleCreateInput = z.infer<typeof moduleCreateSchema>;
export type LessonCreateInput = z.infer<typeof lessonCreateSchema>;
export type ContentBlockCreateInput = z.infer<typeof contentBlockCreateSchema>;
export type QuizSubmitInput = z.infer<typeof quizSubmitSchema>;
