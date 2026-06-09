import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { handleApiError, handleUnauthorized } from "@/lib/api-error";
import { hostelSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const admin = getAuthUser(req);
  if (!admin) return handleUnauthorized();

  try {
    const hostels = await prisma.hostel.findMany({
      include: {
        administrator: {
          select: {
            id: true,
            fname: true,
            lname: true,
          },
        },
        _count: {
          select: {
            rooms: true,
            students: true,
          },
        },
      },
      orderBy: {
        hostel_name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      hostels,
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
    const validatedData = hostelSchema.parse(body);

    const hostel = await prisma.hostel.create({
      data: {
        hostel_name: validatedData.hostel_name,
        no_of_rooms: validatedData.no_of_rooms,
        no_of_students: 0,
      },
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        action: "HOSTEL_CREATED",
        details: `Hostel ${hostel.hostel_name} created with base room capacity of ${hostel.no_of_rooms} rooms.`,
        admin_id: admin.id,
        admin_name: `${admin.fname} ${admin.lname}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Hostel created successfully",
      hostel,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
