import { db } from '../db';
import { teacherClassesTable, teachersTable, classesTable } from '../db/schema';
import { type AssignTeacherToClassInput, type TeacherClass } from '../schema';
import { eq, and } from 'drizzle-orm';

export const assignTeacherToClass = async (input: AssignTeacherToClassInput): Promise<TeacherClass> => {
  try {
    // Verify teacher exists
    const teacher = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, input.teacher_id))
      .execute();

    if (teacher.length === 0) {
      throw new Error('Teacher not found');
    }

    // Verify class exists
    const classRecord = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.class_id))
      .execute();

    if (classRecord.length === 0) {
      throw new Error('Class not found');
    }

    // Check if assignment already exists
    const existingAssignment = await db.select()
      .from(teacherClassesTable)
      .where(
        and(
          eq(teacherClassesTable.teacher_id, input.teacher_id),
          eq(teacherClassesTable.class_id, input.class_id)
        )
      )
      .execute();

    if (existingAssignment.length > 0) {
      throw new Error('Teacher is already assigned to this class');
    }

    // Create the assignment
    const result = await db.insert(teacherClassesTable)
      .values({
        teacher_id: input.teacher_id,
        class_id: input.class_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Teacher-class assignment failed:', error);
    throw error;
  }
};