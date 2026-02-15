# Schoolbus Admin

This project is a Next.js application for managing school bus operations. It includes:

## Features
- **Next.js 15+** (App Router)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn/UI** component structure ready
- **Prisma** for database access
- **React Query** for data fetching
- **Zustand** for state management
- **NextAuth.js** for authentication
- **Firebase** integration ready

## Getting Started

1.  **Install dependencies:**
    ```bash
    pnpm install
    ```

2.  **Start the development server:**
    ```bash
    pnpm dev
    ```

3.  **Open in browser:**
    Navigate to [http://localhost:3000](http://localhost:3000).

## Project Structure
- `src/app`: Application routes (App Router)
  - `(auth)`: Authentication routes
  - `(dashboard)`: MAIN dashboard routes
  - `api`: API routes
- `src/components`: UI components
- `src/lib`: Utilities and configurations (Prisma, Firebase)
- `src/hooks`: Custom hooks
- `src/types`: TypeScript type definitions

## Configuration
- `.eslintrc.json`: Custom linting rules
- `.prettierrc`: Code formatting rules

## Deployment
Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for details.
