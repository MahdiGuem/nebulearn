import { getCurrentUser } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const achievements = await prisma.achievements.findMany({
      orderBy: { id: "asc" },
    });

    const user = await getCurrentUser();
    let earnedIds: string[] = [];
    if (user?.prismaUser) {
      const userAchievements = await prisma.user_achievements.findMany({
        where: { user_id: user.prismaUser.id },
      });
      earnedIds = userAchievements.map(a => a.achievement_id);
    }

    const formatted = achievements.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon_url,
      xpRequirement: a.xp_requirement,
      isEarned: earnedIds.includes(a.id),
    }));

    return NextResponse.json({ achievements: formatted });
  } catch (err) {
    console.error("Achievements error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}