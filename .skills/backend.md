# Backend Skill: schoolApp

This skill defines the data management and server-side logic standards for the `schoolApp` project.

## Core Technologies
- **Prisma ORM**: Data modeling and database access.
- **Next.js Server Actions**: Primary mechanism for data mutations.
- **Next-Auth**: Authentication and session management.
- **Zod**: Schema validation for all inputs.

## Database Management

### 1. Prisma Patterns
- Use **Server Actions** for all database writes to benefit from automatic CSRF protection and type safety.
- Always run `npx prisma generate` after schema changes.
- Use `db:push` for development prototypes and `migrate` for production-ready changes.

### 2. Client Instance
- Use a singleton pattern for the Prisma Client to avoid exhausting database connections in development.
- Location: `src/lib/prisma.ts` (Ensure this file exists).

## Authentication & Authorization

### 1. Next-Auth Setup
- Use `getServerSession` in Server Components for efficient auth checks.
- Protect routes using middleware or direct session checks at the top of page files.

### 2. Role-Based Access Control (RBAC)
- Define roles in the Prisma schema (e.g., ADMIN, USER, DRIVER).
- Validate the user's role before performing sensitive operations in Server Actions.

## API & Server Actions

### 1. Server Action Template
```tsx
'use server';

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { z } from "zod";

const Schema = z.object({
  name: z.string().min(1),
});

export async function createItem(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const validated = Schema.parse({
    name: formData.get("name"),
  });

  return await prisma.item.create({
    data: validated,
  });
}
```

### 2. Validation
- Never trust client-side data. Always re-validate everything using Zod inside the Server Action or API Route.
