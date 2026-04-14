# Next.js Skill: schoolApp

This skill defines the architectural and optimization standards for the Next.js framework in the `schoolApp` project.

## Core Technologies
- **Next.js 15/16 (App Router)**
- **Metadata API**
- **Server Components (RSC)**

## Application Structure

### 1. Routes and Layouts
- **layouts.tsx**: Use for persistent UI elements (Sidebar, Navbar) and global context providers.
- **page.tsx**: Each main page should be a Server Component by default.
- **loading.tsx**: Provide skeleton loading states for every segment in the App Router.
- **error.tsx**: Use local error boundaries to prevent the entire app from crashing on segment-level failures.

### 2. Rendering Strategy
- **Static vs Dynamic**: Use `force-dynamic` or `revalidate` on pages that require real-time data (e.g., Driver tracking).
- **Client Components**: Mark 'use client' ONLY for interactive bits (forms, buttons, charts).

## SEO & Metadata

### 1. Unified Metadata
- Define static metadata in layout files.
- Use `generateMetadata` for dynamic pages (e.g., Route details, User profiles) to ensure titles and descriptions match the content.

### 2. Performance Tracking
- Use standard Next.js logging.
- Monitor build size using `@next/bundle-analyzer` if build times become slow.

## Environment Management
- Store secrets in `.env.local` (never commit to git).
- Use `NEXT_PUBLIC_` prefix ONLY for variables that MUST be accessible on the client.
- Access server secrets directly in Server Actions or `getServerSideProps` equivalent patterns.

## Debugging Next.js
- **Build Errors**: Check for hydration mismatches (usually caused by browser extensions or inconsistent server/client time).
- **Caching**: Use `revalidatePath` or `revalidateTag` in Server Actions to refresh stale data after a mutation.
