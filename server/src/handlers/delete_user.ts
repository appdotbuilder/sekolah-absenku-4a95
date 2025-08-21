import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteUser = async (userId: number): Promise<boolean> => {
  try {
    // Delete the user - cascading deletes will handle related records
    const result = await db.delete(usersTable)
      .where(eq(usersTable.id, userId))
      .returning()
      .execute();

    // Return true if a user was deleted, false if no user found
    return result.length > 0;
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
};