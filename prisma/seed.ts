import "dotenv/config";
import { PrismaClient, Role, StudentStatus, RouteStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Cleaning database...");
  // Clear existing data to avoid unique constraint errors during re-seeding
  await prisma.notification.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.emergencyContact.deleteMany();
  await prisma.student.deleteMany();
  await prisma.stop.deleteMany();
  await prisma.route.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();

  console.log("🌱 Seeding database with real Stockholm data...");

  // ── School ──────────────────────────────────────────────────
  const school = await prisma.school.create({
    data: {
      name: "Lincoln Academy Stockholm",
      addressStreet: "Sveavägen 73",
      addressCity: "Stockholm",
      addressPostal: "113 50",
      contactEmail: "admin@lincolnacademy.se",
      contactPhone: "+46 8 555 123 45",
      latitude: 59.3432,
      longitude: 18.0558,
      radiusKm: 15,
    },
  });

  // ── Users ────────────────────────────────────────────────────
  const hashedAdmin = await bcrypt.hash("Admin123!", 10);
  const hashedDriver = await bcrypt.hash("Driver123!", 10);
  const hashedParent = await bcrypt.hash("Parent123!", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@lincoln.se",
      passwordHash: hashedAdmin,
      name: "Sarah Johnson",
      phone: "+46 70 123 4567",
      role: Role.ADMIN,
      schoolId: school.id,
      emailVerified: new Date(),
    },
  });

  const driver1 = await prisma.user.create({
    data: {
      email: "mike@lincoln.se",
      passwordHash: hashedDriver,
      name: "Mike Wilson",
      phone: "+46 70 234 5678",
      role: Role.DRIVER,
      schoolId: school.id,
      emailVerified: new Date(),
    },
  });

  const driver2 = await prisma.user.create({
    data: {
      email: "anna@lincoln.se",
      passwordHash: hashedDriver,
      name: "Anna Bergström",
      phone: "+46 70 987 6543",
      role: Role.DRIVER,
      schoolId: school.id,
      emailVerified: new Date(),
    },
  });

  const parent1 = await prisma.user.create({
    data: {
      email: "john.doe@example.com",
      passwordHash: hashedParent,
      name: "John Doe",
      phone: "+46 70 345 6789",
      role: Role.PARENT,
      schoolId: school.id,
      emailVerified: new Date(),
    },
  });

  const parent2 = await prisma.user.create({
    data: {
      email: "maria.svensson@example.com",
      passwordHash: hashedParent,
      name: "Maria Svensson",
      phone: "+46 70 456 7890",
      role: Role.PARENT,
      schoolId: school.id,
      emailVerified: new Date(),
    },
  });

  // ── Route A (Solna/Vasastan Line) ──────────────────────────
  const routeA = await prisma.route.create({
    data: {
      name: "Route A – North/Solna",
      schoolId: school.id,
      driverId: driver1.id,
      capacity: 40,
      currentStudents: 0,
      startTime: "07:10",
      endTime: "08:15",
      monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
      status: RouteStatus.IDLE,
      stops: {
        create: [
          { name: "Solna Centrum", address: "Solnaplan 2, Solna", latitude: 59.3601, longitude: 17.9991, scheduledTime: "07:15", orderIndex: 0 },
          { name: "Hagastaden", address: "Norra Stationsgatan 69, Stockholm", latitude: 59.3475, longitude: 18.0345, scheduledTime: "07:35", orderIndex: 1 },
          { name: "Odenplan", address: "Karlbergsvägen 24, Stockholm", latitude: 59.3430, longitude: 18.0498, scheduledTime: "07:50", orderIndex: 2 },
        ],
      },
    },
  });

  // ── Route B (Södermalm/City Line) ──────────────────────────
  const routeB = await prisma.route.create({
    data: {
      name: "Route B – South/Södermalm",
      schoolId: school.id,
      driverId: driver2.id,
      capacity: 35,
      currentStudents: 0,
      startTime: "07:20",
      endTime: "08:30",
      monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
      status: RouteStatus.IDLE,
      stops: {
        create: [
          { name: "Medborgarplatsen", address: "Folkungagatan 44, Stockholm", latitude: 59.3145, longitude: 18.0742, scheduledTime: "07:30", orderIndex: 0 },
          { name: "Slussen", address: "Katarinavägen 15, Stockholm", latitude: 59.3194, longitude: 18.0744, scheduledTime: "07:45", orderIndex: 1 },
          { name: "Kungsträdgården", address: "Hamngatan 2, Stockholm", latitude: 59.3324, longitude: 18.0734, scheduledTime: "08:05", orderIndex: 2 },
        ],
      },
    },
  });

  // ── Students ───────────────────────────────────────────────
  const emma = await prisma.student.create({
    data: {
      name: "Emma Doe",
      studentCode: "STU-1001",
      dateOfBirth: new Date("2015-05-12"),
      grade: 3,
      addressStreet: "Storgatan 12",
      addressPostal: "171 63",
      addressCity: "Solna",
      latitude: 59.3595, longitude: 18.0010,
      schoolId: school.id,
      parentId: parent1.id,
      routeId: routeA.id,
      status: StudentStatus.ACTIVE,
    },
  });

  const oliver = await prisma.student.create({
    data: {
      name: "Oliver Doe",
      studentCode: "STU-1002",
      dateOfBirth: new Date("2013-09-20"),
      grade: 5,
      addressStreet: "Storgatan 12",
      addressPostal: "171 63",
      addressCity: "Solna",
      latitude: 59.3595, longitude: 18.0010,
      schoolId: school.id,
      parentId: parent1.id,
      routeId: routeA.id,
      status: StudentStatus.ACTIVE,
    },
  });

  const lukas = await prisma.student.create({
    data: {
      name: "Lukas Svensson",
      studentCode: "STU-2001",
      dateOfBirth: new Date("2014-11-02"),
      grade: 4,
      addressStreet: "Götgatan 22",
      addressPostal: "118 46",
      addressCity: "Stockholm",
      latitude: 59.3180, longitude: 18.0720,
      schoolId: school.id,
      parentId: parent2.id,
      routeId: routeB.id,
      status: StudentStatus.ACTIVE,
    },
  });

  // ── Emergency Contacts ───────────────────────────────────────
  await prisma.emergencyContact.createMany({
    data: [
      { studentId: emma.id, name: "Jane Doe", relationship: "Mother", phone: "+46 70 111 2222", email: "jane.doe@example.com", isPrimary: true },
      { studentId: lukas.id, name: "Erik Svensson", relationship: "Father", phone: "+46 70 555 6666", email: "erik@example.com", isPrimary: true },
    ],
  });

  // ── Consents ─────────────────────────────────────────────────
  await prisma.consent.createMany({
    data: [
      { userId: parent1.id, studentId: emma.id, type: "DATA_PROCESSING", granted: true, grantedAt: new Date(), ipAddress: "192.168.1.1", userAgent: "Mozilla/5.0", version: "1.1" },
      { userId: parent2.id, studentId: lukas.id, type: "DATA_PROCESSING", granted: true, grantedAt: new Date(), ipAddress: "192.168.1.5", userAgent: "Mozilla/5.0", version: "1.1" },
    ],
  });

  // ── Notification ─────────────────────────────────────────────
  await prisma.notification.create({
    data: {
      title: "Weather Warning",
      body: "Heavy snowfall expected in Stockholm tomorrow. Bus routes may be delayed by 15-20 minutes.",
      targetType: "ALL",
      sentById: admin.id,
      successCount: 4,
      failureCount: 0,
    },
  });

  console.log(`
✅ Seed complete!
---------------------------------------------
School: ${school.name}
Location: ${school.addressStreet}, ${school.addressCity}
Admin: admin@lincoln.se / Admin123!
---------------------------------------------
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });