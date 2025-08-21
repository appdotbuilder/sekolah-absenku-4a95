import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { getClasses } from '../handlers/get_classes';

// Test data for classes
const testClass1: CreateClassInput = {
  name: 'Kelas 10 IPA 1',
  description: 'Kelas 10 jurusan IPA semester 1'
};

const testClass2: CreateClassInput = {
  name: 'Kelas 11 IPS 2',
  description: 'Kelas 11 jurusan IPS semester 2'
};

const testClass3: CreateClassInput = {
  name: 'Kelas 12 Bahasa',
  description: null // Testing nullable description
};

describe('getClasses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no classes exist', async () => {
    const result = await getClasses();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should return single class when one exists', async () => {
    // Create a test class
    await db.insert(classesTable)
      .values({
        name: testClass1.name,
        description: testClass1.description
      })
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual(testClass1.name);
    expect(result[0].description).toEqual(testClass1.description);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple classes in order they were created', async () => {
    // Create multiple test classes
    await db.insert(classesTable)
      .values([
        {
          name: testClass1.name,
          description: testClass1.description
        },
        {
          name: testClass2.name,
          description: testClass2.description
        },
        {
          name: testClass3.name,
          description: testClass3.description
        }
      ])
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(3);

    // Verify all classes are returned
    const classNames = result.map(c => c.name);
    expect(classNames).toContain(testClass1.name);
    expect(classNames).toContain(testClass2.name);
    expect(classNames).toContain(testClass3.name);

    // Verify all required fields are present
    result.forEach(classItem => {
      expect(classItem.id).toBeDefined();
      expect(typeof classItem.name).toBe('string');
      expect(classItem.created_at).toBeInstanceOf(Date);
      expect(classItem.updated_at).toBeInstanceOf(Date);
      // description can be string or null
      expect(typeof classItem.description === 'string' || classItem.description === null).toBe(true);
    });
  });

  it('should handle class with null description correctly', async () => {
    // Create class with null description
    await db.insert(classesTable)
      .values({
        name: testClass3.name,
        description: testClass3.description
      })
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual(testClass3.name);
    expect(result[0].description).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return classes with unique IDs', async () => {
    // Create multiple classes
    await db.insert(classesTable)
      .values([
        {
          name: testClass1.name,
          description: testClass1.description
        },
        {
          name: testClass2.name,
          description: testClass2.description
        }
      ])
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(2);
    
    // Verify IDs are unique
    const ids = result.map(c => c.id);
    const uniqueIds = [...new Set(ids)];
    expect(uniqueIds).toHaveLength(ids.length);

    // Verify IDs are positive numbers
    ids.forEach(id => {
      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);
    });
  });

  it('should return classes with proper timestamp handling', async () => {
    const beforeInsert = new Date();
    
    await db.insert(classesTable)
      .values({
        name: testClass1.name,
        description: testClass1.description
      })
      .execute();

    const afterInsert = new Date();
    const result = await getClasses();

    expect(result).toHaveLength(1);
    const classItem = result[0];

    // Verify timestamps are within expected range
    expect(classItem.created_at.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime());
    expect(classItem.created_at.getTime()).toBeLessThanOrEqual(afterInsert.getTime());
    expect(classItem.updated_at.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime());
    expect(classItem.updated_at.getTime()).toBeLessThanOrEqual(afterInsert.getTime());
  });
});