import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type Student } from '../schema';
import { eq } from 'drizzle-orm';

export const getStudentById = async (studentId: number): Promise<Student | null> => {
  try {
    // Query student by ID
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId))
      .execute();

    if (students.length === 0) {
      return null;
    }

    const student = students[0];

    // Return student with proper type conversion
    return {
      id: student.id,
      user_id: student.user_id,
      class_id: student.class_id,
      nis: student.nis,
      nisn: student.nisn,
      full_name: student.full_name,
      email: student.email,
      phone: student.phone,
      address: student.address,
      photo_url: student.photo_url,
      created_at: student.created_at,
      updated_at: student.updated_at
    };
  } catch (error) {
    console.error('Failed to get student by ID:', error);
    throw error;
  }
};