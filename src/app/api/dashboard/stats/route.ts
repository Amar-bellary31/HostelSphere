import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { handleApiError, handleUnauthorized } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  const admin = getAuthUser(req);
  if (!admin) return handleUnauthorized();

  try {
    // 1. Fetch counts in parallel
    const [
      hostelsCount,
      studentsCount,
      roomsCount,
      allRooms,
      recentLogs,
      activeVisitorsCount,
    ] = await Promise.all([
      prisma.hostel.count(),
      prisma.student.count(),
      prisma.room.count(),
      prisma.room.findMany({
        select: {
          capacity: true,
          occupied_count: true,
          status: true,
          hostel_id: true,
          room_number: true,
        },
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.visitor.count({
        where: { out_time: null },
      }),
    ]);

    // 2. Occupancy rate calculation
    let totalCapacity = 0;
    let totalOccupied = 0;
    
    let availableCount = 0;
    let fullCount = 0;
    let maintenanceCount = 0;

    for (const r of allRooms) {
      totalCapacity += r.capacity;
      totalOccupied += r.occupied_count;

      if (r.status === "AVAILABLE") availableCount++;
      else if (r.status === "FULL") fullCount++;
      else if (r.status === "MAINTENANCE") maintenanceCount++;
    }

    const overallOccupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    // 3. Hostel occupancy breakdown
    const hostels = await prisma.hostel.findMany({
      select: {
        hostel_id: true,
        hostel_name: true,
        rooms: {
          select: {
            capacity: true,
            occupied_count: true,
            room_number: true,
            status: true,
          },
        },
      },
    });

    const hostelOccupancyBreakdown = hostels.map((h) => {
      let cap = 0;
      let occ = 0;
      h.rooms.forEach((r) => {
        cap += r.capacity;
        occ += r.occupied_count;
      });

      const rate = cap > 0 ? Math.round((occ / cap) * 100) : 0;

      // Group rooms into a simple heat map (array of rooms with their occupancy status)
      const roomHeatmap = h.rooms.map((r) => ({
        room_number: r.room_number,
        occupied_percentage: r.capacity > 0 ? Math.round((r.occupied_count / r.capacity) * 100) : 0,
        status: r.status,
      }));

      return {
        hostel_id: h.hostel_id,
        hostel_name: h.hostel_name,
        total_rooms: h.rooms.length,
        capacity: cap,
        occupied: occ,
        occupancy_rate: rate,
        roomHeatmap,
      };
    });

    // 4. Visitor trends (last 7 days visitor counts)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const visitorsLast7Days = await prisma.visitor.findMany({
      where: {
        date: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        date: true,
      },
    });

    // Aggregate visitors by date
    const visitorTrendMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      visitorTrendMap[dateStr] = 0;
    }

    visitorsLast7Days.forEach((v) => {
      const dateStr = new Date(v.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (visitorTrendMap[dateStr] !== undefined) {
        visitorTrendMap[dateStr]++;
      }
    });

    const visitorTrends = Object.entries(visitorTrendMap).map(([date, count]) => ({
      date,
      count,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalHostels: hostelsCount,
        totalRooms: roomsCount,
        totalStudents: studentsCount,
        activeVisitors: activeVisitorsCount,
        occupancyRate: overallOccupancyRate,
        bedsCapacity: totalCapacity,
        bedsOccupied: totalOccupied,
        roomStatusBreakdown: {
          available: availableCount,
          full: fullCount,
          maintenance: maintenanceCount,
        },
        hostelOccupancyBreakdown,
        visitorTrends,
        recentLogs,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
