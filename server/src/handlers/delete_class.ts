import { db } from '../db';
import { classesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteClass = async (classId: number): Promise<boolean> => {
  try {
    // Delete the class by ID
    // Due to cascade delete constraints in the schema, this will automatically
    // delete related students and attendance records
    const result = await db.delete(classesTable)
      .where(eq(classesTable.id, classId))
      .execute();

    // Check if any rows were affected (class existed and was deleted)
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Class deletion failed:', error);
    throw error;
  }
};