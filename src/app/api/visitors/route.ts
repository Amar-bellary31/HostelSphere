import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { handleApiError, handleUnauthorized } from "@/lib/api-error";
import { visitorSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const admin = getAuthUser(req);
  if (!admin) return handleUnauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const studentId = searchParams.get("studentId") ? Number(searchParams.get("studentId")) : undefined;
    
    // Pagination
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.max(1, Number(searchParams.get("limit") || 10));
    const skip = (page - 1) * limit;

    const whereCondition: any = {};

    if (search) {
      whereCondition.visitor_name = { contains: search };
    }

    if (studentId !== undefined) {
      whereCondition.student_id = studentId;
    }

    const [visitors, totalCount] = await Promise.all([
      prisma.visitor.findMany({
        where: whereCondition,
        include: {
          student: {
            select: {
              fname: true,
              lname: true,
              mob_no: true,
              room: {
                select: {
                  room_number: true,
                },
              },
              hostel: {
                select: {
                  hostel_name: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.visitor.count({
        where: whereCondition,
      }),
    ]);

    return NextResponse.json({
      success: true,
      visitors,
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
    const validatedData = visitorSchema.parse(body);

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { student_id: validatedData.student_id },
      include: { hostel: true, room: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    const visitor = await prisma.visitor.create({
      data: {
        visitor_name: validatedData.visitor_name,
        date: validatedData.date,
        in_time: validatedData.in_time,
        student_id: validatedData.student_id,
      },
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        action: "VISITOR_LOGGED",
        details: `Visitor "${visitor.visitor_name}" checked in for Student "${student.fname} ${student.lname}" (Room ${student.room?.room_number || "N/A"}).`,
        admin_id: admin.id,
        admin_name: `${admin.fname} ${admin.lname}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Visitor checked in successfully",
      visitor,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
