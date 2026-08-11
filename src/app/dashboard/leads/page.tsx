"use client";

import React, { Suspense, useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Download,
  Trash2,
  Edit3,
  Eye,
  Loader2,
  X,
  ChevronDown,
  ArrowUpDown,
  FilterX,
  Sparkles,
  Phone,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import {
  BUDGET_OPTIONS,
  PURPOSE_OPTIONS,
  ROAD_OPTIONS,
  DEFAULT_LOCATIONS,
} from "@/lib/crmOptions";

// Zod validation schemas
const leadSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  mobileNumber: z.string().min(10, "Mobile must be at least 10 digits"),
  whatsAppNumber: z.string().min(10, "WhatsApp must be at least 10 digits"),
  purpose: z.enum(PURPOSE_OPTIONS),
  budget: z.string().min(1, "Budget is required"),
  preferredLocations: z
    .array(z.string())
    .min(1, "Select at least one preferred location"),
  leadSource: z.enum([
    "Instagram",
    "Facebook",
    "Website",
    "Reference",
    "Magicbricks",
    "99acres",
    "Housing",
    "Walk-in",
    "Cold Calling",
    "Other",
  ]),
  leadStatus: z.enum([
    "New",
    "Contacted",
    "Follow-up",
    "Interested",
    "Site Visit",
    "Negotiation",
    "Booked",
    "Sold",
    "Lost",
  ]),
  notes: z.string().optional().default(""),
  requirement: z.string().optional().default(""),
  dateOfBirth: z.string().optional().or(z.literal("")),
});

type LeadFormValues = z.infer<typeof leadSchema>;

function LeadsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // List states
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Sorting state
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Search & Filter state
  const [searchVal, setSearchVal] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterPurpose, setFilterPurpose] = useState("");
  const [filterBudget, setFilterBudget] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLocations, setFilterLocations] = useState<string[]>([]);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Form Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any | null>(null);
  const [customLocationInput, setCustomLocationInput] = useState("");

  // Delete Confirm state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Locations checklist items - default locations only
  const LOCATIONS_LIST = DEFAULT_LOCATIONS;

  // Sync Search value from URL parameter (global search bar support)
  useEffect(() => {
    const s = searchParams.get("search") || "";
    setSearchVal(s);
    fetchLeads(s);
  }, [searchParams]);

  // Read filters and fetch leads
  const fetchLeads = async (searchOverride?: string) => {
    try {
      setLoading(true);
      const search = searchOverride !== undefined ? searchOverride : searchVal;
      const locations = filterLocations.join(",");

      let url =
        `/api/customers?search=${encodeURIComponent(search)}` +
        `&purpose=${filterPurpose}` +
        `&budget=${filterBudget}` +
        `&leadSource=${filterSource}` +
        `&leadStatus=${filterStatus}` +
        `&location=${locations}` +
        `&startDate=${filterStartDate}` +
        `&endDate=${filterEndDate}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
        setCurrentPage(1); // reset to first page
      } else {
        toast.error("Failed to load customer leads");
      }
    } catch (err) {
      toast.error("Error fetching leads");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchLeads();
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilterPurpose("");
    setFilterBudget("");
    setFilterSource("");
    setFilterStatus("");
    setFilterLocations([]);
    setFilterStartDate("");
    setFilterEndDate("");

    // Quick fetch empty filters
    let url = `/api/customers?search=${encodeURIComponent(searchVal)}`;
    setLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setLeads(data);
        setCurrentPage(1);
      })
      .finally(() => setLoading(false));

    setShowFilters(false);
    toast.success("Filters cleared");
  };

  // Form Management
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema) as any,
    defaultValues: {
      fullName: "",
      mobileNumber: "",
      whatsAppNumber: "",
      purpose: "Residential",
      budget: "30 Lakh",
      preferredLocations: [],
      leadSource: "Other",
      leadStatus: "New",
      notes: "",
      requirement: "",
    },
  });

  const selectedLocations = watch("preferredLocations");

  // Trigger modal open for creation
  const handleOpenAddModal = () => {
    setEditingLead(null);
    reset({
      fullName: "",
      mobileNumber: "",
      whatsAppNumber: "",
      purpose: "Residential",
      budget: "30 Lakh",
      preferredLocations: [],
      leadSource: "Other",
      leadStatus: "New",
      notes: "",
      requirement: "",
      dateOfBirth: "",
    });
    setModalOpen(true);
  };

  // Trigger modal open for edit
  const handleOpenEditModal = (lead: any) => {
    setEditingLead(lead);
    reset({
      fullName: lead.fullName,
      mobileNumber: lead.mobileNumber,
      whatsAppNumber: lead.whatsAppNumber,
      purpose: lead.purpose,
      budget: lead.budget,
      preferredLocations: lead.preferredLocations || [],
      leadSource: lead.leadSource,
      leadStatus: lead.leadStatus,
      notes: lead.notes || "",
      requirement: lead.requirement || "",
      dateOfBirth: lead.dateOfBirth ? lead.dateOfBirth.substring(0, 10) : "",
    });
    setModalOpen(true);
  };

  // Form Submit Action
  const onSubmit = async (data: LeadFormValues) => {
    try {
      const url = editingLead
        ? `/api/customers/${editingLead._id}`
        : "/api/customers";
      const method = editingLead ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success(
          editingLead
            ? "Lead updated successfully"
            : "Lead created successfully",
        );
        setModalOpen(false);
        fetchLeads();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save lead information");
      }
    } catch (err) {
      toast.error("An error occurred. Try again.");
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await fetch(`/api/customers/${deleteConfirmId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Lead and associated follow-up logs deleted");
        setDeleteConfirmId(null);
        fetchLeads();
      } else {
        toast.error("Failed to delete lead");
      }
    } catch (err) {
      toast.error("Error deleting lead");
    }
  };

  // Sorting Handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sorted list calculation
  const sortedLeads = [...leads].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === "createdAt") {
      aVal = new Date(a.createdAt).getTime();
      bVal = new Date(b.createdAt).getTime();
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination calculation
  const totalPages = Math.ceil(sortedLeads.length / pageSize);
  const currentTableData = sortedLeads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Location Toggle for multi select dropdown
  const toggleFormLocation = (loc: string) => {
    const current = [...selectedLocations];
    const index = current.indexOf(loc);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(loc);
    }
    setValue("preferredLocations", current, { shouldValidate: true });
  };

  const removeLocation = (loc: string) => {
    const current = selectedLocations.filter((l) => l !== loc);
    setValue("preferredLocations", current, { shouldValidate: true });
  };

  const addCustomLocation = () => {
    const value = customLocationInput.trim();
    if (!value) {
      toast.error("Please enter a location");
      return;
    }
    if (selectedLocations?.includes(value)) {
      toast.error("This location is already added");
      return;
    }
    setValue("preferredLocations", [...(selectedLocations || []), value], {
      shouldValidate: true,
    });
    setCustomLocationInput("");
  };

  // Export CSV
  const handleExportCSV = () => {
    if (leads.length === 0) {
      toast.error("No leads available to export");
      return;
    }
    const exportData = leads.map((l) => ({
      Name: l.fullName,
      Mobile: l.mobileNumber,
      WhatsApp: l.whatsAppNumber,
      Purpose: l.purpose,
      Budget: l.budget,
      Locations: l.preferredLocations?.join(", "),
      Source: l.leadSource,
      Status: l.leadStatus,
      "Lead Score": l.leadScore,
      Notes: l.notes,
      Requirement: l.requirement,
      "Created Date": new Date(l.createdAt).toLocaleDateString(),
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Apex_Leads_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export completed");
  };

  // Export Excel
  const handleExportExcel = () => {
    if (leads.length === 0) {
      toast.error("No leads available to export");
      return;
    }
    const exportData = leads.map((l) => ({
      "Full Name": l.fullName,
      "Mobile Number": l.mobileNumber,
      "WhatsApp Number": l.whatsAppNumber,
      Purpose: l.purpose,
      Budget: l.budget,
      "Preferred Locations": l.preferredLocations?.join(", "),
      "Lead Source": l.leadSource,
      "Lead Status": l.leadStatus,
      "Lead Score": l.leadScore,
      Notes: l.notes,
      Requirement: l.requirement,
      "Created Date": new Date(l.createdAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, `Apex_Leads_Report_${Date.now()}.xlsx`);
    toast.success("Excel workbook downloaded");
  };

  // Export PDF (optimized browser print format)
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Exports */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Leads Pipeline Directory{" "}
            <Sparkles className="h-4.5 w-4.5 text-blue-500" />
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Add new customers, adjust status scores, and export listings to
            spreadsheet files.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export Dropdown */}
          <div className="flex items-center border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--card)]">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 text-xs font-semibold hover:bg-[var(--secondary)] border-r border-[var(--border)] flex items-center gap-1 cursor-pointer transition-colors"
            >
              CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3 py-2 text-xs font-semibold hover:bg-[var(--secondary)] border-r border-[var(--border)] flex items-center gap-1 cursor-pointer transition-colors"
            >
              Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3 py-2 text-xs font-semibold hover:bg-[var(--secondary)] flex items-center gap-1 cursor-pointer transition-colors"
            >
              Print Report
            </button>
          </div>

          {/* Add Customer Button */}
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow"
          >
            <Plus className="h-4 w-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS BUTTON PANEL */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Filter by name, phone, notes..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchLeads()}
            className="w-full pl-10 pr-4 py-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] transition-all"
          />
        </div>
        <button
          onClick={() => fetchLeads()}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600/10 text-blue-500 hover:bg-blue-600/15 border border-blue-500/20 cursor-pointer"
        >
          Search
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-colors ${
            showFilters ||
            filterPurpose ||
            filterBudget ||
            filterSource ||
            filterStatus ||
            filterLocations.length > 0
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)]"
          }`}
        >
          <SlidersHorizontal className="h-4.5 w-4.5" /> Advanced Filters
        </button>
      </div>

      {/* COLLAPSIBLE FILTERS PANEL */}
      {showFilters && (
        <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl space-y-4 animate-in slide-in-from-top-4 duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Filter: Purpose */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[var(--muted)] uppercase">
                Purpose
              </label>
              <select
                value={filterPurpose}
                onChange={(e) => setFilterPurpose(e.target.value)}
                className="w-full p-2 border rounded-lg text-xs bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] focus:outline-none"
              >
                <option value="">All Intentions</option>
                {PURPOSE_OPTIONS.map((purpose) => (
                  <option key={purpose} value={purpose}>
                    {purpose}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: Budget */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[var(--muted)] uppercase">
                Budget
              </label>
              <select
                value={filterBudget}
                onChange={(e) => setFilterBudget(e.target.value)}
                className="w-full p-2 border rounded-lg text-xs bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] focus:outline-none"
              >
                <option value="">All Budgets</option>
                {BUDGET_OPTIONS.map((budget) => (
                  <option key={budget} value={budget}>
                    {budget}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: Lead Status */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[var(--muted)] uppercase">
                Lead Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border rounded-lg text-xs bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Interested">Interested</option>
                <option value="Site Visit">Site Visit</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Booked">Booked</option>
                <option value="Sold">Sold</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            {/* Filter: Lead Source */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[var(--muted)] uppercase">
                Lead Source
              </label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="w-full p-2 border rounded-lg text-xs bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] focus:outline-none"
              >
                <option value="">All Sources</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="Website">Website</option>
                <option value="Reference">Reference</option>
                <option value="Magicbricks">Magicbricks</option>
                <option value="99acres">99acres</option>
                <option value="Housing">Housing</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Cold Calling">Cold Calling</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Filter: Date Range Start */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[var(--muted)] uppercase">
                Registered From
              </label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full p-2 border rounded-lg text-xs bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] focus:outline-none"
              />
            </div>

            {/* Filter: Date Range End */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[var(--muted)] uppercase">
                Registered To
              </label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full p-2 border rounded-lg text-xs bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] focus:outline-none"
              />
            </div>

            {/* Filter: Locations (Checkbox list) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-semibold text-[var(--muted)] uppercase block">
                Preferred Locations
              </label>
              <div className="flex gap-2 flex-wrap">
                {LOCATIONS_LIST.map((loc) => {
                  const checked = filterLocations.includes(loc);
                  return (
                    <button
                      key={loc}
                      onClick={() => {
                        setFilterLocations((prev) =>
                          checked
                            ? prev.filter((x) => x !== loc)
                            : [...prev, loc],
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                        checked
                          ? "bg-indigo-600/10 text-indigo-500 border-indigo-500"
                          : "bg-[var(--background)] border-[var(--border)] text-[var(--muted)]"
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border)] flex justify-end gap-2">
            <button
              onClick={handleClearFilters}
              className="px-3.5 py-2 border border-[var(--border)] rounded-xl text-xs font-semibold hover:bg-[var(--secondary)] cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow"
            >
              Apply Filter Conditions
            </button>
          </div>
        </div>
      )}

      {/* LEADS DATATABLE PANEL */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
        {/* <div className="overflow-x-auto"> */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-[var(--foreground)] d-none d-md-block">
            <thead className="bg-[var(--secondary)] text-[var(--muted)] border-b border-[var(--border)] sticky top-0 z-1">
              <tr>
                <th
                  onClick={() => handleSort("fullName")}
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-[var(--foreground)] select-none"
                >
                  <div className="flex items-center gap-1">
                    Client Name <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3 font-semibold">Contact Numbers</th>
                <th
                  onClick={() => handleSort("purpose")}
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-[var(--foreground)] select-none"
                >
                  <div className="flex items-center gap-1">
                    Purpose <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("budget")}
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-[var(--foreground)] select-none"
                >
                  <div className="flex items-center gap-1">
                    Budget <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3 font-semibold">Preferred locations</th>
                <th
                  onClick={() => handleSort("leadSource")}
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-[var(--foreground)] select-none"
                >
                  <div className="flex items-center gap-1">
                    Source <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("leadStatus")}
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-[var(--foreground)] select-none"
                >
                  <div className="flex items-center gap-1">
                    Lead Status <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("leadScore")}
                  className="px-4 py-3 font-semibold cursor-pointer hover:text-[var(--foreground)] select-none text-center"
                >
                  <div className="flex items-center gap-1 justify-center">
                    Score <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                      <span className="text-[var(--muted)]">
                        Syncing leads database...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : currentTableData.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-16 text-center text-[var(--muted)]"
                  >
                    <FilterX className="h-8 w-8 text-[var(--muted)] mx-auto mb-2 opacity-50" />
                    No matching customer leads found. Try resetting filters.
                  </td>
                </tr>
              ) : (
                currentTableData.map((lead) => (
                  <tr
                    key={lead._id}
                    className="hover:bg-[var(--secondary)]/40 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-4 py-3.5 font-bold">{lead.fullName}</td>

                    {/* Contact details */}
                    <td className="px-4 py-3.5 space-y-1">
                      <div className="flex items-center gap-1 text-[var(--muted)]">
                        <Phone className="h-3 w-3 text-blue-500" />{" "}
                        {lead.mobileNumber}
                      </div>
                      <div className="flex items-center gap-1 text-[var(--muted)]">
                        <MessageSquare className="h-3 w-3 text-green-500" />{" "}
                        {lead.whatsAppNumber}
                      </div>
                    </td>

                    {/* Purpose */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          lead.purpose === "Residential"
                            ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        }`}
                      >
                        {lead.purpose}
                      </span>
                    </td>

                    {/* Budget */}
                    <td className="px-4 py-3.5 font-semibold">{lead.budget}</td>

                    {/* Preferred Locations */}
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <div className="flex gap-1 flex-wrap">
                        {lead.preferredLocations?.map((loc: string) => (
                          <span
                            key={loc}
                            className="text-[10px] bg-[var(--secondary)] px-1.5 py-0.5 rounded font-medium border border-[var(--border)]"
                          >
                            {loc}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Lead Source */}
                    <td className="px-4 py-3.5 text-[var(--muted)]">
                      {lead.leadSource}
                    </td>

                    {/* Lead Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          lead.leadStatus === "New"
                            ? "bg-blue-500/10 text-blue-500"
                            : lead.leadStatus === "Contacted"
                              ? "bg-sky-500/10 text-sky-500"
                              : lead.leadStatus === "Follow-up"
                                ? "bg-amber-500/10 text-amber-500"
                                : lead.leadStatus === "Interested"
                                  ? "bg-violet-500/10 text-violet-500"
                                  : lead.leadStatus === "Site Visit"
                                    ? "bg-orange-500/10 text-orange-500"
                                    : lead.leadStatus === "Negotiation"
                                      ? "bg-purple-500/10 text-purple-500"
                                      : lead.leadStatus === "Booked"
                                        ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30"
                                        : lead.leadStatus === "Sold"
                                          ? "bg-green-600 text-white"
                                          : "bg-red-500/10 text-red-500" // Lost
                        }`}
                      >
                        {lead.leadStatus}
                      </span>
                    </td>

                    {/* Lead Score */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20">
                        {lead.leadScore}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right space-x-1 shrink-0">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/leads/${lead._id}`)
                        }
                        className="p-1 rounded bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--secondary)] text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                        title="View Profile Detail"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(lead)}
                        className="p-1 rounded bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--secondary)] text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                        title="Edit Customer Info"
                      >
                        <Edit3 className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(lead._id)}
                        className="p-1 rounded bg-[var(--card)] border border-[var(--border)] hover:bg-red-500/10 text-red-500 cursor-pointer"
                        title="Delete Lead"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="block md:hidden space-y-3">
          {currentTableData.map((lead) => (
            <div
              key={lead._id}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:bg-[var(--secondary)]/40 transition-colors"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <h3 className="mb-3 font-bold text-[var(--foreground)]">
                  {lead.fullName}
                </h3>

                <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20">
                  {lead.leadScore}
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-1 text-xs mb-3">
                <div className="flex items-center gap-2 text-[var(--muted)]">
                  <span className="font-semibold text-[var(--foreground)]">Mob No:</span>
                  <Phone className="h-3 w-3 text-blue-500" />
                  {lead.mobileNumber}
                </div>

                <div className="flex items-center gap-2 text-[var(--muted)]">
                  <span className="font-semibold text-[var(--foreground)]">What's App No:</span>
                  <MessageSquare className="h-3 w-3 text-green-500" />
                  {lead.whatsAppNumber}
                </div>
              </div>

              {/* Purpose + Budget */}
              <div className="flex items-start gap-2 mb-3">

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    lead.purpose === "Residential"
                      ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  }`}
                >
                  {lead.purpose}
                </span>

                <span className="font-semibold text-xs">{lead.budget}</span>
              </div>

              {/* Locations */}
              <div className="flex flex-wrap gap-1 mb-3">
                {lead.preferredLocations?.map((loc: string) => (
                  <span
                    key={loc}
                    className="text-[10px] bg-[var(--secondary)] px-1.5 py-0.5 rounded font-medium border border-[var(--border)]"
                  >
                    {loc}
                  </span>
                ))}
              </div>

              {/* Status */}
              <div className="mb-3">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    lead.leadStatus === "New"
                      ? "bg-blue-500/10 text-blue-500"
                      : lead.leadStatus === "Contacted"
                        ? "bg-sky-500/10 text-sky-500"
                        : lead.leadStatus === "Follow-up"
                          ? "bg-amber-500/10 text-amber-500"
                          : lead.leadStatus === "Interested"
                            ? "bg-violet-500/10 text-violet-500"
                            : lead.leadStatus === "Site Visit"
                              ? "bg-orange-500/10 text-orange-500"
                              : lead.leadStatus === "Negotiation"
                                ? "bg-purple-500/10 text-purple-500"
                                : lead.leadStatus === "Booked"
                                  ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30"
                                  : lead.leadStatus === "Sold"
                                    ? "bg-green-600 text-white"
                                    : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {lead.leadStatus}
                </span>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center border-t border-[var(--border)] pt-3">
                <span className="text-xs text-[var(--muted)]">
                  {lead.leadSource}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/leads/${lead._id}`)}
                    className="p-1 rounded bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--secondary)] text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(lead)}
                    className="p-1 rounded bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--secondary)] text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(lead._id)}
                    className="p-1 rounded bg-[var(--card)] border border-[var(--border)] hover:bg-red-500/10 text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION PANEL FOOTER */}
        {!loading && leads.length > 0 && (
          <div className="p-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--card)]">
            <span className="text-xs text-[var(--muted)]">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, leads.length)} of {leads.length}{" "}
              customer records
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs hover:bg-[var(--secondary)] disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold cursor-pointer ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "border border-[var(--border)] hover:bg-[var(--secondary)] text-[var(--foreground)]"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs hover:bg-[var(--secondary)] disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. ADD / EDIT CUSTOMER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

          <div className="relative w-full max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
              <h3 className="text-md font-bold flex items-center gap-1.5">
                {editingLead
                  ? "Update Lead Profile"
                  : "Register New Customer Lead"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    Full Name
                  </label>
                  <input
                    {...register("fullName")}
                    type="text"
                    placeholder="Full Name"
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                  />
                  {errors.fullName && (
                    <p className="text-red-400 text-[10px] mt-0.5">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    Mobile Number
                  </label>
                  <input
                    {...register("mobileNumber")}
                    type="text"
                    placeholder="Mobile Number"
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                  />
                  {errors.mobileNumber && (
                    <p className="text-red-400 text-[10px] mt-0.5">
                      {errors.mobileNumber.message}
                    </p>
                  )}
                </div>

                {/* WhatsApp Number */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    WhatsApp Number
                  </label>
                  <input
                    {...register("whatsAppNumber")}
                    type="text"
                    placeholder="WhatsApp Number"
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                  />
                  {errors.whatsAppNumber && (
                    <p className="text-red-400 text-[10px] mt-0.5">
                      {errors.whatsAppNumber.message}
                    </p>
                  )}
                </div>

                {/* Purpose */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    Purpose
                  </label>
                  <select
                    {...register("purpose")}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  >
                    {PURPOSE_OPTIONS.map((purpose) => (
                      <option key={purpose} value={purpose}>
                        {purpose}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Budget */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    Budget Range
                  </label>
                  <select
                    {...register("budget")}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] cursor-pointer"
                  >
                    <option value="">Select a budget range</option>
                    {BUDGET_OPTIONS.map((budget) => (
                      <option key={budget} value={budget}>
                        {budget}
                      </option>
                    ))}
                  </select>
                  {errors.budget && (
                    <p className="text-red-400 text-[10px] mt-0.5">
                      {errors.budget.message}
                    </p>
                  )}
                </div>

                {/* Lead Source */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    Lead Source
                  </label>
                  <select
                    {...register("leadSource")}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Website">Website</option>
                    <option value="Reference">Reference</option>
                    <option value="Magicbricks">Magicbricks</option>
                    <option value="99acres">99acres</option>
                    <option value="Housing">Housing</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Cold Calling">Cold Calling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Lead Status */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    Lead Status
                  </label>
                  <select
                    {...register("leadStatus")}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Interested">Interested</option>
                    <option value="Site Visit">Site Visit</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Booked">Booked</option>
                    <option value="Sold">Sold</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                    Date of Birth
                  </label>
                  <input
                    {...register("dateOfBirth")}
                    type="date"
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                  />
                  {errors.dateOfBirth && (
                    <p className="text-red-400 text-[10px] mt-0.5">
                      {errors.dateOfBirth.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Custom Locations Multi Select */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                  Preferred Locations
                </label>
                <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl space-y-3">
                  {/* Default location chips */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-[var(--muted)] uppercase font-medium">
                      Default Locations
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {LOCATIONS_LIST.map((loc) => {
                        const active = selectedLocations?.includes(loc);
                        return (
                          <div
                            key={loc}
                            className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
                              active
                                ? "bg-blue-600/10 text-blue-500 border-blue-500"
                                : "bg-[var(--card)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--foreground)]"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleFormLocation(loc)}
                              className="flex-1 text-left cursor-pointer"
                            >
                              {loc}
                            </button>
                            {active && (
                              <button
                                type="button"
                                onClick={() => removeLocation(loc)}
                                className="p-0 hover:text-red-500 transition-colors ml-1"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom locations section */}
                  <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                    <p className="text-[10px] text-[var(--muted)] uppercase font-medium">
                      Custom Locations
                    </p>

                    {/* Selected custom locations as chips */}
                    {selectedLocations &&
                      selectedLocations.filter(
                        (loc) => !DEFAULT_LOCATIONS.includes(loc as any),
                      ).length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {selectedLocations
                            .filter(
                              (loc) => !DEFAULT_LOCATIONS.includes(loc as any),
                            )
                            .map((loc) => (
                              <div
                                key={loc}
                                className="px-3 py-1.5 bg-green-600/10 text-green-500 border border-green-500/30 rounded-lg text-xs font-medium flex items-center gap-2"
                              >
                                {loc}
                                <button
                                  type="button"
                                  onClick={() => removeLocation(loc)}
                                  className="p-0 hover:text-red-400 transition-colors ml-1"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                        </div>
                      )}

                    {/* Input for adding custom locations */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={customLocationInput}
                        onChange={(e) => setCustomLocationInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomLocation();
                          }
                        }}
                        placeholder="Enter custom location (e.g., New Area)"
                        className="flex-1 p-2 border rounded-lg text-xs bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                      />
                      <button
                        type="button"
                        onClick={addCustomLocation}
                        className="px-4 py-2 bg-blue-600/10 text-blue-500 border border-blue-500/30 rounded-lg text-xs font-semibold cursor-pointer hover:bg-blue-600/20 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {errors.preferredLocations && (
                    <p className="text-red-400 text-[10px] mt-0.5">
                      {errors.preferredLocations.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Requirement */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                  Customer Requirement Details
                </label>
                <textarea
                  {...register("requirement")}
                  rows={2}
                  placeholder="Need a corner plot with 30 feet road, JDA approved..."
                  className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase">
                  Internal Notes
                </label>
                <textarea
                  {...register("notes")}
                  rows={2}
                  placeholder="Shared brochure, requested price negotiation after site visit..."
                  className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-[var(--border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-xl text-xs font-semibold hover:bg-[var(--secondary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Lead Profile"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="text-sm font-bold">Confirm Delete Lead</h4>
            <p className="text-xs text-[var(--muted)]">
              Are you sure you want to delete this lead? This action is
              permanent and will delete all associated follow-ups and activity
              timeline logs.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 border border-[var(--border)] rounded-lg text-xs font-semibold hover:bg-[var(--secondary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="min-h-64" />}>
      <LeadsPageContent />
    </Suspense>
  );
}
