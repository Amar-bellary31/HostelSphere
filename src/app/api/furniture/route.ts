import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { handleApiError, handleUnauthorized } from "@/lib/api-error";
import { furnitureSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const admin = getAuthUser(req);
  if (!admin) return handleUnauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const roomId = searchParams.get("roomId") ? Number(searchParams.get("roomId")) : undefined;

    const furniture = await prisma.furniture.findMany({
      where: {
        room_id: roomId,
        furniture_type: search ? { contains: search } : undefined,
      },
      include: {
        room: {
          select: {
            room_number: true,
            hostel: {
              select: {
                hostel_name: true,
              },
            },
          },
        },
      },
      orderBy: {
        furniture_id: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      furniture,
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
    const validatedData = furnitureSchema.parse(body);

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { room_id: validatedData.room_id },
      include: { hostel: true },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    const item = await prisma.furniture.create({
      data: {
        furniture_type: validatedData.furniture_type,
        room_id: validatedData.room_id,
      },
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        action: "FURNITURE_ASSIGNED",
        details: `Assigned furniture "${item.furniture_type}" to Room ${room.room_number} in ${room.hostel.hostel_name}`,
        admin_id: admin.id,
        admin_name: `${admin.fname} ${admin.lname}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Furniture item added successfully",
      furniture: item,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
