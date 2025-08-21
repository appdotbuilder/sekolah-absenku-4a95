import { db } from '../db';
import { attendancesTable } from '../db/schema';
import { type Attendance } from '../schema';
import { eq, gte, lte, and, desc, SQL } from 'drizzle-orm';

export async function getStudentAttendanceHistory(studentId: number, startDate?: Date, endDate?: Date): Promise<Attendance[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [
      eq(attendancesTable.student_id, studentId)
    ];

    // Add date range filters if provided (convert Date to string format)
    if (startDate) {
      conditions.push(gte(attendancesTable.date, startDate.toISOString().split('T')[0]));
    }

    if (endDate) {
      conditions.push(lte(attendancesTable.date, endDate.toISOString().split('T')[0]));
    }

    // If no date range specified, limit to recent records (last 30 days)
    if (!startDate && !endDate) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      conditions.push(gte(attendancesTable.date, thirtyDaysAgo.toISOString().split('T')[0]));
    }

    // Build and execute query in one step to avoid type issues
    const results = await db.select()
      .from(attendancesTable)
      .where(and(...conditions))
      .orderBy(desc(attendancesTable.date), desc(attendancesTable.created_at))
      .execute();

    // Return the attendance records with proper date conversions
    return results.map(record => ({
      ...record,
      date: new Date(record.date), // Convert date string to Date object
      check_in_time: record.check_in_time ? new Date(record.check_in_time) : null,
      check_out_time: record.check_out_time ? new Date(record.check_out_time) : null,
      created_at: new Date(record.created_at),
      updated_at: new Date(record.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch student attendance history:', error);
    throw error;
  }
}