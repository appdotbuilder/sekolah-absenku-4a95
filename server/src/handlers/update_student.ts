import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type UpdateStudentInput, type Student } from '../schema';
import { eq } from 'drizzle-orm';

export const updateStudent = async (input: UpdateStudentInput): Promise<Student | null> => {
  try {
    // Check if student exists first
    const existingStudent = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.id))
      .execute();

    if (existingStudent.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date()
    };

    if (input.class_id !== undefined) {
      updateData['class_id'] = input.class_id;
    }

    if (input.nis !== undefined) {
      updateData['nis'] = input.nis;
    }

    if (input.nisn !== undefined) {
      updateData['nisn'] = input.nisn;
    }

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

    // Update student record
    const result = await db.update(studentsTable)
      .set(updateData)
      .where(eq(studentsTable.id, input.id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Student update failed:', error);
    throw error;
  }
};