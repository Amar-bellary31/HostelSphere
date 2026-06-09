import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const tokenUser = getAuthUser(req);
  if (!tokenUser) {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  // Fetch full administrator profile
  const admin = await prisma.administrator.findUnique({
    where: { id: tokenUser.id },
    select: {
      id: true,
      username: true,
      fname: true,
      lname: true,
      mob_no: true,
      hostel_id: true,
      hostel: {
        select: {
          hostel_name: true,
        },
      },
    },
  });

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "User not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    user: admin,
  });
}
