import { db } from '../db';
import { teacherClassesTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function removeTeacherFromClass(teacherId: number, classId: number): Promise<boolean> {
  try {
    // Delete the teacher-class relationship record
    const result = await db.delete(teacherClassesTable)
      .where(
        and(
          eq(teacherClassesTable.teacher_id, teacherId),
          eq(teacherClassesTable.class_id, classId)
        )
      )
      .execute();

    // Check if any rows were affected (deleted)
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Remove teacher from class failed:', error);
    throw error;
  }
}