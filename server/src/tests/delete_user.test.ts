import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studentsTable, teachersTable, classesTable, teacherClassesTable, attendancesTable } from '../db/schema';
import { deleteUser } from '../handlers/delete_user';
import { eq } from 'drizzle-orm';

describe('deleteUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing user', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        password: 'password123',
        role: 'admin'
      })
      .returning()
      .execute();

    const result = await deleteUser(user.id);

    expect(result).toBe(true);

    // Verify user was deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    expect(users).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent user', async () => {
    const result = await deleteUser(999);

    expect(result).toBe(false);
  });

  it('should cascade delete student records when deleting user', async () => {
    // Create test class first
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class'
      })
      .returning()
      .execute();

    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'student_user',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    // Create student record
    const [student] = await db.insert(studentsTable)
      .values({
        user_id: user.id,
        class_id: testClass.id,
        nis: 'NIS123',
        nisn: 'NISN123',
        full_name: 'Test Student',
        email: 'student@test.com',
        phone: '1234567890',
        address: 'Test Address',
        photo_url: 'http://test.com/photo.jpg'
      })
      .returning()
      .execute();

    const result = await deleteUser(user.id);

    expect(result).toBe(true);

    // Verify user was deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    expect(users).toHaveLength(0);

    // Verify student was cascade deleted
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, student.id))
      .execute();

    expect(students).toHaveLength(0);
  });

  it('should cascade delete teacher records when deleting user', async () => {
    // Create test class first
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class'
      })
      .returning()
      .execute();

    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'teacher_user',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    // Create teacher record
    const [teacher] = await db.insert(teachersTable)
      .values({
        user_id: user.id,
        nip: 'NIP123',
        full_name: 'Test Teacher',
        email: 'teacher@test.com',
        phone: '1234567890',
        address: 'Test Address',
        photo_url: 'http://test.com/photo.jpg'
      })
      .returning()
      .execute();

    // Create teacher-class assignment
    await db.insert(teacherClassesTable)
      .values({
        teacher_id: teacher.id,
        class_id: testClass.id
      })
      .execute();

    const result = await deleteUser(user.id);

    expect(result).toBe(true);

    // Verify user was deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    expect(users).toHaveLength(0);

    // Verify teacher was cascade deleted
    const teachers = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, teacher.id))
      .execute();

    expect(teachers).toHaveLength(0);

    // Verify teacher-class assignments were cascade deleted
    const teacherClasses = await db.select()
      .from(teacherClassesTable)
      .where(eq(teacherClassesTable.teacher_id, teacher.id))
      .execute();

    expect(teacherClasses).toHaveLength(0);
  });

  it('should cascade delete attendance records when deleting student user', async () => {
    // Create test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class'
      })
      .returning()
      .execute();

    // Create student user
    const [studentUser] = await db.insert(usersTable)
      .values({
        username: 'student_user',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    // Create teacher user
    const [teacherUser] = await db.insert(usersTable)
      .values({
        username: 'teacher_user',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    // Create student record
    const [student] = await db.insert(studentsTable)
      .values({
        user_id: studentUser.id,
        class_id: testClass.id,
        nis: 'NIS123',
        nisn: 'NISN123',
        full_name: 'Test Student',
        email: 'student@test.com',
        phone: '1234567890',
        address: 'Test Address',
        photo_url: null
      })
      .returning()
      .execute();

    // Create teacher record
    const [teacher] = await db.insert(teachersTable)
      .values({
        user_id: teacherUser.id,
        nip: 'NIP123',
        full_name: 'Test Teacher',
        email: 'teacher@test.com',
        phone: '1234567890',
        address: 'Test Address',
        photo_url: null
      })
      .returning()
      .execute();

    // Create attendance record
    const [attendance] = await db.insert(attendancesTable)
      .values({
        student_id: student.id,
        class_id: testClass.id,
        teacher_id: teacher.id,
        date: '2024-01-15',
        status: 'hadir',
        check_in_time: new Date('2024-01-15T08:00:00Z'),
        check_out_time: new Date('2024-01-15T14:00:00Z'),
        notes: 'Present on time'
      })
      .returning()
      .execute();

    const result = await deleteUser(studentUser.id);

    expect(result).toBe(true);

    // Verify attendance records were cascade deleted
    const attendances = await db.select()
      .from(attendancesTable)
      .where(eq(attendancesTable.id, attendance.id))
      .execute();

    expect(attendances).toHaveLength(0);
  });

  it('should handle teacher deletion with null reference in attendance', async () => {
    // Create test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class'
      })
      .returning()
      .execute();

    // Create student user
    const [studentUser] = await db.insert(usersTable)
      .values({
        username: 'student_user',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    // Create teacher user
    const [teacherUser] = await db.insert(usersTable)
      .values({
        username: 'teacher_user',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    // Create student record
    const [student] = await db.insert(studentsTable)
      .values({
        user_id: studentUser.id,
        class_id: testClass.id,
        nis: 'NIS123',
        nisn: null,
        full_name: 'Test Student',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Create teacher record
    const [teacher] = await db.insert(teachersTable)
      .values({
        user_id: teacherUser.id,
        nip: 'NIP123',
        full_name: 'Test Teacher',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Create attendance record with teacher reference
    const [attendance] = await db.insert(attendancesTable)
      .values({
        student_id: student.id,
        class_id: testClass.id,
        teacher_id: teacher.id,
        date: '2024-01-15',
        status: 'hadir',
        check_in_time: null,
        check_out_time: null,
        notes: null
      })
      .returning()
      .execute();

    // Delete teacher user - should set teacher_id to null in attendance (ON DELETE SET NULL)
    const result = await deleteUser(teacherUser.id);

    expect(result).toBe(true);

    // Verify teacher user was deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, teacherUser.id))
      .execute();

    expect(users).toHaveLength(0);

    // Verify teacher record was cascade deleted
    const teachers = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, teacher.id))
      .execute();

    expect(teachers).toHaveLength(0);

    // Verify attendance record still exists but teacher_id is set to null
    const attendances = await db.select()
      .from(attendancesTable)
      .where(eq(attendancesTable.id, attendance.id))
      .execute();

    expect(attendances).toHaveLength(1);
    expect(attendances[0].teacher_id).toBeNull();
  });

  it('should handle multiple related records correctly', async () => {
    // Create test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class'
      })
      .returning()
      .execute();

    // Create teacher user
    const [teacherUser] = await db.insert(usersTable)
      .values({
        username: 'teacher_user',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    // Create teacher record
    const [teacher] = await db.insert(teachersTable)
      .values({
        user_id: teacherUser.id,
        nip: 'NIP123',
        full_name: 'Test Teacher',
        email: 'teacher@test.com',
        phone: '1234567890',
        address: 'Test Address',
        photo_url: null
      })
      .returning()
      .execute();

    // Create multiple teacher-class assignments
    await db.insert(teacherClassesTable)
      .values([
        {
          teacher_id: teacher.id,
          class_id: testClass.id
        }
      ])
      .execute();

    const result = await deleteUser(teacherUser.id);

    expect(result).toBe(true);

    // Verify all related records were properly handled
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, teacherUser.id))
      .execute();

    expect(users).toHaveLength(0);

    const teachers = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, teacher.id))
      .execute();

    expect(teachers).toHaveLength(0);

    const teacherClasses = await db.select()
      .from(teacherClassesTable)
      .where(eq(teacherClassesTable.teacher_id, teacher.id))
      .execute();

    expect(teacherClasses).toHaveLength(0);
  });
});