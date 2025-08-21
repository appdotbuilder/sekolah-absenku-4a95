import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type ChangePasswordInput } from '../schema';
import { changePassword } from '../handlers/change_password';
import { eq } from 'drizzle-orm';

// Test input with current and new passwords
const testInput: ChangePasswordInput = {
  current_password: 'currentPassword123',
  new_password: 'newPassword456'
};

describe('changePassword', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should change password when current password is correct', async () => {
    // Create a test user with hashed password
    const hashedPassword = await Bun.password.hash('currentPassword123');
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        password: hashedPassword,
        role: 'siswa'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Change password
    const result = await changePassword(userId, testInput);

    expect(result).toBe(true);

    // Verify password was actually changed in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    const updatedUser = users[0];
    
    // Verify old password no longer works
    const oldPasswordValid = await Bun.password.verify('currentPassword123', updatedUser.password);
    expect(oldPasswordValid).toBe(false);

    // Verify new password works
    const newPasswordValid = await Bun.password.verify('newPassword456', updatedUser.password);
    expect(newPasswordValid).toBe(true);

    // Verify updated_at timestamp was updated
    expect(updatedUser.updated_at).toBeInstanceOf(Date);
  });

  it('should return false when current password is incorrect', async () => {
    // Create a test user with different password
    const hashedPassword = await Bun.password.hash('differentPassword');
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        password: hashedPassword,
        role: 'siswa'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Try to change password with wrong current password
    const result = await changePassword(userId, testInput);

    expect(result).toBe(false);

    // Verify password was NOT changed
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    const user = users[0];
    
    // Original password should still work
    const originalPasswordValid = await Bun.password.verify('differentPassword', user.password);
    expect(originalPasswordValid).toBe(true);

    // New password should not work
    const newPasswordValid = await Bun.password.verify('newPassword456', user.password);
    expect(newPasswordValid).toBe(false);
  });

  it('should return false when user does not exist', async () => {
    // Try to change password for non-existent user
    const nonExistentUserId = 999;
    
    const result = await changePassword(nonExistentUserId, testInput);

    expect(result).toBe(false);
  });

  it('should handle different user roles correctly', async () => {
    // Test with guru role
    const hashedPassword = await Bun.password.hash('currentPassword123');
    const teacherResult = await db.insert(usersTable)
      .values({
        username: 'teacher1',
        password: hashedPassword,
        role: 'guru'
      })
      .returning()
      .execute();

    const teacherId = teacherResult[0].id;

    const result = await changePassword(teacherId, testInput);

    expect(result).toBe(true);

    // Verify password change worked for teacher
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, teacherId))
      .execute();

    const updatedTeacher = users[0];
    const newPasswordValid = await Bun.password.verify('newPassword456', updatedTeacher.password);
    expect(newPasswordValid).toBe(true);
    expect(updatedTeacher.role).toBe('guru');
  });

  it('should properly hash the new password', async () => {
    // Create test user
    const hashedPassword = await Bun.password.hash('currentPassword123');
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        password: hashedPassword,
        role: 'admin'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Change password
    await changePassword(userId, testInput);

    // Get updated user
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    const updatedUser = users[0];

    // Password should be hashed (not plain text)
    expect(updatedUser.password).not.toBe('newPassword456');
    expect(updatedUser.password.length).toBeGreaterThan(50); // Bun password hashes are long

    // But Bun.password.verify should still work
    const passwordValid = await Bun.password.verify('newPassword456', updatedUser.password);
    expect(passwordValid).toBe(true);
  });

  it('should update the updated_at timestamp', async () => {
    // Create test user
    const hashedPassword = await Bun.password.hash('currentPassword123');
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        password: hashedPassword,
        role: 'siswa'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const originalUpdatedAt = userResult[0].updated_at;

    // Wait a tiny bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Change password
    await changePassword(userId, testInput);

    // Get updated user
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    const updatedUser = users[0];

    // updated_at should be more recent
    expect(updatedUser.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});