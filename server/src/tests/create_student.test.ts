import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable } from '../db/schema';
import { type CreateStudentInput } from '../schema';
import { createStudent } from '../handlers/create_student';
import { eq } from 'drizzle-orm';

describe('createStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUser: any;
  let testClass: any;

  const createTestUser = async () => {
    const userResult = await db.insert(usersTable)
      .values({
        username: 'student123',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();
    
    return userResult[0];
  };

  const createTestClass = async () => {
    const classResult = await db.insert(classesTable)
      .values({
        name: 'XII IPA 1',
        description: 'Kelas XII IPA 1'
      })
      .returning()
      .execute();
    
    return classResult[0];
  };

  beforeEach(async () => {
    testUser = await createTestUser();
    testClass = await createTestClass();
  });

  const testInput: CreateStudentInput = {
    user_id: 0, // Will be set dynamically
    class_id: 0, // Will be set dynamically
    nis: '12345678',
    nisn: '0123456789',
    full_name: 'Ahmad Rizki Pratama',
    email: 'ahmad.rizki@student.com',
    phone: '081234567890',
    address: 'Jl. Merdeka No. 123, Jakarta',
    photo_url: 'https://example.com/photo.jpg'
  };

  it('should create a student with valid input', async () => {
    const input = { ...testInput, user_id: testUser.id, class_id: testClass.id };
    const result = await createStudent(input);

    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUser.id);
    expect(result.class_id).toEqual(testClass.id);
    expect(result.nis).toEqual('12345678');
    expect(result.nisn).toEqual('0123456789');
    expect(result.full_name).toEqual('Ahmad Rizki Pratama');
    expect(result.email).toEqual('ahmad.rizki@student.com');
    expect(result.phone).toEqual('081234567890');
    expect(result.address).toEqual('Jl. Merdeka No. 123, Jakarta');
    expect(result.photo_url).toEqual('https://example.com/photo.jpg');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save student to database', async () => {
    const input = { ...testInput, user_id: testUser.id, class_id: testClass.id };
    const result = await createStudent(input);

    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, result.id))
      .execute();

    expect(students).toHaveLength(1);
    expect(students[0].nis).toEqual('12345678');
    expect(students[0].full_name).toEqual('Ahmad Rizki Pratama');
    expect(students[0].user_id).toEqual(testUser.id);
    expect(students[0].class_id).toEqual(testClass.id);
  });

  it('should create student with nullable fields set to null', async () => {
    const inputWithNulls = {
      user_id: testUser.id,
      class_id: testClass.id,
      nis: '87654321',
      nisn: null,
      full_name: 'Siti Nurhaliza',
      email: null,
      phone: null,
      address: null,
      photo_url: null
    };

    const result = await createStudent(inputWithNulls);

    expect(result.nis).toEqual('87654321');
    expect(result.full_name).toEqual('Siti Nurhaliza');
    expect(result.nisn).toBeNull();
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.photo_url).toBeNull();
  });

  it('should throw error when user does not exist', async () => {
    const input = { ...testInput, user_id: 99999, class_id: testClass.id };

    await expect(createStudent(input)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should throw error when class does not exist', async () => {
    const input = { ...testInput, user_id: testUser.id, class_id: 99999 };

    await expect(createStudent(input)).rejects.toThrow(/Class with id 99999 not found/i);
  });

  it('should throw error when user role is not siswa', async () => {
    // Create a user with 'guru' role
    const guruUser = await db.insert(usersTable)
      .values({
        username: 'teacher123',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const input = { ...testInput, user_id: guruUser[0].id, class_id: testClass.id };

    await expect(createStudent(input)).rejects.toThrow(/must have 'siswa' role/i);
  });

  it('should handle duplicate NIS error', async () => {
    const input1 = { ...testInput, user_id: testUser.id, class_id: testClass.id };
    await createStudent(input1);

    // Create another user for second student
    const secondUser = await db.insert(usersTable)
      .values({
        username: 'student456',
        password: 'password456',
        role: 'siswa'
      })
      .returning()
      .execute();

    // Try to create another student with the same NIS
    const input2 = { ...testInput, user_id: secondUser[0].id, class_id: testClass.id };
    
    await expect(createStudent(input2)).rejects.toThrow();
  });

  it('should create multiple students for the same class', async () => {
    // Create second user
    const secondUser = await db.insert(usersTable)
      .values({
        username: 'student456',
        password: 'password456',
        role: 'siswa'
      })
      .returning()
      .execute();

    const input1 = { ...testInput, user_id: testUser.id, class_id: testClass.id };
    const input2 = { 
      ...testInput, 
      user_id: secondUser[0].id, 
      class_id: testClass.id,
      nis: '87654321',
      full_name: 'Budi Santoso'
    };

    const student1 = await createStudent(input1);
    const student2 = await createStudent(input2);

    expect(student1.class_id).toEqual(testClass.id);
    expect(student2.class_id).toEqual(testClass.id);
    expect(student1.id).not.toEqual(student2.id);
    expect(student1.nis).not.toEqual(student2.nis);
  });

  it('should create student with admin role user should fail', async () => {
    // Create admin user
    const adminUser = await db.insert(usersTable)
      .values({
        username: 'admin123',
        password: 'password123',
        role: 'admin'
      })
      .returning()
      .execute();

    const input = { ...testInput, user_id: adminUser[0].id, class_id: testClass.id };

    await expect(createStudent(input)).rejects.toThrow(/must have 'siswa' role/i);
  });
});