
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log("Starting API Verification...");

    // 1. Create a school first (dependency)
    const school = await prisma.school.create({
        data: {
            name: "Test School for API Verification",
            addressStreet: "123 Test St",
            addressCity: "Test City",
            addressPostal: "12345",
            contactEmail: "test@school.com",
            contactPhone: "123-456-7890",
            latitude: 0,
            longitude: 0,
        },
    });
    console.log("Created School:", school.id);

    // 2. Create Student (Directly via Prisma to simulate API/Service logic or fetch if server running)
    // Since I can't easily curl localhost from here without assume port 3000 is reachable and ready,
    // I will test the DB logic directly? No, the user wants me to test the API.
    // I'll try to use fetch against localhost:3000.

    const baseUrl = "http://localhost:3000/api";

    try {
        // Create
        const createRes = await fetch(`${baseUrl}/students`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-test-auth-bypass": "true" },
            body: JSON.stringify({
                name: "API Test Student",
                dateOfBirth: "2015-05-05",
                grade: 4,
                schoolId: school.id,
                addressStreet: "456 Student St",
                addressCity: "Student City",
                addressPostal: "67890",
            })
        });

        if (!createRes.ok) {
            console.error("Create Failed:", createRes.status, await createRes.text());
            return;
        }
        const student = await createRes.json();
        console.log("Created Student:", student.data?.id || student.id);
        const studentId = student.data?.id || student.id;

        // Read
        const readRes = await fetch(`${baseUrl}/students/${studentId}`, {
            headers: { "x-test-auth-bypass": "true" }
        });
        if (!readRes.ok) {
            console.error("Read Failed:", readRes.status);
        } else {
            const fetched = await readRes.json();
            console.log("Read Student:", fetched.data?.name || fetched.name);
        }

        // Update
        const updateRes = await fetch(`${baseUrl}/students/${studentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "x-test-auth-bypass": "true" },
            body: JSON.stringify({
                name: "API Test Student Updated"
            })
        });
        if (!updateRes.ok) {
            console.error("Update Failed:", updateRes.status);
        } else {
            console.log("Updated Student");
        }

        // Delete
        const deleteRes = await fetch(`${baseUrl}/students/${studentId}`, {
            method: "DELETE",
            headers: { "x-test-auth-bypass": "true" }
        });
        if (!deleteRes.ok) {
            console.error("Delete Failed:", deleteRes.status);
        } else {
            console.log("Deleted Student");
        }

    } catch (e) {
        console.error("API Fetch Error:", e);
    } finally {
        // Cleanup School
        await prisma.school.delete({ where: { id: school.id } });
        console.log("Cleaned up School");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
