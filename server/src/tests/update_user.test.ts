import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Helper functions for password hashing (same as in handler)
const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password: string, hashedPassword: string): boolean => {
  const [salt, hash] = hashedPassword.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user directly in database before each test
    const hashedPassword = hashPassword('password123');
    
    const result = await db.insert(usersTable)
      .values({
        username: 'testuser',
        password: hashedPassword,
        role: 'siswa'
      })
      .returning()
      .execute();
    
    testUserId = result[0].id;
  });

  it('should update username successfully', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      username: 'updateduser'
    };

    const result = await updateUser(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testUserId);
    expect(result!.username).toEqual('updateduser');
    expect(result!.role).toEqual('siswa'); // Unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update role successfully', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      role: 'guru'
    };

    const result = await updateUser(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testUserId);
    expect(result!.username).toEqual('testuser'); // Unchanged
    expect(result!.role).toEqual('guru');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update password and hash it correctly', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      password: 'newpassword456'
    };

    const result = await updateUser(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testUserId);

    // Verify password is hashed and different from plain text
    expect(result!.password).not.toEqual('newpassword456');
    expect(result!.password.length).toBeGreaterThan(20); // Hashed passwords are longer

    // Verify the password can be verified with our hash function
    const isValidPassword = verifyPassword('newpassword456', result!.password);
    expect(isValidPassword).toBe(true);
  });

  it('should update multiple fields at once', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      username: 'multiupdate',
      role: 'admin',
      password: 'multipassword'
    };

    const result = await updateUser(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(testUserId);
    expect(result!.username).toEqual('multiupdate');
    expect(result!.role).toEqual('admin');
    
    // Verify password was hashed
    const isValidPassword = verifyPassword('multipassword', result!.password);
    expect(isValidPassword).toBe(true);
    
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when user does not exist', async () => {
    const updateInput: UpdateUserInput = {
      id: 99999, // Non-existent ID
      username: 'nonexistent'
    };

    const result = await updateUser(updateInput);

    expect(result).toBeNull();
  });

  it('should persist changes to database', async () => {
    const updateInput: UpdateUserInput = {
      id: testUserId,
      username: 'persisteduser',
      role: 'guru'
    };

    await updateUser(updateInput);

    // Verify changes were persisted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUserId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('persisteduser');
    expect(users[0].role).toEqual('guru');
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle partial updates correctly', async () => {
    // Update only username
    const updateUsernameInput: UpdateUserInput = {
      id: testUserId,
      username: 'onlyusername'
    };

    const result = await updateUser(updateUsernameInput);

    expect(result).toBeDefined();
    expect(result!.username).toEqual('onlyusername');
    expect(result!.role).toEqual('siswa'); // Should remain unchanged

    // Verify original password still works
    const isOriginalPasswordValid = verifyPassword('password123', result!.password);
    expect(isOriginalPasswordValid).toBe(true);
  });

  it('should update updated_at timestamp', async () => {
    // Get original timestamp
    const originalUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUserId))
      .execute();

    const originalTimestamp = originalUser[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateUserInput = {
      id: testUserId,
      username: 'timestamptest'
    };

    const result = await updateUser(updateInput);

    expect(result).toBeDefined();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should throw error for duplicate username', async () => {
    // Create another user with different username directly in database
    const hashedPassword = hashPassword('password123');
    await db.insert(usersTable)
      .values({
        username: 'anotheruser',
        password: hashedPassword,
        role: 'guru'
      })
      .execute();

    // Try to update first user with second user's username
    const updateInput: UpdateUserInput = {
      id: testUserId,
      username: 'anotheruser' // This should cause a conflict
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/duplicate key/i);
  });
});