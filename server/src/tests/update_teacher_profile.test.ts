import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, teachersTable } from '../db/schema';
import { type UpdateProfileInput } from '../schema';
import { updateTeacherProfile } from '../handlers/update_teacher_profile';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  username: 'teacher1',
  password: 'password123',
  role: 'guru' as const
};

const testTeacher = {
  nip: '123456789',
  full_name: 'Original Teacher Name',
  email: 'original@example.com',
  phone: '08123456789',
  address: 'Original Address',
  photo_url: 'https://example.com/original.jpg'
};

const updateInput: UpdateProfileInput = {
  full_name: 'Updated Teacher Name',
  email: 'updated@example.com',
  phone: '08987654321',
  address: 'Updated Address',
  photo_url: 'https://example.com/updated.jpg'
};

describe('updateTeacherProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let teacherId: number;

  beforeEach(async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create teacher
    const teacherResult = await db.insert(teachersTable)
      .values({
        user_id: userId,
        ...testTeacher
      })
      .returning()
      .execute();
    
    teacherId = teacherResult[0].id;
  });

  it('should update all teacher profile fields', async () => {
    const result = await updateTeacherProfile(teacherId, updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(teacherId);
    expect(result!.full_name).toEqual('Updated Teacher Name');
    expect(result!.email).toEqual('updated@example.com');
    expect(result!.phone).toEqual('08987654321');
    expect(result!.address).toEqual('Updated Address');
    expect(result!.photo_url).toEqual('https://example.com/updated.jpg');
    expect(result!.updated_at).toBeInstanceOf(Date);
    
    // Verify original fields remain unchanged
    expect(result!.nip).toEqual(testTeacher.nip);
    expect(result!.user_id).toBeDefined();
  });

  it('should update only provided fields', async () => {
    const partialUpdate: UpdateProfileInput = {
      full_name: 'Partially Updated Name',
      email: 'partial@example.com'
    };

    const result = await updateTeacherProfile(teacherId, partialUpdate);

    expect(result).not.toBeNull();
    expect(result!.full_name).toEqual('Partially Updated Name');
    expect(result!.email).toEqual('partial@example.com');
    
    // Other fields should remain unchanged
    expect(result!.phone).toEqual(testTeacher.phone);
    expect(result!.address).toEqual(testTeacher.address);
    expect(result!.photo_url).toEqual(testTeacher.photo_url);
  });

  it('should handle nullable fields being set to null', async () => {
    const nullUpdate: UpdateProfileInput = {
      email: null,
      phone: null,
      address: null,
      photo_url: null
    };

    const result = await updateTeacherProfile(teacherId, nullUpdate);

    expect(result).not.toBeNull();
    expect(result!.email).toBeNull();
    expect(result!.phone).toBeNull();
    expect(result!.address).toBeNull();
    expect(result!.photo_url).toBeNull();
    
    // Non-nullable field should remain unchanged
    expect(result!.full_name).toEqual(testTeacher.full_name);
  });

  it('should save updated data to database', async () => {
    await updateTeacherProfile(teacherId, updateInput);

    // Verify data was saved to database
    const teachers = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, teacherId))
      .execute();

    expect(teachers).toHaveLength(1);
    const teacher = teachers[0];
    expect(teacher.full_name).toEqual('Updated Teacher Name');
    expect(teacher.email).toEqual('updated@example.com');
    expect(teacher.phone).toEqual('08987654321');
    expect(teacher.address).toEqual('Updated Address');
    expect(teacher.photo_url).toEqual('https://example.com/updated.jpg');
    expect(teacher.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent teacher', async () => {
    const nonExistentId = 99999;
    
    const result = await updateTeacherProfile(nonExistentId, updateInput);

    expect(result).toBeNull();
  });

  it('should return current data when no fields provided', async () => {
    const emptyUpdate: UpdateProfileInput = {};

    const result = await updateTeacherProfile(teacherId, emptyUpdate);

    expect(result).not.toBeNull();
    expect(result!.full_name).toEqual(testTeacher.full_name);
    expect(result!.email).toEqual(testTeacher.email);
    expect(result!.phone).toEqual(testTeacher.phone);
    expect(result!.address).toEqual(testTeacher.address);
    expect(result!.photo_url).toEqual(testTeacher.photo_url);
  });

  it('should update timestamp when changes are made', async () => {
    // Get original timestamp
    const originalTeacher = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, teacherId))
      .execute();
    
    const originalTimestamp = originalTeacher[0].updated_at;

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    const result = await updateTeacherProfile(teacherId, {
      full_name: 'Changed Name'
    });

    expect(result).not.toBeNull();
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });
});