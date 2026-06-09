"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { GridSkeleton, LogSkeleton } from "@/components/LoadingSkeleton";
import { useToast } from "@/context/ToastContext";
import {
  Building,
  DoorOpen,
  Users,
  Eye,
  Percent,
  Calendar,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface DashboardStats {
  totalHostels: number;
  totalRooms: number;
  totalStudents: number;
  activeVisitors: number;
  occupancyRate: number;
  bedsCapacity: number;
  bedsOccupied: number;
  roomStatusBreakdown: {
    available: number;
    full: number;
    maintenance: number;
  };
  hostelOccupancyBreakdown: Array<{
    hostel_id: number;
    hostel_name: string;
    total_rooms: number;
    capacity: number;
    occupied: number;
    occupancy_rate: number;
    roomHeatmap: Array<{
      room_number: string;
      occupied_percentage: number;
      status: string;
    }>;
  }>;
  visitorTrends: Array<{
    date: string;
    count: number;
  }>;
  recentLogs: Array<{
    id: number;
    action: string;
    details: string;
    admin_name: string | null;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        } else {
          toast.error(data.message);
        }
      } else {
        toast.error("Failed to load dashboard statistics.");
      }
    } catch (error) {
      console.error("Failed to fetch dashboard statistics:", error);
      toast.error("Network error fetching dashboard details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const cardData = stats
    ? [
        {
          name: "Total Hostels",
          value: stats.totalHostels,
          description: "Registered wings",
          icon: Building,
          color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
        },
        {
          name: "Total Rooms",
          value: stats.totalRooms,
          description: `${stats.roomStatusBreakdown.available} vacant, ${stats.roomStatusBreakdown.full} full`,
          icon: DoorOpen,
          color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
        },
        {
          name: "Total Students",
          value: stats.totalStudents,
          description: "Active boarders",
          icon: Users,
          color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
        },
        {
          name: "Active Visitors",
          value: stats.activeVisitors,
          description: "Currently checked-in",
          icon: Eye,
          color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
        },
      ]
    : [];

  return (
    <SidebarLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Overview</h1>
            <p className="text-slate-400 mt-1">Real-time occupancy analytics, visitor logs, and audit logs.</p>
          </div>
          <button
            onClick={fetchStats}
            className="self-start px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-sm font-semibold rounded-xl transition-all active:scale-[0.98]"
          >
            Refresh Metrics
          </button>
        </div>

        {loading ? (
          <>
            <GridSkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <LogSkeleton count={5} />
              </div>
              <div>
                <LogSkeleton count={3} />
              </div>
            </div>
          </>
        ) : (
          stats && (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cardData.map((card, i) => (
                  <div
                    key={i}
                    className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-lg transition-transform hover:-translate-y-0.5 duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-400">{card.name}</span>
                      <div className={`p-2.5 rounded-xl border ${card.color}`}>
                        <card.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-white tracking-tight">{card.value}</span>
                      <p className="text-xs text-slate-500 mt-1">{card.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Occupancy Rate Bar Card */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm font-semibold text-slate-200">Overall Bed Occupancy Rate</span>
                  </div>
                  <span className="text-2xl font-bold text-white">{stats.occupancyRate}%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${stats.occupancyRate}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
                  <span>Occupied: {stats.bedsOccupied} beds</span>
                  <span>Capacity: {stats.bedsCapacity} beds</span>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Hostel Occupancy Bar Chart */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-lg">
                  <div className="flex items-center gap-2 mb-6">
                    <Building className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-semibold text-slate-200">Hostel Capacity vs Occupancy</h3>
                  </div>
                  <div className="h-80 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.hostelOccupancyBreakdown}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="hostel_name" stroke="#64748b" tickFormatter={(str) => str.split(" ")[0]} />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                          labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                          itemStyle={{ color: "#f1f5f9" }}
                        />
                        <Bar dataKey="capacity" name="Bed Capacity" fill="#1e293b" stroke="#475569" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="occupied" name="Occupied Beds" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Visitor Trends Line Chart */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-lg">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-semibold text-slate-200">Weekly Visitor Traffic</h3>
                  </div>
                  <div className="h-80 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={stats.visitorTrends}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px" }}
                          labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                          itemStyle={{ color: "#f1f5f9" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          name="Visitor Entries"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={{ fill: "#10b981", strokeWidth: 1 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Room Occupancy Heatmap Section */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-lg">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                  <DoorOpen className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-base font-semibold text-slate-200">Room Occupancy Heatmap</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Visual mapping of rooms and allocation percentages</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {stats.hostelOccupancyBreakdown.map((hostel) => (
                    <div key={hostel.hostel_id} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-semibold text-slate-300">{hostel.hostel_name}</h4>
                        <span className="text-xs text-slate-500">
                          {hostel.occupied}/{hostel.capacity} Beds ({hostel.occupancy_rate}%)
                        </span>
                      </div>

                      {hostel.roomHeatmap.length === 0 ? (
                        <p className="text-xs text-slate-600 italic">No rooms registered in this hostel.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                          {hostel.roomHeatmap.map((room) => {
                            let statusClass = "bg-slate-800 text-slate-400 border-slate-700/50";
                            
                            if (room.status === "MAINTENANCE") {
                              statusClass = "bg-rose-950/50 border-rose-800/30 text-rose-300";
                            } else if (room.status === "FULL") {
                              statusClass = "bg-emerald-950/80 border-emerald-700/40 text-emerald-300";
                            } else if (room.occupied_percentage > 0) {
                              statusClass = "bg-indigo-950/80 border-indigo-700/40 text-indigo-300";
                            }

                            return (
                              <div
                                key={room.room_number}
                                className={`p-3 border rounded-xl flex flex-col items-center justify-center text-center transition-all ${statusClass}`}
                              >
                                <span className="text-xs font-semibold">Room {room.room_number}</span>
                                <span className="text-[10px] mt-1 opacity-70">
                                  {room.status === "MAINTENANCE" ? "Maint" : `${room.occupied_percentage}%`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Heatmap Legend */}
                  <div className="flex flex-wrap gap-4 text-[10px] text-slate-500 pt-2 border-t border-slate-800/60 justify-end">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700" />
                      <span>Empty</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-indigo-950 border border-indigo-700" />
                      <span>Vacant Slots</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-emerald-950 border border-emerald-700" />
                      <span>Fully Occupied</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-rose-950 border border-rose-800" />
                      <span>Maintenance</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Audit Logs */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-lg">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-base font-semibold text-slate-200">Recent Security & Activity Logs</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Real-time system audit logs</p>
                  </div>
                </div>

                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-slate-800/60">
                    {stats.recentLogs.map((log) => (
                      <li key={log.id} className="py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-300 font-medium truncate">{log.details}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              By <span className="text-indigo-400 font-semibold">{log.admin_name || "System"}</span> • {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs px-2.5 py-1 rounded-full font-mono bg-slate-950 border border-slate-800 text-slate-400">
                            {log.action}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )
        )}
      </div>
    </SidebarLayout>
  );
}
