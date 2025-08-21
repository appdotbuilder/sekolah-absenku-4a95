import { db } from '../db';
import { attendancesTable, studentsTable } from '../db/schema';
import { type StudentAttendanceInput, type Attendance } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function studentCheckInOut(studentId: number, input: StudentAttendanceInput): Promise<Attendance | null> {
  try {
    const currentDate = new Date();
    // Format today's date as YYYY-MM-DD string for the date column
    const todayString = currentDate.toISOString().split('T')[0];

    if (input.type === 'check_in') {
      // First, get the student's class_id
      const student = await db.select()
        .from(studentsTable)
        .where(eq(studentsTable.id, studentId))
        .execute();

      if (student.length === 0) {
        return null; // Student not found
      }

      // Check if attendance record already exists for today
      const existingAttendance = await db.select()
        .from(attendancesTable)
        .where(and(
          eq(attendancesTable.student_id, studentId),
          eq(attendancesTable.date, todayString)
        ))
        .execute();

      if (existingAttendance.length > 0) {
        return null; // Already checked in today
      }

      // Create new attendance record with check_in_time
      const result = await db.insert(attendancesTable)
        .values({
          student_id: studentId,
          class_id: student[0].class_id,
          teacher_id: null, // Self-recorded attendance
          date: todayString,
          status: 'hadir',
          check_in_time: currentDate,
          check_out_time: null,
          notes: null
        })
        .returning()
        .execute();

      // Convert the date string back to Date object for the response
      return {
        ...result[0],
        date: new Date(result[0].date)
      };

    } else if (input.type === 'check_out') {
      // Find today's attendance record for check_out
      const existingAttendance = await db.select()
        .from(attendancesTable)
        .where(and(
          eq(attendancesTable.student_id, studentId),
          eq(attendancesTable.date, todayString)
        ))
        .execute();

      if (existingAttendance.length === 0) {
        return null; // No check-in record found for today
      }

      if (existingAttendance[0].check_out_time !== null) {
        return null; // Already checked out today
      }

      // Update existing attendance record with check_out_time
      const result = await db.update(attendancesTable)
        .set({
          check_out_time: currentDate,
          updated_at: currentDate
        })
        .where(eq(attendancesTable.id, existingAttendance[0].id))
        .returning()
        .execute();

      // Convert the date string back to Date object for the response
      return {
        ...result[0],
        date: new Date(result[0].date)
      };
    }

    return null; // Invalid type
  } catch (error) {
    console.error('Student check in/out failed:', error);
    throw error;
  }
}