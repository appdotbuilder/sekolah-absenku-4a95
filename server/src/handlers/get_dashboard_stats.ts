import { db } from '../db';
import { studentsTable, teachersTable, classesTable, attendancesTable } from '../db/schema';
import { type DashboardStats } from '../schema';
import { count, eq, sql } from 'drizzle-orm';

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get today's date for attendance filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of next day

    // Get total counts in parallel
    const [
      totalStudentsResult,
      totalTeachersResult,
      totalClassesResult,
      todayAttendanceResult
    ] = await Promise.all([
      // Total students count
      db.select({ count: count() }).from(studentsTable).execute(),
      
      // Total teachers count
      db.select({ count: count() }).from(teachersTable).execute(),
      
      // Total classes count
      db.select({ count: count() }).from(classesTable).execute(),
      
      // Today's attendance stats with status breakdown
      db.select({
        status: attendancesTable.status,
        count: count()
      })
      .from(attendancesTable)
      .where(
        sql`${attendancesTable.date} = ${today.toISOString().split('T')[0]}`
      )
      .groupBy(attendancesTable.status)
      .execute()
    ]);

    // Extract counts
    const totalStudents = totalStudentsResult[0]?.count || 0;
    const totalTeachers = totalTeachersResult[0]?.count || 0;
    const totalClasses = totalClassesResult[0]?.count || 0;

    // Process today's attendance stats
    const attendanceByStatus = {
      hadir: 0,
      izin: 0,
      sakit: 0,
      alpha: 0
    };

    todayAttendanceResult.forEach(record => {
      if (record.status in attendanceByStatus) {
        attendanceByStatus[record.status] = record.count;
      }
    });

    // Calculate totals and attendance rate
    const totalTodayAttendance = Object.values(attendanceByStatus).reduce((sum, count) => sum + count, 0);
    const presentCount = attendanceByStatus.hadir;
    const attendanceRate = totalTodayAttendance > 0 ? (presentCount / totalTodayAttendance) * 100 : 0;

    return {
      total_students: totalStudents,
      total_teachers: totalTeachers,
      total_classes: totalClasses,
      today_attendance: {
        total_students: totalTodayAttendance,
        present: attendanceByStatus.hadir,
        permission: attendanceByStatus.izin,
        sick: attendanceByStatus.sakit,
        absent: attendanceByStatus.alpha,
        attendance_rate: Math.round(attendanceRate * 100) / 100 // Round to 2 decimal places
      }
    };
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    throw error;
  }
}