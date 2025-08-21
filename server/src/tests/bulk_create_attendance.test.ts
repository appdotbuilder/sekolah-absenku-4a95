import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, teachersTable, attendancesTable } from '../db/schema';
import { type CreateAttendanceInput } from '../schema';
import { bulkCreateAttendance } from '../handlers/bulk_create_attendance';
import { eq } from 'drizzle-orm';

// Create test data
let testUser: any;
let testClass: any;
let testStudent: any;
let testTeacher: any;

const setupTestData = async () => {
  // Create test user for student
  const userData = {
    username: 'teststudent',
    password: 'password123',
    role: 'siswa' as const
  };
  
  const users = await db.insert(usersTable)
    .values(userData)
    .returning()
    .execute();
  testUser = users[0];

  // Create test teacher user
  const teacherUserData = {
    username: 'testteacher',
    password: 'password123',
    role: 'guru' as const
  };
  
  const teacherUsers = await db.insert(usersTable)
    .values(teacherUserData)
    .returning()
    .execute();

  // Create test class
  const classData = {
    name: 'Test Class 10A',
    description: 'Test class for bulk attendance'
  };
  
  const classes = await db.insert(classesTable)
    .values(classData)
    .returning()
    .execute();
  testClass = classes[0];

  // Create test student
  const studentData = {
    user_id: testUser.id,
    class_id: testClass.id,
    nis: '123456789',
    nisn: '987654321',
    full_name: 'Test Student',
    email: 'student@test.com',
    phone: '081234567890',
    address: 'Test Address',
    photo_url: null
  };
  
  const students = await db.insert(studentsTable)
    .values(studentData)
    .returning()
    .execute();
  testStudent = students[0];

  // Create test teacher
  const teacherData = {
    user_id: teacherUsers[0].id,
    nip: 'T123456789',
    full_name: 'Test Teacher',
    email: 'teacher@test.com',
    phone: '081234567890',
    address: 'Teacher Address',
    photo_url: null
  };
  
  const teachers = await db.insert(teachersTable)
    .values(teacherData)
    .returning()
    .execute();
  testTeacher = teachers[0];
};

