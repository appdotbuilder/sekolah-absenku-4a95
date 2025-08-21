import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test inputs for different user roles
const testInputSiswa: CreateUserInput = {
  username: 'test_student',
  password: 'password123',
  role: 'siswa'
};

const testInputGuru: CreateUserInput = {
  username: 'test_teacher',
  password: 'securepass456',
  role: 'guru'
};

const testInputAdmin: CreateUserInput = {
  username: 'test_admin',
  password: 'adminpass789',
  role: 'admin'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a student user', async () => {
    const result = await createUser(testInputSiswa);

    // Basic field validation
    expect(result.username).toEqual('test_student');
    expect(result.password).toEqual('password123');
    expect(result.role).toEqual('siswa');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a teacher user', async () => {
    const result = await createUser(testInputGuru);

    expect(result.username).toEqual('test_teacher');
    expect(result.password).toEqual('securepass456');
    expect(result.role).toEqual('guru');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an admin user', async () => {
    const result = await createUser(testInputAdmin);

    expect(result.username).toEqual('test_admin');
    expect(result.password).toEqual('adminpass789');
    expect(result.role).toEqual('admin');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInputSiswa);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('test_student');
    expect(users[0].password).toEqual('password123');
    expect(users[0].role).toEqual('siswa');
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should enforce unique username constraint', async () => {
    // Create first user
    await createUser(testInputSiswa);

    // Try to create second user with same username
    const duplicateInput: CreateUserInput = {
      username: 'test_student', // Same username
      password: 'differentpass',
      role: 'guru'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should create multiple users with different usernames', async () => {
    // Create multiple users
    const user1 = await createUser(testInputSiswa);
    const user2 = await createUser(testInputGuru);
    const user3 = await createUser(testInputAdmin);

    // Verify all users were created with different IDs
    expect(user1.id).not.toEqual(user2.id);
    expect(user1.id).not.toEqual(user3.id);
    expect(user2.id).not.toEqual(user3.id);

    // Verify all users exist in database
    const allUsers = await db.select()
      .from(usersTable)
      .execute();

    expect(allUsers).toHaveLength(3);

    // Verify usernames are unique
    const usernames = allUsers.map(u => u.username);
    expect(usernames).toContain('test_student');
    expect(usernames).toContain('test_teacher');
    expect(usernames).toContain('test_admin');
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createUser(testInputSiswa);
    const afterCreation = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());

    // Initially, created_at and updated_at should be very close or equal
    const timeDifference = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDifference).toBeLessThan(1000); // Less than 1 second difference
  });

  it('should handle all valid user roles', async () => {
    const roles = ['siswa', 'guru', 'admin'] as const;
    
    for (const role of roles) {
      const input: CreateUserInput = {
        username: `test_${role}_user`,
        password: 'password123',
        role: role
      };

      const result = await createUser(input);
      expect(result.role).toEqual(role);
      expect(result.username).toEqual(`test_${role}_user`);
    }

    // Verify all users were created
    const allUsers = await db.select()
      .from(usersTable)
      .execute();

    expect(allUsers).toHaveLength(3);
  });
});