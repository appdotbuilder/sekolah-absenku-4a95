import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, teachersTable, attendancesTable } from '../db/schema';
import { getStudentAttendanceHistory } from '../handlers/get_student_attendance_history';

describe('getStudentAttendanceHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testStudentId: number;
  let testClassId: number;
  let testTeacherId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const [testUser] = await db.insert(usersTable).values({
      username: 'teststudent',
      password: 'password123',
      role: 'siswa'
    }).returning().execute();

    const [testClass] = await db.insert(classesTable).values({
      name: 'Test Class',
      description: 'A class for testing'
    }).returning().execute();

    const [testStudent] = await db.insert(studentsTable).values({
      user_id: testUser.id,
      class_id: testClass.id,
      nis: 'TEST001',
      nisn: 'TEST001N',
      full_name: 'Test Student',
      email: 'test@example.com',
      phone: '1234567890'
    }).returning().execute();

    const [teacherUser] = await db.insert(usersTable).values({
      username: 'testteacher',
      password: 'password123',
      role: 'guru'
    }).returning().execute();

    const [testTeacher] = await db.insert(teachersTable).values({
      user_id: teacherUser.id,
      nip: 'TEACHER001',
      full_name: 'Test Teacher',
      email: 'teacher@example.com'
    }).returning().execute();

    testStudentId = testStudent.id;
    testClassId = testClass.id;
    testTeacherId = testTeacher.id;
  });

  it('should return empty array when no attendance records exist', async () => {
    const result = await getStudentAttendanceHistory(testStudentId);
    expect(result).toEqual([]);
  });

  it('should return student attendance history without date filters', async () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const checkInTime = new Date();
    checkInTime.setHours(8, 0, 0, 0);
    const checkOutTime = new Date();
    checkOutTime.setHours(15, 30, 0, 0);

    // Create test attendance records
    await db.insert(attendancesTable).values([
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: today.toISOString().split('T')[0],
        status: 'hadir',
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        notes: 'Present today'
      },
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: yesterday.toISOString().split('T')[0],
        status: 'izin',
        check_in_time: null,
        check_out_time: null,
        notes: 'Had permission yesterday'
      }
    ]).execute();

    const result = await getStudentAttendanceHistory(testStudentId);

    expect(result).toHaveLength(2);
    
    // Results should be ordered by date descending (today first)
    expect(result[0].date.toDateString()).toEqual(today.toDateString());
    expect(result[0].status).toEqual('hadir');
    expect(result[0].notes).toEqual('Present today');
    expect(result[0].check_in_time).toBeInstanceOf(Date);
    expect(result[0].check_out_time).toBeInstanceOf(Date);
    
    expect(result[1].date.toDateString()).toEqual(yesterday.toDateString());
    expect(result[1].status).toEqual('izin');
    expect(result[1].notes).toEqual('Had permission yesterday');
    expect(result[1].check_in_time).toBeNull();
    expect(result[1].check_out_time).toBeNull();
  });

  it('should filter attendance records by start date', async () => {
    const today = new Date();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    // Create test attendance records
    await db.insert(attendancesTable).values([
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: today.toISOString().split('T')[0],
        status: 'hadir',
        notes: 'Today'
      },
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: threeDaysAgo.toISOString().split('T')[0],
        status: 'hadir',
        notes: 'Three days ago'
      },
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: fiveDaysAgo.toISOString().split('T')[0],
        status: 'hadir',
        notes: 'Five days ago'
      }
    ]).execute();

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const result = await getStudentAttendanceHistory(testStudentId, twoDaysAgo);

    expect(result).toHaveLength(1);
    expect(result[0].notes).toEqual('Today');
  });

  it('should filter attendance records by end date', async () => {
    const today = new Date();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    // Create test attendance records
    await db.insert(attendancesTable).values([
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: today.toISOString().split('T')[0],
        status: 'hadir',
        notes: 'Today'
      },
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: threeDaysAgo.toISOString().split('T')[0],
        status: 'hadir',
        notes: 'Three days ago'
      },
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: fiveDaysAgo.toISOString().split('T')[0],
        status: 'hadir',
        notes: 'Five days ago'
      }
    ]).execute();

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const result = await getStudentAttendanceHistory(testStudentId, undefined, twoDaysAgo);

    expect(result).toHaveLength(2);
    expect(result[0].notes).toEqual('Three days ago');
    expect(result[1].notes).toEqual('Five days ago');
  });

  it('should filter attendance records by date range', async () => {
    const today = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Create test attendance records
    await db.insert(attendancesTable).values([
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: today.toISOString().split('T')[0],
        status: 'hadir',
        notes: 'Today'
      },
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: twoDaysAgo.toISOString().split('T')[0],
        status: 'izin',
        notes: 'Two days ago'
      },
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: fiveDaysAgo.toISOString().split('T')[0],
        status: 'sakit',
        notes: 'Five days ago'
      },
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: sevenDaysAgo.toISOString().split('T')[0],
        status: 'alpha',
        notes: 'Seven days ago'
      }
    ]).execute();

    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const result = await getStudentAttendanceHistory(testStudentId, sixDaysAgo, oneDayAgo);

    expect(result).toHaveLength(2);
    expect(result[0].notes).toEqual('Two days ago');
    expect(result[1].notes).toEqual('Five days ago');
  });

  it('should handle different attendance statuses correctly', async () => {
    const today = new Date();
    
    // Create attendance records with all possible statuses
    await db.insert(attendancesTable).values([
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: today.toISOString().split('T')[0],
        status: 'hadir',
        notes: 'Present'
      },
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: today.toISOString().split('T')[0],
        status: 'izin',
        notes: 'Permission'
      },
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: today.toISOString().split('T')[0],
        status: 'sakit',
        notes: 'Sick'
      },
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: today.toISOString().split('T')[0],
        status: 'alpha',
        notes: 'Absent'
      }
    ]).execute();

    const result = await getStudentAttendanceHistory(testStudentId);

    expect(result).toHaveLength(4);
    
    const statuses = result.map(r => r.status).sort();
    expect(statuses).toEqual(['alpha', 'hadir', 'izin', 'sakit']);
  });

  it('should only return records for the specified student', async () => {
    // Create another student
    const [anotherUser] = await db.insert(usersTable).values({
      username: 'anotherstudent',
      password: 'password123',
      role: 'siswa'
    }).returning().execute();

    const [anotherStudent] = await db.insert(studentsTable).values({
      user_id: anotherUser.id,
      class_id: testClassId,
      nis: 'TEST002',
      nisn: 'TEST002N',
      full_name: 'Another Student',
      email: 'another@example.com'
    }).returning().execute();

    const today = new Date();
    
    // Create attendance records for both students
    await db.insert(attendancesTable).values([
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: today.toISOString().split('T')[0],
        status: 'hadir',
        notes: 'Test student present'
      },
      {
        student_id: anotherStudent.id,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: today.toISOString().split('T')[0],
        status: 'izin',
        notes: 'Another student with permission'
      }
    ]).execute();

    const result = await getStudentAttendanceHistory(testStudentId);

    expect(result).toHaveLength(1);
    expect(result[0].student_id).toEqual(testStudentId);
    expect(result[0].notes).toEqual('Test student present');
  });

  it('should handle records with null teacher_id', async () => {
    const today = new Date();
    
    // Create attendance record without teacher (self-recorded)
    await db.insert(attendancesTable).values({
      student_id: testStudentId,
      class_id: testClassId,
      teacher_id: null,
      date: today.toISOString().split('T')[0],
      status: 'hadir',
      check_in_time: new Date(),
      notes: 'Self-recorded attendance'
    }).execute();

    const result = await getStudentAttendanceHistory(testStudentId);

    expect(result).toHaveLength(1);
    expect(result[0].teacher_id).toBeNull();
    expect(result[0].notes).toEqual('Self-recorded attendance');
  });

  it('should return recent records (last 30 days) when no date range specified', async () => {
    const today = new Date();
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
    const fortyDaysAgo = new Date();
    fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

    // Create test attendance records
    await db.insert(attendancesTable).values([
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: today.toISOString().split('T')[0],
        status: 'hadir',
        notes: 'Recent record'
      },
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: twentyDaysAgo.toISOString().split('T')[0],
        status: 'hadir',
        notes: 'Within 30 days'
      },
      {
        student_id: testStudentId,
        class_id: testClassId,
        teacher_id: testTeacherId,
        date: fortyDaysAgo.toISOString().split('T')[0],
        status: 'hadir',
        notes: 'Too old'
      }
    ]).execute();

    const result = await getStudentAttendanceHistory(testStudentId);

    expect(result).toHaveLength(2);
    expect(result.some(r => r.notes === 'Recent record')).toBe(true);
    expect(result.some(r => r.notes === 'Within 30 days')).toBe(true);
    expect(result.some(r => r.notes === 'Too old')).toBe(false);
  });

  it('should return properly formatted date objects', async () => {
    const today = new Date();
    const checkInTime = new Date();
    checkInTime.setHours(8, 0, 0, 0);
    const checkOutTime = new Date();
    checkOutTime.setHours(15, 30, 0, 0);

    await db.insert(attendancesTable).values({
      student_id: testStudentId,
      class_id: testClassId,
      teacher_id: testTeacherId,
      date: today.toISOString().split('T')[0],
      status: 'hadir',
      check_in_time: checkInTime,
      check_out_time: checkOutTime
    }).execute();

    const result = await getStudentAttendanceHistory(testStudentId);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].check_in_time).toBeInstanceOf(Date);
    expect(result[0].check_out_time).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });
});