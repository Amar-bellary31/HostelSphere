"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { TableSkeleton } from "@/components/LoadingSkeleton";
import { useToast } from "@/context/ToastContext";
import { FolderTree, Plus, Search, X, ClipboardList, BedDouble } from "lucide-react";

interface Room {
  room_id: number;
  room_number: string;
  hostel: {
    hostel_name: string;
  };
}

interface Furniture {
  furniture_id: number;
  furniture_type: string;
  room_id: number;
  room: {
    room_number: string;
    hostel: {
      hostel_name: string;
    };
  };
}

export default function FurniturePage() {
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [filterRoom, setFilterRoom] = useState("");

  // Form state
  const [furnitureType, setFurnitureType] = useState("");
  const [roomId, setRoomId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const fetchFurniture = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.set("search", search);
      if (filterRoom) queryParams.set("roomId", filterRoom);

      const res = await fetch(`/api/furniture?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setFurniture(data.furniture);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Failed to load furniture inventory:", error);
      toast.error("Failed to load furniture inventory.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/rooms");
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error("Failed to load rooms list:", error);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchFurniture();
  }, []);

  useEffect(() => {
    fetchFurniture();
  }, [filterRoom]); // reload on dropdown room filter change

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFurniture();
  };

  const handleAssignFurniture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!furnitureType.trim() || !roomId) {
      toast.error("Furniture type and Room are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/furniture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          furniture_type: furnitureType,
          room_id: Number(roomId),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Furniture assigned successfully!");
        setFurnitureType("");
        setRoomId("");
        setIsModalOpen(false);
        fetchFurniture();
      } else {
        toast.error(data.message || "Failed to assign furniture.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Furniture Inventory</h1>
            <p className="text-slate-400 mt-1">Track furniture items, assignments, and structural logs.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/15 active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Assign Furniture
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between backdrop-blur-md">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search by Furniture Type..."
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
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800/80 px-3 py-1.5 rounded-xl">
            <BedDouble className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Rooms</option>
              {rooms.map((r) => (
                <option key={r.room_id} value={r.room_id}>
                  Room {r.room_number} ({r.hostel.hostel_name.split(" ")[0]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Display */}
        {loading ? (
          <TableSkeleton rows={4} cols={4} />
        ) : furniture.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
            <FolderTree className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-slate-300">No Furniture Registered</h3>
            <p className="text-slate-500 text-sm mt-1">Assign furniture pieces to active rooms to begin tracking inventory.</p>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-lg backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Furniture ID</th>
                    <th className="px-6 py-4">Item Type</th>
                    <th className="px-6 py-4">Assigned Room</th>
                    <th className="px-6 py-4">Hostel Wing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {furniture.map((item) => (
                    <tr key={item.furniture_id} className="hover:bg-slate-850/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-500 font-semibold">#{item.furniture_id}</td>
                      <td className="px-6 py-4 font-bold text-slate-100">{item.furniture_type}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/30 text-indigo-300 font-semibold">
                          Room {item.room.room_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{item.room.hostel.hostel_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assign Furniture Modal */}
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
                <h2 className="text-lg font-semibold text-slate-100">Assign Furniture to Room</h2>
              </div>

              <form onSubmit={handleAssignFurniture} className="space-y-4">
                <div>
                  <label htmlFor="furnitureType" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Furniture Type
                  </label>
                  <input
                    type="text"
                    id="furnitureType"
                    required
                    placeholder="e.g. Study Table, Steel Cupboard, Chair"
                    value={furnitureType}
                    onChange={(e) => setFurnitureType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="roomSelect" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Select Target Room
                  </label>
                  <select
                    id="roomSelect"
                    required
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <option value="">Select Room Number...</option>
                    {rooms.map((r) => (
                      <option key={r.room_id} value={r.room_id}>
                        Room {r.room_number} ({r.hostel.hostel_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all"
                  >
                    {submitting ? "Assigning..." : "Assign Item"}
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
