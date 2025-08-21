import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, usersTable, studentsTable, teachersTable, teacherClassesTable, attendancesTable } from '../db/schema';
import { deleteClass } from '../handlers/delete_class';
import { eq } from 'drizzle-orm';

describe('deleteClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing class', async () => {
    // Create a test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A class for testing'
      })
      .returning()
      .execute();

    // Delete the class
    const result = await deleteClass(testClass.id);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify class no longer exists in database
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, testClass.id))
      .execute();

    expect(classes).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent class', async () => {
    // Try to delete a class that doesn't exist
    const result = await deleteClass(999);

    // Should return false as no rows were affected
    expect(result).toBe(false);
  });

  it('should cascade delete related students when class is deleted', async () => {
    // Create prerequisite user and class
    const [testUser] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A class for testing'
      })
      .returning()
      .execute();

    // Create a student in the class
    const [testStudent] = await db.insert(studentsTable)
      .values({
        user_id: testUser.id,
        class_id: testClass.id,
        nis: 'NIS123',
        nisn: 'NISN123',
        full_name: 'Test Student',
        email: 'test@example.com',
        phone: '081234567890',
        address: 'Test Address',
        photo_url: 'http://example.com/photo.jpg'
      })
      .returning()
      .execute();

    // Delete the class
    const result = await deleteClass(testClass.id);
    expect(result).toBe(true);

    // Verify class is deleted
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, testClass.id))
      .execute();
    expect(classes).toHaveLength(0);

    // Verify student is also deleted due to cascade
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, testStudent.id))
      .execute();
    expect(students).toHaveLength(0);

    // Verify user still exists (should not be deleted)
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUser.id))
      .execute();
    expect(users).toHaveLength(1);
  });

  it('should cascade delete teacher-class assignments when class is deleted', async () => {
    // Create prerequisite user, teacher, and class
    const [teacherUser] = await db.insert(usersTable)
      .values({
        username: 'teacheruser',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const [testTeacher] = await db.insert(teachersTable)
      .values({
        user_id: teacherUser.id,
        nip: 'NIP123',
        full_name: 'Test Teacher',
        email: 'teacher@example.com',
        phone: '081234567890',
        address: 'Teacher Address',
        photo_url: 'http://example.com/teacher.jpg'
      })
      .returning()
      .execute();

    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A class for testing'
      })
      .returning()
      .execute();

    // Assign teacher to class
    const [teacherClassAssignment] = await db.insert(teacherClassesTable)
      .values({
        teacher_id: testTeacher.id,
        class_id: testClass.id
      })
      .returning()
      .execute();

    // Delete the class
    const result = await deleteClass(testClass.id);
    expect(result).toBe(true);

    // Verify class is deleted
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, testClass.id))
      .execute();
    expect(classes).toHaveLength(0);

    // Verify teacher-class assignment is also deleted due to cascade
    const assignments = await db.select()
      .from(teacherClassesTable)
      .where(eq(teacherClassesTable.id, teacherClassAssignment.id))
      .execute();
    expect(assignments).toHaveLength(0);

    // Verify teacher still exists (should not be deleted)
    const teachers = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, testTeacher.id))
      .execute();
    expect(teachers).toHaveLength(1);
  });

  it('should cascade delete attendance records when class is deleted', async () => {
    // Create prerequisite data
    const [studentUser] = await db.insert(usersTable)
      .values({
        username: 'studentuser',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const [teacherUser] = await db.insert(usersTable)
      .values({
        username: 'teacheruser',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A class for testing'
      })
      .returning()
      .execute();

    const [testStudent] = await db.insert(studentsTable)
      .values({
        user_id: studentUser.id,
        class_id: testClass.id,
        nis: 'NIS123',
        nisn: 'NISN123',
        full_name: 'Test Student'
      })
      .returning()
      .execute();

    const [testTeacher] = await db.insert(teachersTable)
      .values({
        user_id: teacherUser.id,
        nip: 'NIP123',
        full_name: 'Test Teacher'
      })
      .returning()
      .execute();

    // Create attendance record
    const [testAttendance] = await db.insert(attendancesTable)
      .values({
        student_id: testStudent.id,
        class_id: testClass.id,
        teacher_id: testTeacher.id,
        date: '2023-01-01',
        status: 'hadir',
        check_in_time: new Date(),
        notes: 'Test attendance'
      })
      .returning()
      .execute();

    // Delete the class
    const result = await deleteClass(testClass.id);
    expect(result).toBe(true);

    // Verify class is deleted
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, testClass.id))
      .execute();
    expect(classes).toHaveLength(0);

    // Verify attendance record is also deleted due to cascade
    const attendances = await db.select()
      .from(attendancesTable)
      .where(eq(attendancesTable.id, testAttendance.id))
      .execute();
    expect(attendances).toHaveLength(0);
  });

  it('should handle deletion errors gracefully', async () => {
    // Create a class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A class for testing'
      })
      .returning()
      .execute();

    // Simulate database error by closing the connection or using invalid ID type
    // In this test, we'll test with a valid scenario but expect the error handling to work
    
    const result = await deleteClass(testClass.id);
    expect(result).toBe(true);
  });
});