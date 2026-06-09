import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { handleApiError, handleUnauthorized } from "@/lib/api-error";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAuthUser(req);
  if (!admin) return handleUnauthorized();

  try {
    const { id } = await params;
    const visitorId = Number(id);
    const body = await req.json();

    if (!body.out_time) {
      return NextResponse.json(
        { success: false, message: "Out time is required for checkout" },
        { status: 400 }
      );
    }

    const visitor = await prisma.visitor.findUnique({
      where: { visitor_id: visitorId },
      include: {
        student: true,
      },
    });

    if (!visitor) {
      return NextResponse.json(
        { success: false, message: "Visitor log not found" },
        { status: 404 }
      );
    }

    const updatedVisitor = await prisma.visitor.update({
      where: { visitor_id: visitorId },
      data: {
        out_time: body.out_time,
      },
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        action: "VISITOR_CHECKOUT",
        details: `Visitor "${visitor.visitor_name}" checked out at ${body.out_time} (Student: "${visitor.student.fname} ${visitor.student.lname}").`,
        admin_id: admin.id,
        admin_name: `${admin.fname} ${admin.lname}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Visitor checked out successfully",
      visitor: updatedVisitor,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
