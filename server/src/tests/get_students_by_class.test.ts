import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable } from '../db/schema';
import { getStudentsByClass } from '../handlers/get_students_by_class';
import { eq } from 'drizzle-orm';

describe('getStudentsByClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return students for a specific class', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'student1',
          password: 'password123',
          role: 'siswa'
        },
        {
          username: 'student2', 
          password: 'password123',
          role: 'siswa'
        }
      ])
      .returning()
      .execute();

    // Create test class
    const classes = await db.insert(classesTable)
      .values({
        name: 'Kelas 10A',
        description: 'Kelas sepuluh A'
      })
      .returning()
      .execute();

    const classId = classes[0].id;

    // Create test students in the class
    const students = await db.insert(studentsTable)
      .values([
        {
          user_id: users[0].id,
          class_id: classId,
          nis: '1001',
          nisn: '1001001',
          full_name: 'Ahmad Rizki',
          email: 'ahmad@test.com',
          phone: '081234567890',
          address: 'Jakarta'
        },
        {
          user_id: users[1].id,
          class_id: classId,
          nis: '1002',
          nisn: '1001002',
          full_name: 'Siti Aminah',
          email: 'siti@test.com',
          phone: '081234567891',
          address: 'Bandung'
        }
      ])
      .returning()
      .execute();

    const result = await getStudentsByClass(classId);

    // Verify results
    expect(result).toHaveLength(2);
    
    // Check first student
    const student1 = result.find(s => s.nis === '1001');
    expect(student1).toBeDefined();
    expect(student1?.full_name).toBe('Ahmad Rizki');
    expect(student1?.class_id).toBe(classId);
    expect(student1?.email).toBe('ahmad@test.com');
    expect(student1?.phone).toBe('081234567890');
    expect(student1?.address).toBe('Jakarta');

    // Check second student
    const student2 = result.find(s => s.nis === '1002');
    expect(student2).toBeDefined();
    expect(student2?.full_name).toBe('Siti Aminah');
    expect(student2?.class_id).toBe(classId);
    expect(student2?.email).toBe('siti@test.com');
    expect(student2?.phone).toBe('081234567891');
    expect(student2?.address).toBe('Bandung');
  });

  it('should return empty array when class has no students', async () => {
    // Create test class but no students
    const classes = await db.insert(classesTable)
      .values({
        name: 'Kelas 10B',
        description: 'Kelas sepuluh B'
      })
      .returning()
      .execute();

    const result = await getStudentsByClass(classes[0].id);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent class', async () => {
    const nonExistentClassId = 999;
    
    const result = await getStudentsByClass(nonExistentClassId);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should only return students from the specified class', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'student1',
          password: 'password123',
          role: 'siswa'
        },
        {
          username: 'student2',
          password: 'password123',
          role: 'siswa'
        },
        {
          username: 'student3',
          password: 'password123',
          role: 'siswa'
        }
      ])
      .returning()
      .execute();

    // Create two test classes
    const classes = await db.insert(classesTable)
      .values([
        {
          name: 'Kelas 10A',
          description: 'Kelas sepuluh A'
        },
        {
          name: 'Kelas 10B',
          description: 'Kelas sepuluh B'
        }
      ])
      .returning()
      .execute();

    const class1Id = classes[0].id;
    const class2Id = classes[1].id;

    // Create students in different classes
    await db.insert(studentsTable)
      .values([
        // Students in class 1
        {
          user_id: users[0].id,
          class_id: class1Id,
          nis: '1001',
          nisn: '1001001',
          full_name: 'Student Class 1 - 1'
        },
        {
          user_id: users[1].id,
          class_id: class1Id,
          nis: '1002',
          nisn: '1001002',
          full_name: 'Student Class 1 - 2'
        },
        // Student in class 2
        {
          user_id: users[2].id,
          class_id: class2Id,
          nis: '2001',
          nisn: '2001001',
          full_name: 'Student Class 2 - 1'
        }
      ])
      .execute();

    // Test getting students from class 1
    const class1Students = await getStudentsByClass(class1Id);
    expect(class1Students).toHaveLength(2);
    expect(class1Students.every(s => s.class_id === class1Id)).toBe(true);
    expect(class1Students.find(s => s.full_name === 'Student Class 1 - 1')).toBeDefined();
    expect(class1Students.find(s => s.full_name === 'Student Class 1 - 2')).toBeDefined();
    expect(class1Students.find(s => s.full_name === 'Student Class 2 - 1')).toBeUndefined();

    // Test getting students from class 2
    const class2Students = await getStudentsByClass(class2Id);
    expect(class2Students).toHaveLength(1);
    expect(class2Students.every(s => s.class_id === class2Id)).toBe(true);
    expect(class2Students[0].full_name).toBe('Student Class 2 - 1');
  });

  it('should include all student fields', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        username: 'teststudent',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    // Create test class
    const classes = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'Test class description'
      })
      .returning()
      .execute();

    // Create student with all fields
    await db.insert(studentsTable)
      .values({
        user_id: users[0].id,
        class_id: classes[0].id,
        nis: '1001',
        nisn: '1001001',
        full_name: 'Complete Student',
        email: 'complete@test.com',
        phone: '081234567890',
        address: 'Complete Address',
        photo_url: 'https://example.com/photo.jpg'
      })
      .execute();

    const result = await getStudentsByClass(classes[0].id);

    expect(result).toHaveLength(1);
    const student = result[0];

    // Verify all fields are present
    expect(student.id).toBeDefined();
    expect(student.user_id).toBe(users[0].id);
    expect(student.class_id).toBe(classes[0].id);
    expect(student.nis).toBe('1001');
    expect(student.nisn).toBe('1001001');
    expect(student.full_name).toBe('Complete Student');
    expect(student.email).toBe('complete@test.com');
    expect(student.phone).toBe('081234567890');
    expect(student.address).toBe('Complete Address');
    expect(student.photo_url).toBe('https://example.com/photo.jpg');
    expect(student.created_at).toBeInstanceOf(Date);
    expect(student.updated_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        username: 'minimalstudent',
        password: 'password123',
        role: 'siswa'
      })
      .returning()
      .execute();

    // Create test class
    const classes = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'Test class description'
      })
      .returning()
      .execute();

    // Create student with minimal required fields (nullable fields as null)
    await db.insert(studentsTable)
      .values({
        user_id: users[0].id,
        class_id: classes[0].id,
        nis: '1001',
        nisn: null, // nullable
        full_name: 'Minimal Student',
        email: null, // nullable
        phone: null, // nullable
        address: null, // nullable
        photo_url: null // nullable
      })
      .execute();

    const result = await getStudentsByClass(classes[0].id);

    expect(result).toHaveLength(1);
    const student = result[0];

    // Verify required fields
    expect(student.nis).toBe('1001');
    expect(student.full_name).toBe('Minimal Student');
    
    // Verify nullable fields are null
    expect(student.nisn).toBeNull();
    expect(student.email).toBeNull();
    expect(student.phone).toBeNull();
    expect(student.address).toBeNull();
    expect(student.photo_url).toBeNull();
  });
});