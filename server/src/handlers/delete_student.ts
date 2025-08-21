import { db } from '../db';
import { studentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteStudent(studentId: number): Promise<boolean> {
  try {
    // Delete the student record - cascade deletion will handle related attendance records
    const result = await db.delete(studentsTable)
      .where(eq(studentsTable.id, studentId))
      .returning()
      .execute();

    // Return true if a student was actually deleted
    return result.length > 0;
  } catch (error) {
    console.error('Student deletion failed:', error);
    throw error;
  }
}