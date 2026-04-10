import { Role as PrismaRole } from "@prisma/client";

// This makes the two types identical in the eyes of TypeScript
export type Role = PrismaRole; 
export const Role = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  PARENT: 'PARENT',
  STUDENT: 'STUDENT',
  DRIVER: "DRIVER", 
} as const;