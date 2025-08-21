import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teachersTable, usersTable } from '../db/schema';
import { type CreateTeacherInput } from '../schema';
import { createTeacher } from '../handlers/create_teacher';
import { eq } from 'drizzle-orm';

describe('createTeacher', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a teacher with valid user reference', async () => {
    // First create a user with 'guru' role
    const userResult = await db.insert(usersTable)
      .values({
        username: 'teacher_user',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const testInput: CreateTeacherInput = {
      user_id: userResult[0].id,
      nip: '1234567890',
      full_name: 'John Teacher',
      email: 'john.teacher@school.com',
      phone: '081234567890',
      address: '123 Teacher Street',
      photo_url: 'https://example.com/photo.jpg'
    };

    const result = await createTeacher(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(userResult[0].id);
    expect(result.nip).toEqual('1234567890');
    expect(result.full_name).toEqual('John Teacher');
    expect(result.email).toEqual('john.teacher@school.com');
    expect(result.phone).toEqual('081234567890');
    expect(result.address).toEqual('123 Teacher Street');
    expect(result.photo_url).toEqual('https://example.com/photo.jpg');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save teacher to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'teacher_user2',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const testInput: CreateTeacherInput = {
      user_id: userResult[0].id,
      nip: '0987654321',
      full_name: 'Jane Teacher',
      email: 'jane.teacher@school.com',
      phone: '081987654321',
      address: '456 Teacher Avenue',
      photo_url: null
    };

    const result = await createTeacher(testInput);

    // Query the database to verify the teacher was saved
    const teachers = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, result.id))
      .execute();

    expect(teachers).toHaveLength(1);
    expect(teachers[0].user_id).toEqual(userResult[0].id);
    expect(teachers[0].nip).toEqual('0987654321');
    expect(teachers[0].full_name).toEqual('Jane Teacher');
    expect(teachers[0].email).toEqual('jane.teacher@school.com');
    expect(teachers[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'teacher_user3',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const testInput: CreateTeacherInput = {
      user_id: userResult[0].id,
      nip: '1111222233',
      full_name: 'Minimal Teacher',
      email: null,
      phone: null,
      address: null,
      photo_url: null
    };

    const result = await createTeacher(testInput);

    expect(result.user_id).toEqual(userResult[0].id);
    expect(result.nip).toEqual('1111222233');
    expect(result.full_name).toEqual('Minimal Teacher');
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.photo_url).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should throw error when user does not exist', async () => {
    const testInput: CreateTeacherInput = {
      user_id: 99999, // Non-existent user ID
      nip: '9999888877',
      full_name: 'Invalid Teacher',
      email: 'invalid@school.com',
      phone: '081999888877',
      address: '999 Invalid Street',
      photo_url: null
    };

    await expect(createTeacher(testInput)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when user role is not guru', async () => {
    // Create a user with 'siswa' role instead of 'guru'
    const userResult = await db.insert(usersTable)
      .values({
        username: 'student_user',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const testInput: CreateTeacherInput = {
      user_id: userResult[0].id,
      nip: '5555666677',
      full_name: 'Wrong Role Teacher',
      email: 'wrong@school.com',
      phone: '081555666677',
      address: '555 Wrong Street',
      photo_url: null
    };

    await expect(createTeacher(testInput)).rejects.toThrow(/user must have role "guru"/i);
  });

  it('should handle duplicate NIP constraint', async () => {
    // Create first teacher
    const userResult1 = await db.insert(usersTable)
      .values({
        username: 'teacher_user4',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const firstInput: CreateTeacherInput = {
      user_id: userResult1[0].id,
      nip: 'DUPLICATE123',
      full_name: 'First Teacher',
      email: 'first@school.com',
      phone: '081111111111',
      address: '111 First Street',
      photo_url: null
    };

    await createTeacher(firstInput);

    // Try to create second teacher with same NIP
    const userResult2 = await db.insert(usersTable)
      .values({
        username: 'teacher_user5',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const duplicateInput: CreateTeacherInput = {
      user_id: userResult2[0].id,
      nip: 'DUPLICATE123', // Same NIP
      full_name: 'Second Teacher',
      email: 'second@school.com',
      phone: '082222222222',
      address: '222 Second Street',
      photo_url: null
    };

    await expect(createTeacher(duplicateInput)).rejects.toThrow();
  });
});