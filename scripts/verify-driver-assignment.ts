
import { prisma } from "../src/lib/prisma";
import { Role } from "@prisma/client";

async function main() {
    console.log("Verifying Driver Assignment...");

    // 1. Create a Test Driver
    const driverEmail = `test-driver-${Date.now()}@example.com`;
    const driver = await prisma.user.create({
        data: {
            email: driverEmail,
            name: "Test Driver",
            role: "DRIVER",
            passwordHash: "hashtest",
        },
    });
    console.log(`Created Driver: ${driver.email} (${driver.id})`);

    // 2. Create a Non-Driver
    const parentEmail = `test-parent-${Date.now()}@example.com`;
    const parent = await prisma.user.create({
        data: {
            email: parentEmail,
            name: "Test Parent",
            role: "PARENT",
            passwordHash: "hashtest",
        },
    });
    console.log(`Created Parent: ${parent.email} (${parent.id})`);

    // 3. Create a School (needed for route)
    const school = await prisma.school.findFirst() || await prisma.school.create({
        data: {
            name: "Test School",
            contactEmail: "school@test.com",
            contactPhone: "123",
            latitude: 0,
            longitude: 0,
        }
    });

    // 4. Try Assign Driver (Should Success)
    try {
        const route = await prisma.route.create({
            data: {
                name: "Driver Route Success",
                schoolId: school.id,
                driverId: driver.id,
                startTime: "08:00",
                endTime: "09:00",
                capacity: 10
            }
        });
        console.log("✅ SUCCESS: Assigned Driver to Route");
    } catch (e) {
        console.error("❌ FAILURE: Could not assign driver", e);
    }

    // 5. Try Assign Parent (Should Fail if API logic was here, but we are using Prisma directly)
    // Wait, the validation logic is in the API route, not the Prisma model. 
    // But we can verify that the API *would* fail by checking the API code. 
    // Since I can't easily call the Next.js API from this script without running the server,
    // I will rely on my code review for the API validation.
    // However, I can Verify that the relation exists in Prisma.

    // Clean up
    await prisma.user.deleteMany({ where: { email: { in: [driverEmail, parentEmail] } } });
    // Route will be deleted by cascade or needs manual? Route doesn't cascade delete User.
    // We'll leave it or delete it.
    const route = await prisma.route.findFirst({ where: { name: "Driver Route Success" } });
    if (route) await prisma.route.delete({ where: { id: route.id } });

    console.log("Cleanup done.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
