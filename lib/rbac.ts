import { auth } from "./auth";
import prisma from "./prisma";
import { $Enums } from "../app/generated/prisma/client";
import { redirect } from "next/navigation";

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  prismaUser: {
    id: string;
    email: string;
    role: $Enums.UserRole;
    firstName: string;
    lastName: string;
  } | null;
};


//get current user from session
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const prismaUser = await prisma.users.findUnique({
    where: { id: session.user.id },
  });

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    prismaUser: prismaUser
      ? {
          id: prismaUser.id,
          email: prismaUser.email,
          role: prismaUser.role,
          firstName: prismaUser.first_name,
          lastName: prismaUser.last_name,
        }
      : null,
  };
}


//require auth - redirects to login if not
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}


//require specific role - redirect to login if not
export async function requireRole(
  allowedRoles: $Enums.UserRole | $Enums.UserRole[]
): Promise<{
  id: string;
  email: string;
  role: $Enums.UserRole;
  firstName: string;
  lastName: string;
}> {
  const user = await requireAuth();

  if (!user.prismaUser) {
    redirect("/auth/login");
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(user.prismaUser.role)) {
    redirect("/unauthorized");
  }

  return user.prismaUser;
}


//concrete teacher role requirement
export async function requireTeacher(): Promise<{
  id: string;
  email: string;
  role: $Enums.UserRole;
  firstName: string;
  lastName: string;
}> {
  return requireRole($Enums.UserRole.TEACHER);
}


//concrete student role requirement
export async function requireStudent(): Promise<{
  id: string;
  email: string;
  role: $Enums.UserRole;
  firstName: string;
  lastName: string;
}> {
  return requireRole($Enums.UserRole.STUDENT);
}


//check if user has specific role - boolean
export async function hasRole(role: $Enums.UserRole): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.prismaUser?.role === role;
}


//check if user is a teacher - boolean
export async function isTeacher(): Promise<boolean> {
  return hasRole($Enums.UserRole.TEACHER);
}


//check if user is a teacher - boolean
export async function isStudent(): Promise<boolean> {
  return hasRole($Enums.UserRole.STUDENT);
}
