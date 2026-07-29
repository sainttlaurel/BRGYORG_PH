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

export const residentSchema = z.object({
  fname: z.string().min(1, "First name is required").max(100),
  lname: z.string().min(1, "Last name is required").max(100),
  purok: z.string().min(1, "Purok is required"),
  contact: z.string().max(50).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  gender: z.enum(["Male", "Female"]),
  dob: z.string().optional().or(z.literal("")),
});

export const officialSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  position: z.string().min(1, "Position is required"),
  committee: z.string().optional().or(z.literal("")),
  contact: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  since: z.string().optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
});

export const blotterSchema = z.object({
  complainant: z.string().min(1, "Complainant is required").max(200),
  respondent: z.string().optional().or(z.literal("")),
  incident: z.string().min(1, "Incident type is required").max(200),
  location: z.string().optional().or(z.literal("")),
  summary: z.string().optional().or(z.literal("")),
});

export const userSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  loginId: z.string().min(3, "Login ID must be at least 3 characters").max(50),
  password: z.string().min(6, "Password must be at least 6 characters").max(100).optional().or(z.literal("")),
  role: z.string().min(1, "Role is required"),
});

export const contactMessageSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  subject: z.string().min(1, "Subject is required").max(300),
  message: z.string().min(1, "Message is required").max(5000),
  category: z.string().optional(),
});

export type ResidentForm = z.infer<typeof residentSchema>;
export type OfficialForm = z.infer<typeof officialSchema>;
export type BlotterForm = z.infer<typeof blotterSchema>;
export type UserForm = z.infer<typeof userSchema>;
export type ContactMessageForm = z.infer<typeof contactMessageSchema>;
