"use client";

import React, { useEffect, useState } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { TableSkeleton } from "@/components/LoadingSkeleton";
import { useToast } from "@/context/ToastContext";
import { History, Search, ChevronLeft, ChevronRight, Calendar, User } from "lucide-react";

interface ActivityLog {
  id: number;
  action: string;
  details: string;
  admin_id: number | null;
  admin_name: string | null;
  createdAt: string;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const toast = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        search,
      });

      const res = await fetch(`/api/logs?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Failed to load activity logs:", error);
      toast.error("Failed to fetch system logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage]); // refetch on page change

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  return (
    <SidebarLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">System Activity Logs</h1>
            <p className="text-slate-400 mt-1">Audit trail tracking all room allocations, registrations, check-ins, and logins.</p>
          </div>
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
                placeholder="Search logs by action, admin, detail..."
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

          <div className="text-xs text-slate-500 font-mono">
            🛡️ Immutable Security Audit Logs
          </div>
        </div>

        {/* Data Display */}
        {loading ? (
          <TableSkeleton rows={8} cols={4} />
        ) : logs.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
            <History className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-slate-300">No Activity Logs</h3>
            <p className="text-slate-500 text-sm mt-1">Activities and logs will appear here once actions are performed in the system.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-lg backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-slate-300">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">Action Token</th>
                      <th className="px-6 py-4">Audit Details</th>
                      <th className="px-6 py-4">Triggered By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-850/20 transition-colors">
                        <td className="px-6 py-4 text-slate-400 font-mono flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-mono font-bold bg-slate-950 border border-slate-800 text-slate-300">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-200 font-medium">{log.details}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <User className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{log.admin_name || "System"}</span>
                          </div>
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
      </div>
    </SidebarLayout>
  );
}
