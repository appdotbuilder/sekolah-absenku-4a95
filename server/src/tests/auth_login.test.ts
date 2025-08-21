import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/auth_login';

// Test users for different roles
const testUsers = {
  student: {
    username: 'student123',
    password: 'password123',
    role: 'siswa' as const
  },
  teacher: {
    username: 'teacher456',
    password: 'password456',
    role: 'guru' as const
  },
  admin: {
    username: 'admin789',
    password: 'password789',
    role: 'admin' as const
  }
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Create test users in database
    await db.insert(usersTable).values([
      testUsers.student,
      testUsers.teacher,
      testUsers.admin
    ]).execute();
  });

  it('should authenticate valid user credentials', async () => {
    const loginInput: LoginInput = {
      username: 'student123',
      password: 'password123',
      role: 'siswa'
    };

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result!.username).toEqual('student123');
    expect(result!.role).toEqual('siswa');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should authenticate teacher credentials', async () => {
    const loginInput: LoginInput = {
      username: 'teacher456',
      password: 'password456',
      role: 'guru'
    };

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result!.username).toEqual('teacher456');
    expect(result!.role).toEqual('guru');
    expect(result!.password).toEqual('password456');
  });

  it('should authenticate admin credentials', async () => {
    const loginInput: LoginInput = {
      username: 'admin789',
      password: 'password789',
      role: 'admin'
    };

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result!.username).toEqual('admin789');
    expect(result!.role).toEqual('admin');
  });

  it('should return null for invalid username', async () => {
    const loginInput: LoginInput = {
      username: 'nonexistent',
      password: 'password123',
      role: 'siswa'
    };

    const result = await loginUser(loginInput);

    expect(result).toBeNull();
  });

  it('should return null for invalid password', async () => {
    const loginInput: LoginInput = {
      username: 'student123',
      password: 'wrongpassword',
      role: 'siswa'
    };

    const result = await loginUser(loginInput);

    expect(result).toBeNull();
  });

  it('should return null for wrong role', async () => {
    const loginInput: LoginInput = {
      username: 'student123',
      password: 'password123',
      role: 'guru' // Wrong role - student exists but as 'siswa'
    };

    const result = await loginUser(loginInput);

    expect(result).toBeNull();
  });

  it('should return null for username with correct password but wrong role', async () => {
    const loginInput: LoginInput = {
      username: 'teacher456',
      password: 'password456',
      role: 'admin' // Teacher exists as 'guru', not 'admin'
    };

    const result = await loginUser(loginInput);

    expect(result).toBeNull();
  });

  it('should verify database query with exact username and role match', async () => {
    // Create users with different usernames to test role specificity
    await db.insert(usersTable).values({
      username: 'roletest_student',
      password: 'pass1',
      role: 'siswa'
    }).execute();

    await db.insert(usersTable).values({
      username: 'roletest_teacher',
      password: 'pass2',
      role: 'guru'
    }).execute();

    // Login as student with correct credentials
    const studentLogin: LoginInput = {
      username: 'roletest_student',
      password: 'pass1',
      role: 'siswa'
    };

    const studentResult = await loginUser(studentLogin);
    expect(studentResult).not.toBeNull();
    expect(studentResult!.role).toEqual('siswa');
    expect(studentResult!.password).toEqual('pass1');

    // Login as teacher with correct credentials
    const teacherLogin: LoginInput = {
      username: 'roletest_teacher',
      password: 'pass2',
      role: 'guru'
    };

    const teacherResult = await loginUser(teacherLogin);
    expect(teacherResult).not.toBeNull();
    expect(teacherResult!.role).toEqual('guru');
    expect(teacherResult!.password).toEqual('pass2');

    // Try to login as student with teacher's username - should fail
    const wrongRoleLogin: LoginInput = {
      username: 'roletest_teacher',
      password: 'pass2',
      role: 'siswa' // Wrong role for this username
    };

    const wrongResult = await loginUser(wrongRoleLogin);
    expect(wrongResult).toBeNull();

    // Try to login with student username but wrong password - should fail
    const wrongPasswordLogin: LoginInput = {
      username: 'roletest_student',
      password: 'pass2', // Teacher's password
      role: 'siswa'
    };

    const wrongPasswordResult = await loginUser(wrongPasswordLogin);
    expect(wrongPasswordResult).toBeNull();
  });

  it('should handle empty database gracefully', async () => {
    // Clear all users
    await db.delete(usersTable).execute();

    const loginInput: LoginInput = {
      username: 'student123',
      password: 'password123',
      role: 'siswa'
    };

    const result = await loginUser(loginInput);

    expect(result).toBeNull();
  });
});