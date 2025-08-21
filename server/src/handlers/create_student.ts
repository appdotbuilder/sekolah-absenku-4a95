import { db } from '../db';
import { studentsTable, usersTable, classesTable } from '../db/schema';
import { type CreateStudentInput, type Student } from '../schema';
import { eq } from 'drizzle-orm';

export const createStudent = async (input: CreateStudentInput): Promise<Student> => {
  try {
    // Verify that the referenced user exists and has 'siswa' role
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    if (user[0].role !== 'siswa') {
      throw new Error(`User with id ${input.user_id} must have 'siswa' role`);
    }

    // Verify that the referenced class exists
    const classExists = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.class_id))
      .execute();

    if (classExists.length === 0) {
      throw new Error(`Class with id ${input.class_id} not found`);
    }

    // Insert student record
    const result = await db.insert(studentsTable)
      .values({
        user_id: input.user_id,
        class_id: input.class_id,
        nis: input.nis,
        nisn: input.nisn,
        full_name: input.full_name,
        email: input.email,
        phone: input.phone,
        address: input.address,
        photo_url: input.photo_url
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Student creation failed:', error);
    throw error;
  }
};