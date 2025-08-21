import { db } from '../db';
import { studentsTable, classesTable, usersTable } from '../db/schema';
import { type Student } from '../schema';
import { eq } from 'drizzle-orm';

export async function getStudents(): Promise<Student[]> {
  try {
    // Fetch all students with their associated class and user information
    const results = await db.select()
      .from(studentsTable)
      .innerJoin(classesTable, eq(studentsTable.class_id, classesTable.id))
      .innerJoin(usersTable, eq(studentsTable.user_id, usersTable.id))
      .execute();

    // Transform the joined results to match the Student schema
    return results.map(result => ({
      id: result.students.id,
      user_id: result.students.user_id,
      class_id: result.students.class_id,
      nis: result.students.nis,
      nisn: result.students.nisn,
      full_name: result.students.full_name,
      email: result.students.email,
      phone: result.students.phone,
      address: result.students.address,
      photo_url: result.students.photo_url,
      created_at: result.students.created_at,
      updated_at: result.students.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch students:', error);
    throw error;
  }
}