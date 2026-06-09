import { z } from "zod";

// Admin validation
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const adminRegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fname: z.string().min(1, "First name is required"),
  lname: z.string().min(1, "Last name is required"),
  mob_no: z.string().min(10, "Mobile number must be at least 10 digits").max(15),
  hostel_id: z.number().int().optional(),
});

// Hostel validation
export const hostelSchema = z.object({
  hostel_name: z.string().min(3, "Hostel name must be at least 3 characters").max(100),
  no_of_rooms: z.number().int().nonnegative().default(0),
});

// Room validation
export const roomSchema = z.object({
  room_number: z.string().min(1, "Room number is required").max(10),
  capacity: z.number().int().positive("Capacity must be at least 1"),
  status: z.enum(["AVAILABLE", "FULL", "MAINTENANCE"]).default("AVAILABLE"),
  hostel_id: z.number().int("Hostel ID is required"),
});

// Student validation
export const studentSchema = z.object({
  fname: z.string().min(1, "First name is required").max(50),
  lname: z.string().min(1, "Last name is required").max(50),
  mob_no: z.string().min(10, "Mobile number must be at least 10 digits").max(15),
  dept: z.string().min(1, "Department is required").max(100),
  year_of_study: z.number().int().min(1).max(5),
  hostel_id: z.number().int().optional().nullable(),
  room_id: z.number().int().optional().nullable(),
});

// Furniture validation
export const furnitureSchema = z.object({
  furniture_type: z.string().min(1, "Furniture type is required").max(50),
  room_id: z.number().int("Room ID is required"),
});

// Visitor validation
export const visitorSchema = z.object({
  visitor_name: z.string().min(1, "Visitor name is required").max(100),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  in_time: z.string().min(1, "In time is required"),
  out_time: z.string().optional().nullable(),
  student_id: z.number().int("Student ID is required"),
});

// Bulk student import item validation
export const bulkStudentItemSchema = z.object({
  fname: z.string().min(1, "First name is required"),
  lname: z.string().min(1, "Last name is required"),
  mob_no: z.string().min(10, "Mobile number is required"),
  dept: z.string().min(1, "Department is required"),
  year_of_study: z.coerce.number().int().min(1).max(5),
  hostel_name: z.string().min(1, "Hostel name is required"),
});
