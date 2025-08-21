import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type UpdateClassInput } from '../schema';
import { updateClass } from '../handlers/update_class';
import { eq } from 'drizzle-orm';

describe('updateClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a class successfully', async () => {
    // Create a test class first
    const createdClass = await db.insert(classesTable)
      .values({
        name: 'Original Class',
        description: 'Original description'
      })
      .returning()
      .execute();

    const testInput: UpdateClassInput = {
      id: createdClass[0].id,
      name: 'Updated Class Name',
      description: 'Updated description'
    };

    const result = await updateClass(testInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdClass[0].id);
    expect(result!.name).toEqual('Updated Class Name');
    expect(result!.description).toEqual('Updated description');
    expect(result!.created_at).toEqual(createdClass[0].created_at);
    expect(result!.updated_at).not.toEqual(createdClass[0].updated_at);
  });

  it('should update only name when only name is provided', async () => {
    // Create a test class first
    const createdClass = await db.insert(classesTable)
      .values({
        name: 'Original Class',
        description: 'Original description'
      })
      .returning()
      .execute();

    const testInput: UpdateClassInput = {
      id: createdClass[0].id,
      name: 'Only Name Updated'
    };

    const result = await updateClass(testInput);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Only Name Updated');
    expect(result!.description).toEqual('Original description'); // Should remain unchanged
  });

  it('should update only description when only description is provided', async () => {
    // Create a test class first
    const createdClass = await db.insert(classesTable)
      .values({
        name: 'Original Class',
        description: 'Original description'
      })
      .returning()
      .execute();

    const testInput: UpdateClassInput = {
      id: createdClass[0].id,
      description: 'Only description updated'
    };

    const result = await updateClass(testInput);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Original Class'); // Should remain unchanged
    expect(result!.description).toEqual('Only description updated');
  });

  it('should handle null description update', async () => {
    // Create a test class first
    const createdClass = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'Some description'
      })
      .returning()
      .execute();

    const testInput: UpdateClassInput = {
      id: createdClass[0].id,
      description: null
    };

    const result = await updateClass(testInput);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Test Class');
    expect(result!.description).toBeNull();
  });

  it('should return null when class does not exist', async () => {
    const testInput: UpdateClassInput = {
      id: 999999, // Non-existent ID
      name: 'Updated Name'
    };

    const result = await updateClass(testInput);

    expect(result).toBeNull();
  });

  it('should persist changes to database', async () => {
    // Create a test class first
    const createdClass = await db.insert(classesTable)
      .values({
        name: 'Original Class',
        description: 'Original description'
      })
      .returning()
      .execute();

    const testInput: UpdateClassInput = {
      id: createdClass[0].id,
      name: 'Database Updated Name',
      description: 'Database updated description'
    };

    await updateClass(testInput);

    // Verify changes are persisted in database
    const updatedClass = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, createdClass[0].id))
      .execute();

    expect(updatedClass).toHaveLength(1);
    expect(updatedClass[0].name).toEqual('Database Updated Name');
    expect(updatedClass[0].description).toEqual('Database updated description');
    expect(updatedClass[0].updated_at.getTime()).toBeGreaterThan(createdClass[0].updated_at.getTime());
  });

  it('should update updated_at timestamp even with minimal changes', async () => {
    // Create a test class first
    const createdClass = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'Test description'
      })
      .returning()
      .execute();

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const testInput: UpdateClassInput = {
      id: createdClass[0].id,
      name: 'Updated Name'
    };

    const result = await updateClass(testInput);

    expect(result).not.toBeNull();
    expect(result!.updated_at.getTime()).toBeGreaterThan(createdClass[0].updated_at.getTime());
  });

  it('should handle empty string description', async () => {
    // Create a test class first
    const createdClass = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        description: 'Original description'
      })
      .returning()
      .execute();

    const testInput: UpdateClassInput = {
      id: createdClass[0].id,
      description: ''
    };

    const result = await updateClass(testInput);

    expect(result).not.toBeNull();
    expect(result!.description).toEqual('');
  });
});