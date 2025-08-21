import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, attendancesTable } from '../db/schema';
import { type StudentAttendanceInput } from '../schema';
import { studentCheckInOut } from '../handlers/student_check_in_out';
import { eq, and } from 'drizzle-orm';

describe('studentCheckInOut', () => {
  let testUserId: number;
  let testClassId: number;
  let testStudentId: number;

  beforeEach(async () => {
    await createDB();

    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'teststudent',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create a test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'Test class for attendance'
      })
      .returning()
      .execute();
    testClassId = classResult[0].id;

    // Create a test student
    const studentResult = await db.insert(studentsTable)
      .values({
        user_id: testUserId,
        class_id: testClassId,
        nis: '123456',
        nisn: '1234567890',
        full_name: 'Test Student',
        email: 'test@example.com',
        phone: '081234567890',
        address: 'Test Address',
        photo_url: null
      })
      .returning()
      .execute();
    testStudentId = studentResult[0].id;
  });

  afterEach(resetDB);

  describe('check_in', () => {
    const checkInInput: StudentAttendanceInput = {
      type: 'check_in'
    };

    it('should create attendance record on first check-in', async () => {
      const result = await studentCheckInOut(testStudentId, checkInInput);

      expect(result).not.toBeNull();
      expect(result!.student_id).toBe(testStudentId);
      expect(result!.class_id).toBe(testClassId);
      expect(result!.teacher_id).toBeNull();
      expect(result!.status).toBe('hadir');
      expect(result!.check_in_time).toBeInstanceOf(Date);
      expect(result!.check_out_time).toBeNull();
      expect(result!.date).toBeInstanceOf(Date);
      expect(result!.id).toBeDefined();
    });

    it('should save attendance to database with correct date', async () => {
      const today = new Date();
      const expectedDateString = today.toISOString().split('T')[0];
      
      const result = await studentCheckInOut(testStudentId, checkInInput);

      const savedAttendance = await db.select()
        .from(attendancesTable)
        .where(eq(attendancesTable.id, result!.id))
        .execute();

      expect(savedAttendance).toHaveLength(1);
      expect(savedAttendance[0].student_id).toBe(testStudentId);
      expect(savedAttendance[0].class_id).toBe(testClassId);
      expect(savedAttendance[0].status).toBe('hadir');
      expect(savedAttendance[0].date).toBe(expectedDateString);
      expect(savedAttendance[0].check_in_time).toBeInstanceOf(Date);
    });

    it('should return null if student does not exist', async () => {
      const nonExistentStudentId = 99999;
      const result = await studentCheckInOut(nonExistentStudentId, checkInInput);

      expect(result).toBeNull();
    });

    it('should return null if already checked in today', async () => {
      // First check-in
      const firstResult = await studentCheckInOut(testStudentId, checkInInput);
      expect(firstResult).not.toBeNull();

      // Second check-in attempt
      const secondResult = await studentCheckInOut(testStudentId, checkInInput);
      expect(secondResult).toBeNull();
    });

    it('should allow check-in on different dates', async () => {
      // Create attendance for yesterday manually
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDateString = yesterday.toISOString().split('T')[0];

      await db.insert(attendancesTable)
        .values({
          student_id: testStudentId,
          class_id: testClassId,
          teacher_id: null,
          date: yesterdayDateString,
          status: 'hadir',
          check_in_time: yesterday,
          check_out_time: null,
          notes: null
        })
        .execute();

      // Today's check-in should still work
      const result = await studentCheckInOut(testStudentId, checkInInput);
      expect(result).not.toBeNull();
      const todayDateString = new Date().toISOString().split('T')[0];
      expect(result!.date.getTime()).toBe(new Date(todayDateString).getTime());
    });
  });

  describe('check_out', () => {
    const checkOutInput: StudentAttendanceInput = {
      type: 'check_out'
    };

    it('should update attendance record with check_out_time', async () => {
      // First check-in
      const checkInResult = await studentCheckInOut(testStudentId, { type: 'check_in' });
      expect(checkInResult).not.toBeNull();
      expect(checkInResult!.check_out_time).toBeNull();

      // Then check-out
      const checkOutResult = await studentCheckInOut(testStudentId, checkOutInput);
      expect(checkOutResult).not.toBeNull();
      expect(checkOutResult!.id).toBe(checkInResult!.id); // Same record
      expect(checkOutResult!.check_out_time).toBeInstanceOf(Date);
      expect(checkOutResult!.check_in_time).toBeInstanceOf(Date);
      expect(checkOutResult!.updated_at).toBeInstanceOf(Date);
    });

    it('should return null if no check-in record exists for today', async () => {
      const result = await studentCheckInOut(testStudentId, checkOutInput);
      expect(result).toBeNull();
    });

    it('should return null if already checked out today', async () => {
      // First check-in
      await studentCheckInOut(testStudentId, { type: 'check_in' });

      // First check-out
      const firstCheckOut = await studentCheckInOut(testStudentId, checkOutInput);
      expect(firstCheckOut).not.toBeNull();

      // Second check-out attempt
      const secondCheckOut = await studentCheckInOut(testStudentId, checkOutInput);
      expect(secondCheckOut).toBeNull();
    });

    it('should update the correct attendance record in database', async () => {
      // Check-in first
      const checkInResult = await studentCheckInOut(testStudentId, { type: 'check_in' });
      
      // Check-out
      const checkOutResult = await studentCheckInOut(testStudentId, checkOutInput);

      // Verify database state
      const attendance = await db.select()
        .from(attendancesTable)
        .where(eq(attendancesTable.id, checkInResult!.id))
        .execute();

      expect(attendance).toHaveLength(1);
      expect(attendance[0].check_in_time).toBeInstanceOf(Date);
      expect(attendance[0].check_out_time).toBeInstanceOf(Date);
      expect(attendance[0].check_out_time!.getTime()).toBeGreaterThan(attendance[0].check_in_time!.getTime());
      expect(attendance[0].updated_at).toBeInstanceOf(Date);
    });
  });

  describe('edge cases', () => {
    it('should return null for invalid attendance type', async () => {
      // @ts-expect-error Testing invalid input
      const result = await studentCheckInOut(testStudentId, { type: 'invalid' });
      expect(result).toBeNull();
    });

    it('should handle check-out without prior check-in gracefully', async () => {
      const result = await studentCheckInOut(testStudentId, { type: 'check_out' });
      expect(result).toBeNull();

      // Verify no attendance records were created
      const attendances = await db.select()
        .from(attendancesTable)
        .where(eq(attendancesTable.student_id, testStudentId))
        .execute();

      expect(attendances).toHaveLength(0);
    });

    it('should handle date boundaries correctly', async () => {
      const today = new Date();
      const expectedDateString = today.toISOString().split('T')[0];

      const result = await studentCheckInOut(testStudentId, { type: 'check_in' });

      expect(result!.date.getTime()).toBe(new Date(expectedDateString).getTime());
      expect(result!.check_in_time!.getTime()).toBeGreaterThanOrEqual(today.getTime() - 1000); // Within 1 second
    });
  });

  describe('complete workflow', () => {
    it('should handle full check-in and check-out cycle', async () => {
      const today = new Date();
      const expectedDateString = today.toISOString().split('T')[0];

      // Check-in
      const checkInResult = await studentCheckInOut(testStudentId, { type: 'check_in' });
      expect(checkInResult).not.toBeNull();
      expect(checkInResult!.status).toBe('hadir');
      expect(checkInResult!.check_in_time).toBeInstanceOf(Date);
      expect(checkInResult!.check_out_time).toBeNull();

      // Check-out
      const checkOutResult = await studentCheckInOut(testStudentId, { type: 'check_out' });
      expect(checkOutResult).not.toBeNull();
      expect(checkOutResult!.id).toBe(checkInResult!.id);
      expect(checkOutResult!.check_out_time).toBeInstanceOf(Date);

      // Verify final database state
      const finalAttendance = await db.select()
        .from(attendancesTable)
        .where(and(
          eq(attendancesTable.student_id, testStudentId),
          eq(attendancesTable.date, expectedDateString)
        ))
        .execute();

      expect(finalAttendance).toHaveLength(1);
      expect(finalAttendance[0].status).toBe('hadir');
      expect(finalAttendance[0].check_in_time).toBeInstanceOf(Date);
      expect(finalAttendance[0].check_out_time).toBeInstanceOf(Date);
      expect(finalAttendance[0].teacher_id).toBeNull();
    });
  });
});