import type { User } from "@prisma/client";
import type { AuthUser, PublicUser } from "@buildscience/shared";

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone,
    organization: user.organization,
    specialization: user.specialization,
    bio: user.bio,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    organization: user.organization,
    specialization: user.specialization,
    bio: user.bio,
  };
}
