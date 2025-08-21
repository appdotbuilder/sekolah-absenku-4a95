import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type Student } from '../schema';
import { eq } from 'drizzle-orm';

export async function getStudentByUserId(userId: number): Promise<Student | null> {
  try {
    // Query student by user_id
    const results = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.user_id, userId))
      .execute();

    // Return null if no student found
    if (results.length === 0) {
      return null;
    }

    // Return the first (should be only) student record
    return results[0];
  } catch (error) {
    console.error('Failed to get student by user ID:', error);
    throw error;
  }
}