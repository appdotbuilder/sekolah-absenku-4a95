import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, teachersTable, classesTable, teacherClassesTable } from '../db/schema';
import { type AssignTeacherToClassInput } from '../schema';
import { assignTeacherToClass } from '../handlers/assign_teacher_to_class';
import { eq, and } from 'drizzle-orm';

describe('assignTeacherToClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let teacherId: number;
  let classId: number;

  beforeEach(async () => {
    // Create a test user for teacher
    const userResult = await db.insert(usersTable)
      .values({
        username: 'teacher1',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    // Create a test teacher
    const teacherResult = await db.insert(teachersTable)
      .values({
        user_id: userResult[0].id,
        nip: '198501012023011001',
        full_name: 'Pak Ahmad',
        email: 'ahmad@school.edu',
        phone: '081234567890',
        address: 'Jl. Pendidikan No. 1'
      })
      .returning()
      .execute();

    // Create a test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'XII IPA 1',
        description: 'Kelas 12 IPA 1'
      })
      .returning()
      .execute();

    teacherId = teacherResult[0].id;
    classId = classResult[0].id;
  });

  it('should assign teacher to class successfully', async () => {
    const testInput: AssignTeacherToClassInput = {
      teacher_id: teacherId,
      class_id: classId
    };

    const result = await assignTeacherToClass(testInput);

    // Basic field validation
    expect(result.teacher_id).toEqual(teacherId);
    expect(result.class_id).toEqual(classId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save assignment to database', async () => {
    const testInput: AssignTeacherToClassInput = {
      teacher_id: teacherId,
      class_id: classId
    };

    const result = await assignTeacherToClass(testInput);

    // Verify assignment was saved to database
    const assignments = await db.select()
      .from(teacherClassesTable)
      .where(eq(teacherClassesTable.id, result.id))
      .execute();

    expect(assignments).toHaveLength(1);
    expect(assignments[0].teacher_id).toEqual(teacherId);
    expect(assignments[0].class_id).toEqual(classId);
    expect(assignments[0].created_at).toBeInstanceOf(Date);
  });

  it('should prevent duplicate assignments', async () => {
    const testInput: AssignTeacherToClassInput = {
      teacher_id: teacherId,
      class_id: classId
    };

    // Create first assignment
    await assignTeacherToClass(testInput);

    // Attempt to create duplicate assignment
    await expect(assignTeacherToClass(testInput))
      .rejects.toThrow(/already assigned to this class/i);
  });

  it('should reject assignment with non-existent teacher', async () => {
    const testInput: AssignTeacherToClassInput = {
      teacher_id: 99999, // Non-existent teacher ID
      class_id: classId
    };

    await expect(assignTeacherToClass(testInput))
      .rejects.toThrow(/teacher not found/i);
  });

  it('should reject assignment with non-existent class', async () => {
    const testInput: AssignTeacherToClassInput = {
      teacher_id: teacherId,
      class_id: 99999 // Non-existent class ID
    };

    await expect(assignTeacherToClass(testInput))
      .rejects.toThrow(/class not found/i);
  });

  it('should handle multiple different assignments correctly', async () => {
    // Create second teacher
    const user2Result = await db.insert(usersTable)
      .values({
        username: 'teacher2',
        password: 'password123',
        role: 'guru'
      })
      .returning()
      .execute();

    const teacher2Result = await db.insert(teachersTable)
      .values({
        user_id: user2Result[0].id,
        nip: '198502022023011002',
        full_name: 'Bu Sari',
        email: 'sari@school.edu',
        phone: '081234567891'
      })
      .returning()
      .execute();

    const teacherId2 = teacher2Result[0].id;

    // Create second class
    const class2Result = await db.insert(classesTable)
      .values({
        name: 'XII IPA 2',
        description: 'Kelas 12 IPA 2'
      })
      .returning()
      .execute();

    const classId2 = class2Result[0].id;

    // Create multiple assignments
    await assignTeacherToClass({ teacher_id: teacherId, class_id: classId });
    await assignTeacherToClass({ teacher_id: teacherId2, class_id: classId });
    await assignTeacherToClass({ teacher_id: teacherId, class_id: classId2 });

    // Verify all assignments exist
    const allAssignments = await db.select()
      .from(teacherClassesTable)
      .execute();

    expect(allAssignments).toHaveLength(3);

    // Verify specific assignments
    const teacher1Class1 = allAssignments.find(a => 
      a.teacher_id === teacherId && a.class_id === classId
    );
    const teacher2Class1 = allAssignments.find(a => 
      a.teacher_id === teacherId2 && a.class_id === classId
    );
    const teacher1Class2 = allAssignments.find(a => 
      a.teacher_id === teacherId && a.class_id === classId2
    );

    expect(teacher1Class1).toBeDefined();
    expect(teacher2Class1).toBeDefined();
    expect(teacher1Class2).toBeDefined();
  });

  it('should query assignments correctly using proper drizzle syntax', async () => {
    const testInput: AssignTeacherToClassInput = {
      teacher_id: teacherId,
      class_id: classId
    };

    await assignTeacherToClass(testInput);

    // Test query with multiple conditions using and()
    const specificAssignment = await db.select()
      .from(teacherClassesTable)
      .where(
        and(
          eq(teacherClassesTable.teacher_id, teacherId),
          eq(teacherClassesTable.class_id, classId)
        )
      )
      .execute();

    expect(specificAssignment).toHaveLength(1);
    expect(specificAssignment[0].teacher_id).toEqual(teacherId);
    expect(specificAssignment[0].class_id).toEqual(classId);
  });
});