import { db } from '../db';
import { attendancesTable, studentsTable } from '../db/schema';
import { type AttendanceStats } from '../schema';
import { eq, and, gte, lte, count, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getAttendanceStatistics(classId?: number, startDate?: Date, endDate?: Date): Promise<AttendanceStats> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (classId !== undefined) {
      conditions.push(eq(attendancesTable.class_id, classId));
    }

    if (startDate !== undefined) {
      conditions.push(gte(attendancesTable.date, startDate.toISOString().split('T')[0]));
    }

    if (endDate !== undefined) {
      conditions.push(lte(attendancesTable.date, endDate.toISOString().split('T')[0]));
    }

    // Get attendance counts by status
    const attendanceQuery = db
      .select({
        status: attendancesTable.status,
        count: count(attendancesTable.id).as('count')
      })
      .from(attendancesTable)
      .groupBy(attendancesTable.status);

    // Execute query with or without conditions
    const attendanceResults = conditions.length > 0
      ? await attendanceQuery.where(
          conditions.length === 1 ? conditions[0] : and(...conditions)
        ).execute()
      : await attendanceQuery.execute();

    // Initialize counters
    let present = 0;
    let permission = 0;
    let sick = 0;
    let absent = 0;

    // Process results and map to appropriate counters
    attendanceResults.forEach(result => {
      switch (result.status) {
        case 'hadir':
          present = result.count;
          break;
        case 'izin':
          permission = result.count;
          break;
        case 'sakit':
          sick = result.count;
          break;
        case 'alpha':
          absent = result.count;
          break;
      }
    });

    // Calculate total attendance records
    const totalAttendanceRecords = present + permission + sick + absent;

    // Get total unique students count
    const studentsQuery = db
      .select({
        count: count(sql`DISTINCT ${studentsTable.id}`).as('count')
      })
      .from(studentsTable);

    // Execute students query with or without class filter
    const studentsResult = classId !== undefined
      ? await studentsQuery.where(eq(studentsTable.class_id, classId)).execute()
      : await studentsQuery.execute();

    const totalStudents = studentsResult[0]?.count || 0;

    // Calculate attendance rate (present / total attendance records)
    let attendanceRate = 0;
    if (totalAttendanceRecords > 0) {
      attendanceRate = Number(((present / totalAttendanceRecords) * 100).toFixed(2));
    }

    return {
      total_students: totalStudents,
      present,
      permission,
      sick,
      absent,
      attendance_rate: attendanceRate
    };
  } catch (error) {
    console.error('Failed to get attendance statistics:', error);
    throw error;
  }
}