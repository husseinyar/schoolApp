
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const driverCount = await prisma.user.count({ where: { role: "DRIVER" } });

    if (driverCount === 0) {
        console.log("No drivers found. Creating default driver...");
        const driver = await prisma.user.create({
            data: {
                email: "driver@schoolbus.com",
                name: "John Driver",
                role: "DRIVER",
                passwordHash: "$2b$10$EpRnTzVlqHNP0.fMdQw29eSdx0w9/1x.9ML1.J8.2.1.1", // "password"
                phone: "+1234567890"
            }
        });
        console.log(`Created Driver: ${driver.email}`);
    } else {
        console.log(`Found ${driverCount} existing drivers.`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
