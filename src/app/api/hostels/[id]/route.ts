import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { handleApiError, handleUnauthorized } from "@/lib/api-error";
import { hostelSchema } from "@/lib/validations";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAuthUser(req);
  if (!admin) return handleUnauthorized();

  try {
    const { id } = await params;
    const hostelId = Number(id);

    const hostel = await prisma.hostel.findUnique({
      where: { hostel_id: hostelId },
      include: {
        administrator: {
          select: {
            id: true,
            fname: true,
            lname: true,
            mob_no: true,
            username: true,
          },
        },
        rooms: {
          include: {
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
        },
        students: {
          select: {
            student_id: true,
            fname: true,
            lname: true,
            mob_no: true,
            dept: true,
            year_of_study: true,
            room: {
              select: {
                room_number: true,
              },
            },
          },
          orderBy: {
            fname: "asc",
          },
        },
      },
    });

    if (!hostel) {
      return NextResponse.json(
        { success: false, message: "Hostel not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      hostel,
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
    const hostelId = Number(id);
    const body = await req.json();
    
    // We only validate the name since capacity is derived or updated elsewhere
    const validatedData = hostelSchema.partial().parse(body);

    const existingHostel = await prisma.hostel.findUnique({
      where: { hostel_id: hostelId },
    });

    if (!existingHostel) {
      return NextResponse.json(
        { success: false, message: "Hostel not found" },
        { status: 404 }
      );
    }

    const updatedHostel = await prisma.hostel.update({
      where: { hostel_id: hostelId },
      data: {
        hostel_name: validatedData.hostel_name,
      },
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        action: "HOSTEL_UPDATED",
        details: `Hostel "${existingHostel.hostel_name}" renamed to "${updatedHostel.hostel_name}".`,
        admin_id: admin.id,
        admin_name: `${admin.fname} ${admin.lname}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Hostel updated successfully",
      hostel: updatedHostel,
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
    const hostelId = Number(id);

    const hostel = await prisma.hostel.findUnique({
      where: { hostel_id: hostelId },
    });

    if (!hostel) {
      return NextResponse.json(
        { success: false, message: "Hostel not found" },
        { status: 404 }
      );
    }

    // Delete hostel. Note that rooms and furniture cascade, and student room_id/hostel_id set to null.
    await prisma.hostel.delete({
      where: { hostel_id: hostelId },
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        action: "HOSTEL_DELETED",
        details: `Hostel ${hostel.hostel_name} was deleted. Associated rooms and furniture were removed.`,
        admin_id: admin.id,
        admin_name: `${admin.fname} ${admin.lname}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Hostel deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
