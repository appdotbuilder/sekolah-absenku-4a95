import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, attendancesTable } from '../db/schema';
import { getStudentAttendanceToday } from '../handlers/get_student_attendance_today';

describe('getStudentAttendanceToday', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when no attendance record exists for today', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'student1',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Class 10A',
        description: 'Test class'
      })
      .returning()
      .execute();

    const studentResult = await db.insert(studentsTable)
      .values({
        user_id: userResult[0].id,
        class_id: classResult[0].id,
        nis: '12345',
        nisn: '54321',
        full_name: 'Test Student'
      })
      .returning()
      .execute();

    const result = await getStudentAttendanceToday(studentResult[0].id);

    expect(result).toBeNull();
  });

  it('should return attendance record when it exists for today', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'student1',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Class 10A',
        description: 'Test class'
      })
      .returning()
      .execute();

    const studentResult = await db.insert(studentsTable)
      .values({
        user_id: userResult[0].id,
        class_id: classResult[0].id,
        nis: '12345',
        nisn: '54321',
        full_name: 'Test Student'
      })
      .returning()
      .execute();

    // Create today's attendance record
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const checkInTime = new Date();
    
    await db.insert(attendancesTable)
      .values({
        student_id: studentResult[0].id,
        class_id: classResult[0].id,
        teacher_id: null,
        date: today,
        status: 'hadir',
        check_in_time: checkInTime,
        check_out_time: null,
        notes: 'Self check-in'
      })
      .execute();

    const result = await getStudentAttendanceToday(studentResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.student_id).toEqual(studentResult[0].id);
    expect(result!.class_id).toEqual(classResult[0].id);
    expect(result!.status).toEqual('hadir');
    expect(result!.notes).toEqual('Self check-in');
    expect(result!.id).toBeDefined();
    
    // Verify date fields are properly converted to Date objects
    expect(result!.date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.check_in_time).toBeInstanceOf(Date);
    expect(result!.check_out_time).toBeNull();
    
    // Verify the date is today
    const resultDateString = result!.date.toISOString().split('T')[0];
    expect(resultDateString).toEqual(today);
  });

  it('should return attendance record with different status types', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'student1',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Class 10A',
        description: 'Test class'
      })
      .returning()
      .execute();

    const studentResult = await db.insert(studentsTable)
      .values({
        user_id: userResult[0].id,
        class_id: classResult[0].id,
        nis: '12345',
        nisn: '54321',
        full_name: 'Test Student'
      })
      .returning()
      .execute();

    // Test with 'izin' status
    const today = new Date().toISOString().split('T')[0];
    
    await db.insert(attendancesTable)
      .values({
        student_id: studentResult[0].id,
        class_id: classResult[0].id,
        teacher_id: null,
        date: today,
        status: 'izin',
        check_in_time: null,
        check_out_time: null,
        notes: 'Permission request'
      })
      .execute();

    const result = await getStudentAttendanceToday(studentResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('izin');
    expect(result!.notes).toEqual('Permission request');
    expect(result!.check_in_time).toBeNull();
    expect(result!.check_out_time).toBeNull();
  });

  it('should not return attendance record from previous days', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'student1',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Class 10A',
        description: 'Test class'
      })
      .returning()
      .execute();

    const studentResult = await db.insert(studentsTable)
      .values({
        user_id: userResult[0].id,
        class_id: classResult[0].id,
        nis: '12345',
        nisn: '54321',
        full_name: 'Test Student'
      })
      .returning()
      .execute();

    // Create attendance record for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    await db.insert(attendancesTable)
      .values({
        student_id: studentResult[0].id,
        class_id: classResult[0].id,
        teacher_id: null,
        date: yesterdayString,
        status: 'hadir',
        check_in_time: yesterday,
        check_out_time: null,
        notes: 'Yesterday attendance'
      })
      .execute();

    const result = await getStudentAttendanceToday(studentResult[0].id);

    // Should return null because the record is from yesterday, not today
    expect(result).toBeNull();
  });

  it('should return attendance record with both check-in and check-out times', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'student1',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Class 10A',
        description: 'Test class'
      })
      .returning()
      .execute();

    const studentResult = await db.insert(studentsTable)
      .values({
        user_id: userResult[0].id,
        class_id: classResult[0].id,
        nis: '12345',
        nisn: '54321',
        full_name: 'Test Student'
      })
      .returning()
      .execute();

    // Create attendance record with both check-in and check-out times
    const today = new Date().toISOString().split('T')[0];
    const checkInTime = new Date();
    checkInTime.setHours(8, 0, 0, 0); // 8:00 AM
    const checkOutTime = new Date();
    checkOutTime.setHours(15, 0, 0, 0); // 3:00 PM
    
    await db.insert(attendancesTable)
      .values({
        student_id: studentResult[0].id,
        class_id: classResult[0].id,
        teacher_id: null,
        date: today,
        status: 'hadir',
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        notes: 'Full day attendance'
      })
      .execute();

    const result = await getStudentAttendanceToday(studentResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('hadir');
    expect(result!.check_in_time).toBeInstanceOf(Date);
    expect(result!.check_out_time).toBeInstanceOf(Date);
    expect(result!.notes).toEqual('Full day attendance');

    // Verify times are properly converted
    expect(result!.check_in_time!.getHours()).toEqual(8);
    expect(result!.check_out_time!.getHours()).toEqual(15);
  });

  it('should handle non-existent student gracefully', async () => {
    const nonExistentStudentId = 999999;
    
    const result = await getStudentAttendanceToday(nonExistentStudentId);
    
    expect(result).toBeNull();
  });
});