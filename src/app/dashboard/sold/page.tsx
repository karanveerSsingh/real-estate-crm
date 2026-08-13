'use client';

import React, { useEffect, useState } from 'react';
import { 
  HandCoins, 
  Search, 
  Loader2, 
  Sparkles, 
  Trash2, 
  FileEdit, 
  TrendingUp, 
  CircleDollarSign, 
  FileCheck2, 
  Calendar,
  X,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { formatINR } from '@/lib/crmOptions';

export default function SoldCustomersPage() {
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  // Edit Dialog States
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editProject, setEditProject] = useState('');
  const [editYards, setEditYards] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editBookingAmt, setEditBookingAmt] = useState('');
  const [editDownPmt, setEditDownPmt] = useState('');
  const [editLoanAmt, setEditLoanAmt] = useState('');
  const [editRegistryStatus, setEditRegistryStatus] = useState('Pending');
  const [editFileStatus, setEditFileStatus] = useState('Pending');
  const [editAgreementStatus, setEditAgreementStatus] = useState('Pending');
  const [editPaymentStatus, setEditPaymentStatus] = useState('Partial');
  const [editSalesExecutive, setEditSalesExecutive] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editRegistryDate, setEditRegistryDate] = useState('');
  const [updating, setUpdating] = useState(false);

  const editAmountValue = (value: string) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
  };

  useEffect(() => {
    fetchSoldRecords();
  }, []);

  const fetchSoldRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sold?search=${encodeURIComponent(searchVal)}`);
      if (res.ok) {
        setRecords(await res.json());
      } else {
        toast.error('Failed to load transaction records');
      }
    } catch (err) {
      toast.error('Error fetching sold records');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchSoldRecords();
    }
  };

  // Instant update dropdown status
  const handleInstantStatusUpdate = async (id: string, field: string, value: string) => {
    try {
      const res = await fetch(`/api/sold/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });

      if (res.ok) {
        toast.success(`Updated ${field.replace(/([A-Z])/g, ' $1')} successfully`);
        // Reload locally
        setRecords(prev => prev.map(r => r._id === id ? { ...r, [field]: value } : r));
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      toast.error('Error updating status');
    }
  };

  // Trigger editing modal
  const handleOpenEditModal = (rec: any) => {
    setEditingRecord(rec);
    setEditProject(rec.projectName);
    setEditYards(rec.squareYard?.toString() ?? '');
    setEditRate(rec.ratePerSquareYard?.toString() ?? '');
    setEditBookingAmt(rec.bookingAmount?.toString() ?? '');
    setEditDownPmt(rec.downPayment?.toString() ?? '');
    setEditLoanAmt(rec.loanAmount?.toString() ?? '');
    setEditRegistryStatus(rec.registryStatus);
    setEditFileStatus(rec.fileProcessingStatus);
    setEditAgreementStatus(rec.agreementStatus);
    setEditPaymentStatus(rec.paymentStatus);
    setEditSalesExecutive(rec.salesExecutive);
    setEditRemarks(rec.remarks || '');
    setEditRegistryDate(rec.registryDate ? new Date(rec.registryDate).toISOString().split('T')[0] : '');
  };

  // Submit edits
  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    try {
      setUpdating(true);
      const editYardsValue = editAmountValue(editYards);
      const editRateValue = editAmountValue(editRate);
      const editBookingAmtValue = editAmountValue(editBookingAmt);
      const editDownPmtValue = editAmountValue(editDownPmt);
      const editLoanAmtValue = editAmountValue(editLoanAmt);
      const totalAmount = editYardsValue * editRateValue;
      const remainingAmount = Math.max(0, totalAmount - editBookingAmtValue - editDownPmtValue - editLoanAmtValue);

      const payload = {
        projectName: editProject.trim(),
        squareYard: editYardsValue,
        ratePerSquareYard: editRateValue,
        totalAmount,
        bookingAmount: editBookingAmtValue,
        downPayment: editDownPmtValue,
        loanAmount: editLoanAmtValue,
        remainingAmount,
        registryStatus: editRegistryStatus,
        fileProcessingStatus: editFileStatus,
        agreementStatus: editAgreementStatus,
        paymentStatus: editPaymentStatus,
        salesExecutive: editSalesExecutive.trim(),
        remarks: editRemarks.trim(),
        registryDate: editRegistryDate ? new Date(editRegistryDate) : undefined
      };

      const res = await fetch(`/api/sold/${editingRecord._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('Sale transaction updated');
        setEditingRecord(null);
        fetchSoldRecords();
      } else {
        toast.error('Failed to update sale transaction');
      }
    } catch (err) {
      toast.error('Error saving transaction details');
    } finally {
      setUpdating(false);
    }
  };

  const calculateSum = (field: string) => {
    return records.reduce((acc, curr) => acc + (curr[field] || 0), 0);
  };

  return (
    <div className="space-y-6">
      
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Sold Customer ledger <HandCoins className="h-4.5 w-4.5 text-emerald-500 animate-pulse" />
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Overview of closed transactions, paperwork stages, loan approvals, and gross margins.
          </p>
        </div>
      </div>

      {/* QUICK FINANCIALS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gradient-to-r from-emerald-600/10 to-blue-600/5 p-4 rounded-xl border border-emerald-500/10">
        <div className="space-y-1 text-xs">
          <span className="text-[var(--muted)] block">Total Sales Count</span>
          <span className="text-lg font-bold flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-emerald-500" /> {records.length} closed deals
          </span>
        </div>
        <div className="space-y-1 text-xs">
          <span className="text-[var(--muted)] block">Gross Closed Value</span>
          <span className="text-lg font-bold text-emerald-500">
            {formatINR(calculateSum('totalAmount'))}
          </span>
        </div>
        <div className="space-y-1 text-xs">
          <span className="text-[var(--muted)] block">Collected (Booking + DP)</span>
          <span className="text-lg font-bold text-blue-500">
            {formatINR(calculateSum('bookingAmount') + calculateSum('downPayment'))}
          </span>
        </div>
        <div className="space-y-1 text-xs">
          <span className="text-[var(--muted)] block">Outstanding Receivable</span>
          <span className="text-lg font-bold text-red-500">
            {formatINR(calculateSum('remainingAmount'))}
          </span>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search by customer name, project or executive..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-10 pr-4 py-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] transition-all"
          />
        </div>
        <button 
          onClick={fetchSoldRecords}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/15 border border-emerald-500/20 cursor-pointer"
        >
          Search
        </button>
      </div>

      {/* DATAGRID / TABLE SHEET */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-[var(--foreground)]">
            <thead className="bg-[var(--secondary)] text-[var(--muted)] border-b border-[var(--border)] sticky top-0 z-1">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer Name</th>
                <th className="px-4 py-3 font-semibold">Deal Description</th>
                <th className="px-4 py-3 font-semibold">Financial Summary</th>
                <th className="px-4 py-3 font-semibold">Agreement Status</th>
                <th className="px-4 py-3 font-semibold">File Stage</th>
                <th className="px-4 py-3 font-semibold">Registry Status</th>
                <th className="px-4 py-3 font-semibold">Payment Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                      <span className="text-[var(--muted)]">Opening sales accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-[var(--muted)]">
                    No closed sale transactions recorded.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec._id} className="hover:bg-[var(--secondary)]/40 transition-colors">
                    
                    {/* Customer Info */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold">{rec.customerName}</div>
                      <div className="text-[10px] text-[var(--muted)] mt-0.5">{rec.mobile}</div>
                    </td>

                    {/* Deal Description */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold">{rec.projectName}</div>
                      <div className="text-[10px] text-[var(--muted)]">{rec.location} | {rec.squareYard} sqyd</div>
                    </td>

                    {/* Financial Summary */}
                    <td className="px-4 py-3.5 space-y-0.5">
                      <div>Deal: <span className="font-semibold">{formatINR(rec.totalAmount)}</span></div>
                      <div className="text-[10px] text-[var(--muted)]">
                        DP: {formatINR(rec.downPayment)} | Bal: <span className="text-red-400 font-medium">{formatINR(rec.remainingAmount)}</span>
                      </div>
                    </td>

                    {/* Agreement Status (Selectable) */}
                    <td className="px-4 py-3.5">
                      <select
                        value={rec.agreementStatus}
                        onChange={(e) => handleInstantStatusUpdate(rec._id, 'agreementStatus', e.target.value)}
                        className={`p-1 rounded text-[10px] font-semibold border bg-[var(--card)] focus:outline-none cursor-pointer ${
                          rec.agreementStatus === 'Signed' ? 'text-green-500 border-green-500/30' : 'text-amber-500 border-amber-500/30'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Signed">Signed</option>
                      </select>
                    </td>

                    {/* File Processing Stage (Selectable) */}
                    <td className="px-4 py-3.5">
                      <select
                        value={rec.fileProcessingStatus}
                        onChange={(e) => handleInstantStatusUpdate(rec._id, 'fileProcessingStatus', e.target.value)}
                        className={`p-1 rounded text-[10px] font-semibold border bg-[var(--card)] focus:outline-none cursor-pointer ${
                          rec.fileProcessingStatus === 'Approved' ? 'text-green-500 border-green-500/30' :
                          rec.fileProcessingStatus === 'Submitted' ? 'text-sky-500 border-sky-500/30' : 'text-amber-500 border-amber-500/30'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Approved">Approved</option>
                      </select>
                    </td>

                    {/* Registry Status (Selectable) */}
                    <td className="px-4 py-3.5">
                      <select
                        value={rec.registryStatus}
                        onChange={(e) => handleInstantStatusUpdate(rec._id, 'registryStatus', e.target.value)}
                        className={`p-1 rounded text-[10px] font-semibold border bg-[var(--card)] focus:outline-none cursor-pointer ${
                          rec.registryStatus === 'Done' ? 'text-green-500 border-green-500/30' : 'text-rose-500 border-rose-500/30'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                    </td>

                    {/* Payment Status (Selectable) */}
                    <td className="px-4 py-3.5">
                      <select
                        value={rec.paymentStatus}
                        onChange={(e) => handleInstantStatusUpdate(rec._id, 'paymentStatus', e.target.value)}
                        className={`p-1 rounded text-[10px] font-semibold border bg-[var(--card)] focus:outline-none cursor-pointer ${
                          rec.paymentStatus === 'Full' ? 'text-green-500 border-green-500/30' :
                          rec.paymentStatus === 'Overdue' ? 'text-red-500 border-red-500/30' : 'text-amber-500 border-amber-500/30'
                        }`}
                      >
                        <option value="Partial">Partial</option>
                        <option value="Full">Full</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </td>

                    {/* Action buttons */}
                    <td className="px-4 py-3.5 text-right space-x-1 shrink-0">
                      <button
                        onClick={() => router.push(`/dashboard/leads/${rec.customerId}`)}
                        className="p-1 rounded bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--secondary)] text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                        title="Open Customer Profile Vault"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(rec)}
                        className="p-1 rounded bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--secondary)] text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                        title="Edit Full Financials"
                      >
                        <FileEdit className="h-4.5 w-4.5" />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL FINANCIALS AND CONTRACTS EDITING MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingRecord(null)} />
          
          <div className="relative w-full max-w-xl bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
              <h3 className="text-md font-bold flex items-center gap-1.5 text-emerald-500">
                <FileCheck2 className="h-5 w-5" /> Edit Purchase Contract details
              </h3>
              <button 
                onClick={() => setEditingRecord(null)}
                className="p-1 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateRecord} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Project Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Project Name</label>
                  <input
                    type="text"
                    value={editProject}
                    onChange={(e) => setEditProject(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>

                {/* Square Yards */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Square Yards</label>
                  <input
                    type="number"
                    value={editYards}
                    onChange={(e) => setEditYards(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>

                {/* Rate */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Rate Per Square Yard (₹)</label>
                  <input
                    type="number"
                    value={editRate}
                    onChange={(e) => setEditRate(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>

                {/* Booking Amount */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Booking Amount Paid (₹)</label>
                  <input
                    type="number"
                    value={editBookingAmt}
                    onChange={(e) => setEditBookingAmt(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>

                {/* Down Payment */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Down Payment Paid (₹)</label>
                  <input
                    type="number"
                    value={editDownPmt}
                    onChange={(e) => setEditDownPmt(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>

                {/* Loan Amount */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Bank Loan Amount (₹)</label>
                  <input
                    type="number"
                    value={editLoanAmt}
                    onChange={(e) => setEditLoanAmt(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>

                {/* Sales Executive */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Sales Executive</label>
                  <input
                    type="text"
                    value={editSalesExecutive}
                    onChange={(e) => setEditSalesExecutive(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>

                {/* Registry Target Date */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Registry Target Date</label>
                  <input
                    type="date"
                    value={editRegistryDate}
                    onChange={(e) => setEditRegistryDate(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>

              </div>

              {/* Status selectors */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Agreement Status</label>
                  <select
                    value={editAgreementStatus}
                    onChange={(e) => setEditAgreementStatus(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Signed">Signed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">File Processing</label>
                  <select
                    value={editFileStatus}
                    onChange={(e) => setEditFileStatus(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Registry Status</label>
                  <select
                    value={editRegistryStatus}
                    onChange={(e) => setEditRegistryStatus(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Payment Status</label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  >
                    <option value="Partial">Partial</option>
                    <option value="Full">Full</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

              </div>

              {/* Financial Summary Calculation */}
              <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl space-y-1 text-xs">
                <div className="flex justify-between font-bold">
                  <span>Gross Deal Amount:</span>
                  <span>{formatINR(editAmountValue(editYards) * editAmountValue(editRate))}</span>
                </div>
                <div className="flex justify-between text-red-500 font-bold border-t pt-1">
                  <span>Remaining Balance:</span>
                  <span>{formatINR(Math.max(0, (editAmountValue(editYards) * editAmountValue(editRate)) - editAmountValue(editBookingAmt) - editAmountValue(editDownPmt) - editAmountValue(editLoanAmt)))}</span>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase">Remarks</label>
                <textarea
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  rows={2}
                  className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-[var(--border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 border border-[var(--border)] rounded-xl text-xs font-semibold hover:bg-[var(--secondary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow"
                >
                  {updating ? 'Saving...' : 'Save Financial updates'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
