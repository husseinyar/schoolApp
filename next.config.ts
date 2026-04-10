import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Tell Next.js to treat Prisma and Postgres as external packages
  serverExternalPackages: ['@prisma/client', 'pg'],

  // 2. Add a Turbopack alias to help find the generated client files
  // (Only needed if you still see "Module Not Found" after step 1)
  turbopack: {
    resolveAlias: {
      '.prisma/client/default': './node_modules/.prisma/client/default.js',
    },
  },
};

export default nextConfig;