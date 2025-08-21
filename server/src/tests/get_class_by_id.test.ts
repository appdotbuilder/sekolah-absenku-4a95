import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { getClassById } from '../handlers/get_class_by_id';

describe('getClassById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a class when it exists', async () => {
    // Create a test class
    const testClass = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'A class for testing'
      })
      .returning()
      .execute();

    const classId = testClass[0].id;
    const result = await getClassById(classId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(classId);
    expect(result!.name).toEqual('Test Class');
    expect(result!.description).toEqual('A class for testing');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when class does not exist', async () => {
    const nonExistentId = 999;
    const result = await getClassById(nonExistentId);

    expect(result).toBeNull();
  });

  it('should return class with null description', async () => {
    // Create a test class with null description
    const testClass = await db.insert(classesTable)
      .values({
        name: 'Class Without Description',
        description: null
      })
      .returning()
      .execute();

    const classId = testClass[0].id;
    const result = await getClassById(classId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(classId);
    expect(result!.name).toEqual('Class Without Description');
    expect(result!.description).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return the correct class when multiple classes exist', async () => {
    // Create multiple test classes
    const class1 = await db.insert(classesTable)
      .values({
        name: 'First Class',
        description: 'First class description'
      })
      .returning()
      .execute();

    const class2 = await db.insert(classesTable)
      .values({
        name: 'Second Class',
        description: 'Second class description'
      })
      .returning()
      .execute();

    const class3 = await db.insert(classesTable)
      .values({
        name: 'Third Class',
        description: 'Third class description'
      })
      .returning()
      .execute();

    // Get the second class specifically
    const result = await getClassById(class2[0].id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(class2[0].id);
    expect(result!.name).toEqual('Second Class');
    expect(result!.description).toEqual('Second class description');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle negative class IDs gracefully', async () => {
    const result = await getClassById(-1);
    expect(result).toBeNull();
  });

  it('should handle zero as class ID gracefully', async () => {
    const result = await getClassById(0);
    expect(result).toBeNull();
  });
});