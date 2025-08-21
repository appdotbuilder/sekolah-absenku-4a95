import { db } from '../db';
import { classesTable } from '../db/schema';
import { type UpdateClassInput, type Class } from '../schema';
import { eq } from 'drizzle-orm';

export const updateClass = async (input: UpdateClassInput): Promise<Class | null> => {
  try {
    // Check if class exists
    const existingClass = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.id))
      .execute();

    if (existingClass.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof classesTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update class record
    const result = await db.update(classesTable)
      .set(updateData)
      .where(eq(classesTable.id, input.id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Class update failed:', error);
    throw error;
  }
};