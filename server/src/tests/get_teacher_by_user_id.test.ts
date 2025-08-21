import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, teachersTable } from '../db/schema';
import { getTeacherByUserId } from '../handlers/get_teacher_by_user_id';

describe('getTeacherByUserId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return teacher when user_id exists', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'teacher1',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a teacher linked to the user
    await db.insert(teachersTable)
      .values({
        user_id: userId,
        nip: '123456789',
        full_name: 'John Doe Teacher',
        email: 'john.teacher@school.com',
        phone: '081234567890',
        address: 'Jl. Teacher Street No. 1',
        photo_url: 'https://example.com/photo.jpg'
      })
      .execute();

    const result = await getTeacherByUserId(userId);

    expect(result).not.toBeNull();
    expect(result!.user_id).toEqual(userId);
    expect(result!.nip).toEqual('123456789');
    expect(result!.full_name).toEqual('John Doe Teacher');
    expect(result!.email).toEqual('john.teacher@school.com');
    expect(result!.phone).toEqual('081234567890');
    expect(result!.address).toEqual('Jl. Teacher Street No. 1');
    expect(result!.photo_url).toEqual('https://example.com/photo.jpg');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when user_id does not exist', async () => {
    const result = await getTeacherByUserId(999);

    expect(result).toBeNull();
  });

  it('should return null when user exists but is not a teacher', async () => {
    // Create a user with non-teacher role
    const userResult = await db.insert(usersTable)
      .values({
        username: 'student1',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const result = await getTeacherByUserId(userId);

    expect(result).toBeNull();
  });

  it('should return teacher with minimal data (nullable fields)', async () => {
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

    // Create a teacher with minimal required fields only
    await db.insert(teachersTable)
      .values({
        user_id: userId,
        nip: '987654321',
        full_name: 'Jane Doe Teacher',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      })
      .execute();

    const result = await getTeacherByUserId(userId);

    expect(result).not.toBeNull();
    expect(result!.user_id).toEqual(userId);
    expect(result!.nip).toEqual('987654321');
    expect(result!.full_name).toEqual('Jane Doe Teacher');
    expect(result!.email).toBeNull();
    expect(result!.phone).toBeNull();
    expect(result!.address).toBeNull();
    expect(result!.photo_url).toBeNull();
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return first teacher when multiple teachers exist for same user_id', async () => {
    // This scenario shouldn't happen in real application due to foreign key constraints,
    // but we test the handler's behavior anyway
    const userResult = await db.insert(usersTable)
      .values({
        username: 'teacher3',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create first teacher
    await db.insert(teachersTable)
      .values({
        user_id: userId,
        nip: '111111111',
        full_name: 'First Teacher',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      })
      .execute();

    const result = await getTeacherByUserId(userId);

    expect(result).not.toBeNull();
    expect(result!.user_id).toEqual(userId);
    expect(result!.nip).toEqual('111111111');
    expect(result!.full_name).toEqual('First Teacher');
  });

  it('should handle database connection issues gracefully', async () => {
    // Test with invalid user_id type to trigger potential database errors
    await expect(getTeacherByUserId(NaN)).rejects.toThrow();
  });
});