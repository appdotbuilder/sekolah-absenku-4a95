import { db } from '../db';
import { attendancesTable } from '../db/schema';
import { type UpdateAttendanceInput, type Attendance } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateAttendance(input: UpdateAttendanceInput): Promise<Attendance | null> {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof attendancesTable.$inferInsert> = {
      updated_at: new Date(),
    };

    if (input.status !== undefined) {
      updateData['status'] = input.status;
    }

    if (input.check_in_time !== undefined) {
      updateData['check_in_time'] = input.check_in_time;
    }

    if (input.check_out_time !== undefined) {
      updateData['check_out_time'] = input.check_out_time;
    }

    if (input.notes !== undefined) {
      updateData['notes'] = input.notes;
    }

    // Update the attendance record
    const result = await db
      .update(attendancesTable)
      .set(updateData)
      .where(eq(attendancesTable.id, input.id))
      .returning()
      .execute();

    // Return the updated record or null if not found
    if (result.length > 0) {
      const record = result[0];
      return {
        ...record,
        date: new Date(record.date) // Convert string date back to Date object
      };
    }
    
    return null;
  } catch (error) {
    console.error('Attendance update failed:', error);
    throw error;
  }
}