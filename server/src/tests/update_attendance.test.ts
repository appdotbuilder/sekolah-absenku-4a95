import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, teachersTable, attendancesTable } from '../db/schema';
import { type UpdateAttendanceInput } from '../schema';
import { updateAttendance } from '../handlers/update_attendance';
import { eq } from 'drizzle-orm';

describe('updateAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  async function createTestData() {
    // Create user accounts
    const [userResult, teacherUserResult] = await Promise.all([
      db.insert(usersTable).values({
        username: 'student1',
        password: 'password123',
        role: 'siswa'
      }).returning().execute(),
      db.insert(usersTable).values({
        username: 'teacher1',
        password: 'password123',
        role: 'guru'
      }).returning().execute()
    ]);

    // Create class
    const [classResult] = await db.insert(classesTable).values({
      name: 'Kelas 1A',
      description: 'Test class'
    }).returning().execute();

    // Create student and teacher
    const [studentResult, teacherResult] = await Promise.all([
      db.insert(studentsTable).values({
        user_id: userResult[0].id,
        class_id: classResult.id,
        nis: '12345',
        nisn: '1234567890',
        full_name: 'Test Student'
      }).returning().execute(),
      db.insert(teachersTable).values({
        user_id: teacherUserResult[0].id,
        nip: 'T001',
        full_name: 'Test Teacher'
      }).returning().execute()
    ]);

    // Create attendance record
    const [attendanceResult] = await db.insert(attendancesTable).values({
      student_id: studentResult[0].id,
      class_id: classResult.id,
      teacher_id: teacherResult[0].id,
      date: '2024-01-15', // Use string format for date field
      status: 'hadir',
      check_in_time: new Date('2024-01-15T07:30:00Z'),
      notes: 'Initial attendance'
    }).returning().execute();

    return {
      user: userResult[0],
      teacherUser: teacherUserResult[0],
      class: classResult,
      student: studentResult[0],
      teacher: teacherResult[0],
      attendance: {
        ...attendanceResult,
        date: new Date(attendanceResult.date) // Convert string date to Date object
      }
    };
  }

  it('should update attendance status', async () => {
    const testData = await createTestData();

    const updateInput: UpdateAttendanceInput = {
      id: testData.attendance.id,
      status: 'izin'
    };

    const result = await updateAttendance(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testData.attendance.id);
    expect(result!.status).toEqual('izin');
    expect(result!.student_id).toEqual(testData.student.id);
    expect(result!.class_id).toEqual(testData.class.id);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update check-in time', async () => {
    const testData = await createTestData();
    const newCheckInTime = new Date('2024-01-15T08:00:00Z');

    const updateInput: UpdateAttendanceInput = {
      id: testData.attendance.id,
      check_in_time: newCheckInTime
    };

    const result = await updateAttendance(updateInput);

    expect(result).not.toBeNull();
    expect(result!.check_in_time).toEqual(newCheckInTime);
    expect(result!.status).toEqual('hadir'); // Should remain unchanged
  });

  it('should update check-out time', async () => {
    const testData = await createTestData();
    const newCheckOutTime = new Date('2024-01-15T15:00:00Z');

    const updateInput: UpdateAttendanceInput = {
      id: testData.attendance.id,
      check_out_time: newCheckOutTime
    };

    const result = await updateAttendance(updateInput);

    expect(result).not.toBeNull();
    expect(result!.check_out_time).toEqual(newCheckOutTime);
    expect(result!.status).toEqual('hadir'); // Should remain unchanged
  });

  it('should update notes', async () => {
    const testData = await createTestData();

    const updateInput: UpdateAttendanceInput = {
      id: testData.attendance.id,
      notes: 'Updated attendance notes'
    };

    const result = await updateAttendance(updateInput);

    expect(result).not.toBeNull();
    expect(result!.notes).toEqual('Updated attendance notes');
    expect(result!.status).toEqual('hadir'); // Should remain unchanged
  });

  it('should update multiple fields at once', async () => {
    const testData = await createTestData();
    const newCheckInTime = new Date('2024-01-15T08:15:00Z');
    const newCheckOutTime = new Date('2024-01-15T14:30:00Z');

    const updateInput: UpdateAttendanceInput = {
      id: testData.attendance.id,
      status: 'sakit',
      check_in_time: newCheckInTime,
      check_out_time: newCheckOutTime,
      notes: 'Student was sick but came later'
    };

    const result = await updateAttendance(updateInput);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('sakit');
    expect(result!.check_in_time).toEqual(newCheckInTime);
    expect(result!.check_out_time).toEqual(newCheckOutTime);
    expect(result!.notes).toEqual('Student was sick but came later');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should set nullable fields to null', async () => {
    const testData = await createTestData();

    const updateInput: UpdateAttendanceInput = {
      id: testData.attendance.id,
      check_in_time: null,
      check_out_time: null,
      notes: null
    };

    const result = await updateAttendance(updateInput);

    expect(result).not.toBeNull();
    expect(result!.check_in_time).toBeNull();
    expect(result!.check_out_time).toBeNull();
    expect(result!.notes).toBeNull();
    expect(result!.status).toEqual('hadir'); // Should remain unchanged
  });

  it('should return null for non-existent attendance record', async () => {
    const updateInput: UpdateAttendanceInput = {
      id: 99999,
      status: 'alpha'
    };

    const result = await updateAttendance(updateInput);

    expect(result).toBeNull();
  });

  it('should persist changes to database', async () => {
    const testData = await createTestData();

    const updateInput: UpdateAttendanceInput = {
      id: testData.attendance.id,
      status: 'alpha',
      notes: 'Student was absent without permission'
    };

    await updateAttendance(updateInput);

    // Query database directly to verify changes
    const updatedRecord = await db.select()
      .from(attendancesTable)
      .where(eq(attendancesTable.id, testData.attendance.id))
      .execute();

    expect(updatedRecord).toHaveLength(1);
    expect(updatedRecord[0].status).toEqual('alpha');
    expect(updatedRecord[0].notes).toEqual('Student was absent without permission');
    expect(updatedRecord[0].updated_at).toBeInstanceOf(Date);
    expect(updatedRecord[0].updated_at.getTime()).toBeGreaterThan(testData.attendance.updated_at.getTime());
  });

  it('should handle all attendance status enums', async () => {
    const testData = await createTestData();
    const statusOptions = ['hadir', 'izin', 'sakit', 'alpha'] as const;

    for (const status of statusOptions) {
      const updateInput: UpdateAttendanceInput = {
        id: testData.attendance.id,
        status: status
      };

      const result = await updateAttendance(updateInput);

      expect(result).not.toBeNull();
      expect(result!.status).toEqual(status);
    }
  });

  it('should update updated_at timestamp automatically', async () => {
    const testData = await createTestData();
    const originalUpdatedAt = testData.attendance.updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateAttendanceInput = {
      id: testData.attendance.id,
      notes: 'Updated notes'
    };

    const result = await updateAttendance(updateInput);

    expect(result).not.toBeNull();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});