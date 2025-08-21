import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  studentsTable, 
  teachersTable, 
  classesTable, 
  attendancesTable 
} from '../db/schema';
import { getDashboardStats } from '../handlers/get_dashboard_stats';

describe('getDashboardStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty stats when no data exists', async () => {
    const result = await getDashboardStats();

    expect(result.total_students).toBe(0);
    expect(result.total_teachers).toBe(0);
    expect(result.total_classes).toBe(0);
    expect(result.today_attendance.total_students).toBe(0);
    expect(result.today_attendance.present).toBe(0);
    expect(result.today_attendance.permission).toBe(0);
    expect(result.today_attendance.sick).toBe(0);
    expect(result.today_attendance.absent).toBe(0);
    expect(result.today_attendance.attendance_rate).toBe(0);
  });

  it('should return correct counts for students, teachers, and classes', async () => {
    // Create test users
    const users = await db.insert(usersTable).values([
      { username: 'student1', password: 'password123', role: 'siswa' },
      { username: 'student2', password: 'password123', role: 'siswa' },
      { username: 'teacher1', password: 'password123', role: 'guru' },
      { username: 'teacher2', password: 'password123', role: 'guru' },
      { username: 'admin1', password: 'password123', role: 'admin' }
    ]).returning().execute();

    // Create test classes
    const classes = await db.insert(classesTable).values([
      { name: 'Class 1A', description: 'First class' },
      { name: 'Class 1B', description: 'Second class' },
      { name: 'Class 2A', description: 'Third class' }
    ]).returning().execute();

    // Create test students
    await db.insert(studentsTable).values([
      {
        user_id: users[0].id,
        class_id: classes[0].id,
        nis: 'NIS001',
        nisn: 'NISN001',
        full_name: 'Student One',
        email: 'student1@test.com',
        phone: '08123456789',
        address: 'Test Address 1',
        photo_url: null
      },
      {
        user_id: users[1].id,
        class_id: classes[1].id,
        nis: 'NIS002',
        nisn: 'NISN002',
        full_name: 'Student Two',
        email: 'student2@test.com',
        phone: '08123456790',
        address: 'Test Address 2',
        photo_url: null
      }
    ]).returning().execute();

    // Create test teachers
    await db.insert(teachersTable).values([
      {
        user_id: users[2].id,
        nip: 'NIP001',
        full_name: 'Teacher One',
        email: 'teacher1@test.com',
        phone: '08123456791',
        address: 'Teacher Address 1',
        photo_url: null
      },
      {
        user_id: users[3].id,
        nip: 'NIP002',
        full_name: 'Teacher Two',
        email: 'teacher2@test.com',
        phone: '08123456792',
        address: 'Teacher Address 2',
        photo_url: null
      }
    ]).returning().execute();

    const result = await getDashboardStats();

    expect(result.total_students).toBe(2);
    expect(result.total_teachers).toBe(2);
    expect(result.total_classes).toBe(3);
  });

  it('should calculate today attendance stats correctly', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable).values([
      { username: 'student1', password: 'password123', role: 'siswa' },
      { username: 'student2', password: 'password123', role: 'siswa' },
      { username: 'student3', password: 'password123', role: 'siswa' },
      { username: 'student4', password: 'password123', role: 'siswa' },
      { username: 'teacher1', password: 'password123', role: 'guru' }
    ]).returning().execute();

    const classes = await db.insert(classesTable).values([
      { name: 'Class 1A', description: 'Test class' }
    ]).returning().execute();

    const students = await db.insert(studentsTable).values([
      {
        user_id: users[0].id,
        class_id: classes[0].id,
        nis: 'NIS001',
        nisn: null,
        full_name: 'Student One',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      },
      {
        user_id: users[1].id,
        class_id: classes[0].id,
        nis: 'NIS002',
        nisn: null,
        full_name: 'Student Two',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      },
      {
        user_id: users[2].id,
        class_id: classes[0].id,
        nis: 'NIS003',
        nisn: null,
        full_name: 'Student Three',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      },
      {
        user_id: users[3].id,
        class_id: classes[0].id,
        nis: 'NIS004',
        nisn: null,
        full_name: 'Student Four',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      }
    ]).returning().execute();

    const teachers = await db.insert(teachersTable).values([
      {
        user_id: users[4].id,
        nip: 'NIP001',
        full_name: 'Teacher One',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      }
    ]).returning().execute();

    // Get today's date as string for database
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Create today's attendance records with different statuses
    await db.insert(attendancesTable).values([
      {
        student_id: students[0].id,
        class_id: classes[0].id,
        teacher_id: teachers[0].id,
        date: todayStr,
        status: 'hadir',
        check_in_time: new Date(),
        check_out_time: null,
        notes: null
      },
      {
        student_id: students[1].id,
        class_id: classes[0].id,
        teacher_id: teachers[0].id,
        date: todayStr,
        status: 'hadir',
        check_in_time: new Date(),
        check_out_time: null,
        notes: null
      },
      {
        student_id: students[2].id,
        class_id: classes[0].id,
        teacher_id: teachers[0].id,
        date: todayStr,
        status: 'izin',
        check_in_time: null,
        check_out_time: null,
        notes: 'Family event'
      },
      {
        student_id: students[3].id,
        class_id: classes[0].id,
        teacher_id: teachers[0].id,
        date: todayStr,
        status: 'sakit',
        check_in_time: null,
        check_out_time: null,
        notes: 'Flu'
      }
    ]).execute();

    const result = await getDashboardStats();

    expect(result.today_attendance.total_students).toBe(4);
    expect(result.today_attendance.present).toBe(2);
    expect(result.today_attendance.permission).toBe(1);
    expect(result.today_attendance.sick).toBe(1);
    expect(result.today_attendance.absent).toBe(0);
    expect(result.today_attendance.attendance_rate).toBe(50); // 2/4 * 100 = 50%
  });

  it('should not include past or future attendance records', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable).values([
      { username: 'student1', password: 'password123', role: 'siswa' },
      { username: 'teacher1', password: 'password123', role: 'guru' }
    ]).returning().execute();

    const classes = await db.insert(classesTable).values([
      { name: 'Class 1A', description: 'Test class' }
    ]).returning().execute();

    const students = await db.insert(studentsTable).values([
      {
        user_id: users[0].id,
        class_id: classes[0].id,
        nis: 'NIS001',
        nisn: null,
        full_name: 'Student One',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      }
    ]).returning().execute();

    const teachers = await db.insert(teachersTable).values([
      {
        user_id: users[1].id,
        nip: 'NIP001',
        full_name: 'Teacher One',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      }
    ]).returning().execute();

    // Create attendance records for different dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    await db.insert(attendancesTable).values([
      // Yesterday's attendance - should not be counted
      {
        student_id: students[0].id,
        class_id: classes[0].id,
        teacher_id: teachers[0].id,
        date: yesterdayStr,
        status: 'hadir',
        check_in_time: new Date(),
        check_out_time: null,
        notes: null
      },
      // Today's attendance - should be counted
      {
        student_id: students[0].id,
        class_id: classes[0].id,
        teacher_id: teachers[0].id,
        date: todayStr,
        status: 'hadir',
        check_in_time: new Date(),
        check_out_time: null,
        notes: null
      },
      // Tomorrow's attendance - should not be counted
      {
        student_id: students[0].id,
        class_id: classes[0].id,
        teacher_id: teachers[0].id,
        date: tomorrowStr,
        status: 'hadir',
        check_in_time: new Date(),
        check_out_time: null,
        notes: null
      }
    ]).execute();

    const result = await getDashboardStats();

    expect(result.today_attendance.total_students).toBe(1);
    expect(result.today_attendance.present).toBe(1);
    expect(result.today_attendance.attendance_rate).toBe(100);
  });

  it('should handle zero attendance rate correctly', async () => {
    // Create prerequisite data
    const users = await db.insert(usersTable).values([
      { username: 'student1', password: 'password123', role: 'siswa' },
      { username: 'teacher1', password: 'password123', role: 'guru' }
    ]).returning().execute();

    const classes = await db.insert(classesTable).values([
      { name: 'Class 1A', description: 'Test class' }
    ]).returning().execute();

    const students = await db.insert(studentsTable).values([
      {
        user_id: users[0].id,
        class_id: classes[0].id,
        nis: 'NIS001',
        nisn: null,
        full_name: 'Student One',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      }
    ]).returning().execute();

    const teachers = await db.insert(teachersTable).values([
      {
        user_id: users[1].id,
        nip: 'NIP001',
        full_name: 'Teacher One',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      }
    ]).returning().execute();

    // Create today's attendance with all absent students
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    await db.insert(attendancesTable).values([
      {
        student_id: students[0].id,
        class_id: classes[0].id,
        teacher_id: teachers[0].id,
        date: todayStr,
        status: 'alpha',
        check_in_time: null,
        check_out_time: null,
        notes: null
      }
    ]).execute();

    const result = await getDashboardStats();

    expect(result.today_attendance.total_students).toBe(1);
    expect(result.today_attendance.present).toBe(0);
    expect(result.today_attendance.absent).toBe(1);
    expect(result.today_attendance.attendance_rate).toBe(0);
  });

  it('should calculate partial attendance rate correctly', async () => {
    // Create prerequisite data with 5 students
    const users = await db.insert(usersTable).values([
      { username: 'student1', password: 'password123', role: 'siswa' },
      { username: 'student2', password: 'password123', role: 'siswa' },
      { username: 'student3', password: 'password123', role: 'siswa' },
      { username: 'teacher1', password: 'password123', role: 'guru' }
    ]).returning().execute();

    const classes = await db.insert(classesTable).values([
      { name: 'Class 1A', description: 'Test class' }
    ]).returning().execute();

    const students = await db.insert(studentsTable).values([
      {
        user_id: users[0].id,
        class_id: classes[0].id,
        nis: 'NIS001',
        nisn: null,
        full_name: 'Student One',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      },
      {
        user_id: users[1].id,
        class_id: classes[0].id,
        nis: 'NIS002',
        nisn: null,
        full_name: 'Student Two',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      },
      {
        user_id: users[2].id,
        class_id: classes[0].id,
        nis: 'NIS003',
        nisn: null,
        full_name: 'Student Three',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      }
    ]).returning().execute();

    const teachers = await db.insert(teachersTable).values([
      {
        user_id: users[3].id,
        nip: 'NIP001',
        full_name: 'Teacher One',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      }
    ]).returning().execute();

    // Create today's attendance: 2 present out of 3 students
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    await db.insert(attendancesTable).values([
      {
        student_id: students[0].id,
        class_id: classes[0].id,
        teacher_id: teachers[0].id,
        date: todayStr,
        status: 'hadir',
        check_in_time: new Date(),
        check_out_time: null,
        notes: null
      },
      {
        student_id: students[1].id,
        class_id: classes[0].id,
        teacher_id: teachers[0].id,
        date: todayStr,
        status: 'hadir',
        check_in_time: new Date(),
        check_out_time: null,
        notes: null
      },
      {
        student_id: students[2].id,
        class_id: classes[0].id,
        teacher_id: teachers[0].id,
        date: todayStr,
        status: 'alpha',
        check_in_time: null,
        check_out_time: null,
        notes: null
      }
    ]).execute();

    const result = await getDashboardStats();

    expect(result.today_attendance.total_students).toBe(3);
    expect(result.today_attendance.present).toBe(2);
    expect(result.today_attendance.absent).toBe(1);
    expect(result.today_attendance.attendance_rate).toBe(66.67); // 2/3 * 100 = 66.67% (rounded)
  });
});