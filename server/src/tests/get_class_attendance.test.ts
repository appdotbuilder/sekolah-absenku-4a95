import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, teachersTable, attendancesTable } from '../db/schema';
import { getClassAttendance } from '../handlers/get_class_attendance';
import { eq } from 'drizzle-orm';

describe('getClassAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return attendance records for specific class and date', async () => {
    // Create test users
    const userResults = await db.insert(usersTable)
      .values([
        { username: 'student1', password: 'password123', role: 'siswa' },
        { username: 'student2', password: 'password123', role: 'siswa' },
        { username: 'teacher1', password: 'password123', role: 'guru' }
      ])
      .returning()
      .execute();

    const [studentUser1, studentUser2, teacherUser] = userResults;

    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Kelas X-A',
        description: 'Test class'
      })
      .returning()
      .execute();

    const testClass = classResult[0];

    // Create test students
    const studentResults = await db.insert(studentsTable)
      .values([
        {
          user_id: studentUser1.id,
          class_id: testClass.id,
          nis: '12345',
          nisn: 'NISN12345',
          full_name: 'Student One',
          email: 'student1@test.com'
        },
        {
          user_id: studentUser2.id,
          class_id: testClass.id,
          nis: '12346',
          nisn: 'NISN12346',
          full_name: 'Student Two',
          email: 'student2@test.com'
        }
      ])
      .returning()
      .execute();

    const [student1, student2] = studentResults;

    // Create test teacher
    const teacherResult = await db.insert(teachersTable)
      .values({
        user_id: teacherUser.id,
        nip: 'T12345',
        full_name: 'Teacher One',
        email: 'teacher1@test.com'
      })
      .returning()
      .execute();

    const teacher = teacherResult[0];

    // Create attendance records for today
    const testDate = new Date('2024-01-15');
    await db.insert(attendancesTable)
      .values([
        {
          student_id: student1.id,
          class_id: testClass.id,
          teacher_id: teacher.id,
          date: '2024-01-15',
          status: 'hadir',
          check_in_time: new Date('2024-01-15T08:00:00Z'),
          notes: 'On time'
        },
        {
          student_id: student2.id,
          class_id: testClass.id,
          teacher_id: teacher.id,
          date: '2024-01-15',
          status: 'izin',
          notes: 'Family event'
        }
      ])
      .execute();

    // Test the handler
    const result = await getClassAttendance(testClass.id, testDate);

    expect(result).toHaveLength(2);
    
    // Verify attendance data
    const presentStudent = result.find(att => att.student_id === student1.id);
    const absentStudent = result.find(att => att.student_id === student2.id);

    expect(presentStudent).toBeDefined();
    expect(presentStudent?.status).toBe('hadir');
    expect(presentStudent?.date).toBeInstanceOf(Date);
    expect(presentStudent?.check_in_time).toBeInstanceOf(Date);
    expect(presentStudent?.notes).toBe('On time');

    expect(absentStudent).toBeDefined();
    expect(absentStudent?.status).toBe('izin');
    expect(absentStudent?.date).toBeInstanceOf(Date);
    expect(absentStudent?.check_in_time).toBeNull();
    expect(absentStudent?.notes).toBe('Family event');
  });

  it('should return empty array when no attendance records exist for class and date', async () => {
    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Empty Class',
        description: 'Test class with no attendance'
      })
      .returning()
      .execute();

    const testClass = classResult[0];
    const testDate = new Date('2024-01-15');

    const result = await getClassAttendance(testClass.id, testDate);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return only attendance records for specified date', async () => {
    // Create test users and class
    const userResult = await db.insert(usersTable)
      .values({ username: 'student1', password: 'password123', role: 'siswa' })
      .returning()
      .execute();

    const studentUser = userResult[0];

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'Test class'
      })
      .returning()
      .execute();

    const testClass = classResult[0];

    const studentResult = await db.insert(studentsTable)
      .values({
        user_id: studentUser.id,
        class_id: testClass.id,
        nis: '12345',
        full_name: 'Test Student'
      })
      .returning()
      .execute();

    const student = studentResult[0];

    // Create attendance records for different dates
    await db.insert(attendancesTable)
      .values([
        {
          student_id: student.id,
          class_id: testClass.id,
          date: '2024-01-15',
          status: 'hadir'
        },
        {
          student_id: student.id,
          class_id: testClass.id,
          date: '2024-01-16',
          status: 'alpha'
        }
      ])
      .execute();

    // Query for specific date
    const result = await getClassAttendance(testClass.id, new Date('2024-01-15'));

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('hadir');
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].date.toISOString().split('T')[0]).toBe('2024-01-15');
  });

  it('should return only attendance records for specified class', async () => {
    // Create test users
    const userResults = await db.insert(usersTable)
      .values([
        { username: 'student1', password: 'password123', role: 'siswa' },
        { username: 'student2', password: 'password123', role: 'siswa' }
      ])
      .returning()
      .execute();

    const [studentUser1, studentUser2] = userResults;

    // Create test classes
    const classResults = await db.insert(classesTable)
      .values([
        { name: 'Class A', description: 'Test class A' },
        { name: 'Class B', description: 'Test class B' }
      ])
      .returning()
      .execute();

    const [classA, classB] = classResults;

    // Create students in different classes
    const studentResults = await db.insert(studentsTable)
      .values([
        {
          user_id: studentUser1.id,
          class_id: classA.id,
          nis: '12345',
          full_name: 'Student in Class A'
        },
        {
          user_id: studentUser2.id,
          class_id: classB.id,
          nis: '12346',
          full_name: 'Student in Class B'
        }
      ])
      .returning()
      .execute();

    const [studentA, studentB] = studentResults;

    // Create attendance records for same date but different classes
    const testDate = '2024-01-15';
    await db.insert(attendancesTable)
      .values([
        {
          student_id: studentA.id,
          class_id: classA.id,
          date: testDate,
          status: 'hadir'
        },
        {
          student_id: studentB.id,
          class_id: classB.id,
          date: testDate,
          status: 'izin'
        }
      ])
      .execute();

    // Query for Class A only
    const result = await getClassAttendance(classA.id, new Date(testDate));

    expect(result).toHaveLength(1);
    expect(result[0].class_id).toBe(classA.id);
    expect(result[0].student_id).toBe(studentA.id);
    expect(result[0].status).toBe('hadir');
  });

  it('should handle all attendance status types correctly', async () => {
    // Create test user, class, and student
    const userResult = await db.insert(usersTable)
      .values({ username: 'student1', password: 'password123', role: 'siswa' })
      .returning()
      .execute();

    const studentUser = userResult[0];

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'Test class'
      })
      .returning()
      .execute();

    const testClass = classResult[0];

    const studentResult = await db.insert(studentsTable)
      .values({
        user_id: studentUser.id,
        class_id: testClass.id,
        nis: '12345',
        full_name: 'Test Student'
      })
      .returning()
      .execute();

    const student = studentResult[0];

    // Create attendance records with different statuses on different dates
    await db.insert(attendancesTable)
      .values([
        {
          student_id: student.id,
          class_id: testClass.id,
          date: '2024-01-15',
          status: 'hadir'
        },
        {
          student_id: student.id,
          class_id: testClass.id,
          date: '2024-01-16',
          status: 'izin'
        },
        {
          student_id: student.id,
          class_id: testClass.id,
          date: '2024-01-17',
          status: 'sakit'
        },
        {
          student_id: student.id,
          class_id: testClass.id,
          date: '2024-01-18',
          status: 'alpha'
        }
      ])
      .execute();

    // Test each status type
    const presentResult = await getClassAttendance(testClass.id, new Date('2024-01-15'));
    expect(presentResult[0].status).toBe('hadir');

    const permissionResult = await getClassAttendance(testClass.id, new Date('2024-01-16'));
    expect(permissionResult[0].status).toBe('izin');

    const sickResult = await getClassAttendance(testClass.id, new Date('2024-01-17'));
    expect(sickResult[0].status).toBe('sakit');

    const absentResult = await getClassAttendance(testClass.id, new Date('2024-01-18'));
    expect(absentResult[0].status).toBe('alpha');
  });

  it('should handle attendance records with and without teacher assignment', async () => {
    // Create test users
    const userResults = await db.insert(usersTable)
      .values([
        { username: 'student1', password: 'password123', role: 'siswa' },
        { username: 'teacher1', password: 'password123', role: 'guru' }
      ])
      .returning()
      .execute();

    const [studentUser, teacherUser] = userResults;

    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'Test class'
      })
      .returning()
      .execute();

    const testClass = classResult[0];

    // Create student
    const studentResult = await db.insert(studentsTable)
      .values({
        user_id: studentUser.id,
        class_id: testClass.id,
        nis: '12345',
        full_name: 'Test Student'
      })
      .returning()
      .execute();

    const student = studentResult[0];

    // Create teacher
    const teacherResult = await db.insert(teachersTable)
      .values({
        user_id: teacherUser.id,
        nip: 'T12345',
        full_name: 'Test Teacher'
      })
      .returning()
      .execute();

    const teacher = teacherResult[0];

    // Create attendance records - one with teacher, one without (self-recorded)
    await db.insert(attendancesTable)
      .values([
        {
          student_id: student.id,
          class_id: testClass.id,
          teacher_id: teacher.id,
          date: '2024-01-15',
          status: 'hadir',
          notes: 'Teacher recorded'
        },
        {
          student_id: student.id,
          class_id: testClass.id,
          teacher_id: null,
          date: '2024-01-16',
          status: 'hadir',
          notes: 'Self recorded'
        }
      ])
      .execute();

    // Test teacher-recorded attendance
    const teacherRecorded = await getClassAttendance(testClass.id, new Date('2024-01-15'));
    expect(teacherRecorded).toHaveLength(1);
    expect(teacherRecorded[0].teacher_id).toBe(teacher.id);
    expect(teacherRecorded[0].notes).toBe('Teacher recorded');

    // Test self-recorded attendance
    const selfRecorded = await getClassAttendance(testClass.id, new Date('2024-01-16'));
    expect(selfRecorded).toHaveLength(1);
    expect(selfRecorded[0].teacher_id).toBeNull();
    expect(selfRecorded[0].notes).toBe('Self recorded');
  });
});