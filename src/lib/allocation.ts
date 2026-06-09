import { prisma } from "./prisma";

interface AllocationResult {
  success: boolean;
  roomId?: number;
  roomNumber?: string;
  error?: string;
}

/**
 * Automatically allocates a room to a student in a specific hostel.
 * Runs inside a database transaction to ensure consistency and prevent race conditions.
 */
export async function allocateRoom(
  studentId: number,
  hostelId: number,
  studentName: string,
  adminId?: number,
  adminName?: string
): Promise<AllocationResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Check if the hostel exists
      const hostel = await tx.hostel.findUnique({
        where: { hostel_id: hostelId },
      });

      if (!hostel) {
        return { success: false, error: "Hostel not found" };
      }

      // 2. Find first available room in the hostel with vacancy
      const availableRoom = await tx.room.findFirst({
        where: {
          hostel_id: hostelId,
          status: "AVAILABLE",
          occupied_count: {
            lt: tx.room.fields.capacity, // occupied_count < capacity
          },
        },
        orderBy: {
          room_number: "asc",
        },
      });

      if (!availableRoom) {
        return {
          success: false,
          error: `No vacant rooms available in ${hostel.hostel_name}`,
        };
      }

      const newOccupiedCount = availableRoom.occupied_count + 1;
      const isFull = newOccupiedCount >= availableRoom.capacity;

      // 3. Update room occupancy count and status
      await tx.room.update({
        where: { room_id: availableRoom.room_id },
        data: {
          occupied_count: newOccupiedCount,
          status: isFull ? "FULL" : "AVAILABLE",
        },
      });

      // 4. Link student to room and hostel
      await tx.student.update({
        where: { student_id: studentId },
        data: {
          hostel_id: hostelId,
          room_id: availableRoom.room_id,
        },
      });

      // 5. Update hostel student count
      await tx.hostel.update({
        where: { hostel_id: hostelId },
        data: {
          no_of_students: { increment: 1 },
        },
      });

      // 6. Log the action
      await tx.activityLog.create({
        data: {
          action: "ROOM_ALLOCATED",
          details: `Student ${studentName} allocated to ${hostel.hostel_name} - Room ${availableRoom.room_number}`,
          admin_id: adminId || null,
          admin_name: adminName || "System",
        },
      });

      return {
        success: true,
        roomId: availableRoom.room_id,
        roomNumber: availableRoom.room_number,
      };
    });
  } catch (error: any) {
    console.error("Room allocation transaction failed:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred during room allocation.",
    };
  }
}

/**
 * Deallocates a student from their current room.
 */
export async function deallocateRoom(
  studentId: number,
  adminId?: number,
  adminName?: string
): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx) => {
      const student = await tx.student.findUnique({
        where: { student_id: studentId },
        include: { room: true, hostel: true },
      });

      if (!student || !student.room || !student.hostel) {
        return; // Student doesn't have a room or hostel linked
      }

      const room = student.room;
      const hostel = student.hostel;

      const newOccupiedCount = Math.max(0, room.occupied_count - 1);
      
      // Update room occupancy
      await tx.room.update({
        where: { room_id: room.room_id },
        data: {
          occupied_count: newOccupiedCount,
          status: "AVAILABLE", // Always available if count drops below capacity
        },
      });

      // Remove room association from student (keep hostel or set null, let's set room_id null, but student can stay registered)
      await tx.student.update({
        where: { student_id: studentId },
        data: {
          room_id: null,
          hostel_id: null,
        },
      });

      // Update hostel student count
      await tx.hostel.update({
        where: { hostel_id: hostel.hostel_id },
        data: {
          no_of_students: { decrement: 1 },
        },
      });

      // Log the action
      await tx.activityLog.create({
        data: {
          action: "ROOM_DEALLOCATED",
          details: `Student ${student.fname} ${student.lname} deallocated from Room ${room.room_number} in ${hostel.hostel_name}`,
          admin_id: adminId || null,
          admin_name: adminName || "System",
        },
      });
    });
    return true;
  } catch (error) {
    console.error("Deallocation failed:", error);
    return false;
  }
}
