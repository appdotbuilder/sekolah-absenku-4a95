import { db } from '../db';
import { attendancesTable } from '../db/schema';
import { type CreateAttendanceInput, type Attendance } from '../schema';

export const createAttendance = async (input: CreateAttendanceInput): Promise<Attendance> => {
  try {
    // Insert attendance record
    const result = await db.insert(attendancesTable)
      .values({
        student_id: input.student_id,
        class_id: input.class_id,
        teacher_id: input.teacher_id,
        date: input.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string for date column
        status: input.status,
        check_in_time: input.check_in_time,
        check_out_time: input.check_out_time,
        notes: input.notes
      })
      .returning()
      .execute();

    const attendance = result[0];
    return {
      ...attendance,
      date: new Date(attendance.date) // Convert date string back to Date object
    };
  } catch (error) {
    console.error('Attendance creation failed:', error);
    throw error;
  }
};