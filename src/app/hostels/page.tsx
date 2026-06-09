"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { TableSkeleton } from "@/components/LoadingSkeleton";
import { useToast } from "@/context/ToastContext";
import { Building2, Plus, DoorOpen, Users2, X, ClipboardList } from "lucide-react";

interface Hostel {
  hostel_id: number;
  hostel_name: string;
  no_of_rooms: number;
  no_of_students: number;
  administrator?: {
    id: number;
    fname: string;
    lname: string;
  };
  _count?: {
    rooms: number;
    students: number;
  };
}

export default function HostelsPage() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [hostelName, setHostelName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const fetchHostels = async () => {
    try {
      const res = await fetch("/api/hostels");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setHostels(data.hostels);
        } else {
          toast.error(data.message);
        }
      } else {
        toast.error("Failed to load hostels list.");
      }
    } catch (error) {
      console.error("Failed to fetch hostels:", error);
      toast.error("Network error fetching hostels.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostelName.trim()) {
      toast.error("Hostel name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/hostels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostel_name: hostelName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Hostel created successfully!");
        setHostelName("");
        setIsModalOpen(false);
        fetchHostels();
      } else {
        toast.error(data.message || "Failed to create hostel.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHostel = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? All rooms and furniture will be permanently removed.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/hostels/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Hostel deleted successfully.");
        fetchHostels();
      } else {
        toast.error(data.message || "Failed to delete hostel.");
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
            <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Manage Hostels</h1>
            <p className="text-slate-400 mt-1">Add, update, or remove residential hostel wings.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/15 active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Create Hostel
          </button>
        </div>

        {loading ? (
          <TableSkeleton rows={3} cols={4} />
        ) : hostels.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-slate-300">No Hostels Registered</h3>
            <p className="text-slate-500 text-sm mt-1 mb-6">Create a hostel to start adding rooms and allocating students.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hostels.map((hostel) => (
              <div
                key={hostel.hostel_id}
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-lg flex flex-col justify-between hover:border-slate-700/60 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] uppercase font-semibold font-mono px-2 py-1 rounded bg-slate-950 text-slate-500 border border-slate-800/80">
                      ID: {hostel.hostel_id}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mt-4 truncate">{hostel.hostel_name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Managed by:{" "}
                    <span className="text-indigo-400 font-medium">
                      {hostel.administrator
                        ? `${hostel.administrator.fname} ${hostel.administrator.lname}`
                        : "System Admin"}
                    </span>
                  </p>

                  <div className="grid grid-cols-2 gap-4 mt-6 p-4 rounded-xl bg-slate-950/50 border border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-cyan-400" />
                      <div>
                        <span className="block text-lg font-bold text-white">
                          {hostel._count?.rooms ?? hostel.no_of_rooms}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                          Rooms
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="block text-lg font-bold text-white">
                          {hostel._count?.students ?? hostel.no_of_students}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                          Students
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => handleDeleteHostel(hostel.hostel_id, hostel.hostel_name)}
                    className="flex-1 text-center py-2 border border-rose-500/20 text-rose-400 hover:bg-rose-950/20 text-xs font-semibold rounded-xl transition-all"
                  >
                    Delete Wing
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Hostel Modal */}
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
                <h2 className="text-lg font-semibold text-slate-100">Create New Hostel Wing</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="hostelName" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Hostel Wing Name
                  </label>
                  <input
                    type="text"
                    id="hostelName"
                    required
                    placeholder="e.g. Visvesvaraya Hall"
                    value={hostelName}
                    onChange={(e) => setHostelName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
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
                    {submitting ? "Creating..." : "Save Hostel"}
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
