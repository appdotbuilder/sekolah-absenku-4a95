import { db } from '../db';
import { teachersTable } from '../db/schema';
import { type UpdateProfileInput, type Teacher } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateTeacherProfile(teacherId: number, input: UpdateProfileInput): Promise<Teacher | null> {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof teachersTable.$inferInsert> = {};
    
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

    // If no fields to update, return current teacher data
    if (Object.keys(updateData).length === 0) {
      const teachers = await db.select()
        .from(teachersTable)
        .where(eq(teachersTable.id, teacherId))
        .execute();
        
      return teachers[0] || null;
    }

    // Set updated timestamp
    updateData.updated_at = new Date();

    // Update teacher profile
    const result = await db.update(teachersTable)
      .set(updateData)
      .where(eq(teachersTable.id, teacherId))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Teacher profile update failed:', error);
    throw error;
  }
}