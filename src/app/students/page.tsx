"use client";

import React, { useEffect, useState, useRef } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { TableSkeleton } from "@/components/LoadingSkeleton";
import { useToast } from "@/context/ToastContext";
import {
  Users2,
  Plus,
  Search,
  Filter,
  Trash2,
  X,
  FileSpreadsheet,
  FileText,
  Upload,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Declare module extension for jsPDF
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Hostel {
  hostel_id: number;
  hostel_name: string;
}

interface Student {
  student_id: number;
  fname: string;
  lname: string;
  mob_no: string;
  dept: string;
  year_of_study: number;
  hostel_id: number | null;
  room_id: number | null;
  hostel?: {
    hostel_name: string;
  } | null;
  room?: {
    room_number: string;
  } | null;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Search, Filters & Pagination
  const [search, setSearch] = useState("");
  const [filterHostel, setFilterHostel] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Student Form state
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [mobNo, setMobNo] = useState("");
  const [dept, setDept] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState(1);
  const [hostelId, setHostelId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // CSV Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const toast = useToast();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        search,
      });
      if (filterHostel) queryParams.set("hostelId", filterHostel);
      if (filterYear) queryParams.set("yearOfStudy", filterYear);
      if (filterDept) queryParams.set("dept", filterDept);

      const res = await fetch(`/api/students?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Failed to fetch students list:", error);
      toast.error("Failed to fetch students database.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHostels = async () => {
    try {
      const res = await fetch("/api/hostels");
      const data = await res.json();
      if (data.success) {
        setHostels(data.hostels);
      }
    } catch (error) {
      console.error("Failed to load hostels:", error);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [currentPage, filterHostel, filterYear, filterDept]); // refetch on filter change

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchStudents();
  };

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fname || !lname || !mobNo || !dept) {
      toast.error("All mandatory fields must be completed.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        fname,
        lname,
        mob_no: mobNo,
        dept,
        year_of_study: Number(yearOfStudy),
      };
      if (hostelId) {
        payload.hostel_id = Number(hostelId);
      }

      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Student registered successfully!");
        setFname("");
        setLname("");
        setMobNo("");
        setDept("");
        setYearOfStudy(1);
        setHostelId("");
        setIsModalOpen(false);
        fetchStudents();
      } else {
        toast.error(data.message || "Failed to register student.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to remove student "${name}"? This will free up their assigned room bed.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Student removed successfully.");
        fetchStudents();
      } else {
        toast.error(data.message || "Failed to remove student.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  // CSV Parser
  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
        if (lines.length < 2) {
          toast.error("CSV file is empty or missing header row.");
          setImporting(false);
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        
        // Expected headers: fname, lname, mob_no, dept, year_of_study, hostel_name
        const parsedStudents = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });
          return row;
        });

        // Send to backend
        const res = await fetch("/api/students/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ students: parsedStudents }),
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
          toast.success(data.message);
          setIsImportOpen(false);
          fetchStudents();
        } else {
          toast.error(data.message || "Import failed.");
          if (data.results?.errors?.length > 0) {
            console.error("Import Errors: ", data.results.errors);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Error parsing CSV. Ensure fields are separated by commas.");
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // Excel Export
  const exportToExcel = () => {
    const exportData = students.map((s) => ({
      "Student ID": s.student_id,
      "First Name": s.fname,
      "Last Name": s.lname,
      "Mobile No": s.mob_no,
      Department: s.dept,
      "Year of Study": s.year_of_study,
      Hostel: s.hostel?.hostel_name || "Unassigned",
      "Room Number": s.room?.room_number || "Unassigned",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students Ledger");
    XLSX.writeFile(workbook, "Hostel_Students_List.xlsx");
    toast.success("Excel sheet exported successfully!");
  };

  // PDF Export
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("HostelSphere - Registered Students Ledger", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 21);

    const tableRows = students.map((s) => [
      s.student_id,
      `${s.fname} ${s.lname}`,
      s.mob_no,
      s.dept,
      s.year_of_study,
      s.hostel?.hostel_name?.split(" ")[0] || "Unassigned",
      s.room?.room_number || "Unassigned",
    ]);

    doc.autoTable({
      head: [["ID", "Name", "Mobile No", "Department", "Year", "Hostel", "Room"]],
      body: tableRows,
      startY: 28,
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save("Hostel_Students_Ledger.pdf");
    toast.success("PDF report generated successfully!");
  };

  return (
    <SidebarLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Manage Students</h1>
            <p className="text-slate-400 mt-1">Register student boarders, allocate rooms, and export data ledger.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-sm font-semibold rounded-xl transition-all"
            >
              <Upload className="w-4.5 h-4.5 text-indigo-400" />
              Bulk Import CSV
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/15 active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" />
              Register Student
            </button>
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
                placeholder="Search by name, phone..."
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

          {/* Filters & Exports */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Department Filter */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800/80 px-3 py-1.5 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Mechanical Engg">Mechanical Engg</option>
                <option value="Electronics Engg">Electronics Engg</option>
                <option value="Biotechnology">Biotechnology</option>
                <option value="Civil Engg">Civil Engg</option>
              </select>
            </div>

            {/* Year Filter */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800/80 px-3 py-1.5 rounded-xl">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            {/* Hostel Filter */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800/80 px-3 py-1.5 rounded-xl">
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

            {/* Exports */}
            <div className="flex gap-2 border-l border-slate-800 pl-3">
              <button
                onClick={exportToExcel}
                disabled={students.length === 0}
                className="p-2 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 rounded-xl transition-all"
                title="Export to Excel"
              >
                <FileSpreadsheet className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={exportToPDF}
                disabled={students.length === 0}
                className="p-2 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 text-rose-400 rounded-xl transition-all"
                title="Export to PDF"
              >
                <FileText className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Data Display */}
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : students.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
            <Users2 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-slate-300">No Students Registered</h3>
            <p className="text-slate-500 text-sm mt-1">Add students individually or import them in bulk from a CSV template.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-lg backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-slate-300">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Mobile No</th>
                      <th className="px-6 py-4">Department & Year</th>
                      <th className="px-6 py-4">Allocated Hostel</th>
                      <th className="px-6 py-4">Room No</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {students.map((student) => (
                      <tr key={student.student_id} className="hover:bg-slate-850/20 transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-500 font-bold">#{student.student_id}</td>
                        <td className="px-6 py-4 font-bold text-slate-100">
                          {student.fname} {student.lname}
                        </td>
                        <td className="px-6 py-4 text-slate-400">{student.mob_no}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-200">{student.dept}</span>
                            <span className="text-[10px] text-slate-500">Year {student.year_of_study}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {student.hostel?.hostel_name || (
                            <span className="text-slate-600 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {student.room?.room_number ? (
                            <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/30 text-indigo-300 font-semibold">
                              Room {student.room.room_number}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-850 text-slate-600 italic">
                              Unallocated
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() =>
                              handleDeleteStudent(
                                student.student_id,
                                `${student.fname} ${student.lname}`
                              )
                            }
                            className="p-1.5 rounded-lg border border-slate-800 text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

        {/* Register Student Modal */}
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
                  <UserCheck className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-semibold text-slate-100">Register Student Boarder</h2>
              </div>

              <form onSubmit={handleRegisterStudent} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fname" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="fname"
                      required
                      placeholder="e.g. Rahul"
                      value={fname}
                      onChange={(e) => setFname(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="lname" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lname"
                      required
                      placeholder="e.g. Kumar"
                      value={lname}
                      onChange={(e) => setLname(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="mobNo" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    id="mobNo"
                    required
                    placeholder="e.g. 9876543210"
                    value={mobNo}
                    onChange={(e) => setMobNo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dept" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Department
                    </label>
                    <select
                      id="dept"
                      required
                      value={dept}
                      onChange={(e) => setDept(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <option value="">Select Dept...</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Mechanical Engg">Mechanical Engg</option>
                      <option value="Electronics Engg">Electronics Engg</option>
                      <option value="Biotechnology">Biotechnology</option>
                      <option value="Civil Engg">Civil Engg</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="yearOfStudy" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Year of Study
                    </label>
                    <select
                      id="yearOfStudy"
                      required
                      value={yearOfStudy}
                      onChange={(e) => setYearOfStudy(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="hostelSelect" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Allocate to Hostel Wing (Optional)
                  </label>
                  <select
                    id="hostelSelect"
                    value={hostelId}
                    onChange={(e) => setHostelId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <option value="">No Room Allocation (Register only)</option>
                    {hostels.map((h) => (
                      <option key={h.hostel_id} value={h.hostel_id}>
                        {h.hostel_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    💡 Selecting a hostel wing triggers the room allocation algorithm to find the first open room bed.
                  </p>
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
                    {submitting ? "Registering..." : "Register"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CSV Import Modal */}
        {isImportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsImportOpen(false)} />

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md z-10 relative shadow-2xl animate-scale-in">
              <button
                onClick={() => setIsImportOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                  <Upload className="w-4.5 h-4.5" />
                </div>
                <h2 className="text-lg font-semibold text-slate-100">Bulk Import Student CSV</h2>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload a CSV file containing student records. The system will create the student profiles and automatically run room allocations based on the designated hostel wing.
                </p>

                {/* Template Description */}
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-850">
                  <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-1.5">Required CSV Columns:</h4>
                  <p className="text-[10px] font-mono text-slate-300 break-words leading-tight bg-slate-900 p-2 rounded-lg border border-slate-800">
                    fname,lname,mob_no,dept,year_of_study,hostel_name
                  </p>
                  <p className="text-[9px] text-slate-500 mt-2">
                    * Ensure hostel_name matches existing hostels (e.g. "Aryabhatta Hall of Residence").
                  </p>
                </div>

                <div className="pt-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv"
                    onChange={handleCSVImport}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    className="w-full py-8 border-2 border-dashed border-slate-800 hover:border-indigo-500/40 hover:bg-indigo-950/5 text-slate-400 hover:text-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-indigo-400 animate-bounce" />
                    <span className="text-xs font-semibold">
                      {importing ? "Processing file..." : "Click to select CSV File"}
                    </span>
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => setIsImportOpen(false)}
                    className="w-full py-2.5 bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-800 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
