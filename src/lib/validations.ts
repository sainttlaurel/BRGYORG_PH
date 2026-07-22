import { z } from 'zod';

export const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  category: z.string().min(1, 'Category is required'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  priority: z.enum(['normal', 'high']).default('normal'),
});

export const pollSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  endDate: z.string().optional(),
});

export const documentRequestSchema = z.object({
  serviceType: z.string().min(1, 'Please select a service'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  middleName: z.string().optional(),
  address: z.string().min(1, 'Address is required').max(500),
  contact: z.string().min(1, 'Contact number is required').max(50),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  purpose: z.string().min(1, 'Purpose is required').max(1000),
  notes: z.string().optional(),
  agreeToTerms: z.literal(true, { message: 'You must agree to proceed' }),
});

export const loginSchema = z.object({
  loginId: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type AnnouncementForm = z.infer<typeof announcementSchema>;
export type PollForm = z.infer<typeof pollSchema>;
export type DocumentRequestForm = z.infer<typeof documentRequestSchema>;
export type LoginForm = z.infer<typeof loginSchema>;
