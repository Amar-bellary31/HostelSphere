import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { handleApiError, handleUnauthorized } from "@/lib/api-error";
import { studentSchema } from "@/lib/validations";
import { allocateRoom, deallocateRoom } from "@/lib/allocation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAuthUser(req);
  if (!admin) return handleUnauthorized();

  try {
    const { id } = await params;
    const studentId = Number(id);

    const student = await prisma.student.findUnique({
      where: { student_id: studentId },
      include: {
        hostel: true,
        room: true,
        visitors: {
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      student,
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
    const studentId = Number(id);
    const body = await req.json();

    const validatedData = studentSchema.partial().parse(body);

    const existingStudent = await prisma.student.findUnique({
      where: { student_id: studentId },
      include: { room: true },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    // Handle room allocation changes
    let roomChangeSuccess = true;
    let roomChangeMessage = "";
    
    // Check if hostel_id changed (or a new hostel was assigned, or set to null)
    if (
      body.hostel_id !== undefined && 
      body.hostel_id !== existingStudent.hostel_id
    ) {
      // 1. Deallocate old room if any
      if (existingStudent.room_id) {
        await deallocateRoom(studentId, admin.id, `${admin.fname} ${admin.lname}`);
      }

      // 2. Allocate to new hostel if provided
      if (body.hostel_id !== null) {
        const allocation = await allocateRoom(
          studentId,
          body.hostel_id,
          `${validatedData.fname || existingStudent.fname} ${validatedData.lname || existingStudent.lname}`,
          admin.id,
          `${admin.fname} ${admin.lname}`
        );
        if (!allocation.success) {
          roomChangeSuccess = false;
          roomChangeMessage = `Profile updated, but room allocation failed: ${allocation.error}`;
        } else {
          roomChangeMessage = `Profile updated and allocated to Room ${allocation.roomNumber}`;
        }
      } else {
        roomChangeMessage = "Profile updated and student deallocated from room.";
      }
    }

    // Update the other student details
    const updatedStudent = await prisma.student.update({
      where: { student_id: studentId },
      data: {
        fname: validatedData.fname,
        lname: validatedData.lname,
        mob_no: validatedData.mob_no,
        dept: validatedData.dept,
        year_of_study: validatedData.year_of_study,
      },
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        action: "STUDENT_UPDATED",
        details: `Student ${updatedStudent.fname} ${updatedStudent.lname} details updated.`,
        admin_id: admin.id,
        admin_name: `${admin.fname} ${admin.lname}`,
      },
    });

    return NextResponse.json({
      success: roomChangeSuccess,
      message: roomChangeMessage || "Student details updated successfully",
      student: updatedStudent,
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
    const studentId = Number(id);

    const student = await prisma.student.findUnique({
      where: { student_id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    // Deallocate room (updating room occupied count and status) before deleting the student
    await deallocateRoom(studentId, admin.id, `${admin.fname} ${admin.lname}`);

    // Delete student
    await prisma.student.delete({
      where: { student_id: studentId },
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        action: "STUDENT_DELETED",
        details: `Student ${student.fname} ${student.lname} was removed from the system.`,
        admin_id: admin.id,
        admin_name: `${admin.fname} ${admin.lname}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
