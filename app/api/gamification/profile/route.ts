import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const attrs = await prisma.student_attributes.findUnique({ where: { user_id: user.prismaUser.id } });

    return NextResponse.json({
      userId: user.prismaUser.id,
      totalXp: attrs?.total_xp ?? 0,
      currentLevel: attrs?.current_level ?? 1,
      currentStreak: attrs?.current_streak ?? 0,
      longestStreak: attrs?.longest_streak ?? 0,
      lastActivityDate: attrs?.last_activity_date?.toISOString() ?? null,
    });
  } catch (err) {
    console.error("Gamification profile error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}