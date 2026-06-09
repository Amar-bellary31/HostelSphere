import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { handleApiError, handleUnauthorized } from "@/lib/api-error";
import { studentSchema } from "@/lib/validations";
import { allocateRoom } from "@/lib/allocation";

export async function GET(req: NextRequest) {
  const admin = getAuthUser(req);
  if (!admin) return handleUnauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const hostelId = searchParams.get("hostelId") ? Number(searchParams.get("hostelId")) : undefined;
    const yearOfStudy = searchParams.get("yearOfStudy") ? Number(searchParams.get("yearOfStudy")) : undefined;
    const dept = searchParams.get("dept") || undefined;
    
    // Pagination parameters
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.max(1, Number(searchParams.get("limit") || 10));
    const skip = (page - 1) * limit;

    // Build Prisma query condition
    const whereCondition: any = {};

    if (search) {
      whereCondition.OR = [
        { fname: { contains: search } },
        { lname: { contains: search } },
        { mob_no: { contains: search } },
      ];
    }

    if (hostelId !== undefined) {
      whereCondition.hostel_id = hostelId;
    }

    if (yearOfStudy !== undefined) {
      whereCondition.year_of_study = yearOfStudy;
    }

    if (dept) {
      whereCondition.dept = dept;
    }

    // Run parallel queries for pagination info and data
    const [students, totalCount] = await Promise.all([
      prisma.student.findMany({
        where: whereCondition,
        include: {
          hostel: {
            select: {
              hostel_name: true,
            },
          },
          room: {
            select: {
              room_number: true,
            },
          },
        },
        orderBy: {
          student_id: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.student.count({
        where: whereCondition,
      }),
    ]);

    return NextResponse.json({
      success: true,
      students,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
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
    const validatedData = studentSchema.parse(body);

    // Create student first (room allocation will be handled next)
    const student = await prisma.student.create({
      data: {
        fname: validatedData.fname,
        lname: validatedData.lname,
        mob_no: validatedData.mob_no,
        dept: validatedData.dept,
        year_of_study: validatedData.year_of_study,
      },
    });

    // If hostel_id is provided, try to allocate a room using the allocation algorithm
    let allocationMsg = "Registered (No room assigned)";
    let allocatedRoomNum = "";
    
    if (validatedData.hostel_id) {
      const allocation = await allocateRoom(
        student.student_id,
        validatedData.hostel_id,
        `${student.fname} ${student.lname}`,
        admin.id,
        `${admin.fname} ${admin.lname}`
      );

      if (allocation.success) {
        allocationMsg = `Registered and allocated to Room ${allocation.roomNumber}`;
        allocatedRoomNum = allocation.roomNumber || "";
      } else {
        // If allocation failed (e.g. no rooms), we delete the student or keep them?
        // Let's keep the student registered but return an alert that room was not allocated
        allocationMsg = `Registered, but room allocation failed: ${allocation.error}`;
      }
    } else {
      // Log simple registration without room
      await prisma.activityLog.create({
        data: {
          action: "STUDENT_REGISTERED",
          details: `Student ${student.fname} ${student.lname} was registered in the database.`,
          admin_id: admin.id,
          admin_name: `${admin.fname} ${admin.lname}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: allocationMsg,
      student: {
        ...student,
        allocatedRoom: allocatedRoomNum,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
