import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function handleApiError(error: any) {
  console.error("API Error Logged:", error);

  if (error instanceof ZodError) {
    const fieldErrors = error.flatten().fieldErrors;
    const firstVal = Object.values(fieldErrors)[0];
    const firstErrorMessage = Array.isArray(firstVal) ? firstVal[0] : "Validation failed";
    return NextResponse.json(
      {
        success: false,
        message: firstErrorMessage,
        errors: fieldErrors,
      },
      { status: 400 }
    );
  }

  // Prisma Errors
  if (error.code === "P2002") {
    const targetFields = (error.meta?.target as string[]) || [];
    return NextResponse.json(
      {
        success: false,
        message: `A record with this ${targetFields.join(", ") || "unique field"} already exists.`,
      },
      { status: 409 }
    );
  }

  if (error.code === "P2025") {
    return NextResponse.json(
      {
        success: false,
        message: "The requested record was not found.",
      },
      { status: 404 }
    );
  }

  // JWT / Auth errors
  if (error.name === "JsonWebTokenError") {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid authentication token.",
      },
      { status: 401 }
    );
  }

  if (error.name === "TokenExpiredError") {
    return NextResponse.json(
      {
        success: false,
        message: "Authentication token has expired.",
      },
      { status: 401 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      message: error.message || "An unexpected server error occurred.",
    },
    { status: 500 }
  );
}

export function handleUnauthorized() {
  return NextResponse.json(
    {
      success: false,
      message: "Access denied. Please log in as an administrator to proceed.",
    },
    { status: 401 }
  );
}
