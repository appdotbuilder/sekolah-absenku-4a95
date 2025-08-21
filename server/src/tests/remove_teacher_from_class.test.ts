import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, teachersTable, classesTable, teacherClassesTable } from '../db/schema';
import { removeTeacherFromClass } from '../handlers/remove_teacher_from_class';
import { eq, and } from 'drizzle-orm';

describe('removeTeacherFromClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove teacher from class successfully', async () => {
    // Create test user for teacher
    const userResult = await db.insert(usersTable)
      .values({
        username: 'teacher1',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    // Create test teacher
    const teacherResult = await db.insert(teachersTable)
      .values({
        user_id: userResult[0].id,
        nip: 'NIP001',
        full_name: 'Test Teacher',
        email: 'teacher@test.com',
        phone: '123456789',
        address: 'Test Address',
        photo_url: null
      })
      .returning()
      .execute();

    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A test class'
      })
      .returning()
      .execute();

    // Assign teacher to class
    await db.insert(teacherClassesTable)
      .values({
        teacher_id: teacherResult[0].id,
        class_id: classResult[0].id
      })
      .execute();

    // Remove teacher from class
    const result = await removeTeacherFromClass(teacherResult[0].id, classResult[0].id);

    expect(result).toBe(true);

    // Verify the relationship was deleted
    const teacherClasses = await db.select()
      .from(teacherClassesTable)
      .where(
        and(
          eq(teacherClassesTable.teacher_id, teacherResult[0].id),
          eq(teacherClassesTable.class_id, classResult[0].id)
        )
      )
      .execute();

    expect(teacherClasses).toHaveLength(0);
  });

  it('should return false when teacher-class relationship does not exist', async () => {
    // Create test user for teacher
    const userResult = await db.insert(usersTable)
      .values({
        username: 'teacher2',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    // Create test teacher
    const teacherResult = await db.insert(teachersTable)
      .values({
        user_id: userResult[0].id,
        nip: 'NIP002',
        full_name: 'Test Teacher 2',
        email: 'teacher2@test.com',
        phone: '123456789',
        address: 'Test Address',
        photo_url: null
      })
      .returning()
      .execute();

    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class 2',
        description: 'Another test class'
      })
      .returning()
      .execute();

    // Try to remove non-existent relationship
    const result = await removeTeacherFromClass(teacherResult[0].id, classResult[0].id);

    expect(result).toBe(false);
  });

  it('should return false when teacher does not exist', async () => {
    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class 3',
        description: 'Yet another test class'
      })
      .returning()
      .execute();

    // Try to remove relationship with non-existent teacher
    const result = await removeTeacherFromClass(999, classResult[0].id);

    expect(result).toBe(false);
  });

  it('should return false when class does not exist', async () => {
    // Create test user for teacher
    const userResult = await db.insert(usersTable)
      .values({
        username: 'teacher3',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    // Create test teacher
    const teacherResult = await db.insert(teachersTable)
      .values({
        user_id: userResult[0].id,
        nip: 'NIP003',
        full_name: 'Test Teacher 3',
        email: 'teacher3@test.com',
        phone: '123456789',
        address: 'Test Address',
        photo_url: null
      })
      .returning()
      .execute();

    // Try to remove relationship with non-existent class
    const result = await removeTeacherFromClass(teacherResult[0].id, 999);

    expect(result).toBe(false);
  });

  it('should not affect other teacher-class relationships', async () => {
    // Create test users for teachers
    const user1Result = await db.insert(usersTable)
      .values({
        username: 'teacher4',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        username: 'teacher5',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    // Create test teachers
    const teacher1Result = await db.insert(teachersTable)
      .values({
        user_id: user1Result[0].id,
        nip: 'NIP004',
        full_name: 'Test Teacher 4',
        email: 'teacher4@test.com',
        phone: '123456789',
        address: 'Test Address',
        photo_url: null
      })
      .returning()
      .execute();

    const teacher2Result = await db.insert(teachersTable)
      .values({
        user_id: user2Result[0].id,
        nip: 'NIP005',
        full_name: 'Test Teacher 5',
        email: 'teacher5@test.com',
        phone: '123456789',
        address: 'Test Address',
        photo_url: null
      })
      .returning()
      .execute();

    // Create test classes
    const class1Result = await db.insert(classesTable)
      .values({
        name: 'Test Class 4',
        description: 'Test class 4'
      })
      .returning()
      .execute();

    const class2Result = await db.insert(classesTable)
      .values({
        name: 'Test Class 5',
        description: 'Test class 5'
      })
      .returning()
      .execute();

    // Create multiple teacher-class relationships
    await db.insert(teacherClassesTable)
      .values([
        {
          teacher_id: teacher1Result[0].id,
          class_id: class1Result[0].id
        },
        {
          teacher_id: teacher1Result[0].id,
          class_id: class2Result[0].id
        },
        {
          teacher_id: teacher2Result[0].id,
          class_id: class1Result[0].id
        }
      ])
      .execute();

    // Remove only one specific relationship
    const result = await removeTeacherFromClass(teacher1Result[0].id, class1Result[0].id);

    expect(result).toBe(true);

    // Verify only the specific relationship was removed
    const remainingRelationships = await db.select()
      .from(teacherClassesTable)
      .execute();

    expect(remainingRelationships).toHaveLength(2);

    // Verify the correct relationships remain
    const teacher1Class2 = await db.select()
      .from(teacherClassesTable)
      .where(
        and(
          eq(teacherClassesTable.teacher_id, teacher1Result[0].id),
          eq(teacherClassesTable.class_id, class2Result[0].id)
        )
      )
      .execute();

    const teacher2Class1 = await db.select()
      .from(teacherClassesTable)
      .where(
        and(
          eq(teacherClassesTable.teacher_id, teacher2Result[0].id),
          eq(teacherClassesTable.class_id, class1Result[0].id)
        )
      )
      .execute();

    expect(teacher1Class2).toHaveLength(1);
    expect(teacher2Class1).toHaveLength(1);
  });
});