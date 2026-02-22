import "dotenv/config";
import { PrismaClient, Role, StudentStatus, RouteStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database…");

  // ── School ──────────────────────────────────────────────────
  const school = await prisma.school.create({
    data: {
      name: "Lincoln Elementary School",
      addressStreet: "Storgatan 1",
      addressCity: "Stockholm",
      addressPostal: "123 45",
      contactEmail: "info@lincoln.se",
      contactPhone: "+46 8 123 456",
      latitude: 59.3293,
      longitude: 18.0686,
      radiusKm: 15,
    },
  });
  console.log("✅ School:", school.name);

  // ── Users ────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: "admin@lincoln.se",
      passwordHash: await bcrypt.hash("Admin123!", 10),
      name: "Sarah Johnson",
      phone: "+46 70 123 4567",
      role: Role.ADMIN,
      schoolId: school.id,
      emailVerified: new Date(),
    },
  });
  console.log("✅ Admin:", admin.email);

  const driver1 = await prisma.user.create({
    data: {
      email: "mike@lincoln.se",
      passwordHash: await bcrypt.hash("Driver123!", 10),
      name: "Mike Wilson",
      phone: "+46 70 234 5678",
      role: Role.DRIVER,
      schoolId: school.id,
      emailVerified: new Date(),
    },
  });
  console.log("✅ Driver 1:", driver1.email);

  const driver2 = await prisma.user.create({
    data: {
      email: "anna@lincoln.se",
      passwordHash: await bcrypt.hash("Driver123!", 10),
      name: "Anna Bergström",
      phone: "+46 70 987 6543",
      role: Role.DRIVER,
      schoolId: school.id,
      emailVerified: new Date(),
    },
  });
  console.log("✅ Driver 2:", driver2.email);

  const parent1 = await prisma.user.create({
    data: {
      email: "john.doe@example.com",
      passwordHash: await bcrypt.hash("Parent123!", 10),
      name: "John Doe",
      phone: "+46 70 345 6789",
      role: Role.PARENT,
      schoolId: school.id,
      emailVerified: new Date(),
    },
  });
  console.log("✅ Parent 1:", parent1.email);

  const parent2 = await prisma.user.create({
    data: {
      email: "maria.svensson@example.com",
      passwordHash: await bcrypt.hash("Parent123!", 10),
      name: "Maria Svensson",
      phone: "+46 70 456 7890",
      role: Role.PARENT,
      schoolId: school.id,
      emailVerified: new Date(),
    },
  });
  console.log("✅ Parent 2:", parent2.email);

  // ── Route A (Mike's route — North) ──────────────────────────
  const routeA = await prisma.route.create({
    data: {
      name: "Route A – North Stockholm",
      schoolId: school.id,
      driverId: driver1.id,
      capacity: 40,
      currentStudents: 0,
      startTime: "07:00",
      endTime: "08:30",
      monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
      status: RouteStatus.IDLE,
      stops: {
        create: [
          { name: "Oak & Maple Corner", address: "Ekgatan 5, Solna", latitude: 59.3600, longitude: 18.0050, scheduledTime: "07:10", orderIndex: 0 },
          { name: "Pine Street Market", address: "Tallvägen 12, Solna", latitude: 59.3480, longitude: 18.0200, scheduledTime: "07:20", orderIndex: 1 },
          { name: "Birch Park Entrance", address: "Björkparken 3, Stockholm", latitude: 59.3400, longitude: 18.0400, scheduledTime: "07:30", orderIndex: 2 },
          { name: "Church Square North", address: "Kyrkotorget 1, Stockholm", latitude: 59.3330, longitude: 18.0550, scheduledTime: "07:42", orderIndex: 3 },
          { name: "Central Library Stop", address: "Sveavägen 73, Stockholm", latitude: 59.3293, longitude: 18.0600, scheduledTime: "07:55", orderIndex: 4 },
        ],
      },
    },
  });
  console.log("✅ Route A:", routeA.name);

  // ── Route B (Anna's route — South) ──────────────────────────
  const routeB = await prisma.route.create({
    data: {
      name: "Route B – South Stockholm",
      schoolId: school.id,
      driverId: driver2.id,
      capacity: 35,
      currentStudents: 0,
      startTime: "07:15",
      endTime: "08:45",
      monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
      status: RouteStatus.IDLE,
      stops: {
        create: [
          { name: "South Gate Plaza", address: "Södergatans Torg, Stockholm", latitude: 59.3100, longitude: 18.0600, scheduledTime: "07:25", orderIndex: 0 },
          { name: "Riverside Dock", address: "Strandvägen 45, Stockholm", latitude: 59.3150, longitude: 18.0650, scheduledTime: "07:35", orderIndex: 1 },
          { name: "Gamla Stan Metro", address: "Gamla Stan T-bana, Stockholm", latitude: 59.3230, longitude: 18.0720, scheduledTime: "07:48", orderIndex: 2 },
        ],
      },
    },
  });
  console.log("✅ Route B:", routeB.name);

  // ── Students (Parent 1 — John Doe's kids on Route A) ────────
  const [emma, oliver] = await Promise.all([
    prisma.student.create({
      data: {
        name: "Emma Doe",
        studentCode: "STU-00001",
        dateOfBirth: new Date("2014-03-15"),
        grade: 3,
        addressStreet: "Ekgatan 7",
        addressPostal: "171 54",
        addressCity: "Solna",
        latitude: 59.3600,
        longitude: 18.0050,
        schoolId: school.id,
        parentId: parent1.id,
        routeId: routeA.id,
        status: StudentStatus.ACTIVE,
      },
    }),
    prisma.student.create({
      data: {
        name: "Oliver Doe",
        studentCode: "STU-00002",
        dateOfBirth: new Date("2012-07-22"),
        grade: 5,
        addressStreet: "Ekgatan 7",
        addressPostal: "171 54",
        addressCity: "Solna",
        latitude: 59.3600,
        longitude: 18.0050,
        schoolId: school.id,
        parentId: parent1.id,
        routeId: routeA.id,
        status: StudentStatus.ACTIVE,
      },
    }),
  ]);

  // Students for Parent 2 — Maria (Route B)
  const [lukas, sofia] = await Promise.all([
    prisma.student.create({
      data: {
        name: "Lukas Svensson",
        studentCode: "STU-00003",
        dateOfBirth: new Date("2013-11-05"),
        grade: 4,
        addressStreet: "Södergatans Torg 9",
        addressPostal: "118 25",
        addressCity: "Stockholm",
        latitude: 59.3100,
        longitude: 18.0600,
        schoolId: school.id,
        parentId: parent2.id,
        routeId: routeB.id,
        status: StudentStatus.ACTIVE,
      },
    }),
    prisma.student.create({
      data: {
        name: "Sofia Svensson",
        studentCode: "STU-00004",
        dateOfBirth: new Date("2015-02-28"),
        grade: 2,
        addressStreet: "Södergatans Torg 9",
        addressPostal: "118 25",
        addressCity: "Stockholm",
        latitude: 59.3100,
        longitude: 18.0600,
        schoolId: school.id,
        parentId: parent2.id,
        routeId: routeB.id,
        status: StudentStatus.ACTIVE,
      },
    }),
  ]);
  console.log("✅ Students: Emma, Oliver, Lukas, Sofia");

  // ── Emergency Contacts ───────────────────────────────────────
  await prisma.emergencyContact.createMany({
    data: [
      { studentId: emma.id, name: "Jane Doe", relationship: "Mother", phone: "+46 70 111 2222", email: "jane.doe@example.com", isPrimary: true },
      { studentId: emma.id, name: "Bob Doe", relationship: "Grandfather", phone: "+46 70 333 4444", isPrimary: false },
      { studentId: oliver.id, name: "Jane Doe", relationship: "Mother", phone: "+46 70 111 2222", email: "jane.doe@example.com", isPrimary: true },
      { studentId: lukas.id, name: "Erik Svensson", relationship: "Father", phone: "+46 70 555 6666", email: "erik@example.com", isPrimary: true },
      { studentId: sofia.id, name: "Erik Svensson", relationship: "Father", phone: "+46 70 555 6666", email: "erik@example.com", isPrimary: true },
    ],
  });
  console.log("✅ Emergency contacts created");

  // ── Consents ─────────────────────────────────────────────────
  await prisma.consent.createMany({
    data: [
      { userId: parent1.id, studentId: emma.id, type: "DATA_PROCESSING", granted: true, grantedAt: new Date(), ipAddress: "127.0.0.1", userAgent: "seed-script", version: "1.0" },
      { userId: parent1.id, studentId: oliver.id, type: "DATA_PROCESSING", granted: true, grantedAt: new Date(), ipAddress: "127.0.0.1", userAgent: "seed-script", version: "1.0" },
      { userId: parent2.id, studentId: lukas.id, type: "DATA_PROCESSING", granted: true, grantedAt: new Date(), ipAddress: "127.0.0.1", userAgent: "seed-script", version: "1.0" },
      { userId: parent2.id, studentId: sofia.id, type: "DATA_PROCESSING", granted: false, grantedAt: new Date(), ipAddress: "127.0.0.1", userAgent: "seed-script", version: "1.0" },
    ],
  });
  console.log("✅ Consents created");

  // ── Notification ─────────────────────────────────────────────
  await prisma.notification.create({
    data: {
      title: "School Bus Update",
      body: "Route A will depart 10 minutes early tomorrow due to road works on Sveavägen.",
      targetType: "ALL",
      sentById: admin.id,
      successCount: 4,
      failureCount: 0,
    },
  });
  console.log("✅ Sample notification created");

  console.log(`
🎉 Seed complete! Credentials:
  Admin:    admin@lincoln.se      / Admin123!
  Driver 1: mike@lincoln.se       / Driver123!   → Route A (5 stops, 2 students)
  Driver 2: anna@lincoln.se       / Driver123!   → Route B (3 stops, 2 students)
  Parent 1: john.doe@example.com  / Parent123!   → Emma & Oliver
  Parent 2: maria.svensson@...    / Parent123!   → Lukas & Sofia
`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
