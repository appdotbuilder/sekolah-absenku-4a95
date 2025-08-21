import { db } from '../db';
import { attendancesTable } from '../db/schema';
import { type Attendance } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getStudentAttendanceToday(studentId: number): Promise<Attendance | null> {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Query for today's attendance record for the student
    const result = await db.select()
      .from(attendancesTable)
      .where(
        and(
          eq(attendancesTable.student_id, studentId),
          eq(attendancesTable.date, todayString)
        )
      )
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Return the attendance record
    const attendance = result[0];
    return {
      ...attendance,
      // Convert date fields to Date objects for consistency with schema
      date: new Date(attendance.date),
      created_at: new Date(attendance.created_at),
      updated_at: new Date(attendance.updated_at),
      check_in_time: attendance.check_in_time ? new Date(attendance.check_in_time) : null,
      check_out_time: attendance.check_out_time ? new Date(attendance.check_out_time) : null
    };
  } catch (error) {
    console.error('Failed to fetch student attendance for today:', error);
    throw error;
  }
}