describe('bulkCreateAttendance', () => {
  beforeEach(async () => {
    await createDB();
    await setupTestData();
  });
  
  afterEach(resetDB);

  it('should create multiple attendance records at once', async () => {
    const attendanceDate = new Date('2024-01-15');
    const checkInTime = new Date('2024-01-15T07:30:00');
    
    const attendanceRecords: CreateAttendanceInput[] = [
      {
        student_id: testStudent.id,
        class_id: testClass.id,
        teacher_id: testTeacher.id,
        date: attendanceDate,
        status: 'hadir',
        check_in_time: checkInTime,
        check_out_time: null,
        notes: 'Present and on time'
      },
      {
        student_id: testStudent.id,
        class_id: testClass.id,
        teacher_id: testTeacher.id,
        date: new Date('2024-01-16'),
        status: 'izin',
        check_in_time: null,
        check_out_time: null,
        notes: 'Family emergency'
      }
    ];

    const results = await bulkCreateAttendance(attendanceRecords);

    expect(results).toHaveLength(2);
    
    // Verify first record
    expect(results[0].student_id).toEqual(testStudent.id);
    expect(results[0].class_id).toEqual(testClass.id);
    expect(results[0].teacher_id).toEqual(testTeacher.id);
    expect(results[0].status).toEqual('hadir');
    expect(results[0].notes).toEqual('Present and on time');
    expect(results[0].id).toBeDefined();
    expect(results[0].created_at).toBeInstanceOf(Date);
    
    // Verify second record
    expect(results[1].student_id).toEqual(testStudent.id);
    expect(results[1].status).toEqual('izin');
    expect(results[1].notes).toEqual('Family emergency');
    expect(results[1].check_in_time).toBeNull();
    expect(results[1].check_out_time).toBeNull();
  });

  it('should save all records to database', async () => {
    const attendanceRecords: CreateAttendanceInput[] = [
      {
        student_id: testStudent.id,
        class_id: testClass.id,
        teacher_id: testTeacher.id,
        date: new Date('2024-01-15'),
        status: 'hadir',
        check_in_time: new Date('2024-01-15T08:00:00'),
        check_out_time: new Date('2024-01-15T14:00:00'),
        notes: 'Full day attendance'
      },
      {
        student_id: testStudent.id,
        class_id: testClass.id,
        teacher_id: null,
        date: new Date('2024-01-16'),
        status: 'sakit',
        check_in_time: null,
        check_out_time: null,
        notes: 'Doctor visit'
      }
    ];

    const results = await bulkCreateAttendance(attendanceRecords);

    // Query database to verify records were saved
    const savedRecords = await db.select()
      .from(attendancesTable)
      .where(eq(attendancesTable.student_id, testStudent.id))
      .execute();

    expect(savedRecords).toHaveLength(2);
    
    // Sort by date for consistent comparison
    savedRecords.sort((a, b) => a.date.localeCompare(b.date));
    
    expect(savedRecords[0].status).toEqual('hadir');
    expect(savedRecords[0].teacher_id).toEqual(testTeacher.id);
    expect(savedRecords[0].notes).toEqual('Full day attendance');
    expect(savedRecords[0].check_in_time).toBeInstanceOf(Date);
    expect(savedRecords[0].check_out_time).toBeInstanceOf(Date);
    
    expect(savedRecords[1].status).toEqual('sakit');
    expect(savedRecords[1].teacher_id).toBeNull();
    expect(savedRecords[1].notes).toEqual('Doctor visit');
  });

  it('should handle empty array input', async () => {
    const result = await bulkCreateAttendance([]);
    
    expect(result).toHaveLength(0);
    
    // Verify no records were created in database
    const allRecords = await db.select()
      .from(attendancesTable)
      .execute();
    
    expect(allRecords).toHaveLength(0);
  });

  it('should handle records with null optional fields', async () => {
    const attendanceRecords: CreateAttendanceInput[] = [
      {
        student_id: testStudent.id,
        class_id: testClass.id,
        teacher_id: null,
        date: new Date('2024-01-15'),
        status: 'alpha',
        check_in_time: null,
        check_out_time: null,
        notes: null
      }
    ];

    const results = await bulkCreateAttendance(attendanceRecords);

    expect(results).toHaveLength(1);
    expect(results[0].teacher_id).toBeNull();
    expect(results[0].check_in_time).toBeNull();
    expect(results[0].check_out_time).toBeNull();
    expect(results[0].notes).toBeNull();
    expect(results[0].status).toEqual('alpha');
  });

  it('should handle different attendance statuses', async () => {
    const attendanceRecords: CreateAttendanceInput[] = [
      {
        student_id: testStudent.id,
        class_id: testClass.id,
        teacher_id: testTeacher.id,
        date: new Date('2024-01-15'),
        status: 'hadir',
        check_in_time: new Date('2024-01-15T08:00:00'),
        check_out_time: null,
        notes: 'Present'
      },
      {
        student_id: testStudent.id,
        class_id: testClass.id,
        teacher_id: testTeacher.id,
        date: new Date('2024-01-16'),
        status: 'izin',
        check_in_time: null,
        check_out_time: null,
        notes: 'Permission'
      },
      {
        student_id: testStudent.id,
        class_id: testClass.id,
        teacher_id: testTeacher.id,
        date: new Date('2024-01-17'),
        status: 'sakit',
        check_in_time: null,
        check_out_time: null,
        notes: 'Sick'
      },
      {
        student_id: testStudent.id,
        class_id: testClass.id,
        teacher_id: testTeacher.id,
        date: new Date('2024-01-18'),
        status: 'alpha',
        check_in_time: null,
        check_out_time: null,
        notes: 'Absent without permission'
      }
    ];

    const results = await bulkCreateAttendance(attendanceRecords);

    expect(results).toHaveLength(4);
    
    const statuses = results.map(r => r.status).sort();
    expect(statuses).toEqual(['alpha', 'hadir', 'izin', 'sakit']);
  });

  it('should throw error when referencing non-existent student', async () => {
    const attendanceRecords: CreateAttendanceInput[] = [
      {
        student_id: 99999, // Non-existent student ID
        class_id: testClass.id,
        teacher_id: testTeacher.id,
        date: new Date('2024-01-15'),
        status: 'hadir',
        check_in_time: new Date('2024-01-15T08:00:00'),
        check_out_time: null,
        notes: 'Test'
      }
    ];

    await expect(bulkCreateAttendance(attendanceRecords)).rejects.toThrow();
  });

  it('should throw error when referencing non-existent class', async () => {
    const attendanceRecords: CreateAttendanceInput[] = [
      {
        student_id: testStudent.id,
        class_id: 99999, // Non-existent class ID
        teacher_id: testTeacher.id,
        date: new Date('2024-01-15'),
        status: 'hadir',
        check_in_time: new Date('2024-01-15T08:00:00'),
        check_out_time: null,
        notes: 'Test'
      }
    ];

    await expect(bulkCreateAttendance(attendanceRecords)).rejects.toThrow();
  });

  it('should throw error when referencing non-existent teacher', async () => {
    const attendanceRecords: CreateAttendanceInput[] = [
      {
        student_id: testStudent.id,
        class_id: testClass.id,
        teacher_id: 99999, // Non-existent teacher ID
        date: new Date('2024-01-15'),
        status: 'hadir',
        check_in_time: new Date('2024-01-15T08:00:00'),
        check_out_time: null,
        notes: 'Test'
      }
    ];

    await expect(bulkCreateAttendance(attendanceRecords)).rejects.toThrow();
  });
});