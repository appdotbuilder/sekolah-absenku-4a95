import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, teachersTable, classesTable, teacherClassesTable, studentsTable, attendancesTable } from '../db/schema';
import { deleteTeacher } from '../handlers/delete_teacher';
import { eq, isNull } from 'drizzle-orm';

describe('deleteTeacher', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing teacher', async () => {
    // Create a user first
    const user = await db.insert(usersTable)
      .values({
        username: 'teacher1',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    // Create a teacher
    const teacher = await db.insert(teachersTable)
      .values({
        user_id: user[0].id,
        nip: 'T001',
        full_name: 'Test Teacher',
        email: 'teacher@test.com',
        phone: '123456789',
        address: 'Test Address',
        photo_url: null
      })
      .returning()
      .execute();

    const result = await deleteTeacher(teacher[0].id);

    expect(result).toBe(true);

    // Verify teacher is deleted from database
    const deletedTeacher = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, teacher[0].id))
      .execute();

    expect(deletedTeacher).toHaveLength(0);
  });

  it('should return false when teacher does not exist', async () => {
    const result = await deleteTeacher(999);
    expect(result).toBe(false);
  });

  it('should remove teacher from class assignments when deleted', async () => {
    // Create a user
    const user = await db.insert(usersTable)
      .values({
        username: 'teacher2',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    // Create a teacher
    const teacher = await db.insert(teachersTable)
      .values({
        user_id: user[0].id,
        nip: 'T002',
        full_name: 'Test Teacher 2',
        email: 'teacher2@test.com',
        phone: '123456789'
      })
      .returning()
      .execute();

    // Create a class
    const testClass = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class'
      })
      .returning()
      .execute();

    // Assign teacher to class
    await db.insert(teacherClassesTable)
      .values({
        teacher_id: teacher[0].id,
        class_id: testClass[0].id
      })
      .execute();

    // Verify teacher-class assignment exists
    const assignmentBefore = await db.select()
      .from(teacherClassesTable)
      .where(eq(teacherClassesTable.teacher_id, teacher[0].id))
      .execute();

    expect(assignmentBefore).toHaveLength(1);

    // Delete teacher
    const result = await deleteTeacher(teacher[0].id);
    expect(result).toBe(true);

    // Verify teacher-class assignment is removed (cascade delete)
    const assignmentAfter = await db.select()
      .from(teacherClassesTable)
      .where(eq(teacherClassesTable.teacher_id, teacher[0].id))
      .execute();

    expect(assignmentAfter).toHaveLength(0);
  });

  it('should set teacher_id to null in attendance records when teacher is deleted', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        username: 'teacher3',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const studentUser = await db.insert(usersTable)
      .values({
        username: 'student1',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const testClass = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class'
      })
      .returning()
      .execute();

    const teacher = await db.insert(teachersTable)
      .values({
        user_id: user[0].id,
        nip: 'T003',
        full_name: 'Test Teacher 3',
        email: 'teacher3@test.com'
      })
      .returning()
      .execute();

    const student = await db.insert(studentsTable)
      .values({
        user_id: studentUser[0].id,
        class_id: testClass[0].id,
        nis: 'S001',
        full_name: 'Test Student'
      })
      .returning()
      .execute();

    // Create attendance record with teacher
    const attendance = await db.insert(attendancesTable)
      .values({
        student_id: student[0].id,
        class_id: testClass[0].id,
        teacher_id: teacher[0].id,
        date: '2024-01-15',
        status: 'hadir'
      })
      .returning()
      .execute();

    // Verify attendance record has teacher_id
    expect(attendance[0].teacher_id).toBe(teacher[0].id);

    // Delete teacher
    const result = await deleteTeacher(teacher[0].id);
    expect(result).toBe(true);

    // Verify attendance record still exists but teacher_id is null
    const attendanceAfter = await db.select()
      .from(attendancesTable)
      .where(eq(attendancesTable.id, attendance[0].id))
      .execute();

    expect(attendanceAfter).toHaveLength(1);
    expect(attendanceAfter[0].teacher_id).toBeNull();
  });

  it('should handle multiple class assignments and attendance records', async () => {
    // Create user and teacher
    const user = await db.insert(usersTable)
      .values({
        username: 'teacher4',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const teacher = await db.insert(teachersTable)
      .values({
        user_id: user[0].id,
        nip: 'T004',
        full_name: 'Test Teacher 4'
      })
      .returning()
      .execute();

    // Create multiple classes
    const classes = await db.insert(classesTable)
      .values([
        { name: 'Class 1', description: 'First class' },
        { name: 'Class 2', description: 'Second class' }
      ])
      .returning()
      .execute();

    // Assign teacher to multiple classes
    await db.insert(teacherClassesTable)
      .values([
        { teacher_id: teacher[0].id, class_id: classes[0].id },
        { teacher_id: teacher[0].id, class_id: classes[1].id }
      ])
      .execute();

    // Create student and multiple attendance records
    const studentUser = await db.insert(usersTable)
      .values({
        username: 'student2',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const student = await db.insert(studentsTable)
      .values({
        user_id: studentUser[0].id,
        class_id: classes[0].id,
        nis: 'S002',
        full_name: 'Test Student 2'
      })
      .returning()
      .execute();

    await db.insert(attendancesTable)
      .values([
        {
          student_id: student[0].id,
          class_id: classes[0].id,
          teacher_id: teacher[0].id,
          date: '2024-01-15',
          status: 'hadir'
        },
        {
          student_id: student[0].id,
          class_id: classes[1].id,
          teacher_id: teacher[0].id,
          date: '2024-01-16',
          status: 'izin'
        }
      ])
      .execute();

    // Delete teacher
    const result = await deleteTeacher(teacher[0].id);
    expect(result).toBe(true);

    // Verify all class assignments are removed
    const assignments = await db.select()
      .from(teacherClassesTable)
      .where(eq(teacherClassesTable.teacher_id, teacher[0].id))
      .execute();

    expect(assignments).toHaveLength(0);

    // Verify all attendance records have teacher_id set to null
    const attendances = await db.select()
      .from(attendancesTable)
      .where(isNull(attendancesTable.teacher_id))
      .execute();

    expect(attendances.length).toBeGreaterThanOrEqual(2);
    attendances.forEach(attendance => {
      expect(attendance.teacher_id).toBeNull();
    });
  });

  it('should handle deletion of teacher with no class assignments or attendance records', async () => {
    // Create user and teacher with minimal data
    const user = await db.insert(usersTable)
      .values({
        username: 'teacher5',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const teacher = await db.insert(teachersTable)
      .values({
        user_id: user[0].id,
        nip: 'T005',
        full_name: 'Test Teacher 5'
      })
      .returning()
      .execute();

    // Delete teacher immediately without any associations
    const result = await deleteTeacher(teacher[0].id);
    expect(result).toBe(true);

    // Verify teacher is deleted
    const deletedTeacher = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, teacher[0].id))
      .execute();

    expect(deletedTeacher).toHaveLength(0);
  });
});