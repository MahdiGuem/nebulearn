import prisma from "@/lib/prisma";
import { $Enums } from "@/app/generated/prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values($Enums.UserRole).includes(role as $Enums.UserRole)) {
      return NextResponse.json(
        { error: "Invalid role. Must be TEACHER or STUDENT" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    // Create user
    const user = await prisma.users.create({
      data: {
        id: randomUUID(),
        email: email.toLowerCase(),
        password_hash: passwordHash,
        role: role as $Enums.UserRole,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        created_at: now,
        updated_at: now,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    });
  } catch (err) {
    console.error("Sign-up error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
