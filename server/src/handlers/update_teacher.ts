import { db } from '../db';
import { teachersTable } from '../db/schema';
import { type UpdateTeacherInput, type Teacher } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTeacher = async (input: UpdateTeacherInput): Promise<Teacher | null> => {
  try {
    // Check if teacher exists
    const existingTeacher = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, input.id))
      .execute();

    if (existingTeacher.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof teachersTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.nip !== undefined) {
      updateData.nip = input.nip;
    }
    if (input.full_name !== undefined) {
      updateData.full_name = input.full_name;
    }
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    if (input.address !== undefined) {
      updateData.address = input.address;
    }
    if (input.photo_url !== undefined) {
      updateData.photo_url = input.photo_url;
    }

    // Update teacher record
    const result = await db.update(teachersTable)
      .set(updateData)
      .where(eq(teachersTable.id, input.id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Teacher update failed:', error);
    throw error;
  }
};