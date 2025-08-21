import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type Student } from '../schema';
import { eq } from 'drizzle-orm';

export async function getStudentsByClass(classId: number): Promise<Student[]> {
  try {
    // Fetch all students in the specified class
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.class_id, classId))
      .execute();

    // Return the students - no numeric conversion needed for this table
    return students;
  } catch (error) {
    console.error('Failed to get students by class:', error);
    throw error;
  }
}