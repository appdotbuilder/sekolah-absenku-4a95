import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, attendancesTable } from '../db/schema';
import { getAttendanceStatistics } from '../handlers/get_attendance_statistics';

describe('getAttendanceStatistics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const setupTestData = async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        { username: 'student1', password: 'password123', role: 'siswa' },
        { username: 'student2', password: 'password123', role: 'siswa' },
        { username: 'student3', password: 'password123', role: 'siswa' },
        { username: 'student4', password: 'password123', role: 'siswa' },
      ])
      .returning()
      .execute();

    // Create test classes
    const classes = await db.insert(classesTable)
      .values([
        { name: 'Class A', description: 'First class' },
        { name: 'Class B', description: 'Second class' },
      ])
      .returning()
      .execute();

    // Create test students
    const students = await db.insert(studentsTable)
      .values([
        {
          user_id: users[0].id,
          class_id: classes[0].id,
          nis: '001',
          nisn: '001001',
          full_name: 'Student One',
          email: 'student1@test.com',
          phone: '1234567890',
          address: 'Address 1',
          photo_url: null
        },
        {
          user_id: users[1].id,
          class_id: classes[0].id,
          nis: '002',
          nisn: '001002',
          full_name: 'Student Two',
          email: 'student2@test.com',
          phone: '1234567891',
          address: 'Address 2',
          photo_url: null
        },
        {
          user_id: users[2].id,
          class_id: classes[1].id,
          nis: '003',
          nisn: '001003',
          full_name: 'Student Three',
          email: 'student3@test.com',
          phone: '1234567892',
          address: 'Address 3',
          photo_url: null
        },
        {
          user_id: users[3].id,
          class_id: classes[1].id,
          nis: '004',
          nisn: '001004',
          full_name: 'Student Four',
          email: 'student4@test.com',
          phone: '1234567893',
          address: 'Address 4',
          photo_url: null
        },
      ])
      .returning()
      .execute();

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Create attendance records with various statuses
    await db.insert(attendancesTable)
      .values([
        // Today's attendance for Class A
        {
          student_id: students[0].id,
          class_id: classes[0].id,
          teacher_id: null,
          date: today.toISOString().split('T')[0],
          status: 'hadir',
          check_in_time: new Date(),
          check_out_time: null,
          notes: null
        },
        {
          student_id: students[1].id,
          class_id: classes[0].id,
          teacher_id: null,
          date: today.toISOString().split('T')[0],
          status: 'izin',
          check_in_time: null,
          check_out_time: null,
          notes: 'Family event'
        },
        // Yesterday's attendance for Class A
        {
          student_id: students[0].id,
          class_id: classes[0].id,
          teacher_id: null,
          date: yesterday.toISOString().split('T')[0],
          status: 'sakit',
          check_in_time: null,
          check_out_time: null,
          notes: 'Flu symptoms'
        },
        {
          student_id: students[1].id,
          class_id: classes[0].id,
          teacher_id: null,
          date: yesterday.toISOString().split('T')[0],
          status: 'alpha',
          check_in_time: null,
          check_out_time: null,
          notes: null
        },
        // Today's attendance for Class B
        {
          student_id: students[2].id,
          class_id: classes[1].id,
          teacher_id: null,
          date: today.toISOString().split('T')[0],
          status: 'hadir',
          check_in_time: new Date(),
          check_out_time: null,
          notes: null
        },
        {
          student_id: students[3].id,
          class_id: classes[1].id,
          teacher_id: null,
          date: today.toISOString().split('T')[0],
          status: 'hadir',
          check_in_time: new Date(),
          check_out_time: null,
          notes: null
        },
        // Two days ago attendance
        {
          student_id: students[0].id,
          class_id: classes[0].id,
          teacher_id: null,
          date: twoDaysAgo.toISOString().split('T')[0],
          status: 'hadir',
          check_in_time: new Date(twoDaysAgo.getTime() + 8 * 60 * 60 * 1000), // 8 AM
          check_out_time: new Date(twoDaysAgo.getTime() + 15 * 60 * 60 * 1000), // 3 PM
          notes: null
        }
      ])
      .execute();

    return { users, classes, students, today, yesterday, twoDaysAgo };
  };

  it('should return overall statistics without filters', async () => {
    await setupTestData();

    const stats = await getAttendanceStatistics();

    // Overall stats should include all students and all attendance records
    expect(stats.total_students).toEqual(4);
    expect(stats.present).toEqual(4); // 3 hadir records
    expect(stats.permission).toEqual(1); // 1 izin record
    expect(stats.sick).toEqual(1); // 1 sakit record
    expect(stats.absent).toEqual(1); // 1 alpha record
    expect(stats.attendance_rate).toEqual(57.14); // 4/7 * 100 = 57.14%
  });

  it('should return statistics filtered by class', async () => {
    const { classes } = await setupTestData();

    const statsClassA = await getAttendanceStatistics(classes[0].id);

    // Class A has 2 students and 4 attendance records
    expect(statsClassA.total_students).toEqual(2);
    expect(statsClassA.present).toEqual(2); // 2 hadir records for class A
    expect(statsClassA.permission).toEqual(1); // 1 izin record for class A
    expect(statsClassA.sick).toEqual(1); // 1 sakit record for class A
    expect(statsClassA.absent).toEqual(1); // 1 alpha record for class A
    expect(statsClassA.attendance_rate).toEqual(40); // 2/5 * 100 = 40%

    const statsClassB = await getAttendanceStatistics(classes[1].id);

    // Class B has 2 students and 2 attendance records
    expect(statsClassB.total_students).toEqual(2);
    expect(statsClassB.present).toEqual(2); // 2 hadir records for class B
    expect(statsClassB.permission).toEqual(0);
    expect(statsClassB.sick).toEqual(0);
    expect(statsClassB.absent).toEqual(0);
    expect(statsClassB.attendance_rate).toEqual(100); // 2/2 * 100 = 100%
  });

  it('should return statistics filtered by date range', async () => {
    const { today, yesterday } = await setupTestData();

    // Only today's records
    const todayStats = await getAttendanceStatistics(undefined, today, today);

    expect(todayStats.total_students).toEqual(4);
    expect(todayStats.present).toEqual(3); // 3 hadir records today
    expect(todayStats.permission).toEqual(1); // 1 izin record today
    expect(todayStats.sick).toEqual(0);
    expect(todayStats.absent).toEqual(0);
    expect(todayStats.attendance_rate).toEqual(75); // 3/4 * 100 = 75%

    // Yesterday's records only
    const yesterdayStats = await getAttendanceStatistics(undefined, yesterday, yesterday);

    expect(yesterdayStats.total_students).toEqual(4);
    expect(yesterdayStats.present).toEqual(0);
    expect(yesterdayStats.permission).toEqual(0);
    expect(yesterdayStats.sick).toEqual(1); // 1 sakit record yesterday
    expect(yesterdayStats.absent).toEqual(1); // 1 alpha record yesterday
    expect(yesterdayStats.attendance_rate).toEqual(0); // 0/2 * 100 = 0%
  });

  it('should return statistics filtered by class and date range', async () => {
    const { classes, today } = await setupTestData();

    const stats = await getAttendanceStatistics(classes[0].id, today, today);

    // Class A today only
    expect(stats.total_students).toEqual(2);
    expect(stats.present).toEqual(1); // 1 hadir record for class A today
    expect(stats.permission).toEqual(1); // 1 izin record for class A today
    expect(stats.sick).toEqual(0);
    expect(stats.absent).toEqual(0);
    expect(stats.attendance_rate).toEqual(50); // 1/2 * 100 = 50%
  });

  it('should return zero statistics for non-existent class', async () => {
    await setupTestData();

    const stats = await getAttendanceStatistics(999);

    expect(stats.total_students).toEqual(0);
    expect(stats.present).toEqual(0);
    expect(stats.permission).toEqual(0);
    expect(stats.sick).toEqual(0);
    expect(stats.absent).toEqual(0);
    expect(stats.attendance_rate).toEqual(0);
  });

  it('should return zero statistics for date range with no records', async () => {
    await setupTestData();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const stats = await getAttendanceStatistics(undefined, futureDate, futureDate);

    expect(stats.total_students).toEqual(4); // Total students still counted
    expect(stats.present).toEqual(0);
    expect(stats.permission).toEqual(0);
    expect(stats.sick).toEqual(0);
    expect(stats.absent).toEqual(0);
    expect(stats.attendance_rate).toEqual(0);
  });

  it('should handle empty database correctly', async () => {
    const stats = await getAttendanceStatistics();

    expect(stats.total_students).toEqual(0);
    expect(stats.present).toEqual(0);
    expect(stats.permission).toEqual(0);
    expect(stats.sick).toEqual(0);
    expect(stats.absent).toEqual(0);
    expect(stats.attendance_rate).toEqual(0);
  });

  it('should calculate attendance rate correctly when only absent records exist', async () => {
    const { users, classes } = await setupTestData();

    // Clear existing attendance and add only alpha records
    await db.delete(attendancesTable).execute();

    await db.insert(attendancesTable)
      .values([
        {
          student_id: users[0].id,
          class_id: classes[0].id,
          teacher_id: null,
          date: new Date().toISOString().split('T')[0],
          status: 'alpha',
          check_in_time: null,
          check_out_time: null,
          notes: null
        }
      ])
      .execute();

    const stats = await getAttendanceStatistics();

    expect(stats.present).toEqual(0);
    expect(stats.absent).toEqual(1);
    expect(stats.attendance_rate).toEqual(0); // 0/1 * 100 = 0%
  });

  it('should handle date range filters correctly with start date only', async () => {
    const { today } = await setupTestData();

    const stats = await getAttendanceStatistics(undefined, today);

    // Should include today and future records (if any)
    expect(stats.total_students).toEqual(4);
    expect(stats.present).toEqual(3); // Only today's present records
    expect(stats.permission).toEqual(1); // Only today's permission records
    expect(stats.sick).toEqual(0); // No sick records today
    expect(stats.absent).toEqual(0); // No absent records today
  });

  it('should handle date range filters correctly with end date only', async () => {
    const { yesterday } = await setupTestData();

    const stats = await getAttendanceStatistics(undefined, undefined, yesterday);

    // Should include all records up to and including yesterday
    expect(stats.total_students).toEqual(4);
    expect(stats.present).toEqual(1); // Present record from two days ago only
    expect(stats.permission).toEqual(0);
    expect(stats.sick).toEqual(1); // Sick record from yesterday
    expect(stats.absent).toEqual(1); // Absent record from yesterday
  });
});