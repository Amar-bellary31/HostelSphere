import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { handleApiError, handleUnauthorized } from "@/lib/api-error";
import { roomSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const admin = getAuthUser(req);
  if (!admin) return handleUnauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const hostelId = searchParams.get("hostelId") ? Number(searchParams.get("hostelId")) : undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || "";

    const rooms = await prisma.room.findMany({
      where: {
        hostel_id: hostelId,
        status: status as any,
        room_number: search ? { contains: search } : undefined,
      },
      include: {
        hostel: {
          select: {
            hostel_name: true,
          },
        },
        _count: {
          select: {
            students: true,
            furniture: true,
          },
        },
      },
      orderBy: {
        room_number: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      rooms,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const admin = getAuthUser(req);
  if (!admin) return handleUnauthorized();

  try {
    const body = await req.json();
    const validatedData = roomSchema.parse(body);

    // Create room and update hostel room count in a transaction
    const room = await prisma.$transaction(async (tx) => {
      const newRoom = await tx.room.create({
        data: {
          room_number: validatedData.room_number,
          capacity: validatedData.capacity,
          status: validatedData.status,
          hostel_id: validatedData.hostel_id,
          occupied_count: 0,
        },
      });

      // Update hostel room count
      await tx.hostel.update({
        where: { hostel_id: validatedData.hostel_id },
        data: {
          no_of_rooms: { increment: 1 },
        },
      });

      return newRoom;
    });

    // Fetch hostel details for log
    const hostel = await prisma.hostel.findUnique({
      where: { hostel_id: validatedData.hostel_id },
      select: { hostel_name: true },
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        action: "ROOM_CREATED",
        details: `Room ${room.room_number} (Capacity: ${room.capacity}) created in ${hostel?.hostel_name || "Hostel"}.`,
        admin_id: admin.id,
        admin_name: `${admin.fname} ${admin.lname}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Room created successfully",
      room,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
