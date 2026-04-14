# Frontend Skill: schoolApp

This skill defines the architectural and styling standards for the frontend of the `schoolApp` project.

## Core Technologies
- **React 19**: Use modern hooks and concurrent features where applicable.
- **Next.js (App Router)**: Client components should be minimal; prioritize Server Components.
- **Tailwind CSS 4**: Utilize the latest features of Tailwind 4 (CSS-first configuration).
- **Shadcn UI + Radix UI**: Primary component library.

## Styling Standards

### 1. Tailwind 4 Patterns
- Use the `@theme` block in CSS for custom values instead of `tailwind.config.js`.
- Prefer modern CSS features (layers, variables) enabled by the Tailwind 4 engine.
- Avoid inline complex styles; use the `cn()` utility for conditional classes.

### 2. Design System
- **Colors**: Use the CSS variables defined in `src/styles/globals.css` (or equivalent).
- **Typography**: Responsive font sizes using Tailwind's `text-*` classes.
- **Spacing**: Use standard spacing units (e.g., `p-4`, `m-6`) to maintain consistency.

## Component Guidelines

### 1. Structure
```tsx
'use client';

import * as React from "react";
import { cn } from "@/lib/utils";

interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function MyComponent({ className, ...props }: MyComponentProps) {
  return (
    <div className={cn("base-styles", className)} {...props}>
      {/* Content */}
    </div>
  );
}
```

### 2. Lucide Icons
- Use `lucide-react` for all icons.
- Standardize icon size: `size={18}` or `size={20}` for general UI elements.

### 3. Forms
- Use `react-hook-form` with `zod` for validation.
- Wrap inputs in `FormControl` from Shadcn for consistent accessibility and error messaging.

## Performance
- lazy-load heavy components (e.g., Leaflet maps) using `dynamic()` from `next/dynamic`.
- Use `next/image` for all images to ensure optimization.
