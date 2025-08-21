import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export const updateUser = async (input: UpdateUserInput): Promise<User | null> => {
  try {
    // First check if user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    if (existingUser.length === 0) {
      return null; // User not found
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };

    // Add fields that are being updated
    if (input.username !== undefined) {
      updateData.username = input.username;
    }

    if (input.role !== undefined) {
      updateData.role = input.role;
    }

    // Hash password if provided
    if (input.password !== undefined) {
      // Create a salt and hash the password
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(input.password, salt, 1000, 64, 'sha512').toString('hex');
      updateData.password = `${salt}:${hash}`;
    }

    // Update user in database
    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
};