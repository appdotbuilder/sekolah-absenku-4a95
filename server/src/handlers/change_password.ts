import { db } from '../db';
import { usersTable } from '../db/schema';
import { type ChangePasswordInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function changePassword(userId: number, input: ChangePasswordInput): Promise<boolean> {
  try {
    // First, get the current user from database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (users.length === 0) {
      return false; // User not found
    }

    const user = users[0];

    // Verify current password using Bun's password utilities
    const isCurrentPasswordValid = await Bun.password.verify(input.current_password, user.password);
    if (!isCurrentPasswordValid) {
      return false; // Current password is incorrect
    }

    // Hash the new password using Bun's password utilities
    const hashedNewPassword = await Bun.password.hash(input.new_password);

    // Update the password in database
    const updateResult = await db.update(usersTable)
      .set({ 
        password: hashedNewPassword,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, userId))
      .execute();

    // Return true if password was successfully updated
    return updateResult.rowCount ? updateResult.rowCount > 0 : false;
  } catch (error) {
    console.error('Password change failed:', error);
    throw error;
  }
}