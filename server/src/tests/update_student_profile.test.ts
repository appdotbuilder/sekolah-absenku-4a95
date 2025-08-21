import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable } from '../db/schema';
import { type UpdateProfileInput } from '../schema';
import { updateStudentProfile } from '../handlers/update_student_profile';
import { eq } from 'drizzle-orm';

describe('updateStudentProfile', () => {
  let testUserId: number;
  let testClassId: number;
  let testStudentId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'student123',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class'
      })
      .returning()
      .execute();
    testClassId = classResult[0].id;

    // Create test student
    const studentResult = await db.insert(studentsTable)
      .values({
        user_id: testUserId,
        class_id: testClassId,
        nis: '12345',
        nisn: 'NISN12345',
        full_name: 'Original Name',
        email: 'original@test.com',
        phone: '081234567890',
        address: 'Original Address',
        photo_url: 'https://example.com/original.jpg'
      })
      .returning()
      .execute();
    testStudentId = studentResult[0].id;
  });

  afterEach(resetDB);

  it('should update student profile with all fields', async () => {
    const input: UpdateProfileInput = {
      full_name: 'Updated Name',
      email: 'updated@test.com',
      phone: '081987654321',
      address: 'Updated Address',
      photo_url: 'https://example.com/updated.jpg'
    };

    const result = await updateStudentProfile(testStudentId, input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testStudentId);
    expect(result!.full_name).toEqual('Updated Name');
    expect(result!.email).toEqual('updated@test.com');
    expect(result!.phone).toEqual('081987654321');
    expect(result!.address).toEqual('Updated Address');
    expect(result!.photo_url).toEqual('https://example.com/updated.jpg');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const input: UpdateProfileInput = {
      full_name: 'Partially Updated Name',
      email: 'partial@test.com'
    };

    const result = await updateStudentProfile(testStudentId, input);

    expect(result).toBeDefined();
    expect(result!.full_name).toEqual('Partially Updated Name');
    expect(result!.email).toEqual('partial@test.com');
    // Other fields should remain unchanged
    expect(result!.phone).toEqual('081234567890');
    expect(result!.address).toEqual('Original Address');
    expect(result!.photo_url).toEqual('https://example.com/original.jpg');
  });

  it('should handle nullable fields correctly', async () => {
    const input: UpdateProfileInput = {
      email: null,
      phone: null,
      address: null,
      photo_url: null
    };

    const result = await updateStudentProfile(testStudentId, input);

    expect(result).toBeDefined();
    expect(result!.email).toBeNull();
    expect(result!.phone).toBeNull();
    expect(result!.address).toBeNull();
    expect(result!.photo_url).toBeNull();
    // Non-nullable field should remain unchanged
    expect(result!.full_name).toEqual('Original Name');
  });

  it('should persist changes to database', async () => {
    const input: UpdateProfileInput = {
      full_name: 'Database Test Name',
      email: 'database@test.com'
    };

    await updateStudentProfile(testStudentId, input);

    // Verify changes persisted in database
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, testStudentId))
      .execute();

    expect(students).toHaveLength(1);
    expect(students[0].full_name).toEqual('Database Test Name');
    expect(students[0].email).toEqual('database@test.com');
    expect(students[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent student', async () => {
    const nonExistentStudentId = 99999;
    const input: UpdateProfileInput = {
      full_name: 'Should Not Update'
    };

    const result = await updateStudentProfile(nonExistentStudentId, input);

    expect(result).toBeNull();
  });

  it('should return current student when no fields to update', async () => {
    const input: UpdateProfileInput = {};

    const result = await updateStudentProfile(testStudentId, input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testStudentId);
    expect(result!.full_name).toEqual('Original Name');
    expect(result!.email).toEqual('original@test.com');
  });

  it('should handle email validation through schema', async () => {
    const input: UpdateProfileInput = {
      email: 'valid@example.com'
    };

    const result = await updateStudentProfile(testStudentId, input);

    expect(result).toBeDefined();
    expect(result!.email).toEqual('valid@example.com');
  });

  it('should update timestamp when changes are made', async () => {
    const beforeUpdate = new Date();
    
    const input: UpdateProfileInput = {
      full_name: 'Timestamp Test'
    };

    const result = await updateStudentProfile(testStudentId, input);

    expect(result).toBeDefined();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
  });
});