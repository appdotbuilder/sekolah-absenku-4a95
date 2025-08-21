import { db } from '../db';
import { attendancesTable, studentsTable, classesTable, teachersTable } from '../db/schema';
import { type AttendanceReportQuery, type Attendance } from '../schema';
import { eq, and, gte, lte, SQL } from 'drizzle-orm';

export async function getAttendanceReport(query: AttendanceReportQuery): Promise<Attendance[]> {
  try {
    // Start with base query - select from attendances with joins for better query capabilities
    let baseQuery = db.select()
      .from(attendancesTable)
      .innerJoin(studentsTable, eq(attendancesTable.student_id, studentsTable.id))
      .innerJoin(classesTable, eq(attendancesTable.class_id, classesTable.id));

    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Date range filtering (required parameters) - convert Date objects to string format
    const startDateString = query.start_date.toISOString().split('T')[0];
    const endDateString = query.end_date.toISOString().split('T')[0];
    conditions.push(gte(attendancesTable.date, startDateString));
    conditions.push(lte(attendancesTable.date, endDateString));

    // Optional class filtering
    if (query.class_id !== undefined) {
      conditions.push(eq(attendancesTable.class_id, query.class_id));
    }

    // Optional student filtering
    if (query.student_id !== undefined) {
      conditions.push(eq(attendancesTable.student_id, query.student_id));
    }

    // Optional status filtering
    if (query.status !== undefined) {
      conditions.push(eq(attendancesTable.status, query.status));
    }

    // Apply all conditions
    const finalQuery = baseQuery.where(and(...conditions));

    const results = await finalQuery.execute();

    // Transform results from joined structure back to Attendance objects
    return results.map(result => {
      const attendanceData = result.attendances;
      return {
        id: attendanceData.id,
        student_id: attendanceData.student_id,
        class_id: attendanceData.class_id,
        teacher_id: attendanceData.teacher_id,
        date: new Date(attendanceData.date), // Convert string date back to Date object
        status: attendanceData.status,
        check_in_time: attendanceData.check_in_time,
        check_out_time: attendanceData.check_out_time,
        notes: attendanceData.notes,
        created_at: attendanceData.created_at,
        updated_at: attendanceData.updated_at
      };
    });
  } catch (error) {
    console.error('Attendance report generation failed:', error);
    throw error;
  }
}