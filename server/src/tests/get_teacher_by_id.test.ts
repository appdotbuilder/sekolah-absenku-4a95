import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, teachersTable } from '../db/schema';
import { getTeacherById } from '../handlers/get_teacher_by_id';

describe('getTeacherById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return teacher when valid ID is provided', async () => {
    // Create a user first (required for foreign key)
    const userResult = await db.insert(usersTable)
      .values({
        username: 'teacher1',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a teacher
    const teacherResult = await db.insert(teachersTable)
      .values({
        user_id: userId,
        nip: '123456789',
        full_name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        photo_url: 'https://example.com/photo.jpg'
      })
      .returning()
      .execute();

    const createdTeacher = teacherResult[0];

    // Test the handler
    const result = await getTeacherById(createdTeacher.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTeacher.id);
    expect(result!.user_id).toEqual(userId);
    expect(result!.nip).toEqual('123456789');
    expect(result!.full_name).toEqual('John Doe');
    expect(result!.email).toEqual('john.doe@example.com');
    expect(result!.phone).toEqual('+1234567890');
    expect(result!.address).toEqual('123 Main St');
    expect(result!.photo_url).toEqual('https://example.com/photo.jpg');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when teacher does not exist', async () => {
    const result = await getTeacherById(999);

    expect(result).toBeNull();
  });

  it('should return teacher with nullable fields as null', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'teacher2',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a teacher with minimal data (nullable fields as null)
    const teacherResult = await db.insert(teachersTable)
      .values({
        user_id: userId,
        nip: '987654321',
        full_name: 'Jane Smith',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      })
      .returning()
      .execute();

    const createdTeacher = teacherResult[0];

    // Test the handler
    const result = await getTeacherById(createdTeacher.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTeacher.id);
    expect(result!.user_id).toEqual(userId);
    expect(result!.nip).toEqual('987654321');
    expect(result!.full_name).toEqual('Jane Smith');
    expect(result!.email).toBeNull();
    expect(result!.phone).toBeNull();
    expect(result!.address).toBeNull();
    expect(result!.photo_url).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle multiple teachers and return the correct one', async () => {
    // Create users for multiple teachers
    const user1Result = await db.insert(usersTable)
      .values({
        username: 'teacher1',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        username: 'teacher2',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const userId1 = user1Result[0].id;
    const userId2 = user2Result[0].id;

    // Create multiple teachers
    const teacher1Result = await db.insert(teachersTable)
      .values({
        user_id: userId1,
        nip: '111111111',
        full_name: 'Teacher One',
        email: 'teacher1@example.com'
      })
      .returning()
      .execute();

    const teacher2Result = await db.insert(teachersTable)
      .values({
        user_id: userId2,
        nip: '222222222',
        full_name: 'Teacher Two',
        email: 'teacher2@example.com'
      })
      .returning()
      .execute();

    const teacherId1 = teacher1Result[0].id;
    const teacherId2 = teacher2Result[0].id;

    // Test retrieving the first teacher
    const result1 = await getTeacherById(teacherId1);
    expect(result1).not.toBeNull();
    expect(result1!.id).toEqual(teacherId1);
    expect(result1!.full_name).toEqual('Teacher One');
    expect(result1!.nip).toEqual('111111111');

    // Test retrieving the second teacher
    const result2 = await getTeacherById(teacherId2);
    expect(result2).not.toBeNull();
    expect(result2!.id).toEqual(teacherId2);
    expect(result2!.full_name).toEqual('Teacher Two');
    expect(result2!.nip).toEqual('222222222');
  });

  it('should handle negative ID values', async () => {
    const result = await getTeacherById(-1);
    expect(result).toBeNull();
  });

  it('should handle zero ID value', async () => {
    const result = await getTeacherById(0);
    expect(result).toBeNull();
  });
});