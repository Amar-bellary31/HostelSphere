"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { TableSkeleton } from "@/components/LoadingSkeleton";
import { useToast } from "@/context/ToastContext";
import { UserCheck, Plus, Search, X, ClipboardList, LogOut, ChevronLeft, ChevronRight, Clock } from "lucide-react";

interface Student {
  student_id: number;
  fname: string;
  lname: string;
}

interface Visitor {
  visitor_id: number;
  visitor_name: string;
  date: string;
  in_time: string;
  out_time: string | null;
  student_id: number;
  student: {
    fname: string;
    lname: string;
    mob_no: string;
    room?: {
      room_number: string;
    } | null;
    hostel?: {
      hostel_name: string;
    } | null;
  };
}

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search, Filters & Pagination
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Form State
  const [visitorName, setVisitorName] = useState("");
  const [inTime, setInTime] = useState("");
  const [studentId, setStudentId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        search,
      });

      const res = await fetch(`/api/visitors?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setVisitors(data.visitors);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Failed to load visitor records:", error);
      toast.error("Failed to fetch visitor records.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students?limit=100"); // fetch some students for checkout mapping
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error("Failed to load students:", error);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchVisitors();
  }, []);

  useEffect(() => {
    fetchVisitors();
  }, [currentPage]); // refetch on page change

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchVisitors();
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !inTime || !studentId) {
      toast.error("All check-in details are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitor_name: visitorName,
          date: new Date().toISOString().split("T")[0],
          in_time: inTime,
          student_id: Number(studentId),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Visitor checked in successfully!");
        setVisitorName("");
        setInTime("");
        setStudentId("");
        setIsModalOpen(false);
        fetchVisitors();
      } else {
        toast.error(data.message || "Failed to check in visitor.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (id: number) => {
    const formattedOutTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    try {
      const res = await fetch(`/api/visitors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ out_time: formattedOutTime }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Visitor checked out at ${formattedOutTime}`);
        fetchVisitors();
      } else {
        toast.error(data.message || "Failed to check out visitor.");
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
            <h1 className="text-3xl font-bold tracking-tight text-white">Visitor Logs</h1>
            <p className="text-slate-400 mt-1">Register visitor check-ins, record exit logs, and view history.</p>
          </div>
          <button
            onClick={() => {
              // Prepopulate current time in inTime input
              const now = new Date();
              const timeString = now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });
              setInTime(timeString);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/15 active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Check-In Visitor
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
                placeholder="Search by Visitor Name..."
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

          <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400" />
            Active Records Monitoring Screen
          </div>
        </div>

        {/* Data Display */}
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : visitors.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
            <UserCheck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-slate-300">No Visitor Logs Found</h3>
            <p className="text-slate-500 text-sm mt-1">Check in a visitor to start recording entry and exit logs.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-lg backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-slate-300">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Visitor</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Boarder Visited</th>
                      <th className="px-6 py-4">Room & Wing</th>
                      <th className="px-6 py-4">In Time</th>
                      <th className="px-6 py-4">Out Time</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {visitors.map((visitor) => (
                      <tr key={visitor.visitor_id} className="hover:bg-slate-850/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-100">{visitor.visitor_name}</td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(visitor.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-200">
                          {visitor.student.fname} {visitor.student.lname}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-300">
                              {visitor.student.room ? `Room ${visitor.student.room.room_number}` : "Unallocated"}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {visitor.student.hostel?.hostel_name.split(" ")[0] || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-indigo-400 font-semibold">{visitor.in_time}</td>
                        <td className="px-6 py-4">
                          {visitor.out_time ? (
                            <span className="text-emerald-400 font-semibold">{visitor.out_time}</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/30 text-indigo-300 font-mono text-[9px] uppercase animate-pulse">
                              Inside Hostel
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!visitor.out_time ? (
                            <button
                              onClick={() => handleCheckOut(visitor.visitor_id)}
                              className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ml-auto"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              Check-Out
                            </button>
                          ) : (
                            <span className="text-slate-650 text-xs italic">Complete</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-800 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-800 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Check-In Visitor Modal */}
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
                <h2 className="text-lg font-semibold text-slate-100">Log Visitor Check-In</h2>
              </div>

              <form onSubmit={handleCheckIn} className="space-y-4">
                <div>
                  <label htmlFor="visitorName" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Visitor Full Name
                  </label>
                  <input
                    type="text"
                    id="visitorName"
                    required
                    placeholder="e.g. Ramesh Verma"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="inTime" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Check-In Time
                    </label>
                    <input
                      type="text"
                      id="inTime"
                      required
                      placeholder="e.g. 10:15 AM"
                      value={inTime}
                      onChange={(e) => setInTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="date" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Date
                    </label>
                    <input
                      type="text"
                      id="date"
                      disabled
                      value={new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      className="w-full bg-slate-950/50 border border-slate-850 text-slate-500 rounded-xl py-2.5 px-3 text-xs select-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="studentSelect" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Select Visited Boarder
                  </label>
                  <select
                    id="studentSelect"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <option value="">Choose Student Boarder...</option>
                    {students.map((s) => (
                      <option key={s.student_id} value={s.student_id}>
                        {s.fname} {s.lname} (ID: #{s.student_id})
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
                    {submitting ? "Logging..." : "Log Check-In"}
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
