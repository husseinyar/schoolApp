import { config } from "dotenv";
import { resolve } from "path";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const envPath = resolve(process.cwd(), ".env");
console.log(`Loading .env from: ${envPath}`);
const result = config({ path: envPath });

if (result.error) {
    console.error("Error loading .env:", result.error);
    process.exit(1);
}

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Defined" : "Undefined");

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

try {
    console.log("Checking database connection...");
    await prisma.$connect();
    console.log("✅ Database connection successful!");
} catch (e) {
    console.error("❌ Database connection failed:", e);
    process.exit(1);
} finally {
    await prisma.$disconnect();
}
