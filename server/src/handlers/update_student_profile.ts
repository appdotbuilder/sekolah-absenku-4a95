import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type UpdateProfileInput, type Student } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateStudentProfile(studentId: number, input: UpdateProfileInput): Promise<Student | null> {
  try {
    // Check if student exists first
    const existingStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId))
      .execute();

    if (existingStudent.length === 0) {
      return null;
    }

    // Build update data from input (only include defined fields)
    const updateData: Record<string, any> = {};
    
    if (input.full_name !== undefined) {
      updateData['full_name'] = input.full_name;
    }
    
    if (input.email !== undefined) {
      updateData['email'] = input.email;
    }
    
    if (input.phone !== undefined) {
      updateData['phone'] = input.phone;
    }
    
    if (input.address !== undefined) {
      updateData['address'] = input.address;
    }
    
    if (input.photo_url !== undefined) {
      updateData['photo_url'] = input.photo_url;
    }

    // Add updated_at timestamp
    updateData['updated_at'] = new Date();

    // If no fields to update, return current student
    if (Object.keys(updateData).length === 1) { // Only updated_at
      return existingStudent[0] as Student;
    }

    // Update the student record
    const result = await db.update(studentsTable)
      .set(updateData)
      .where(eq(studentsTable.id, studentId))
      .returning()
      .execute();

    return result[0] as Student;
  } catch (error) {
    console.error('Student profile update failed:', error);
    throw error;
  }
}