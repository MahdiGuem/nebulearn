import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ classId?: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user?.prismaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const leaderboard = await prisma.student_attributes.findMany({
      orderBy: { total_xp: "desc" },
      take: 50,
    });

    const leader = leaderboard.map((l, i) => ({
      rank: i + 1,
      userId: l.user_id,
      totalXp: l.total_xp,
      currentLevel: l.current_level,
      currentStreak: l.current_streak,
    }));

    return NextResponse.json({ leaderboard: leader });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}