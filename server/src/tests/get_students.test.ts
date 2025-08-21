import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable } from '../db/schema';
import { getStudents } from '../handlers/get_students';
import { type CreateUserInput, type CreateClassInput, type CreateStudentInput } from '../schema';

// Test data
const testUser: CreateUserInput = {
  username: 'student1',
  password: 'password123',
  role: 'siswa'
};

const testUser2: CreateUserInput = {
  username: 'student2',
  password: 'password123',
  role: 'siswa'
};

const testClass: CreateClassInput = {
  name: '10-A',
  description: 'Kelas 10 A'
};

const testClass2: CreateClassInput = {
  name: '10-B',
  description: 'Kelas 10 B'
};

describe('getStudents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no students exist', async () => {
    const result = await getStudents();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should fetch all students with complete information', async () => {
    // Create prerequisite data
    const userResults = await db.insert(usersTable)
      .values([testUser, testUser2])
      .returning()
      .execute();

    const classResults = await db.insert(classesTable)
      .values([testClass, testClass2])
      .returning()
      .execute();

    const testStudent1: CreateStudentInput = {
      user_id: userResults[0].id,
      class_id: classResults[0].id,
      nis: '12345',
      nisn: '1234567890',
      full_name: 'Ahmad Fauzi',
      email: 'ahmad.fauzi@example.com',
      phone: '08123456789',
      address: 'Jl. Merdeka No. 1',
      photo_url: 'https://example.com/photo1.jpg'
    };

    const testStudent2: CreateStudentInput = {
      user_id: userResults[1].id,
      class_id: classResults[1].id,
      nis: '67890',
      nisn: null,
      full_name: 'Siti Aminah',
      email: null,
      phone: null,
      address: null,
      photo_url: null
    };

    await db.insert(studentsTable)
      .values([testStudent1, testStudent2])
      .execute();

    const result = await getStudents();

    expect(result).toHaveLength(2);

    // Check first student
    const student1 = result.find(s => s.nis === '12345');
    expect(student1).toBeDefined();
    expect(student1!.user_id).toEqual(userResults[0].id);
    expect(student1!.class_id).toEqual(classResults[0].id);
    expect(student1!.nis).toEqual('12345');
    expect(student1!.nisn).toEqual('1234567890');
    expect(student1!.full_name).toEqual('Ahmad Fauzi');
    expect(student1!.email).toEqual('ahmad.fauzi@example.com');
    expect(student1!.phone).toEqual('08123456789');
    expect(student1!.address).toEqual('Jl. Merdeka No. 1');
    expect(student1!.photo_url).toEqual('https://example.com/photo1.jpg');
    expect(student1!.created_at).toBeInstanceOf(Date);
    expect(student1!.updated_at).toBeInstanceOf(Date);

    // Check second student (with nullable fields)
    const student2 = result.find(s => s.nis === '67890');
    expect(student2).toBeDefined();
    expect(student2!.user_id).toEqual(userResults[1].id);
    expect(student2!.class_id).toEqual(classResults[1].id);
    expect(student2!.nis).toEqual('67890');
    expect(student2!.nisn).toBeNull();
    expect(student2!.full_name).toEqual('Siti Aminah');
    expect(student2!.email).toBeNull();
    expect(student2!.phone).toBeNull();
    expect(student2!.address).toBeNull();
    expect(student2!.photo_url).toBeNull();
  });

  it('should fetch students from multiple classes', async () => {
    // Create test data with students from different classes
    const userResults = await db.insert(usersTable)
      .values([testUser, testUser2])
      .returning()
      .execute();

    const classResults = await db.insert(classesTable)
      .values([testClass, testClass2])
      .returning()
      .execute();

    const testStudents: CreateStudentInput[] = [
      {
        user_id: userResults[0].id,
        class_id: classResults[0].id,
        nis: '10001',
        nisn: '1234567890',
        full_name: 'Student Class A',
        email: 'student.a@example.com',
        phone: '08111111111',
        address: 'Address A',
        photo_url: null
      },
      {
        user_id: userResults[1].id,
        class_id: classResults[1].id,
        nis: '10002',
        nisn: '0987654321',
        full_name: 'Student Class B',
        email: 'student.b@example.com',
        phone: '08222222222',
        address: 'Address B',
        photo_url: null
      }
    ];

    await db.insert(studentsTable)
      .values(testStudents)
      .execute();

    const result = await getStudents();

    expect(result).toHaveLength(2);

    // Verify students are from different classes
    const classIds = result.map(student => student.class_id);
    expect(classIds).toContain(classResults[0].id);
    expect(classIds).toContain(classResults[1].id);
    expect(new Set(classIds)).toHaveLength(2); // Should have 2 unique class IDs
  });

  it('should maintain proper data types', async () => {
    // Create minimal test data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    const testStudent: CreateStudentInput = {
      user_id: userResult[0].id,
      class_id: classResult[0].id,
      nis: '99999',
      nisn: '9999999999',
      full_name: 'Test Student Types',
      email: 'types@example.com',
      phone: '08999999999',
      address: 'Test Address',
      photo_url: 'https://example.com/photo.jpg'
    };

    await db.insert(studentsTable)
      .values(testStudent)
      .execute();

    const result = await getStudents();

    expect(result).toHaveLength(1);

    const student = result[0];
    expect(typeof student.id).toBe('number');
    expect(typeof student.user_id).toBe('number');
    expect(typeof student.class_id).toBe('number');
    expect(typeof student.nis).toBe('string');
    expect(typeof student.nisn).toBe('string');
    expect(typeof student.full_name).toBe('string');
    expect(typeof student.email).toBe('string');
    expect(typeof student.phone).toBe('string');
    expect(typeof student.address).toBe('string');
    expect(typeof student.photo_url).toBe('string');
    expect(student.created_at).toBeInstanceOf(Date);
    expect(student.updated_at).toBeInstanceOf(Date);
  });

  it('should handle students with mixed nullable fields correctly', async () => {
    // Create users and class
    const userResults = await db.insert(usersTable)
      .values([testUser, testUser2])
      .returning()
      .execute();

    const classResult = await db.insert(classesTable)
      .values(testClass)
      .returning()
      .execute();

    // Create students with different combinations of null/non-null fields
    const testStudents: CreateStudentInput[] = [
      {
        user_id: userResults[0].id,
        class_id: classResult[0].id,
        nis: '11111',
        nisn: '1111111111',
        full_name: 'Full Info Student',
        email: 'full@example.com',
        phone: '08111111111',
        address: 'Full Address',
        photo_url: 'https://example.com/full.jpg'
      },
      {
        user_id: userResults[1].id,
        class_id: classResult[0].id,
        nis: '22222',
        nisn: null,
        full_name: 'Partial Info Student',
        email: null,
        phone: '08222222222',
        address: null,
        photo_url: null
      }
    ];

    await db.insert(studentsTable)
      .values(testStudents)
      .execute();

    const result = await getStudents();

    expect(result).toHaveLength(2);

    const fullInfoStudent = result.find(s => s.nis === '11111');
    const partialInfoStudent = result.find(s => s.nis === '22222');

    // Full info student should have all fields
    expect(fullInfoStudent!.nisn).toEqual('1111111111');
    expect(fullInfoStudent!.email).toEqual('full@example.com');
    expect(fullInfoStudent!.phone).toEqual('08111111111');
    expect(fullInfoStudent!.address).toEqual('Full Address');
    expect(fullInfoStudent!.photo_url).toEqual('https://example.com/full.jpg');

    // Partial info student should have null values where expected
    expect(partialInfoStudent!.nisn).toBeNull();
    expect(partialInfoStudent!.email).toBeNull();
    expect(partialInfoStudent!.phone).toEqual('08222222222');
    expect(partialInfoStudent!.address).toBeNull();
    expect(partialInfoStudent!.photo_url).toBeNull();
  });
});