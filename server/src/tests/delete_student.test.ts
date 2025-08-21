import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, attendancesTable } from '../db/schema';
import { deleteStudent } from '../handlers/delete_student';
import { eq } from 'drizzle-orm';

describe('deleteStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing student', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable).values({
      username: 'student01',
      password: 'password123',
      role: 'siswa'
    }).returning().execute();

    const classRecord = await db.insert(classesTable).values({
      name: 'Test Class',
      description: 'A test class'
    }).returning().execute();

    const student = await db.insert(studentsTable).values({
      user_id: user[0].id,
      class_id: classRecord[0].id,
      nis: 'TEST001',
      nisn: 'TESTNIS001',
      full_name: 'Test Student',
      email: 'test@example.com',
      phone: '081234567890',
      address: 'Test Address',
      photo_url: null
    }).returning().execute();

    // Execute delete
    const result = await deleteStudent(student[0].id);

    // Verify result
    expect(result).toBe(true);

    // Verify student is deleted from database
    const deletedStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, student[0].id))
      .execute();

    expect(deletedStudent).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent student', async () => {
    const nonExistentId = 99999;

    const result = await deleteStudent(nonExistentId);

    expect(result).toBe(false);
  });

  it('should handle cascade deletion of related attendance records', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable).values({
      username: 'student02',
      password: 'password123',
      role: 'siswa'
    }).returning().execute();

    const classRecord = await db.insert(classesTable).values({
      name: 'Test Class 2',
      description: 'Another test class'
    }).returning().execute();

    const student = await db.insert(studentsTable).values({
      user_id: user[0].id,
      class_id: classRecord[0].id,
      nis: 'TEST002',
      nisn: 'TESTNIS002',
      full_name: 'Test Student 2',
      email: 'test2@example.com',
      phone: null,
      address: null,
      photo_url: null
    }).returning().execute();

    // Create attendance record for this student
    await db.insert(attendancesTable).values({
      student_id: student[0].id,
      class_id: classRecord[0].id,
      teacher_id: null,
      date: '2024-01-15',
      status: 'hadir',
      check_in_time: new Date('2024-01-15T08:00:00Z'),
      check_out_time: null,
      notes: 'Test attendance'
    }).execute();

    // Verify attendance record exists before deletion
    const attendancesBefore = await db.select()
      .from(attendancesTable)
      .where(eq(attendancesTable.student_id, student[0].id))
      .execute();

    expect(attendancesBefore).toHaveLength(1);

    // Delete the student
    const result = await deleteStudent(student[0].id);

    expect(result).toBe(true);

    // Verify student is deleted
    const deletedStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, student[0].id))
      .execute();

    expect(deletedStudent).toHaveLength(0);

    // Verify related attendance records are also deleted (cascade)
    const attendancesAfter = await db.select()
      .from(attendancesTable)
      .where(eq(attendancesTable.student_id, student[0].id))
      .execute();

    expect(attendancesAfter).toHaveLength(0);
  });

  it('should delete student with minimal required fields only', async () => {
    // Create prerequisite data with minimal fields
    const user = await db.insert(usersTable).values({
      username: 'student03',
      password: 'password123',
      role: 'siswa'
    }).returning().execute();

    const classRecord = await db.insert(classesTable).values({
      name: 'Minimal Class',
      description: null
    }).returning().execute();

    const student = await db.insert(studentsTable).values({
      user_id: user[0].id,
      class_id: classRecord[0].id,
      nis: 'MINIMAL001',
      nisn: null,
      full_name: 'Minimal Student',
      email: null,
      phone: null,
      address: null,
      photo_url: null
    }).returning().execute();

    // Execute delete
    const result = await deleteStudent(student[0].id);

    expect(result).toBe(true);

    // Verify student is deleted
    const deletedStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, student[0].id))
      .execute();

    expect(deletedStudent).toHaveLength(0);
  });

  it('should handle multiple attendance records for same student', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable).values({
      username: 'student04',
      password: 'password123',
      role: 'siswa'
    }).returning().execute();

    const classRecord = await db.insert(classesTable).values({
      name: 'Multi Attendance Class',
      description: 'Class with multiple attendance records'
    }).returning().execute();

    const student = await db.insert(studentsTable).values({
      user_id: user[0].id,
      class_id: classRecord[0].id,
      nis: 'MULTI001',
      nisn: null,
      full_name: 'Multi Attendance Student',
      email: null,
      phone: null,
      address: null,
      photo_url: null
    }).returning().execute();

    // Create multiple attendance records
    await db.insert(attendancesTable).values([
      {
        student_id: student[0].id,
        class_id: classRecord[0].id,
        teacher_id: null,
        date: '2024-01-15',
        status: 'hadir',
        check_in_time: new Date('2024-01-15T08:00:00Z'),
        check_out_time: new Date('2024-01-15T15:00:00Z'),
        notes: 'Day 1 attendance'
      },
      {
        student_id: student[0].id,
        class_id: classRecord[0].id,
        teacher_id: null,
        date: '2024-01-16',
        status: 'izin',
        check_in_time: null,
        check_out_time: null,
        notes: 'Day 2 permission'
      },
      {
        student_id: student[0].id,
        class_id: classRecord[0].id,
        teacher_id: null,
        date: '2024-01-17',
        status: 'sakit',
        check_in_time: null,
        check_out_time: null,
        notes: 'Day 3 sick'
      }
    ]).execute();

    // Verify all attendance records exist before deletion
    const attendancesBefore = await db.select()
      .from(attendancesTable)
      .where(eq(attendancesTable.student_id, student[0].id))
      .execute();

    expect(attendancesBefore).toHaveLength(3);

    // Delete the student
    const result = await deleteStudent(student[0].id);

    expect(result).toBe(true);

    // Verify all related attendance records are deleted
    const attendancesAfter = await db.select()
      .from(attendancesTable)
      .where(eq(attendancesTable.student_id, student[0].id))
      .execute();

    expect(attendancesAfter).toHaveLength(0);
  });
});