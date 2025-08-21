import { db } from '../db';
import { teachersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Teacher } from '../schema';

export const getTeacherByUserId = async (userId: number): Promise<Teacher | null> => {
  try {
    // Query teacher by user_id
    const results = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.user_id, userId))
      .execute();

    // Return null if no teacher found
    if (results.length === 0) {
      return null;
    }

    // Return the first matching teacher
    return results[0];
  } catch (error) {
    console.error('Failed to get teacher by user ID:', error);
    throw error;
  }
};