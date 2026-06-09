import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, generateToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validatedData = loginSchema.parse(body);

    // Find Administrator by username
    const admin = await prisma.administrator.findUnique({
      where: { username: validatedData.username },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Compare password
    const isPasswordValid = await comparePassword(validatedData.password, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const tokenPayload = {
      id: admin.id,
      username: admin.username,
      fname: admin.fname,
      lname: admin.lname,
    };
    const token = generateToken(tokenPayload);

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Successfully logged in",
      user: tokenPayload,
    });

    // Set JWT token in HttpOnly cookie
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    });

    // Log this login event
    await prisma.activityLog.create({
      data: {
        action: "ADMIN_LOGIN",
        details: `Administrator ${admin.fname} ${admin.lname} (${admin.username}) logged in.`,
        admin_id: admin.id,
        admin_name: `${admin.fname} ${admin.lname}`,
      },
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
