import type { Role } from "@buildscience/shared";

export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case "COMPANY":
      return "/app/company";
    case "SCIENTIST":
      return "/app/scientist";
    case "ADMIN":
      return "/admin";
  }
}
