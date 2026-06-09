import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-jwt-development-only";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

export function generateToken(payload: { id: number; username: string; fname: string; lname: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export interface UserPayload {
  id: number;
  username: string;
  fname: string;
  lname: string;
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

export function getAuthUser(req: NextRequest): UserPayload | null {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies.get("auth_token")?.value || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}
