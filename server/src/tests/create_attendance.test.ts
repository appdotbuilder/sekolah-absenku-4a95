import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { attendancesTable, studentsTable, teachersTable, classesTable, usersTable } from '../db/schema';
import { type CreateAttendanceInput } from '../schema';
import { createAttendance } from '../handlers/create_attendance';
import { eq } from 'drizzle-orm';

describe('createAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let studentId: number;
  let teacherId: number;
  let classId: number;

  beforeEach(async () => {
    // Create prerequisite data for testing
    // Create a class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A class for testing'
      })
      .returning()
      .execute();
    classId = classResult[0].id;

    // Create user for student
    const studentUserResult = await db.insert(usersTable)
      .values({
        username: 'student1',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    // Create student
    const studentResult = await db.insert(studentsTable)
      .values({
        user_id: studentUserResult[0].id,
        class_id: classId,
        nis: 'NIS001',
        nisn: 'NISN001',
        full_name: 'Test Student'
      })
      .returning()
      .execute();
    studentId = studentResult[0].id;

    // Create user for teacher
    const teacherUserResult = await db.insert(usersTable)
      .values({
        username: 'teacher1',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    // Create teacher
    const teacherResult = await db.insert(teachersTable)
      .values({
        user_id: teacherUserResult[0].id,
        nip: 'NIP001',
        full_name: 'Test Teacher'
      })
      .returning()
      .execute();
    teacherId = teacherResult[0].id;
  });

  it('should create an attendance record with all fields', async () => {
    const testInput: CreateAttendanceInput = {
      student_id: studentId,
      class_id: classId,
      teacher_id: teacherId,
      date: new Date('2024-01-15'),
      status: 'hadir',
      check_in_time: new Date('2024-01-15T08:00:00Z'),
      check_out_time: new Date('2024-01-15T15:00:00Z'),
      notes: 'Present on time'
    };

    const result = await createAttendance(testInput);

    // Verify basic fields
    expect(result.student_id).toBe(studentId);
    expect(result.class_id).toBe(classId);
    expect(result.teacher_id).toBe(teacherId);
    expect(result.status).toBe('hadir');
    expect(result.notes).toBe('Present on time');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify date handling
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.getTime()).toBe(new Date('2024-01-15').getTime());

    // Verify timestamp fields
    expect(result.check_in_time).toBeInstanceOf(Date);
    expect(result.check_out_time).toBeInstanceOf(Date);
  });

  it('should create attendance record with minimal fields (nullables)', async () => {
    const testInput: CreateAttendanceInput = {
      student_id: studentId,
      class_id: classId,
      teacher_id: null,
      date: new Date('2024-01-16'),
      status: 'sakit',
      check_in_time: null,
      check_out_time: null,
      notes: null
    };

    const result = await createAttendance(testInput);

    expect(result.student_id).toBe(studentId);
    expect(result.class_id).toBe(classId);
    expect(result.teacher_id).toBeNull();
    expect(result.status).toBe('sakit');
    expect(result.check_in_time).toBeNull();
    expect(result.check_out_time).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.date).toBeInstanceOf(Date);
  });

  it('should save attendance record to database', async () => {
    const testInput: CreateAttendanceInput = {
      student_id: studentId,
      class_id: classId,
      teacher_id: teacherId,
      date: new Date('2024-01-17'),
      status: 'izin',
      check_in_time: new Date('2024-01-17T09:00:00Z'),
      check_out_time: null,
      notes: 'Permission granted'
    };

    const result = await createAttendance(testInput);

    // Verify record exists in database
    const attendances = await db.select()
      .from(attendancesTable)
      .where(eq(attendancesTable.id, result.id))
      .execute();

    expect(attendances).toHaveLength(1);
    const dbAttendance = attendances[0];
    expect(dbAttendance.student_id).toBe(studentId);
    expect(dbAttendance.class_id).toBe(classId);
    expect(dbAttendance.teacher_id).toBe(teacherId);
    expect(dbAttendance.status).toBe('izin');
    expect(dbAttendance.notes).toBe('Permission granted');
    expect(new Date(dbAttendance.date)).toEqual(new Date('2024-01-17'));
  });

  it('should handle different attendance statuses', async () => {
    const statuses = ['hadir', 'izin', 'sakit', 'alpha'] as const;

    for (const status of statuses) {
      const testInput: CreateAttendanceInput = {
        student_id: studentId,
        class_id: classId,
        teacher_id: teacherId,
        date: new Date(`2024-01-${18 + statuses.indexOf(status)}`),
        status: status,
        check_in_time: null,
        check_out_time: null,
        notes: `Status: ${status}`
      };

      const result = await createAttendance(testInput);
      expect(result.status).toBe(status);
      expect(result.notes).toBe(`Status: ${status}`);
    }
  });

  it('should throw error for invalid student_id', async () => {
    const testInput: CreateAttendanceInput = {
      student_id: 99999, // Non-existent student
      class_id: classId,
      teacher_id: teacherId,
      date: new Date('2024-01-20'),
      status: 'hadir',
      check_in_time: null,
      check_out_time: null,
      notes: null
    };

    await expect(createAttendance(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should throw error for invalid class_id', async () => {
    const testInput: CreateAttendanceInput = {
      student_id: studentId,
      class_id: 99999, // Non-existent class
      teacher_id: teacherId,
      date: new Date('2024-01-21'),
      status: 'hadir',
      check_in_time: null,
      check_out_time: null,
      notes: null
    };

    await expect(createAttendance(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should allow null teacher_id', async () => {
    const testInput: CreateAttendanceInput = {
      student_id: studentId,
      class_id: classId,
      teacher_id: null, // Self-recorded attendance
      date: new Date('2024-01-22'),
      status: 'hadir',
      check_in_time: new Date('2024-01-22T08:30:00Z'),
      check_out_time: null,
      notes: 'Self check-in'
    };

    const result = await createAttendance(testInput);
    expect(result.teacher_id).toBeNull();
    expect(result.notes).toBe('Self check-in');
  });

  it('should handle edge case dates correctly', async () => {
    // Test with different date formats and edge cases
    const testDates = [
      new Date('2024-02-29'), // Leap year
      new Date('2024-12-31'), // End of year
      new Date('2024-01-01')  // Start of year
    ];

    for (let i = 0; i < testDates.length; i++) {
      const testInput: CreateAttendanceInput = {
        student_id: studentId,
        class_id: classId,
        teacher_id: teacherId,
        date: testDates[i],
        status: 'hadir',
        check_in_time: null,
        check_out_time: null,
        notes: `Edge case date test ${i + 1}`
      };

      const result = await createAttendance(testInput);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date.toISOString().split('T')[0]).toBe(testDates[i].toISOString().split('T')[0]);
    }
  });
});