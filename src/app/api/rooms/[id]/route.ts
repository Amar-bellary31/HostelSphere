import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { handleApiError, handleUnauthorized } from "@/lib/api-error";
import { roomSchema } from "@/lib/validations";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAuthUser(req);
  if (!admin) return handleUnauthorized();

  try {
    const { id } = await params;
    const roomId = Number(id);

    const room = await prisma.room.findUnique({
      where: { room_id: roomId },
      include: {
        hostel: {
          select: {
            hostel_id: true,
            hostel_name: true,
          },
        },
        students: {
          select: {
            student_id: true,
            fname: true,
            lname: true,
            mob_no: true,
            dept: true,
            year_of_study: true,
          },
        },
        furniture: {
          select: {
            furniture_id: true,
            furniture_type: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      room,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAuthUser(req);
  if (!admin) return handleUnauthorized();

  try {
    const { id } = await params;
    const roomId = Number(id);
    const body = await req.json();

    const validatedData = roomSchema.partial().parse(body);

    const existingRoom = await prisma.room.findUnique({
      where: { room_id: roomId },
    });

    if (!existingRoom) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    // Determine status: if occupied matches capacity, change status to FULL automatically, unless manual status is specified
    let status = validatedData.status || existingRoom.status;
    const newCapacity = validatedData.capacity ?? existingRoom.capacity;
    
    if (!validatedData.status && existingRoom.occupied_count >= newCapacity) {
      status = "FULL";
    } else if (!validatedData.status && existingRoom.occupied_count < newCapacity) {
      status = "AVAILABLE";
    }

    const updatedRoom = await prisma.room.update({
      where: { room_id: roomId },
      data: {
        room_number: validatedData.room_number,
        capacity: validatedData.capacity,
        status,
      },
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        action: "ROOM_UPDATED",
        details: `Room ${existingRoom.room_number} details updated. (Capacity: ${newCapacity}, Status: ${status})`,
        admin_id: admin.id,
        admin_name: `${admin.fname} ${admin.lname}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Room updated successfully",
      room: updatedRoom,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAuthUser(req);
  if (!admin) return handleUnauthorized();

  try {
    const { id } = await params;
    const roomId = Number(id);

    const room = await prisma.room.findUnique({
      where: { room_id: roomId },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    // Perform inside transaction to update hostel room count and decr student count if needed
    await prisma.$transaction(async (tx) => {
      // Get all students in this room
      const studentsInRoom = await tx.student.findMany({
        where: { room_id: roomId },
      });

      // Delete room (furniture will cascade delete)
      await tx.room.delete({
        where: { room_id: roomId },
      });

      // Update hostel room count
      await tx.hostel.update({
        where: { hostel_id: room.hostel_id },
        data: {
          no_of_rooms: { decrement: 1 },
          no_of_students: { decrement: studentsInRoom.length },
        },
      });
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        action: "ROOM_DELETED",
        details: `Room ${room.room_number} from Hostel ID ${room.hostel_id} was deleted.`,
        admin_id: admin.id,
        admin_name: `${admin.fname} ${admin.lname}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
