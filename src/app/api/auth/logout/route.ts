import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const admin = getAuthUser(req);

  if (admin) {
    // Log the logout event
    await prisma.activityLog.create({
      data: {
        action: "ADMIN_LOGOUT",
        details: `Administrator ${admin.fname} ${admin.lname} (${admin.username}) logged out.`,
        admin_id: admin.id,
        admin_name: `${admin.fname} ${admin.lname}`,
      },
    });
  }

  const response = NextResponse.json({
    success: true,
    message: "Successfully logged out",
  });

  // Clear cookie
  response.cookies.delete("auth_token");

  return response;
}
