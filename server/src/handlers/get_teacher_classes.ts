import { db } from '../db';
import { teacherClassesTable, classesTable } from '../db/schema';
import { type Class } from '../schema';
import { eq } from 'drizzle-orm';

export async function getTeacherClasses(teacherId: number): Promise<Class[]> {
  try {
    // Query to get all classes assigned to the teacher
    const results = await db.select({
      id: classesTable.id,
      name: classesTable.name,
      description: classesTable.description,
      created_at: classesTable.created_at,
      updated_at: classesTable.updated_at
    })
      .from(teacherClassesTable)
      .innerJoin(classesTable, eq(teacherClassesTable.class_id, classesTable.id))
      .where(eq(teacherClassesTable.teacher_id, teacherId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get teacher classes:', error);
    throw error;
  }
}