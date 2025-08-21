import { db } from '../db';
import { teachersTable } from '../db/schema';
import { type Teacher } from '../schema';
import { eq } from 'drizzle-orm';

export const getTeacherById = async (teacherId: number): Promise<Teacher | null> => {
  try {
    // Query the teacher by ID
    const results = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, teacherId))
      .execute();

    // Return null if no teacher found
    if (results.length === 0) {
      return null;
    }

    // Return the first (and only) result
    return results[0];
  } catch (error) {
    console.error('Failed to fetch teacher by ID:', error);
    throw error;
  }
};