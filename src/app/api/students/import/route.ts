import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { handleApiError, handleUnauthorized } from "@/lib/api-error";
import { bulkStudentItemSchema } from "@/lib/validations";
import { allocateRoom } from "@/lib/allocation";
import { z } from "zod";

export async function POST(req: NextRequest) {
  const admin = getAuthUser(req);
  if (!admin) return handleUnauthorized();

  try {
    const body = await req.json();
    
    if (!body.students || !Array.isArray(body.students)) {
      return NextResponse.json(
        { success: false, message: "Invalid payload format. Expected an array under 'students'." },
        { status: 400 }
      );
    }

    const results = {
      total: body.students.length,
      successCount: 0,
      roomAllocatedCount: 0,
      failedCount: 0,
      errors: [] as string[],
    };

    // We process sequentially to ensure transaction integrity and count accuracy
    for (let i = 0; i < body.students.length; i++) {
      const row = body.students[i];
      try {
        // 1. Validate the row data
        const validatedRow = bulkStudentItemSchema.parse(row);

        // 2. Find hostel by name (case-insensitive)
        const hostel = await prisma.hostel.findFirst({
          where: {
            hostel_name: {
              equals: validatedRow.hostel_name,
            },
          },
        });

        if (!hostel) {
          throw new Error(`Hostel "${validatedRow.hostel_name}" does not exist in the system.`);
        }

        // 3. Create Student
        const student = await prisma.student.create({
          data: {
            fname: validatedRow.fname,
            lname: validatedRow.lname,
            mob_no: validatedRow.mob_no,
            dept: validatedRow.dept,
            year_of_study: validatedRow.year_of_study,
          },
        });

        // 4. Allocate Room
        const allocation = await allocateRoom(
          student.student_id,
          hostel.hostel_id,
          `${student.fname} ${student.lname}`,
          admin.id,
          `${admin.fname} ${admin.lname}`
        );

        results.successCount++;
        if (allocation.success) {
          results.roomAllocatedCount++;
        } else {
          results.errors.push(
            `Row ${i + 1} (${student.fname} ${student.lname}): Registered, but room allocation failed (${allocation.error})`
          );
        }
      } catch (err: any) {
        results.failedCount++;
        if (err instanceof z.ZodError) {
          const firstErr = err.issues[0];
          results.errors.push(`Row ${i + 1} Validation: ${firstErr.path.join(".") || "Field"} - ${firstErr.message}`);
        } else {
          results.errors.push(`Row ${i + 1}: ${err.message || "Unknown error"}`);
        }
      }
    }

    // Log the bulk import event
    await prisma.activityLog.create({
      data: {
        action: "BULK_IMPORT",
        details: `Imported ${results.successCount}/${results.total} students from CSV (Rooms allocated: ${results.roomAllocatedCount}). Failed rows: ${results.failedCount}`,
        admin_id: admin.id,
        admin_name: `${admin.fname} ${admin.lname}`,
      },
    });

    return NextResponse.json({
      success: results.failedCount < results.total,
      message: `Import completed. Successful: ${results.successCount}, Rooms Allocated: ${results.roomAllocatedCount}, Failed: ${results.failedCount}`,
      results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
