import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  loginInputSchema,
  createUserInputSchema,
  updateUserInputSchema,
  changePasswordInputSchema,
  createClassInputSchema,
  updateClassInputSchema,
  createStudentInputSchema,
  updateStudentInputSchema,
  updateProfileInputSchema,
  createTeacherInputSchema,
  updateTeacherInputSchema,
  assignTeacherToClassInputSchema,
  createAttendanceInputSchema,
  updateAttendanceInputSchema,
  studentAttendanceInputSchema,
  attendanceReportQuerySchema
} from './schema';

// Import handlers
import { loginUser } from './handlers/auth_login';
import { getCurrentUser } from './handlers/get_current_user';
import { changePassword } from './handlers/change_password';
import { createUser } from './handlers/create_user';
import { updateUser } from './handlers/update_user';
import { deleteUser } from './handlers/delete_user';

import { createClass } from './handlers/create_class';
import { getClasses } from './handlers/get_classes';
import { getClassById } from './handlers/get_class_by_id';
import { updateClass } from './handlers/update_class';
import { deleteClass } from './handlers/delete_class';

import { createStudent } from './handlers/create_student';
import { getStudents } from './handlers/get_students';
import { getStudentsByClass } from './handlers/get_students_by_class';
import { getStudentById } from './handlers/get_student_by_id';
import { getStudentByUserId } from './handlers/get_student_by_user_id';
import { updateStudent } from './handlers/update_student';
import { updateStudentProfile } from './handlers/update_student_profile';
import { deleteStudent } from './handlers/delete_student';

import { createTeacher } from './handlers/create_teacher';
import { getTeachers } from './handlers/get_teachers';
import { getTeacherById } from './handlers/get_teacher_by_id';
import { getTeacherByUserId } from './handlers/get_teacher_by_user_id';
import { updateTeacher } from './handlers/update_teacher';
import { updateTeacherProfile } from './handlers/update_teacher_profile';
import { deleteTeacher } from './handlers/delete_teacher';
import { assignTeacherToClass } from './handlers/assign_teacher_to_class';
import { getTeacherClasses } from './handlers/get_teacher_classes';
import { removeTeacherFromClass } from './handlers/remove_teacher_from_class';

