import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studentsTable, teachersTable, classesTable } from '../db/schema';
import { getCurrentUser } from '../handlers/get_current_user';
import { eq } from 'drizzle-orm';

describe('getCurrentUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent user', async () => {
    const result = await getCurrentUser(999);
    expect(result).toBeNull();
  });

  it('should return user data for admin role', async () => {
    // Create admin user
    const adminUsers = await db.insert(usersTable)
      .values({
        username: 'admin1',
        password: 'password123',
        role: 'admin'
      })
      .returning()
      .execute();

    const adminUser = adminUsers[0];

    const result = await getCurrentUser(adminUser.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(adminUser.id);
    expect(result!.username).toEqual('admin1');
    expect(result!.role).toEqual('admin');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect((result as any).profile).toBeUndefined();
  });

  it('should return user with student profile for siswa role', async () => {
    // Create class first
    const classes = await db.insert(classesTable)
      .values({
        name: 'Class 10A',
        description: 'Grade 10 Class A'
      })
      .returning()
      .execute();

    const testClass = classes[0];

    // Create student user
    const studentUsers = await db.insert(usersTable)
      .values({
        username: 'student1',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const studentUser = studentUsers[0];

    // Create student profile
    const students = await db.insert(studentsTable)
      .values({
        user_id: studentUser.id,
        class_id: testClass.id,
        nis: '123456',
        nisn: '1234567890',
        full_name: 'John Doe Student',
        email: 'john@student.com',
        phone: '081234567890',
        address: 'Jl. Student No. 1',
        photo_url: 'http://example.com/photo.jpg'
      })
      .returning()
      .execute();

    const student = students[0];

    const result = await getCurrentUser(studentUser.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(studentUser.id);
    expect(result!.username).toEqual('student1');
    expect(result!.role).toEqual('siswa');
    
    const resultWithProfile = result as any;
    expect(resultWithProfile.profile).toBeDefined();
    expect(resultWithProfile.profile.id).toEqual(student.id);
    expect(resultWithProfile.profile.class_id).toEqual(testClass.id);
    expect(resultWithProfile.profile.nis).toEqual('123456');
    expect(resultWithProfile.profile.nisn).toEqual('1234567890');
    expect(resultWithProfile.profile.full_name).toEqual('John Doe Student');
    expect(resultWithProfile.profile.email).toEqual('john@student.com');
    expect(resultWithProfile.profile.phone).toEqual('081234567890');
    expect(resultWithProfile.profile.address).toEqual('Jl. Student No. 1');
    expect(resultWithProfile.profile.photo_url).toEqual('http://example.com/photo.jpg');
  });

  it('should return user with teacher profile for guru role', async () => {
    // Create teacher user
    const teacherUsers = await db.insert(usersTable)
      .values({
        username: 'teacher1',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const teacherUser = teacherUsers[0];

    // Create teacher profile
    const teachers = await db.insert(teachersTable)
      .values({
        user_id: teacherUser.id,
        nip: '987654',
        full_name: 'Jane Doe Teacher',
        email: 'jane@teacher.com',
        phone: '087654321098',
        address: 'Jl. Teacher No. 2',
        photo_url: 'http://example.com/teacher.jpg'
      })
      .returning()
      .execute();

    const teacher = teachers[0];

    const result = await getCurrentUser(teacherUser.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(teacherUser.id);
    expect(result!.username).toEqual('teacher1');
    expect(result!.role).toEqual('guru');
    
    const resultWithProfile = result as any;
    expect(resultWithProfile.profile).toBeDefined();
    expect(resultWithProfile.profile.id).toEqual(teacher.id);
    expect(resultWithProfile.profile.nip).toEqual('987654');
    expect(resultWithProfile.profile.full_name).toEqual('Jane Doe Teacher');
    expect(resultWithProfile.profile.email).toEqual('jane@teacher.com');
    expect(resultWithProfile.profile.phone).toEqual('087654321098');
    expect(resultWithProfile.profile.address).toEqual('Jl. Teacher No. 2');
    expect(resultWithProfile.profile.photo_url).toEqual('http://example.com/teacher.jpg');
  });

  it('should return base user data for siswa without student profile', async () => {
    // Create student user without profile
    const studentUsers = await db.insert(usersTable)
      .values({
        username: 'orphan_student',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const studentUser = studentUsers[0];

    const result = await getCurrentUser(studentUser.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(studentUser.id);
    expect(result!.username).toEqual('orphan_student');
    expect(result!.role).toEqual('siswa');
    expect((result as any).profile).toBeUndefined();
  });

  it('should return base user data for guru without teacher profile', async () => {
    // Create teacher user without profile
    const teacherUsers = await db.insert(usersTable)
      .values({
        username: 'orphan_teacher',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const teacherUser = teacherUsers[0];

    const result = await getCurrentUser(teacherUser.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(teacherUser.id);
    expect(result!.username).toEqual('orphan_teacher');
    expect(result!.role).toEqual('guru');
    expect((result as any).profile).toBeUndefined();
  });

  it('should handle student with nullable fields', async () => {
    // Create class first
    const classes = await db.insert(classesTable)
      .values({
        name: 'Class 11B',
        description: null
      })
      .returning()
      .execute();

    const testClass = classes[0];

    // Create student user
    const studentUsers = await db.insert(usersTable)
      .values({
        username: 'minimal_student',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const studentUser = studentUsers[0];

    // Create minimal student profile with nullable fields
    const students = await db.insert(studentsTable)
      .values({
        user_id: studentUser.id,
        class_id: testClass.id,
        nis: '654321',
        nisn: null,
        full_name: 'Minimal Student',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      })
      .returning()
      .execute();

    const student = students[0];

    const result = await getCurrentUser(studentUser.id);

    expect(result).not.toBeNull();
    const resultWithProfile = result as any;
    expect(resultWithProfile.profile).toBeDefined();
    expect(resultWithProfile.profile.nis).toEqual('654321');
    expect(resultWithProfile.profile.nisn).toBeNull();
    expect(resultWithProfile.profile.email).toBeNull();
    expect(resultWithProfile.profile.phone).toBeNull();
    expect(resultWithProfile.profile.address).toBeNull();
    expect(resultWithProfile.profile.photo_url).toBeNull();
  });

  it('should handle teacher with nullable fields', async () => {
    // Create teacher user
    const teacherUsers = await db.insert(usersTable)
      .values({
        username: 'minimal_teacher',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const teacherUser = teacherUsers[0];

    // Create minimal teacher profile with nullable fields
    const teachers = await db.insert(teachersTable)
      .values({
        user_id: teacherUser.id,
        nip: '456789',
        full_name: 'Minimal Teacher',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      })
      .returning()
      .execute();

    const teacher = teachers[0];

    const result = await getCurrentUser(teacherUser.id);

    expect(result).not.toBeNull();
    const resultWithProfile = result as any;
    expect(resultWithProfile.profile).toBeDefined();
    expect(resultWithProfile.profile.nip).toEqual('456789');
    expect(resultWithProfile.profile.email).toBeNull();
    expect(resultWithProfile.profile.phone).toBeNull();
    expect(resultWithProfile.profile.address).toBeNull();
    expect(resultWithProfile.profile.photo_url).toBeNull();
  });
});