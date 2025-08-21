import { db } from '../db';
import { teachersTable, teacherClassesTable, attendancesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteTeacher(teacherId: number): Promise<boolean> {
  try {
    // Check if teacher exists first
    const existingTeacher = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, teacherId))
      .execute();

    if (existingTeacher.length === 0) {
      return false; // Teacher doesn't exist
    }

    // Delete teacher record - cascade will handle:
    // - teacherClasses (teacher_classes table has onDelete: 'cascade')
    // - attendances (attendances table has onDelete: 'set null' for teacher_id)
    const result = await db.delete(teachersTable)
      .where(eq(teachersTable.id, teacherId))
      .execute();

    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Teacher deletion failed:', error);
    throw error;
  }
}