import { createAttendance } from './handlers/create_attendance';
import { studentCheckInOut } from './handlers/student_check_in_out';
import { getStudentAttendanceToday } from './handlers/get_student_attendance_today';
import { getStudentAttendanceHistory } from './handlers/get_student_attendance_history';
import { updateAttendance } from './handlers/update_attendance';
import { getClassAttendance } from './handlers/get_class_attendance';
import { getAttendanceReport } from './handlers/get_attendance_report';
import { getAttendanceStatistics } from './handlers/get_attendance_statistics';
import { getDashboardStats } from './handlers/get_dashboard_stats';
import { bulkCreateAttendance } from './handlers/bulk_create_attendance';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  getCurrentUser: publicProcedure
    .input(z.number())
    .query(({ input }) => getCurrentUser(input)),

  changePassword: publicProcedure
    .input(z.object({
      userId: z.number(),
      passwordData: changePasswordInputSchema
    }))
    .mutation(({ input }) => changePassword(input.userId, input.passwordData)),

  // User management routes (Admin only)
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  deleteUser: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteUser(input)),

  // Class management routes
  createClass: publicProcedure
    .input(createClassInputSchema)
    .mutation(({ input }) => createClass(input)),

  getClasses: publicProcedure
    .query(() => getClasses()),

  getClassById: publicProcedure
    .input(z.number())
    .query(({ input }) => getClassById(input)),

  updateClass: publicProcedure
    .input(updateClassInputSchema)
    .mutation(({ input }) => updateClass(input)),

  deleteClass: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteClass(input)),

  // Student management routes
  createStudent: publicProcedure
    .input(createStudentInputSchema)
    .mutation(({ input }) => createStudent(input)),

  getStudents: publicProcedure
    .query(() => getStudents()),

  getStudentsByClass: publicProcedure
    .input(z.number())
    .query(({ input }) => getStudentsByClass(input)),

  getStudentById: publicProcedure
    .input(z.number())
    .query(({ input }) => getStudentById(input)),

  getStudentByUserId: publicProcedure
    .input(z.number())
    .query(({ input }) => getStudentByUserId(input)),

  updateStudent: publicProcedure
    .input(updateStudentInputSchema)
    .mutation(({ input }) => updateStudent(input)),

  updateStudentProfile: publicProcedure
    .input(z.object({
      studentId: z.number(),
      profileData: updateProfileInputSchema
    }))
    .mutation(({ input }) => updateStudentProfile(input.studentId, input.profileData)),

  deleteStudent: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteStudent(input)),

  // Teacher management routes
  createTeacher: publicProcedure
    .input(createTeacherInputSchema)
    .mutation(({ input }) => createTeacher(input)),

  getTeachers: publicProcedure
    .query(() => getTeachers()),

  getTeacherById: publicProcedure
    .input(z.number())
    .query(({ input }) => getTeacherById(input)),

  getTeacherByUserId: publicProcedure
    .input(z.number())
    .query(({ input }) => getTeacherByUserId(input)),

  updateTeacher: publicProcedure
    .input(updateTeacherInputSchema)
    .mutation(({ input }) => updateTeacher(input)),

  updateTeacherProfile: publicProcedure
    .input(z.object({
      teacherId: z.number(),
      profileData: updateProfileInputSchema
    }))
    .mutation(({ input }) => updateTeacherProfile(input.teacherId, input.profileData)),

  deleteTeacher: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteTeacher(input)),

  // Teacher-Class assignment routes
  assignTeacherToClass: publicProcedure
    .input(assignTeacherToClassInputSchema)
    .mutation(({ input }) => assignTeacherToClass(input)),

  getTeacherClasses: publicProcedure
    .input(z.number())
    .query(({ input }) => getTeacherClasses(input)),

  removeTeacherFromClass: publicProcedure
    .input(z.object({
      teacherId: z.number(),
      classId: z.number()
    }))
    .mutation(({ input }) => removeTeacherFromClass(input.teacherId, input.classId)),

  // Attendance routes
  createAttendance: publicProcedure
    .input(createAttendanceInputSchema)
    .mutation(({ input }) => createAttendance(input)),

  bulkCreateAttendance: publicProcedure
    .input(z.array(createAttendanceInputSchema))
    .mutation(({ input }) => bulkCreateAttendance(input)),

  studentCheckInOut: publicProcedure
    .input(z.object({
      studentId: z.number(),
      attendanceData: studentAttendanceInputSchema
    }))
    .mutation(({ input }) => studentCheckInOut(input.studentId, input.attendanceData)),

  getStudentAttendanceToday: publicProcedure
    .input(z.number())
    .query(({ input }) => getStudentAttendanceToday(input)),

  getStudentAttendanceHistory: publicProcedure
    .input(z.object({
      studentId: z.number(),
      startDate: z.string().transform((val) => new Date(val)).optional(),
      endDate: z.string().transform((val) => new Date(val)).optional()
    }))
    .query(({ input }) => getStudentAttendanceHistory(input.studentId, input.startDate, input.endDate)),

  updateAttendance: publicProcedure
    .input(updateAttendanceInputSchema)
    .mutation(({ input }) => updateAttendance(input)),

  getClassAttendance: publicProcedure
    .input(z.object({
      classId: z.number(),
      date: z.string().transform((val) => new Date(val))
    }))
    .query(({ input }) => getClassAttendance(input.classId, input.date)),

  getAttendanceReport: publicProcedure
    .input(attendanceReportQuerySchema)
    .query(({ input }) => getAttendanceReport(input)),

  getAttendanceStatistics: publicProcedure
    .input(z.object({
      classId: z.number().optional(),
      startDate: z.string().transform((val) => new Date(val)).optional(),
      endDate: z.string().transform((val) => new Date(val)).optional()
    }))
    .query(({ input }) => getAttendanceStatistics(input.classId, input.startDate, input.endDate)),

  // Dashboard routes
  getDashboardStats: publicProcedure
    .query(() => getDashboardStats()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`🚀 TRPC Server "Sekolah Absenku" listening at port: ${port}`);
  console.log(`📚 School attendance management system is ready!`);
}

start();