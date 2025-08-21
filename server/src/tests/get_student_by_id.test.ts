import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable } from '../db/schema';
import { type CreateUserInput, type CreateClassInput, type CreateStudentInput } from '../schema';
import { getStudentById } from '../handlers/get_student_by_id';

// Test data
const testUser: CreateUserInput = {
  username: 'student1',
  password: 'password123',
  role: 'siswa'
};

const testClass: CreateClassInput = {
  name: 'Kelas 10A',
  description: 'Kelas 10A untuk tahun ajaran 2024'
};

const testStudent: CreateStudentInput = {
  user_id: 1, // Will be set after creating user
  class_id: 1, // Will be set after creating class
  nis: '1001',
  nisn: '0001234567',
  full_name: 'Ahmad Rizky',
  email: 'ahmad.rizky@email.com',
  phone: '08123456789',
  address: 'Jl. Contoh No. 123, Jakarta',
  photo_url: 'https://example.com/photo.jpg'
};

describe('getStudentById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return student by ID', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        password: testUser.password,
        role: testUser.role
      })
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values({
        name: testClass.name,
        description: testClass.description
      })
      .returning()
      .execute();

    const studentResult = await db.insert(studentsTable)
      .values({
        user_id: userResult[0].id,
        class_id: classResult[0].id,
        nis: testStudent.nis,
        nisn: testStudent.nisn,
        full_name: testStudent.full_name,
        email: testStudent.email,
        phone: testStudent.phone,
        address: testStudent.address,
        photo_url: testStudent.photo_url
      })
      .returning()
      .execute();

    const createdStudent = studentResult[0];

    // Test the handler
    const result = await getStudentById(createdStudent.id);

    // Assertions
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdStudent.id);
    expect(result!.user_id).toBe(userResult[0].id);
    expect(result!.class_id).toBe(classResult[0].id);
    expect(result!.nis).toBe('1001');
    expect(result!.nisn).toBe('0001234567');
    expect(result!.full_name).toBe('Ahmad Rizky');
    expect(result!.email).toBe('ahmad.rizky@email.com');
    expect(result!.phone).toBe('08123456789');
    expect(result!.address).toBe('Jl. Contoh No. 123, Jakarta');
    expect(result!.photo_url).toBe('https://example.com/photo.jpg');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent student ID', async () => {
    const result = await getStudentById(999);
    expect(result).toBeNull();
  });

  it('should handle student with null optional fields', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'student2',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Kelas 10B',
        description: null
      })
      .returning()
      .execute();

    // Create student with minimal required fields
    const studentResult = await db.insert(studentsTable)
      .values({
        user_id: userResult[0].id,
        class_id: classResult[0].id,
        nis: '1002',
        nisn: null,
        full_name: 'Siti Nurhaliza',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      })
      .returning()
      .execute();

    const createdStudent = studentResult[0];

    // Test the handler
    const result = await getStudentById(createdStudent.id);

    // Assertions
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdStudent.id);
    expect(result!.user_id).toBe(userResult[0].id);
    expect(result!.class_id).toBe(classResult[0].id);
    expect(result!.nis).toBe('1002');
    expect(result!.nisn).toBeNull();
    expect(result!.full_name).toBe('Siti Nurhaliza');
    expect(result!.email).toBeNull();
    expect(result!.phone).toBeNull();
    expect(result!.address).toBeNull();
    expect(result!.photo_url).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return most recent student when multiple exist', async () => {
    // Create prerequisite data
    const userResult1 = await db.insert(usersTable)
      .values({
        username: 'student3',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const userResult2 = await db.insert(usersTable)
      .values({
        username: 'student4',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Kelas 10C',
        description: 'Test class'
      })
      .returning()
      .execute();

    // Create first student
    const studentResult1 = await db.insert(studentsTable)
      .values({
        user_id: userResult1[0].id,
        class_id: classResult[0].id,
        nis: '1003',
        nisn: '0003456789',
        full_name: 'Student Three',
        email: 'student3@email.com',
        phone: null,
        address: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Create second student
    const studentResult2 = await db.insert(studentsTable)
      .values({
        user_id: userResult2[0].id,
        class_id: classResult[0].id,
        nis: '1004',
        nisn: '0004567890',
        full_name: 'Student Four',
        email: 'student4@email.com',
        phone: null,
        address: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Test getting first student
    const result1 = await getStudentById(studentResult1[0].id);
    expect(result1).not.toBeNull();
    expect(result1!.id).toBe(studentResult1[0].id);
    expect(result1!.full_name).toBe('Student Three');
    expect(result1!.nis).toBe('1003');

    // Test getting second student
    const result2 = await getStudentById(studentResult2[0].id);
    expect(result2).not.toBeNull();
    expect(result2!.id).toBe(studentResult2[0].id);
    expect(result2!.full_name).toBe('Student Four');
    expect(result2!.nis).toBe('1004');
  });

  it('should handle database query correctly', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'Test description'
      })
      .returning()
      .execute();

    const studentResult = await db.insert(studentsTable)
      .values({
        user_id: userResult[0].id,
        class_id: classResult[0].id,
        nis: '9999',
        nisn: '9999999999',
        full_name: 'Test Student',
        email: 'test@example.com',
        phone: '081234567890',
        address: 'Test Address',
        photo_url: 'https://test.com/photo.jpg'
      })
      .returning()
      .execute();

    // Get the student
    const result = await getStudentById(studentResult[0].id);

    // Verify all fields are properly returned
    expect(result).not.toBeNull();
    expect(typeof result!.id).toBe('number');
    expect(typeof result!.user_id).toBe('number');
    expect(typeof result!.class_id).toBe('number');
    expect(typeof result!.nis).toBe('string');
    expect(typeof result!.full_name).toBe('string');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify the specific values
    expect(result!.user_id).toBe(userResult[0].id);
    expect(result!.class_id).toBe(classResult[0].id);
    expect(result!.nis).toBe('9999');
    expect(result!.nisn).toBe('9999999999');
    expect(result!.full_name).toBe('Test Student');
    expect(result!.email).toBe('test@example.com');
    expect(result!.phone).toBe('081234567890');
    expect(result!.address).toBe('Test Address');
    expect(result!.photo_url).toBe('https://test.com/photo.jpg');
  });
});