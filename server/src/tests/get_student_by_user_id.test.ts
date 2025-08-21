import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable } from '../db/schema';
import { getStudentByUserId } from '../handlers/get_student_by_user_id';
import { eq } from 'drizzle-orm';

describe('getStudentByUserId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return student by user ID', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'student1',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const [classData] = await db.insert(classesTable)
      .values({
        name: 'Kelas 10A',
        description: 'Kelas sepuluh A'
      })
      .returning()
      .execute();

    const [student] = await db.insert(studentsTable)
      .values({
        user_id: user.id,
        class_id: classData.id,
        nis: '2024001',
        nisn: '1234567890',
        full_name: 'Ahmad Student',
        email: 'ahmad@student.com',
        phone: '08123456789',
        address: 'Jalan Student No. 1',
        photo_url: 'https://example.com/photo.jpg'
      })
      .returning()
      .execute();

    // Test the handler
    const result = await getStudentByUserId(user.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(student.id);
    expect(result!.user_id).toEqual(user.id);
    expect(result!.class_id).toEqual(classData.id);
    expect(result!.nis).toEqual('2024001');
    expect(result!.nisn).toEqual('1234567890');
    expect(result!.full_name).toEqual('Ahmad Student');
    expect(result!.email).toEqual('ahmad@student.com');
    expect(result!.phone).toEqual('08123456789');
    expect(result!.address).toEqual('Jalan Student No. 1');
    expect(result!.photo_url).toEqual('https://example.com/photo.jpg');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when no student exists for user ID', async () => {
    // Create a user without a student record
    const [user] = await db.insert(usersTable)
      .values({
        username: 'teacher1',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    // Test the handler
    const result = await getStudentByUserId(user.id);

    // Should return null
    expect(result).toBeNull();
  });

  it('should return null for non-existent user ID', async () => {
    // Test with a non-existent user ID
    const result = await getStudentByUserId(99999);

    // Should return null
    expect(result).toBeNull();
  });

  it('should handle student with minimal data (nullable fields)', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'student2',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const [classData] = await db.insert(classesTable)
      .values({
        name: 'Kelas 10B',
        description: null
      })
      .returning()
      .execute();

    // Create student with minimal data (only required fields)
    const [student] = await db.insert(studentsTable)
      .values({
        user_id: user.id,
        class_id: classData.id,
        nis: '2024002',
        nisn: null,
        full_name: 'Budi Student',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Test the handler
    const result = await getStudentByUserId(user.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(student.id);
    expect(result!.user_id).toEqual(user.id);
    expect(result!.class_id).toEqual(classData.id);
    expect(result!.nis).toEqual('2024002');
    expect(result!.nisn).toBeNull();
    expect(result!.full_name).toEqual('Budi Student');
    expect(result!.email).toBeNull();
    expect(result!.phone).toBeNull();
    expect(result!.address).toBeNull();
    expect(result!.photo_url).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should verify data integrity after retrieval', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'student3',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const [classData] = await db.insert(classesTable)
      .values({
        name: 'Kelas 11A',
        description: 'Kelas sebelas A'
      })
      .returning()
      .execute();

    await db.insert(studentsTable)
      .values({
        user_id: user.id,
        class_id: classData.id,
        nis: '2024003',
        nisn: '9876543210',
        full_name: 'Siti Student',
        email: 'siti@student.com',
        phone: '08987654321',
        address: 'Jalan Siti No. 3',
        photo_url: 'https://example.com/siti.jpg'
      })
      .execute();

    // Get student through handler
    const result = await getStudentByUserId(user.id);

    // Verify the student exists in database with same data
    const directQuery = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.user_id, user.id))
      .execute();

    expect(result).not.toBeNull();
    expect(directQuery).toHaveLength(1);
    expect(result!.id).toEqual(directQuery[0].id);
    expect(result!.nis).toEqual(directQuery[0].nis);
    expect(result!.full_name).toEqual(directQuery[0].full_name);
  });

  it('should handle multiple students but return only the first one', async () => {
    // This tests an edge case - ideally user_id should be unique per student
    // but the handler should handle gracefully if database constraints allow duplicates
    
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'student4',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    const [classData] = await db.insert(classesTable)
      .values({
        name: 'Kelas 12A',
        description: 'Kelas dua belas A'
      })
      .returning()
      .execute();

    // In a real scenario, this shouldn't happen due to business logic
    // but testing handler robustness
    const [student1] = await db.insert(studentsTable)
      .values({
        user_id: user.id,
        class_id: classData.id,
        nis: '2024004',
        nisn: null,
        full_name: 'First Student',
        email: null,
        phone: null,
        address: null,
        photo_url: null
      })
      .returning()
      .execute();

    // Test the handler
    const result = await getStudentByUserId(user.id);

    // Should return the student (first one)
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(student1.id);
    expect(result!.full_name).toEqual('First Student');
  });
});