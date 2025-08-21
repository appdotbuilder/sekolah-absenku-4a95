import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function loginUser(input: LoginInput): Promise<User | null> {
  try {
    // Query user by username and role
    const users = await db.select()
      .from(usersTable)
      .where(and(
        eq(usersTable.username, input.username),
        eq(usersTable.role, input.role)
      ))
      .execute();

    // Check if user exists
    if (users.length === 0) {
      return null;
    }

    const user = users[0];

    // Verify password (in a real app, you'd use bcrypt or similar)
    // For this implementation, we're doing direct comparison
    if (user.password !== input.password) {
      return null;
    }

    // Return user data (excluding password for security)
    return {
      id: user.id,
      username: user.username,
      password: user.password, // Note: In real apps, you'd exclude this
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}