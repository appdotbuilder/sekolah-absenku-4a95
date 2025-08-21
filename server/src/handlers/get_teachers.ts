import { db } from '../db';
import { teachersTable, usersTable } from '../db/schema';
import { type Teacher } from '../schema';
import { eq } from 'drizzle-orm';

export async function getTeachers(): Promise<Teacher[]> {
  try {
    // Query teachers with their user information
    const results = await db.select()
      .from(teachersTable)
      .innerJoin(usersTable, eq(teachersTable.user_id, usersTable.id))
      .execute();

    // Transform the joined results to match the Teacher schema
    return results.map(result => ({
      id: result.teachers.id,
      user_id: result.teachers.user_id,
      nip: result.teachers.nip,
      full_name: result.teachers.full_name,
      email: result.teachers.email,
      phone: result.teachers.phone,
      address: result.teachers.address,
      photo_url: result.teachers.photo_url,
      created_at: result.teachers.created_at,
      updated_at: result.teachers.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch teachers:', error);
    throw error;
  }
}