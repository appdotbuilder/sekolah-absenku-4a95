import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput, type Class } from '../schema';

export const createClass = async (input: CreateClassInput): Promise<Class> => {
  try {
    // Insert class record
    const result = await db.insert(classesTable)
      .values({
        name: input.name,
        description: input.description
      })
      .returning()
      .execute();

    // Return the created class
    const classRecord = result[0];
    return {
      ...classRecord,
      // Ensure dates are properly converted to Date objects
      created_at: new Date(classRecord.created_at),
      updated_at: new Date(classRecord.updated_at)
    };
  } catch (error) {
    console.error('Class creation failed:', error);
    throw error;
  }
};