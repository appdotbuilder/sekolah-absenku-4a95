import { db } from '../db';
import { classesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Class } from '../schema';

export const getClassById = async (classId: number): Promise<Class | null> => {
  try {
    const results = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Failed to get class by ID:', error);
    throw error;
  }
};