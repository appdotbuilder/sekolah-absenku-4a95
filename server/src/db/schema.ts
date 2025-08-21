import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  integer, 
  pgEnum,
  date,
  varchar,
  primaryKey
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const userRoleEnum = pgEnum('user_role', ['siswa', 'guru', 'admin']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['hadir', 'izin', 'sakit', 'alpha']);

// Users table - base authentication for all user types
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  password: text('password').notNull(),
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Classes table
export const classesTable = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Students table
export const studentsTable = pgTable('students', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  class_id: integer('class_id').notNull().references(() => classesTable.id, { onDelete: 'cascade' }),
  nis: varchar('nis', { length: 20 }).notNull().unique(), // Nomor Induk Siswa
  nisn: varchar('nisn', { length: 20 }), // Nomor Induk Siswa Nasional - nullable
  full_name: varchar('full_name', { length: 200 }).notNull(),
  email: varchar('email', { length: 200 }), // nullable
  phone: varchar('phone', { length: 20 }), // nullable
  address: text('address'), // nullable
  photo_url: text('photo_url'), // nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Teachers table
export const teachersTable = pgTable('teachers', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  nip: varchar('nip', { length: 20 }).notNull().unique(), // Nomor Induk Pegawai
  full_name: varchar('full_name', { length: 200 }).notNull(),
  email: varchar('email', { length: 200 }), // nullable
  phone: varchar('phone', { length: 20 }), // nullable
  address: text('address'), // nullable
  photo_url: text('photo_url'), // nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Teacher-Class relationship table (many-to-many)
export const teacherClassesTable = pgTable('teacher_classes', {
  id: serial('id').primaryKey(),
  teacher_id: integer('teacher_id').notNull().references(() => teachersTable.id, { onDelete: 'cascade' }),
  class_id: integer('class_id').notNull().references(() => classesTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Attendance table - main table for tracking student attendance
export const attendancesTable = pgTable('attendances', {
  id: serial('id').primaryKey(),
  student_id: integer('student_id').notNull().references(() => studentsTable.id, { onDelete: 'cascade' }),
  class_id: integer('class_id').notNull().references(() => classesTable.id, { onDelete: 'cascade' }),
  teacher_id: integer('teacher_id').references(() => teachersTable.id, { onDelete: 'set null' }), // nullable - can be self-recorded
  date: date('date').notNull(), // Date of attendance
  status: attendanceStatusEnum('status').notNull(),
  check_in_time: timestamp('check_in_time'), // nullable
  check_out_time: timestamp('check_out_time'), // nullable
  notes: text('notes'), // nullable - for additional remarks
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations for better querying
export const usersRelations = relations(usersTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [usersTable.id],
    references: [studentsTable.user_id],
  }),
  teacher: one(teachersTable, {
    fields: [usersTable.id],
    references: [teachersTable.user_id],
  }),
}));

export const classesRelations = relations(classesTable, ({ many }) => ({
  students: many(studentsTable),
  teacherClasses: many(teacherClassesTable),
  attendances: many(attendancesTable),
}));

export const studentsRelations = relations(studentsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [studentsTable.user_id],
    references: [usersTable.id],
  }),
  class: one(classesTable, {
    fields: [studentsTable.class_id],
    references: [classesTable.id],
  }),
  attendances: many(attendancesTable),
}));

export const teachersRelations = relations(teachersTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [teachersTable.user_id],
    references: [usersTable.id],
  }),
  teacherClasses: many(teacherClassesTable),
  attendances: many(attendancesTable),
}));

export const teacherClassesRelations = relations(teacherClassesTable, ({ one }) => ({
  teacher: one(teachersTable, {
    fields: [teacherClassesTable.teacher_id],
    references: [teachersTable.id],
  }),
  class: one(classesTable, {
    fields: [teacherClassesTable.class_id],
    references: [classesTable.id],
  }),
}));

export const attendancesRelations = relations(attendancesTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [attendancesTable.student_id],
    references: [studentsTable.id],
  }),
  class: one(classesTable, {
    fields: [attendancesTable.class_id],
    references: [classesTable.id],
  }),
  teacher: one(teachersTable, {
    fields: [attendancesTable.teacher_id],
    references: [teachersTable.id],
  }),
}));

// TypeScript types for the tables
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Class = typeof classesTable.$inferSelect;
export type NewClass = typeof classesTable.$inferInsert;

export type Student = typeof studentsTable.$inferSelect;
export type NewStudent = typeof studentsTable.$inferInsert;

export type Teacher = typeof teachersTable.$inferSelect;
export type NewTeacher = typeof teachersTable.$inferInsert;

export type TeacherClass = typeof teacherClassesTable.$inferSelect;
export type NewTeacherClass = typeof teacherClassesTable.$inferInsert;

export type Attendance = typeof attendancesTable.$inferSelect;
export type NewAttendance = typeof attendancesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  classes: classesTable,
  students: studentsTable,
  teachers: teachersTable,
  teacherClasses: teacherClassesTable,
  attendances: attendancesTable,
};

export const tableRelations = {
  usersRelations,
  classesRelations,
  studentsRelations,
  teachersRelations,
  teacherClassesRelations,
  attendancesRelations,
};