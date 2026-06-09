import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // 1. Clean existing data
  console.log("Cleaning existing database records...");
  await prisma.activityLog.deleteMany({});
  await prisma.visitor.deleteMany({});
  await prisma.furniture.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.administrator.deleteMany({});
  await prisma.hostel.deleteMany({});

  // 2. Create Administrator
  console.log("Creating Administrator...");
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.administrator.create({
    data: {
      username: "admin",
      password: hashedPassword,
      fname: "amar",
      lname: "Singh",
      mob_no: "9876543210",
    },
  });
  console.log(`Admin created: ${admin.username}`);

  // 3. Create Hostels
  console.log("Creating Hostels...");
  const hostel1 = await prisma.hostel.create({
    data: {
      hostel_name: "Aryabhatta Hall of Residence",
      no_of_rooms: 4,
      no_of_students: 0, // will update during student creation
    },
  });

  const hostel2 = await prisma.hostel.create({
    data: {
      hostel_name: "Kalpana Chawla Hall of Residence",
      no_of_rooms: 4,
      no_of_students: 0,
    },
  });

  // Link admin to hostel1
  await prisma.administrator.update({
    where: { id: admin.id },
    data: { hostel_id: hostel1.hostel_id },
  });
  console.log(`Linked admin ${admin.fname} to Hostel: ${hostel1.hostel_name}`);

  // 4. Create Rooms
  console.log("Creating Rooms...");
  const roomsHostel1 = [];
  const roomsHostel2 = [];

  const roomNumbers = ["101", "102", "103", "104"];
  for (const num of roomNumbers) {
    const room = await prisma.room.create({
      data: {
        room_number: num,
        capacity: 3,
        occupied_count: 0,
        status: "AVAILABLE",
        hostel_id: hostel1.hostel_id,
      },
    });
    roomsHostel1.push(room);

    const room2 = await prisma.room.create({
      data: {
        room_number: num,
        capacity: 2,
        occupied_count: 0,
        status: "AVAILABLE",
        hostel_id: hostel2.hostel_id,
      },
    });
    roomsHostel2.push(room2);
  }

  // 5. Create Furniture items for rooms
  console.log("Assigning Furniture to Rooms...");
  const furnitureTypes = ["Single Bed", "Study Table", "Wooden Chair", "Steel Almirah"];
  const allRooms = [...roomsHostel1, ...roomsHostel2];
  
  for (const r of allRooms) {
    for (const fType of furnitureTypes) {
      await prisma.furniture.create({
        data: {
          furniture_type: fType,
          room_id: r.room_id,
        },
      });
    }
  }

  // 6. Create Students
  console.log("Registering Students and Allocating Rooms...");
  const studentsData = [
    { fname: "Rohan", lname: "Verma", mob_no: "9812345670", dept: "Computer Science", year_of_study: 3 },
    { fname: "Amit", lname: "Patel", mob_no: "9823456781", dept: "Mechanical Engg", year_of_study: 2 },
    { fname: "Priya", lname: "Sen", mob_no: "9834567892", dept: "Electronics Engg", year_of_study: 4 },
    { fname: "Ananya", lname: "Nair", mob_no: "9845678903", dept: "Biotechnology", year_of_study: 1 },
    { fname: "Vikram", lname: "Singh", mob_no: "9856789014", dept: "Computer Science", year_of_study: 2 },
    { fname: "Sneha", lname: "Reddy", mob_no: "9867890125", dept: "Civil Engg", year_of_study: 3 },
  ];

  // Let's allocate Rohan, Amit, Vikram to Hostel 1
  // Let's allocate Priya, Ananya, Sneha to Hostel 2
  const createdStudents = [];

  // Hostel 1 (Boys/General - Rooms 101, 102)
  const h1Students = [studentsData[0], studentsData[1], studentsData[4]];
  let studentIdx1 = 0;
  for (const s of h1Students) {
    // We allocate first 2 to room 101, next to room 102
    const targetRoom = studentIdx1 < 2 ? roomsHostel1[0] : roomsHostel1[1];
    const student = await prisma.student.create({
      data: {
        ...s,
        hostel_id: hostel1.hostel_id,
        room_id: targetRoom.room_id,
      },
    });
    createdStudents.push(student);

    // Update room occupied count
    await prisma.room.update({
      where: { room_id: targetRoom.room_id },
      data: {
        occupied_count: { increment: 1 },
        status: targetRoom.capacity <= targetRoom.occupied_count + 1 ? "FULL" : "AVAILABLE",
      },
    });
    studentIdx1++;
  }

  // Hostel 2 (Girls - Rooms 101, 102)
  const h2Students = [studentsData[2], studentsData[3], studentsData[5]];
  let studentIdx2 = 0;
  for (const s of h2Students) {
    const targetRoom = studentIdx2 < 2 ? roomsHostel2[0] : roomsHostel2[1];
    const student = await prisma.student.create({
      data: {
        ...s,
        hostel_id: hostel2.hostel_id,
        room_id: targetRoom.room_id,
      },
    });
    createdStudents.push(student);

    // Update room occupied count
    const updatedRoom = await prisma.room.update({
      where: { room_id: targetRoom.room_id },
      data: {
        occupied_count: { increment: 1 },
      },
    });
    // Update status
    await prisma.room.update({
      where: { room_id: targetRoom.room_id },
      data: {
        status: updatedRoom.capacity <= updatedRoom.occupied_count ? "FULL" : "AVAILABLE",
      },
    });
    studentIdx2++;
  }

  // Update Hostel student and room counts
  await prisma.hostel.update({
    where: { hostel_id: hostel1.hostel_id },
    data: {
      no_of_students: 3,
      no_of_rooms: 4,
    },
  });

  await prisma.hostel.update({
    where: { hostel_id: hostel2.hostel_id },
    data: {
      no_of_students: 3,
      no_of_rooms: 4,
    },
  });

  // 7. Create Visitors
  console.log("Creating Visitor Logs...");
  const visitors = [
    { visitor_name: "Suresh Verma", date: new Date("2026-06-01T10:00:00Z"), in_time: "10:00 AM", out_time: "12:00 PM", student_id: createdStudents[0].student_id },
    { visitor_name: "Meena Patel", date: new Date("2026-06-02T02:00:00Z"), in_time: "02:15 PM", out_time: "04:30 PM", student_id: createdStudents[1].student_id },
    { visitor_name: "Rahul Sen", date: new Date("2026-06-04T11:00:00Z"), in_time: "11:00 AM", out_time: "01:00 PM", student_id: createdStudents[2].student_id },
    { visitor_name: "Gopal Reddy", date: new Date("2026-06-05T09:30:00Z"), in_time: "09:30 AM", out_time: null, student_id: createdStudents[5].student_id }, // still in hostel
  ];

  for (const v of visitors) {
    await prisma.visitor.create({
      data: v,
    });
  }

  // 8. Create Activity Logs
  console.log("Logging Initial Activities...");
  const logs = [
    { action: "HOSTEL_CREATED", details: "Aryabhatta Hall of Residence created with 4 rooms.", admin_name: "System" },
    { action: "HOSTEL_CREATED", details: "Kalpana Chawla Hall of Residence created with 4 rooms.", admin_name: "System" },
    { action: "ADMIN_REGISTERED", details: `Administrator amar Singh registered.`, admin_name: "System" },
    { action: "ROOM_ALLOCATED", details: "Student Rohan Verma allocated to Aryabhatta Hall - Room 101", admin_name: "amar Singh", admin_id: admin.id },
    { action: "ROOM_ALLOCATED", details: "Student Amit Patel allocated to Aryabhatta Hall - Room 101", admin_name: "amar Singh", admin_id: admin.id },
    { action: "ROOM_ALLOCATED", details: "Student Priya Sen allocated to Kalpana Chawla Hall - Room 101", admin_name: "amar Singh", admin_id: admin.id },
    { action: "VISITOR_LOGGED", details: "Visitor Suresh Verma logged in for Student Rohan Verma", admin_name: "amar Singh", admin_id: admin.id },
  ];

  for (const l of logs) {
    await prisma.activityLog.create({
      data: l,
    });
  }

  console.log("Database Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding database: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
