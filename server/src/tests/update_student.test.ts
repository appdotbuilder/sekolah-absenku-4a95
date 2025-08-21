import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable } from '../db/schema';
import { type UpdateStudentInput } from '../schema';
import { updateStudent } from '../handlers/update_student';
import { eq } from 'drizzle-orm';

describe('updateStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUser: any;
  let testClass: any;
  let testStudent: any;

  beforeEach(async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'teststudent',
        password: 'hashedpassword',
        role: 'siswa'
      })
      .returning()
      .execute();
    testUser = userResult[0];

    // Create prerequisite class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'Test class description'
      })
      .returning()
      .execute();
    testClass = classResult[0];

    // Create test student
    const studentResult = await db.insert(studentsTable)
      .values({
        user_id: testUser.id,
        class_id: testClass.id,
        nis: '12345',
        nisn: '1234567890',
        full_name: 'Original Name',
        email: 'original@example.com',
        phone: '081234567890',
        address: 'Original Address',
        photo_url: 'http://example.com/original.jpg'
      })
      .returning()
      .execute();
    testStudent = studentResult[0];
  });

  it('should update student with all fields', async () => {
    // Create another class for testing class_id update
    const newClassResult = await db.insert(classesTable)
      .values({
        name: 'New Class',
        description: 'New class description'
      })
      .returning()
      .execute();
    const newClass = newClassResult[0];

    const updateInput: UpdateStudentInput = {
      id: testStudent.id,
      class_id: newClass.id,
      nis: '54321',
      nisn: '0987654321',
      full_name: 'Updated Name',
      email: 'updated@example.com',
      phone: '089876543210',
      address: 'Updated Address',
      photo_url: 'http://example.com/updated.jpg'
    };

    const result = await updateStudent(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testStudent.id);
    expect(result!.class_id).toEqual(newClass.id);
    expect(result!.nis).toEqual('54321');
    expect(result!.nisn).toEqual('0987654321');
    expect(result!.full_name).toEqual('Updated Name');
    expect(result!.email).toEqual('updated@example.com');
    expect(result!.phone).toEqual('089876543210');
    expect(result!.address).toEqual('Updated Address');
    expect(result!.photo_url).toEqual('http://example.com/updated.jpg');
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at).not.toEqual(testStudent.updated_at);
  });

  it('should update student with partial fields', async () => {
    const updateInput: UpdateStudentInput = {
      id: testStudent.id,
      full_name: 'Partially Updated Name',
      email: 'partial@example.com'
    };

    const result = await updateStudent(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testStudent.id);
    expect(result!.full_name).toEqual('Partially Updated Name');
    expect(result!.email).toEqual('partial@example.com');
    // Other fields should remain unchanged
    expect(result!.class_id).toEqual(testClass.id);
    expect(result!.nis).toEqual('12345');
    expect(result!.nisn).toEqual('1234567890');
    expect(result!.phone).toEqual('081234567890');
    expect(result!.address).toEqual('Original Address');
    expect(result!.photo_url).toEqual('http://example.com/original.jpg');
  });

  it('should update student with nullable fields set to null', async () => {
    const updateInput: UpdateStudentInput = {
      id: testStudent.id,
      nisn: null,
      email: null,
      phone: null,
      address: null,
      photo_url: null
    };

    const result = await updateStudent(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testStudent.id);
    expect(result!.nisn).toBeNull();
    expect(result!.email).toBeNull();
    expect(result!.phone).toBeNull();
    expect(result!.address).toBeNull();
    expect(result!.photo_url).toBeNull();
    // Non-nullable fields should remain unchanged
    expect(result!.full_name).toEqual('Original Name');
    expect(result!.nis).toEqual('12345');
  });

  it('should save changes to database', async () => {
    const updateInput: UpdateStudentInput = {
      id: testStudent.id,
      full_name: 'Database Test Name',
      nis: '99999'
    };

    await updateStudent(updateInput);

    // Query database to verify changes were persisted
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, testStudent.id))
      .execute();

    expect(students).toHaveLength(1);
    expect(students[0].full_name).toEqual('Database Test Name');
    expect(students[0].nis).toEqual('99999');
    expect(students[0].updated_at).toBeInstanceOf(Date);
    expect(students[0].updated_at).not.toEqual(testStudent.updated_at);
  });

  it('should return null for non-existent student', async () => {
    const updateInput: UpdateStudentInput = {
      id: 99999, // Non-existent ID
      full_name: 'Should Not Work'
    };

    const result = await updateStudent(updateInput);

    expect(result).toBeNull();
  });

  it('should handle foreign key constraint for class_id', async () => {
    const updateInput: UpdateStudentInput = {
      id: testStudent.id,
      class_id: 99999 // Non-existent class ID
    };

    await expect(updateStudent(updateInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should handle unique constraint violation for nis', async () => {
    // Create another student with a different NIS
    const anotherUserResult = await db.insert(usersTable)
      .values({
        username: 'anotherstudent',
        password: 'hashedpassword',
        role: 'siswa'
      })
      .returning()
      .execute();

    await db.insert(studentsTable)
      .values({
        user_id: anotherUserResult[0].id,
        class_id: testClass.id,
        nis: 'UNIQUE123',
        full_name: 'Another Student'
      })
      .returning()
      .execute();

    // Try to update our test student with the existing NIS
    const updateInput: UpdateStudentInput = {
      id: testStudent.id,
      nis: 'UNIQUE123' // This should cause a unique constraint violation
    };

    await expect(updateStudent(updateInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should update only updated_at when no other fields provided', async () => {
    const updateInput: UpdateStudentInput = {
      id: testStudent.id
    };

    const result = await updateStudent(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testStudent.id);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at).not.toEqual(testStudent.updated_at);
    // All other fields should remain unchanged
    expect(result!.full_name).toEqual('Original Name');
    expect(result!.nis).toEqual('12345');
    expect(result!.email).toEqual('original@example.com');
  });
});