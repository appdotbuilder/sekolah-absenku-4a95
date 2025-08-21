import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, teachersTable } from '../db/schema';
import { getTeachers } from '../handlers/get_teachers';

describe('getTeachers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no teachers exist', async () => {
    const result = await getTeachers();
    expect(result).toEqual([]);
  });

  it('should return all teachers with complete information', async () => {
    // Create test users first
    const userResults = await db.insert(usersTable)
      .values([
        {
          username: 'teacher1',
          password: 'password123',
          role: 'guru'
        },
        {
          username: 'teacher2',
          password: 'password123',
          role: 'guru'
        }
      ])
      .returning()
      .execute();

    // Create test teachers
    await db.insert(teachersTable)
      .values([
        {
          user_id: userResults[0].id,
          nip: 'NIP001',
          full_name: 'John Doe',
          email: 'john@example.com',
          phone: '081234567890',
          address: 'Jakarta',
          photo_url: 'https://example.com/photo1.jpg'
        },
        {
          user_id: userResults[1].id,
          nip: 'NIP002',
          full_name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '081234567891',
          address: 'Bandung',
          photo_url: 'https://example.com/photo2.jpg'
        }
      ])
      .execute();

    const result = await getTeachers();

    expect(result).toHaveLength(2);

    // Check first teacher
    const teacher1 = result.find(t => t.nip === 'NIP001');
    expect(teacher1).toBeDefined();
    expect(teacher1!.full_name).toBe('John Doe');
    expect(teacher1!.email).toBe('john@example.com');
    expect(teacher1!.phone).toBe('081234567890');
    expect(teacher1!.address).toBe('Jakarta');
    expect(teacher1!.photo_url).toBe('https://example.com/photo1.jpg');
    expect(teacher1!.user_id).toBe(userResults[0].id);
    expect(teacher1!.created_at).toBeInstanceOf(Date);
    expect(teacher1!.updated_at).toBeInstanceOf(Date);

    // Check second teacher
    const teacher2 = result.find(t => t.nip === 'NIP002');
    expect(teacher2).toBeDefined();
    expect(teacher2!.full_name).toBe('Jane Smith');
    expect(teacher2!.email).toBe('jane@example.com');
    expect(teacher2!.phone).toBe('081234567891');
    expect(teacher2!.address).toBe('Bandung');
    expect(teacher2!.photo_url).toBe('https://example.com/photo2.jpg');
    expect(teacher2!.user_id).toBe(userResults[1].id);
  });

  it('should handle teachers with nullable fields', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'teacher3',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    // Create teacher with minimal required fields only
    await db.insert(teachersTable)
      .values({
        user_id: userResult[0].id,
        nip: 'NIP003',
        full_name: 'Minimal Teacher',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      })
      .execute();

    const result = await getTeachers();

    expect(result).toHaveLength(1);
    expect(result[0].full_name).toBe('Minimal Teacher');
    expect(result[0].nip).toBe('NIP003');
    expect(result[0].email).toBeNull();
    expect(result[0].phone).toBeNull();
    expect(result[0].address).toBeNull();
    expect(result[0].photo_url).toBeNull();
    expect(result[0].user_id).toBe(userResult[0].id);
  });

  it('should return teachers ordered consistently', async () => {
    // Create multiple users
    const userResults = await db.insert(usersTable)
      .values([
        { username: 'teacher_z', password: 'password123', role: 'guru' },
        { username: 'teacher_a', password: 'password123', role: 'guru' },
        { username: 'teacher_m', password: 'password123', role: 'guru' }
      ])
      .returning()
      .execute();

    // Create teachers in different order
    await db.insert(teachersTable)
      .values([
        {
          user_id: userResults[0].id,
          nip: 'NIP999',
          full_name: 'Zebra Teacher'
        },
        {
          user_id: userResults[1].id,
          nip: 'NIP001',
          full_name: 'Alpha Teacher'
        },
        {
          user_id: userResults[2].id,
          nip: 'NIP555',
          full_name: 'Middle Teacher'
        }
      ])
      .execute();

    const result = await getTeachers();

    expect(result).toHaveLength(3);
    // Verify all teachers are returned
    const teacherNames = result.map(t => t.full_name).sort();
    expect(teacherNames).toEqual(['Alpha Teacher', 'Middle Teacher', 'Zebra Teacher']);
  });

  it('should include all required timestamp fields', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'teacher4',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    // Create teacher
    await db.insert(teachersTable)
      .values({
        user_id: userResult[0].id,
        nip: 'NIP004',
        full_name: 'Timestamp Teacher'
      })
      .execute();

    const result = await getTeachers();

    expect(result).toHaveLength(1);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(result[0].created_at.getTime()).toBeLessThanOrEqual(Date.now());
    expect(result[0].updated_at.getTime()).toBeLessThanOrEqual(Date.now());
  });
});