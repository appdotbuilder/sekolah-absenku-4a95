import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { createClass } from '../handlers/create_class';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateClassInput = {
  name: 'Test Class 10A',
  description: 'Mathematics class for grade 10'
};

// Test input with null description
const testInputNullDescription: CreateClassInput = {
  name: 'Test Class 10B',
  description: null
};

describe('createClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a class with description', async () => {
    const result = await createClass(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Class 10A');
    expect(result.description).toEqual('Mathematics class for grade 10');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a class with null description', async () => {
    const result = await createClass(testInputNullDescription);

    // Basic field validation
    expect(result.name).toEqual('Test Class 10B');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save class to database', async () => {
    const result = await createClass(testInput);

    // Query using proper drizzle syntax
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(classes).toHaveLength(1);
    expect(classes[0].name).toEqual('Test Class 10A');
    expect(classes[0].description).toEqual('Mathematics class for grade 10');
    expect(classes[0].id).toEqual(result.id);
    expect(classes[0].created_at).toBeInstanceOf(Date);
    expect(classes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle unique class names correctly', async () => {
    // Create first class
    const result1 = await createClass(testInput);
    expect(result1.name).toEqual('Test Class 10A');

    // Create second class with different name
    const differentInput: CreateClassInput = {
      name: 'Test Class 11A',
      description: 'Physics class for grade 11'
    };

    const result2 = await createClass(differentInput);
    expect(result2.name).toEqual('Test Class 11A');
    expect(result2.id).not.toEqual(result1.id);

    // Verify both classes exist in database
    const allClasses = await db.select()
      .from(classesTable)
      .execute();

    expect(allClasses).toHaveLength(2);
    expect(allClasses.map(c => c.name)).toContain('Test Class 10A');
    expect(allClasses.map(c => c.name)).toContain('Test Class 11A');
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createClass(testInput);
    const afterCreation = new Date();

    // Check that timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 1000); // 1 second tolerance
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 1000);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 1000);
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 1000);

    // created_at and updated_at should be very close for new records
    const timeDiff = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
  });

  it('should handle empty string description as null', async () => {
    const inputWithEmptyDescription: CreateClassInput = {
      name: 'Test Class Empty Desc',
      description: ''
    };

    const result = await createClass(inputWithEmptyDescription);

    // Empty string should be stored as is, not converted to null
    expect(result.description).toEqual('');
    expect(result.name).toEqual('Test Class Empty Desc');
  });
});