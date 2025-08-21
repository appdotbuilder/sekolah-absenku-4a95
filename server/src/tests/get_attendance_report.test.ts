import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, teachersTable, attendancesTable } from '../db/schema';
import { type AttendanceReportQuery } from '../schema';
import { getAttendanceReport } from '../handlers/get_attendance_report';

// Test data
const testUser = {
  username: 'teststudent',
  password: 'password123',
  role: 'siswa' as const
};

const testTeacherUser = {
  username: 'testteacher',
  password: 'password123',
  role: 'guru' as const
};

const testClass = {
  name: 'Test Class',
  description: 'A class for testing'
};

const testStudent = {
  nis: 'NIS001',
  nisn: 'NISN001',
  full_name: 'Test Student',
  email: 'student@test.com',
  phone: '123456789',
  address: 'Test Address',
  photo_url: null
};

const testTeacher = {
  nip: 'NIP001',
  full_name: 'Test Teacher',
  email: 'teacher@test.com',
  phone: '987654321',
  address: 'Teacher Address',
  photo_url: null
};

describe('getAttendanceReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return attendance records within date range', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const teacherUserResult = await db.insert(usersTable).values(testTeacherUser).returning().execute();
    const classResult = await db.insert(classesTable).values(testClass).returning().execute();
    
    const studentResult = await db.insert(studentsTable).values({
      ...testStudent,
      user_id: userResult[0].id,
      class_id: classResult[0].id
    }).returning().execute();

    const teacherResult = await db.insert(teachersTable).values({
      ...testTeacher,
      user_id: teacherUserResult[0].id
    }).returning().execute();

    // Create test attendance records with different dates
    const today = new Date('2024-01-15');
    const tomorrow = new Date('2024-01-16');
    const dayAfter = new Date('2024-01-17');

    await db.insert(attendancesTable).values([
      {
        student_id: studentResult[0].id,
        class_id: classResult[0].id,
        teacher_id: teacherResult[0].id,
        date: today.toISOString().split('T')[0], // Convert to string format
        status: 'hadir',
        check_in_time: new Date('2024-01-15T08:00:00Z'),
        check_out_time: new Date('2024-01-15T16:00:00Z'),
        notes: 'Present today'
      },
      {
        student_id: studentResult[0].id,
        class_id: classResult[0].id,
        teacher_id: teacherResult[0].id,
        date: tomorrow.toISOString().split('T')[0], // Convert to string format
        status: 'izin',
        check_in_time: null,
        check_out_time: null,
        notes: 'Permission tomorrow'
      },
      {
        student_id: studentResult[0].id,
        class_id: classResult[0].id,
        teacher_id: null,
        date: dayAfter.toISOString().split('T')[0], // Convert to string format
        status: 'alpha',
        check_in_time: null,
        check_out_time: null,
        notes: 'Absent day after'
      }
    ]).execute();

    const query: AttendanceReportQuery = {
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-16')
    };

    const result = await getAttendanceReport(query);

    expect(result).toHaveLength(2);
    expect(result[0].date).toEqual(today);
    expect(result[0].status).toEqual('hadir');
    expect(result[0].student_id).toEqual(studentResult[0].id);
    expect(result[0].class_id).toEqual(classResult[0].id);
    expect(result[0].teacher_id).toEqual(teacherResult[0].id);
    expect(result[0].notes).toEqual('Present today');
    
    expect(result[1].date).toEqual(tomorrow);
    expect(result[1].status).toEqual('izin');
    expect(result[1].notes).toEqual('Permission tomorrow');
  });

  it('should filter by class_id when provided', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const classResult1 = await db.insert(classesTable).values(testClass).returning().execute();
    const classResult2 = await db.insert(classesTable).values({
      name: 'Another Class',
      description: 'Another test class'
    }).returning().execute();
    
    const studentResult = await db.insert(studentsTable).values({
      ...testStudent,
      user_id: userResult[0].id,
      class_id: classResult1[0].id
    }).returning().execute();

    const today = new Date('2024-01-15');

    // Create attendance for both classes
    await db.insert(attendancesTable).values([
      {
        student_id: studentResult[0].id,
        class_id: classResult1[0].id,
        teacher_id: null,
        date: today.toISOString().split('T')[0], // Convert to string format
        status: 'hadir',
        check_in_time: new Date('2024-01-15T08:00:00Z'),
        check_out_time: null,
        notes: 'Class 1 attendance'
      },
      {
        student_id: studentResult[0].id,
        class_id: classResult2[0].id,
        teacher_id: null,
        date: today.toISOString().split('T')[0], // Convert to string format
        status: 'izin',
        check_in_time: null,
        check_out_time: null,
        notes: 'Class 2 attendance'
      }
    ]).execute();

    const query: AttendanceReportQuery = {
      class_id: classResult1[0].id,
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-15')
    };

    const result = await getAttendanceReport(query);

    expect(result).toHaveLength(1);
    expect(result[0].class_id).toEqual(classResult1[0].id);
    expect(result[0].notes).toEqual('Class 1 attendance');
  });

  it('should filter by student_id when provided', async () => {
    // Create prerequisite data
    const user1Result = await db.insert(usersTable).values(testUser).returning().execute();
    const user2Result = await db.insert(usersTable).values({
      username: 'student2',
      password: 'password123',
      role: 'siswa' as const
    }).returning().execute();
    
    const classResult = await db.insert(classesTable).values(testClass).returning().execute();
    
    const student1Result = await db.insert(studentsTable).values({
      ...testStudent,
      user_id: user1Result[0].id,
      class_id: classResult[0].id
    }).returning().execute();

    const student2Result = await db.insert(studentsTable).values({
      nis: 'NIS002',
      nisn: 'NISN002',
      full_name: 'Test Student 2',
      email: 'student2@test.com',
      phone: '123456789',
      address: 'Test Address',
      photo_url: null,
      user_id: user2Result[0].id,
      class_id: classResult[0].id
    }).returning().execute();

    const today = new Date('2024-01-15');

    // Create attendance for both students
    await db.insert(attendancesTable).values([
      {
        student_id: student1Result[0].id,
        class_id: classResult[0].id,
        teacher_id: null,
        date: today.toISOString().split('T')[0], // Convert to string format
        status: 'hadir',
        check_in_time: new Date('2024-01-15T08:00:00Z'),
        check_out_time: null,
        notes: 'Student 1 attendance'
      },
      {
        student_id: student2Result[0].id,
        class_id: classResult[0].id,
        teacher_id: null,
        date: today.toISOString().split('T')[0], // Convert to string format
        status: 'izin',
        check_in_time: null,
        check_out_time: null,
        notes: 'Student 2 attendance'
      }
    ]).execute();

    const query: AttendanceReportQuery = {
      student_id: student1Result[0].id,
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-15')
    };

    const result = await getAttendanceReport(query);

    expect(result).toHaveLength(1);
    expect(result[0].student_id).toEqual(student1Result[0].id);
    expect(result[0].notes).toEqual('Student 1 attendance');
  });

  it('should filter by status when provided', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const classResult = await db.insert(classesTable).values(testClass).returning().execute();
    
    const studentResult = await db.insert(studentsTable).values({
      ...testStudent,
      user_id: userResult[0].id,
      class_id: classResult[0].id
    }).returning().execute();

    const today = new Date('2024-01-15');

    // Create attendance with different statuses
    await db.insert(attendancesTable).values([
      {
        student_id: studentResult[0].id,
        class_id: classResult[0].id,
        teacher_id: null,
        date: today.toISOString().split('T')[0], // Convert to string format
        status: 'hadir',
        check_in_time: new Date('2024-01-15T08:00:00Z'),
        check_out_time: null,
        notes: 'Present'
      },
      {
        student_id: studentResult[0].id,
        class_id: classResult[0].id,
        teacher_id: null,
        date: today.toISOString().split('T')[0], // Convert to string format
        status: 'izin',
        check_in_time: null,
        check_out_time: null,
        notes: 'Permission'
      },
      {
        student_id: studentResult[0].id,
        class_id: classResult[0].id,
        teacher_id: null,
        date: today.toISOString().split('T')[0], // Convert to string format
        status: 'alpha',
        check_in_time: null,
        check_out_time: null,
        notes: 'Absent'
      }
    ]).execute();

    const query: AttendanceReportQuery = {
      status: 'hadir',
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-15')
    };

    const result = await getAttendanceReport(query);

    expect(result).toHaveLength(1);
    expect(result[0].status).toEqual('hadir');
    expect(result[0].notes).toEqual('Present');
  });

  it('should combine multiple filters correctly', async () => {
    // Create prerequisite data
    const user1Result = await db.insert(usersTable).values(testUser).returning().execute();
    const user2Result = await db.insert(usersTable).values({
      username: 'student2',
      password: 'password123',
      role: 'siswa' as const
    }).returning().execute();
    
    const class1Result = await db.insert(classesTable).values(testClass).returning().execute();
    const class2Result = await db.insert(classesTable).values({
      name: 'Class 2',
      description: 'Another test class'
    }).returning().execute();
    
    const student1Result = await db.insert(studentsTable).values({
      ...testStudent,
      user_id: user1Result[0].id,
      class_id: class1Result[0].id
    }).returning().execute();

    const student2Result = await db.insert(studentsTable).values({
      nis: 'NIS002',
      nisn: 'NISN002',
      full_name: 'Test Student 2',
      email: 'student2@test.com',
      phone: '123456789',
      address: 'Test Address',
      photo_url: null,
      user_id: user2Result[0].id,
      class_id: class2Result[0].id
    }).returning().execute();

    const today = new Date('2024-01-15');

    // Create diverse attendance records
    await db.insert(attendancesTable).values([
      {
        student_id: student1Result[0].id,
        class_id: class1Result[0].id,
        teacher_id: null,
        date: today.toISOString().split('T')[0], // Convert to string format
        status: 'hadir',
        check_in_time: new Date('2024-01-15T08:00:00Z'),
        check_out_time: null,
        notes: 'Target record'
      },
      {
        student_id: student1Result[0].id,
        class_id: class1Result[0].id,
        teacher_id: null,
        date: today.toISOString().split('T')[0], // Convert to string format
        status: 'izin',
        check_in_time: null,
        check_out_time: null,
        notes: 'Wrong status'
      },
      {
        student_id: student2Result[0].id,
        class_id: class2Result[0].id,
        teacher_id: null,
        date: today.toISOString().split('T')[0], // Convert to string format
        status: 'hadir',
        check_in_time: null,
        check_out_time: null,
        notes: 'Wrong student and class'
      }
    ]).execute();

    const query: AttendanceReportQuery = {
      student_id: student1Result[0].id,
      class_id: class1Result[0].id,
      status: 'hadir',
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-15')
    };

    const result = await getAttendanceReport(query);

    expect(result).toHaveLength(1);
    expect(result[0].student_id).toEqual(student1Result[0].id);
    expect(result[0].class_id).toEqual(class1Result[0].id);
    expect(result[0].status).toEqual('hadir');
    expect(result[0].notes).toEqual('Target record');
  });

  it('should return empty array when no records match filters', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const classResult = await db.insert(classesTable).values(testClass).returning().execute();
    
    const studentResult = await db.insert(studentsTable).values({
      ...testStudent,
      user_id: userResult[0].id,
      class_id: classResult[0].id
    }).returning().execute();

    // Create attendance with different date
    await db.insert(attendancesTable).values({
      student_id: studentResult[0].id,
      class_id: classResult[0].id,
      teacher_id: null,
      date: '2024-01-20', // Use string format directly
      status: 'hadir',
      check_in_time: null,
      check_out_time: null,
      notes: 'Outside range'
    }).execute();

    const query: AttendanceReportQuery = {
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-16')
    };

    const result = await getAttendanceReport(query);
    expect(result).toHaveLength(0);
  });

  it('should handle null values in attendance records correctly', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const classResult = await db.insert(classesTable).values(testClass).returning().execute();
    
    const studentResult = await db.insert(studentsTable).values({
      ...testStudent,
      user_id: userResult[0].id,
      class_id: classResult[0].id
    }).returning().execute();

    const today = new Date('2024-01-15');

    // Create attendance with null values
    await db.insert(attendancesTable).values({
      student_id: studentResult[0].id,
      class_id: classResult[0].id,
      teacher_id: null, // null teacher
      date: today.toISOString().split('T')[0], // Convert to string format
      status: 'alpha',
      check_in_time: null, // null check-in
      check_out_time: null, // null check-out
      notes: null // null notes
    }).execute();

    const query: AttendanceReportQuery = {
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-15')
    };

    const result = await getAttendanceReport(query);

    expect(result).toHaveLength(1);
    expect(result[0].teacher_id).toBeNull();
    expect(result[0].check_in_time).toBeNull();
    expect(result[0].check_out_time).toBeNull();
    expect(result[0].notes).toBeNull();
    expect(result[0].status).toEqual('alpha');
  });
});