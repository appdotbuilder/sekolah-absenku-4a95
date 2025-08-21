import { db } from '../db';
import { teachersTable, usersTable } from '../db/schema';
import { type CreateTeacherInput, type Teacher } from '../schema';
import { eq } from 'drizzle-orm';

export const createTeacher = async (input: CreateTeacherInput): Promise<Teacher> => {
  try {
    // Verify that the referenced user exists and has 'guru' role
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    if (user[0].role !== 'guru') {
      throw new Error('User must have role "guru" to be created as a teacher');
    }

    // Insert teacher record
    const result = await db.insert(teachersTable)
      .values({
        user_id: input.user_id,
        nip: input.nip,
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
    console.error('Teacher creation failed:', error);
    throw error;
  }
};