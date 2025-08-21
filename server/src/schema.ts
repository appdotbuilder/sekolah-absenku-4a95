import { z } from 'zod';

// Enums for the application
export const userRoleEnum = z.enum(['siswa', 'guru', 'admin']);
export const attendanceStatusEnum = z.enum(['hadir', 'izin', 'sakit', 'alpha']);

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
  role: userRoleEnum,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Input schema for user login
export const loginInputSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: userRoleEnum
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Input schema for creating users
export const createUserInputSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: userRoleEnum
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for updating users
export const updateUserInputSchema = z.object({
  id: z.number(),
  username: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: userRoleEnum.optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Class schema
export const classSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Class = z.infer<typeof classSchema>;

// Input schema for creating classes
export const createClassInputSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  description: z.string().nullable()
});

export type CreateClassInput = z.infer<typeof createClassInputSchema>;

// Input schema for updating classes
export const updateClassInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional()
});

export type UpdateClassInput = z.infer<typeof updateClassInputSchema>;

// Student schema
export const studentSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  class_id: z.number(),
  nis: z.string(),
  nisn: z.string().nullable(),
  full_name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  photo_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Student = z.infer<typeof studentSchema>;

// Input schema for creating students
export const createStudentInputSchema = z.object({
  user_id: z.number(),
  class_id: z.number(),
  nis: z.string().min(1, "NIS is required"),
  nisn: z.string().nullable(),
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  photo_url: z.string().nullable()
});

export type CreateStudentInput = z.infer<typeof createStudentInputSchema>;

// Input schema for updating students
export const updateStudentInputSchema = z.object({
  id: z.number(),
  class_id: z.number().optional(),
  nis: z.string().optional(),
  nisn: z.string().nullable().optional(),
  full_name: z.string().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  photo_url: z.string().nullable().optional()
});

export type UpdateStudentInput = z.infer<typeof updateStudentInputSchema>;

// Teacher schema
export const teacherSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  nip: z.string(),
  full_name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  photo_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Teacher = z.infer<typeof teacherSchema>;

// Input schema for creating teachers
export const createTeacherInputSchema = z.object({
  user_id: z.number(),
  nip: z.string().min(1, "NIP is required"),
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  photo_url: z.string().nullable()
});

export type CreateTeacherInput = z.infer<typeof createTeacherInputSchema>;

// Input schema for updating teachers
export const updateTeacherInputSchema = z.object({
  id: z.number(),
  nip: z.string().optional(),
  full_name: z.string().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  photo_url: z.string().nullable().optional()
});

export type UpdateTeacherInput = z.infer<typeof updateTeacherInputSchema>;

// Teacher-Class relationship schema
export const teacherClassSchema = z.object({
  id: z.number(),
  teacher_id: z.number(),
  class_id: z.number(),
  created_at: z.coerce.date()
});

export type TeacherClass = z.infer<typeof teacherClassSchema>;

// Input schema for assigning teacher to class
export const assignTeacherToClassInputSchema = z.object({
  teacher_id: z.number(),
  class_id: z.number()
});

export type AssignTeacherToClassInput = z.infer<typeof assignTeacherToClassInputSchema>;

// Attendance schema
export const attendanceSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  class_id: z.number(),
  teacher_id: z.number().nullable(),
  date: z.coerce.date(),
  status: attendanceStatusEnum,
  check_in_time: z.coerce.date().nullable(),
  check_out_time: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Attendance = z.infer<typeof attendanceSchema>;

// Input schema for creating attendance
export const createAttendanceInputSchema = z.object({
  student_id: z.number(),
  class_id: z.number(),
  teacher_id: z.number().nullable(),
  date: z.string().transform((val) => new Date(val)),
  status: attendanceStatusEnum,
  check_in_time: z.string().transform((val) => new Date(val)).nullable(),
  check_out_time: z.string().transform((val) => new Date(val)).nullable(),
  notes: z.string().nullable()
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceInputSchema>;

// Input schema for updating attendance
export const updateAttendanceInputSchema = z.object({
  id: z.number(),
  status: attendanceStatusEnum.optional(),
  check_in_time: z.string().transform((val) => new Date(val)).nullable().optional(),
  check_out_time: z.string().transform((val) => new Date(val)).nullable().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateAttendanceInput = z.infer<typeof updateAttendanceInputSchema>;

// Input schema for student self-attendance
export const studentAttendanceInputSchema = z.object({
  type: z.enum(['check_in', 'check_out'])
});

export type StudentAttendanceInput = z.infer<typeof studentAttendanceInputSchema>;

// Query schema for attendance reports
export const attendanceReportQuerySchema = z.object({
  class_id: z.number().optional(),
  student_id: z.number().optional(),
  start_date: z.string().transform((val) => new Date(val)),
  end_date: z.string().transform((val) => new Date(val)),
  status: attendanceStatusEnum.optional()
});

export type AttendanceReportQuery = z.infer<typeof attendanceReportQuerySchema>;

// Statistics schema
export const attendanceStatsSchema = z.object({
  total_students: z.number(),
  present: z.number(),
  permission: z.number(),
  sick: z.number(),
  absent: z.number(),
  attendance_rate: z.number()
});

export type AttendanceStats = z.infer<typeof attendanceStatsSchema>;

// Profile update schema
export const updateProfileInputSchema = z.object({
  full_name: z.string().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  photo_url: z.string().nullable().optional()
});

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

// Change password schema
export const changePasswordInputSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(6, "New password must be at least 6 characters")
});

export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

// Admin dashboard stats schema
export const dashboardStatsSchema = z.object({
  total_students: z.number(),
  total_teachers: z.number(),
  total_classes: z.number(),
  today_attendance: attendanceStatsSchema
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;