# Debugging Skill: schoolApp

This skill contains common error patterns and resolution strategies specifically for the `schoolApp` project environment.

## Common Failures & Fixes

### 1. Package Management (`pnpm` vs `npm`)
- **Issue**: `pnpm` command not found or lockfile mismatch.
- **Fix**: 
  - If `pnpm` is not globally installed, use `npm install -g pnpm` first (if allowed).
  - Use `npm install` if `pnpm` repeatedly fails in the environment.
  - Delete `node_modules` and the irrelevant lockfile if switching between managers.

### 2. Prisma Errors
- **"Prisma Client not initialized"**: 
  - Run `npx prisma generate`.
  - Ensure the client is imported from `@prisma/client` and initialized correctly.
- **"Foreign key constraint failed"**: 
  - Check database referential integrity. 
  - Ensure parent records exist before creating child records (e.g., creating a Route before a Stop).

### 3. Next.js Issues
- **Hydration Mismatch**: 
  - Ensure component output is identical on server and client. 
  - Wrap problematic client-only code in `useEffect` or use `dynamic` with `ssr: false`.
- **Module Not Found**:
  - Re-run `npm install`.
  - Check `tsconfig.json` path aliases (e.g., `@/*` should point to `src/*`).

### 4. FCM / Firebase Issues
- **Invalid VAPID Key**: 
  - Verify key in `NotificationProvider.tsx`.
  - Ensure key matches the Firebase Console project settings.
- **Push Permission Denied**: 
  - Check browser console for user permission status.

## Diagnostic Commands

### Project Health Check
```powershell
# Check dependencies
npm list --depth=0

# Check TypeScript errors
npx tsc --noEmit

# Check Prisma schema
npx prisma validate

# Build to find production errors
npm run build
```

## Token-Saving Strategy
- When debugging a complex error, always check the relevant `.skills/*.md` file first to see if a standard fix is already documented.
- Provide minimal, clean logs when reporting errors.
