import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, teachersTable } from '../db/schema';
import { type UpdateTeacherInput } from '../schema';
import { updateTeacher } from '../handlers/update_teacher';
import { eq } from 'drizzle-orm';

describe('updateTeacher', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test user and teacher
  const createTestTeacher = async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'teacher_user',
        password: 'hashedpassword',
        role: 'guru'
      })
      .returning()
      .execute();

    // Create teacher
    const teacherResult = await db.insert(teachersTable)
      .values({
        user_id: userResult[0].id,
        nip: '123456789',
        full_name: 'John Teacher',
        email: 'john.teacher@example.com',
        phone: '08123456789',
        address: '123 Teacher St',
        photo_url: 'https://example.com/photo.jpg'
      })
      .returning()
      .execute();

    return teacherResult[0];
  };

  it('should update teacher successfully', async () => {
    const teacher = await createTestTeacher();

    const updateInput: UpdateTeacherInput = {
      id: teacher.id,
      nip: '987654321',
      full_name: 'Jane Teacher Updated',
      email: 'jane.updated@example.com',
      phone: '08987654321',
      address: '456 Updated Teacher Ave',
      photo_url: 'https://example.com/updated_photo.jpg'
    };

    const result = await updateTeacher(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(teacher.id);
    expect(result!.nip).toEqual('987654321');
    expect(result!.full_name).toEqual('Jane Teacher Updated');
    expect(result!.email).toEqual('jane.updated@example.com');
    expect(result!.phone).toEqual('08987654321');
    expect(result!.address).toEqual('456 Updated Teacher Ave');
    expect(result!.photo_url).toEqual('https://example.com/updated_photo.jpg');
    expect(result!.user_id).toEqual(teacher.user_id); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > teacher.updated_at).toBe(true);
  });

  it('should update only provided fields', async () => {
    const teacher = await createTestTeacher();

    const updateInput: UpdateTeacherInput = {
      id: teacher.id,
      full_name: 'Partially Updated Teacher',
      email: 'partial@example.com'
    };

    const result = await updateTeacher(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(teacher.id);
    expect(result!.full_name).toEqual('Partially Updated Teacher');
    expect(result!.email).toEqual('partial@example.com');
    // These should remain unchanged
    expect(result!.nip).toEqual(teacher.nip);
    expect(result!.phone).toEqual(teacher.phone);
    expect(result!.address).toEqual(teacher.address);
    expect(result!.photo_url).toEqual(teacher.photo_url);
  });

  it('should handle nullable fields correctly', async () => {
    const teacher = await createTestTeacher();

    const updateInput: UpdateTeacherInput = {
      id: teacher.id,
      email: null,
      phone: null,
      address: null,
      photo_url: null
    };

    const result = await updateTeacher(updateInput);

    expect(result).toBeDefined();
    expect(result!.email).toBeNull();
    expect(result!.phone).toBeNull();
    expect(result!.address).toBeNull();
    expect(result!.photo_url).toBeNull();
  });

  it('should save updated data to database', async () => {
    const teacher = await createTestTeacher();

    const updateInput: UpdateTeacherInput = {
      id: teacher.id,
      full_name: 'Database Test Teacher',
      nip: '555666777'
    };

    await updateTeacher(updateInput);

    // Verify the data was actually saved to database
    const savedTeacher = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, teacher.id))
      .execute();

    expect(savedTeacher).toHaveLength(1);
    expect(savedTeacher[0].full_name).toEqual('Database Test Teacher');
    expect(savedTeacher[0].nip).toEqual('555666777');
    expect(savedTeacher[0].updated_at).toBeInstanceOf(Date);
    expect(savedTeacher[0].updated_at > teacher.updated_at).toBe(true);
  });

  it('should return null for non-existent teacher', async () => {
    const updateInput: UpdateTeacherInput = {
      id: 999999, // Non-existent ID
      full_name: 'Non Existent Teacher'
    };

    const result = await updateTeacher(updateInput);

    expect(result).toBeNull();
  });

  it('should reject duplicate NIP', async () => {
    // Create first teacher
    const teacher1 = await createTestTeacher();
    
    // Create second teacher with different user
    const user2Result = await db.insert(usersTable)
      .values({
        username: 'teacher_user2',
        password: 'hashedpassword2',
        role: 'guru'
      })
      .returning()
      .execute();

    const teacher2Result = await db.insert(teachersTable)
      .values({
        user_id: user2Result[0].id,
        nip: '999888777',
        full_name: 'Second Teacher',
        email: 'second@example.com'
      })
      .returning()
      .execute();

    const teacher2 = teacher2Result[0];

    // Try to update teacher2 with teacher1's NIP
    const updateInput: UpdateTeacherInput = {
      id: teacher2.id,
      nip: teacher1.nip // This should cause a unique constraint violation
    };

    await expect(updateTeacher(updateInput)).rejects.toThrow(/duplicate key value violates unique constraint|UNIQUE constraint failed/i);
  });

  it('should handle empty update gracefully', async () => {
    const teacher = await createTestTeacher();

    const updateInput: UpdateTeacherInput = {
      id: teacher.id
      // No fields to update
    };

    const result = await updateTeacher(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(teacher.id);
    expect(result!.full_name).toEqual(teacher.full_name);
    expect(result!.nip).toEqual(teacher.nip);
    // Only updated_at should change
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > teacher.updated_at).toBe(true);
  });
});