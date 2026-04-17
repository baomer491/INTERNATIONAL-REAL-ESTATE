import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'يرجى إدخال اسم المستخدم').max(50),
  password: z.string().min(1, 'يرجى إدخال كلمة المرور').max(100),
});

export const bankSchema = z.object({
  name: z.string().min(1, 'يرجى إدخال اسم البنك').max(200),
  nameEn: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
});

export const beneficiarySchema = z.object({
  fullName: z.string().min(1, 'يرجى إدخال الاسم الكامل').max(200),
  civilId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
  address: z.string().optional(),
  relation: z.enum(['owner', 'buyer', 'seller', 'heir', 'agent', 'other']),
  workplace: z.string().optional(),
  notes: z.string().optional(),
});

export const employeeSchema = z.object({
  fullName: z.string().min(1, 'يرجى إدخال الاسم الكامل').max(200),
  username: z.string().min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل').max(50),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
  phone: z.string().optional(),
  role: z.enum(['admin', 'manager', 'appraiser', 'viewer']),
  department: z.string().optional(),
});

export const taskSchema = z.object({
  title: z.string().min(1, 'يرجى إدخال عنوان المهمة').max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().min(1, 'يرجى تحديد تاريخ الاستحقاق'),
});

export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
};

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0]?.toString() || 'general';
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }
  return { success: false, errors };
}
