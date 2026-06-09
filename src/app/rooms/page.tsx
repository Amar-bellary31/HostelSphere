"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { TableSkeleton } from "@/components/LoadingSkeleton";
import { useToast } from "@/context/ToastContext";
import { DoorOpen, Plus, Search, Filter, Trash2, X, ClipboardList, BedDouble, Hammer } from "lucide-react";

interface Hostel {
  hostel_id: number;
  hostel_name: string;
}

interface Room {
  room_id: number;
  room_number: string;
  capacity: number;
  occupied_count: number;
  status: string;
  hostel_id: number;
  hostel: {
    hostel_name: string;
  };
  _count: {
    students: number;
    furniture: number;
  };
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [filterHostel, setFilterHostel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Form state
  const [roomNumber, setRoomNumber] = useState("");
  const [capacity, setCapacity] = useState(3);
  const [status, setStatus] = useState("AVAILABLE");
  const [hostelId, setHostelId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch hostels for dropdown
      const hostelsRes = await fetch("/api/hostels");
      const hostelsData = await hostelsRes.json();
      if (hostelsData.success) {
        setHostels(hostelsData.hostels);
      }

      // Build rooms query URL
      const queryParams = new URLSearchParams();
      if (search) queryParams.set("search", search);
      if (filterHostel) queryParams.set("hostelId", filterHostel);
      if (filterStatus) queryParams.set("status", filterStatus);

      const roomsRes = await fetch(`/api/rooms?${queryParams.toString()}`);
      const roomsData = await roomsRes.json();
      if (roomsData.success) {
        setRooms(roomsData.rooms);
      } else {
        toast.error(roomsData.message);
      }
    } catch (error) {
      console.error("Failed to load rooms details:", error);
      toast.error("Failed to fetch rooms records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterHostel, filterStatus]); // reload on dropdown filters change

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim() || !hostelId) {
      toast.error("Room number and hostel are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_number: roomNumber,
          capacity: Number(capacity),
          status,
          hostel_id: Number(hostelId),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Room created successfully!");
        setRoomNumber("");
        setCapacity(3);
        setStatus("AVAILABLE");
        setHostelId("");
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error(data.message || "Failed to create room.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async (id: number, number: string) => {
    if (!confirm(`Are you sure you want to delete Room ${number}? All assigned furniture and student room placements will be unassigned.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/rooms/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Room deleted successfully.");
        fetchData();
      } else {
        toast.error(data.message || "Failed to delete room.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Manage Rooms</h1>
            <p className="text-slate-400 mt-1">Configure room allocations, capacities, and availability.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/15 active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Add Room
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between backdrop-blur-md">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search by Room Number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all active:scale-[0.98]"
            >
              Search
            </button>
          </form>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800/80 px-3 py-1.5 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={filterHostel}
                onChange={(e) => setFilterHostel(e.target.value)}
                className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="">All Hostels</option>
                {hostels.map((h) => (
                  <option key={h.hostel_id} value={h.hostel_id}>
                    {h.hostel_name.split(" ")[0]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800/80 px-3 py-1.5 rounded-xl">
              <BedDouble className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="FULL">Fully Occupied</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Display */}
        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : rooms.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
            <DoorOpen className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-slate-300">No Rooms Found</h3>
            <p className="text-slate-500 text-sm mt-1">Try resetting your filters or register a new room in the system.</p>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-lg backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Room No</th>
                    <th className="px-6 py-4">Hostel Wing</th>
                    <th className="px-6 py-4">Beds (Occupied / Total)</th>
                    <th className="px-6 py-4">Furniture Inventory</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rooms.map((room) => {
                    let statusBadge = "bg-indigo-950/80 border-indigo-700/30 text-indigo-300";
                    if (room.status === "FULL") {
                      statusBadge = "bg-emerald-950/80 border-emerald-700/30 text-emerald-300";
                    } else if (room.status === "MAINTENANCE") {
                      statusBadge = "bg-rose-950/80 border-rose-700/30 text-rose-300";
                    }

                    return (
                      <tr key={room.room_id} className="hover:bg-slate-850/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-100">Room {room.room_number}</td>
                        <td className="px-6 py-4 text-slate-400">{room.hostel.hostel_name}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">
                              {room.occupied_count} / {room.capacity}
                            </span>
                            <div className="w-24 bg-slate-950 h-2 rounded-full border border-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  room.status === "FULL" ? "bg-emerald-500" : "bg-indigo-500"
                                }`}
                                style={{ width: `${(room.occupied_count / room.capacity) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-850 text-slate-400 font-mono">
                            {room._count.furniture} items
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusBadge}`}>
                            {room.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteRoom(room.room_id, room.room_number)}
                            className="p-1.5 rounded-lg border border-slate-800 text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Room Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md z-10 relative shadow-2xl animate-scale-in">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-semibold text-slate-100">Add New Room</h2>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="roomNumber" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Room Number
                    </label>
                    <input
                      type="text"
                      id="roomNumber"
                      required
                      placeholder="e.g. 101"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="capacity" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Bed Capacity
                    </label>
                    <input
                      type="number"
                      id="capacity"
                      required
                      min={1}
                      max={10}
                      value={capacity}
                      onChange={(e) => setCapacity(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="hostelId" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Hostel Wing
                  </label>
                  <select
                    id="hostelId"
                    required
                    value={hostelId}
                    onChange={(e) => setHostelId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <option value="">Select Hostel Wing...</option>
                    {hostels.map((h) => (
                      <option key={h.hostel_id} value={h.hostel_id}>
                        {h.hostel_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Initial Status
                  </label>
                  <div className="flex gap-2">
                    {["AVAILABLE", "MAINTENANCE"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          status === s
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800"
                        }`}
                      >
                        {s === "MAINTENANCE" && <Hammer className="w-3.5 h-3.5" />}
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-slate-950 border border-slate-800 text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
                  >
                    {submitting ? "Adding..." : "Add Room"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
