import { db } from '../db';
import { attendancesTable } from '../db/schema';
import { type Attendance } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getClassAttendance = async (classId: number, date: Date): Promise<Attendance[]> => {
  try {
    // Format the date to YYYY-MM-DD string for PostgreSQL date column comparison
    const dateString = date.toISOString().split('T')[0];
    
    // Query attendance records for the specified class and date
    const results = await db.select()
      .from(attendancesTable)
      .where(and(
        eq(attendancesTable.class_id, classId),
        eq(attendancesTable.date, dateString)
      ))
      .execute();

    // Convert date strings to Date objects to match schema expectations
    return results.map(result => ({
      ...result,
      date: new Date(result.date)
    }));
  } catch (error) {
    console.error('Failed to fetch class attendance:', error);
    throw error;
  }
};