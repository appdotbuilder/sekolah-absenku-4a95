import { db } from '../db';
import { usersTable, studentsTable, teachersTable } from '../db/schema';
import { type User } from '../schema';
import { eq } from 'drizzle-orm';

export const getCurrentUser = async (userId: number): Promise<User | null> => {
  try {
    // First, get the user data
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (users.length === 0) {
      return null;
    }

    const user = users[0];

    // Based on the user's role, fetch additional profile information
    if (user.role === 'siswa') {
      // Get student profile data
      const students = await db.select()
        .from(studentsTable)
        .where(eq(studentsTable.user_id, userId))
        .execute();

      if (students.length > 0) {
        const student = students[0];
        return {
          ...user,
          profile: {
            id: student.id,
            class_id: student.class_id,
            nis: student.nis,
            nisn: student.nisn,
            full_name: student.full_name,
            email: student.email,
            phone: student.phone,
            address: student.address,
            photo_url: student.photo_url
          }
        } as User & { profile: any };
      }
    } else if (user.role === 'guru') {
      // Get teacher profile data
      const teachers = await db.select()
        .from(teachersTable)
        .where(eq(teachersTable.user_id, userId))
        .execute();

      if (teachers.length > 0) {
        const teacher = teachers[0];
        return {
          ...user,
          profile: {
            id: teacher.id,
            nip: teacher.nip,
            full_name: teacher.full_name,
            email: teacher.email,
            phone: teacher.phone,
            address: teacher.address,
            photo_url: teacher.photo_url
          }
        } as User & { profile: any };
      }
    }

    // Return base user data for admin or if no profile found
    return user;
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    throw error;
  }
};