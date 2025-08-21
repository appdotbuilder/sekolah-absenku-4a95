import { db } from '../db';
import { attendancesTable } from '../db/schema';
import { type CreateAttendanceInput, type Attendance } from '../schema';

export async function bulkCreateAttendance(attendanceRecords: CreateAttendanceInput[]): Promise<Attendance[]> {
  try {
    if (attendanceRecords.length === 0) {
      return [];
    }

    // Transform input data for database insertion
    const insertData = attendanceRecords.map(record => ({
      student_id: record.student_id,
      class_id: record.class_id,
      teacher_id: record.teacher_id,
      date: record.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string for date column
      status: record.status,
      check_in_time: record.check_in_time,
      check_out_time: record.check_out_time,
      notes: record.notes
    }));

    // Insert all records at once using bulk insert
    const results = await db.insert(attendancesTable)
      .values(insertData)
      .returning()
      .execute();

    // Convert date strings back to Date objects before returning
    return results.map(result => ({
      ...result,
      date: new Date(result.date) // Convert string back to Date
    }));
  } catch (error) {
    console.error('Bulk attendance creation failed:', error);
    throw error;
  }
}