'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Phone, 
  MessageSquare, 
  Clock, 
  CalendarDays, 
  FolderUp, 
  Building, 
  ChevronRight, 
  Check, 
  Plus, 
  Loader2, 
  Sparkles,
  ArrowLeft,
  DollarSign,
  AlertTriangle,
  BookmarkCheck,
  FileBadge,
  MapPin,
  Compass,
  FileText,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PAYMENT_MODE_OPTIONS, PROPERTY_CATEGORY_OPTIONS, formatINR } from '@/lib/crmOptions';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [visitProperties, setVisitProperties] = useState<any[]>([]);
  const [selectedVisitPropertyId, setSelectedVisitPropertyId] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [visitSubmitting, setVisitSubmitting] = useState(false);
  const [matchedProperties, setMatchedProperties] = useState<any[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchSort, setMatchSort] = useState('match');
  const [matchLocation, setMatchLocation] = useState('');
  const [matchTolerance, setMatchTolerance] = useState<'tolerant' | 'strict'>('tolerant');
  const [matchPropertyType, setMatchPropertyType] = useState('');
  const [soldRecord, setSoldRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal / Logger states
  const [logType, setLogType] = useState('Called');
  const [logDesc, setLogDesc] = useState('');
  const [logSubmit, setLogSubmit] = useState(false);

  // New Follow-up states
  const [fTitle, setFTitle] = useState('');
  const [fDate, setFDate] = useState('');
  const [fTime, setFTime] = useState('');
  const [fRemark, setFRemark] = useState('');
  const [fPriority, setFPriority] = useState('Medium');
  const [fType, setFType] = useState<'Follow-up' | 'Property Visit'>('Follow-up');
  const [fPropertyId, setFPropertyId] = useState('');
  const [fSubmit, setFSubmit] = useState(false);

  // Transition to Sold states
  const [soldModalOpen, setSoldModalOpen] = useState(false);
  const [soldProject, setSoldProject] = useState('');
  const [soldSociety, setSoldSociety] = useState('');
  const [soldLoc, setSoldLoc] = useState('');
  const [soldRoad, setSoldRoad] = useState('');
  const [soldYards, setSoldYards] = useState('');
  const [soldRate, setSoldRate] = useState('');
  const [soldDlcRate, setSoldDlcRate] = useState('');
  const [soldBookingAmt, setSoldBookingAmt] = useState('');
  const [soldDownPmt, setSoldDownPmt] = useState('');
  const [soldPaymentMode, setSoldPaymentMode] = useState('Cash');
  const [soldRegistryAmt, setSoldRegistryAmt] = useState('');
  const [soldLoanAmt, setSoldLoanAmt] = useState('');
  const [soldChequeAmt, setSoldChequeAmt] = useState('');
  const [soldRtgsAmt, setSoldRtgsAmt] = useState('');
  const [soldOnlineAmt, setSoldOnlineAmt] = useState('');
  const [soldOtherWhiteAmt, setSoldOtherWhiteAmt] = useState('');
  const [soldCashAmt, setSoldCashAmt] = useState('');
  const [soldCashDate, setSoldCashDate] = useState('');
  const [soldCashRemarks, setSoldCashRemarks] = useState('');
  const [soldRegistryStatus, setSoldRegistryStatus] = useState('Pending');
  const [soldRegistryDate, setSoldRegistryDate] = useState('');
  const [soldRegistryNumber, setSoldRegistryNumber] = useState('');
  const [soldRegistryPdfUrl, setSoldRegistryPdfUrl] = useState('');
  const [soldFileStatus, setSoldFileStatus] = useState('Pending');
  const [soldLoanBankName, setSoldLoanBankName] = useState('');
  const [soldLoanExecutive, setSoldLoanExecutive] = useState('');
  const [soldProcessingFee, setSoldProcessingFee] = useState('');
  const [soldFileRemarks, setSoldFileRemarks] = useState('');
  const [soldExecutive, setSoldExecutive] = useState('Admin');
  const [soldRemarks, setSoldRemarks] = useState('');

  // Upload States
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState('Aadhaar');
  const [uploading, setUploading] = useState(false);

  const amountValue = (value: string) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
  };

  const resetSaleAmounts = () => {
    setSoldYards('');
    setSoldRate('');
    setSoldDlcRate('');
    setSoldBookingAmt('');
    setSoldDownPmt('');
    setSoldRegistryAmt('');
    setSoldLoanAmt('');
    setSoldChequeAmt('');
    setSoldRtgsAmt('');
    setSoldOnlineAmt('');
    setSoldOtherWhiteAmt('');
    setSoldCashAmt('');
    setSoldProcessingFee('');
  };

  // Empty inputs are treated as zero only for calculations; their displayed value remains empty.
  const soldYardsValue = amountValue(soldYards);
  const soldRateValue = amountValue(soldRate);
  const soldDlcRateValue = amountValue(soldDlcRate);
  const soldBookingAmtValue = amountValue(soldBookingAmt);
  const soldDownPmtValue = amountValue(soldDownPmt);
  const soldRegistryAmtValue = amountValue(soldRegistryAmt);
  const soldLoanAmtValue = amountValue(soldLoanAmt);
  const soldChequeAmtValue = amountValue(soldChequeAmt);
  const soldRtgsAmtValue = amountValue(soldRtgsAmt);
  const soldOnlineAmtValue = amountValue(soldOnlineAmt);
  const soldOtherWhiteAmtValue = amountValue(soldOtherWhiteAmt);
  const soldCashAmtValue = amountValue(soldCashAmt);
  const soldProcessingFeeValue = amountValue(soldProcessingFee);

  // Derived financial calculation
  const calculatedTotal = soldYardsValue * soldRateValue;
  const calculatedDlcAmount = soldYardsValue * soldDlcRateValue;
  const calculatedWhiteMoney = soldRegistryAmtValue + soldLoanAmtValue + soldChequeAmtValue + soldRtgsAmtValue + soldOnlineAmtValue + soldOtherWhiteAmtValue;
  const calculatedCashMoney = soldCashAmtValue;
  const calculatedReceived = soldBookingAmtValue + soldDownPmtValue + calculatedWhiteMoney + calculatedCashMoney;
  const calculatedRemaining = Math.max(0, calculatedTotal - calculatedReceived);
  const calculatedDlcDifference = calculatedTotal - calculatedDlcAmount;
  const calculatedPending = calculatedRemaining;
  const whiteCashVariance = calculatedTotal - (calculatedWhiteMoney + calculatedCashMoney);
  const hasDealMismatch = Math.abs(whiteCashVariance) > 0;
  const hasOverReceived = calculatedReceived > calculatedTotal;

  useEffect(() => {
    fetchProfileDetails();
  }, [id]);

  useEffect(() => {
    fetchMatchingProperties();
  }, [id, matchSort, matchLocation, matchTolerance, matchPropertyType]);

  async function fetchProfileDetails() {
    try {
      setLoading(true);
      // Fetch customer detail
      const resCust = await fetch(`/api/customers/${id}`);
      if (!resCust.ok) {
        toast.error('Customer profile not found');
        router.push('/dashboard/leads');
        return;
      }
      const dataCust = await resCust.json();
      setCustomer(dataCust);
      void fetchMatchingProperties();

      // Fetch timeline logs
      const resTime = await fetch(`/api/customers/${id}/timeline`);
      if (resTime.ok) setTimeline(await resTime.json());

      // Fetch followups
      const resFollow = await fetch(`/api/customers/${id}/followups`);
      if (resFollow.ok) setFollowups(await resFollow.json());

      const [resVisits, resProperties] = await Promise.all([
        fetch(`/api/customers/${id}/visits`),
        fetch(`/api/properties?status=Available&customerId=${id}`)
      ]);
      if (resVisits.ok) setVisits(await resVisits.json());
      if (resProperties.ok) {
        setVisitProperties(await resProperties.json());
      } else {
        // Ranking is an enhancement; keep the visit scheduler usable if it is unavailable.
        const fallbackProperties = await fetch('/api/properties?status=Available');
        if (fallbackProperties.ok) setVisitProperties(await fallbackProperties.json());
      }

      // Fetch sold record if customer is sold
      if (dataCust.leadStatus === 'Sold') {
        const resSold = await fetch(`/api/sold`);
        if (resSold.ok) {
          const soldList = await resSold.json();
          const match = soldList.find((s: any) => s.customerId === id);
          if (match) setSoldRecord(match);
        }
      }
    } catch (err) {
      toast.error('Error loading profile resources');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMatchingProperties() {
    try {
      setMatchingLoading(true);
      const query = new URLSearchParams({ sort: matchSort, tolerance: matchTolerance });
      if (matchLocation) query.set('location', matchLocation);
      if (matchPropertyType) query.set('propertyType', matchPropertyType);
      const response = await fetch(`/api/matches/customer/${id}?${query}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to match properties');
      setMatchedProperties(data.matches || []);
    } catch (err) {
      setMatchedProperties([]);
      toast.error(err instanceof Error ? err.message : 'Unable to match properties');
    } finally {
      setMatchingLoading(false);
    }
  }

  // Log activity submit
  const handleAddTimelineLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logDesc.trim()) return;

    try {
      setLogSubmit(true);
      const res = await fetch(`/api/customers/${id}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: logType, description: logDesc.trim() })
      });

      if (res.ok) {
        toast.success('Activity logged on timeline');
        setLogDesc('');
        // Reload timeline
        const resTime = await fetch(`/api/customers/${id}/timeline`);
        if (resTime.ok) setTimeline(await resTime.json());
      } else {
        toast.error('Failed to register activity');
      }
    } catch (err) {
      toast.error('Error logging timeline');
    } finally {
      setLogSubmit(false);
    }
  };

  // Add followup reminder submit
  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!fTitle.trim() && fType !== 'Property Visit') || !fDate || !fTime || (fType === 'Property Visit' && !fPropertyId)) {
      toast.error(fType === 'Property Visit' ? 'Please select a property, date and time' : 'Please input Title, Date and Time');
      return;
    }

    try {
      setFSubmit(true);
      const res = await fetch(`/api/customers/${id}/followups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fTitle.trim() || 'Property Visit',
          date: fDate,
          time: fTime,
          remark: fRemark.trim(),
          priority: fPriority,
          type: fType,
          status: fType === 'Property Visit' ? 'Planned' : 'Pending',
          ...(fType === 'Property Visit' ? (() => {
            const property = visitProperties.find((item) => item._id === fPropertyId);
            return property ? { propertyId: property._id, propertyName: property.propertyName, projectName: property.projectName || '', location: property.location || '' } : {};
          })() : {})
        })
      });

      if (res.ok) {
        toast.success('New follow-up scheduled');
        setFTitle('');
        setFDate('');
        setFTime('');
        setFRemark('');
        setFPropertyId('');
        // Reload follow-ups and timeline
        const resFollow = await fetch(`/api/customers/${id}/followups`);
        if (resFollow.ok) setFollowups(await resFollow.json());
        
        const resTime = await fetch(`/api/customers/${id}/timeline`);
        if (resTime.ok) setTimeline(await resTime.json());
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || 'Failed to create reminder');
      }
    } catch (err) {
      toast.error('Error scheduling follow-up');
    } finally {
      setFSubmit(false);
    }
  };

  // Mark Follow-up complete
  const handleCompleteFollowup = async (fId: string) => {
    try {
      const res = await fetch(`/api/customers/${id}/followups`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followUpId: fId,
          status: 'Completed'
        })
      });

      if (res.ok) {
        toast.success('Task marked completed');
        // Reload followups and timeline
        const resFollow = await fetch(`/api/customers/${id}/followups`);
        if (resFollow.ok) setFollowups(await resFollow.json());
        
        const resTime = await fetch(`/api/customers/${id}/timeline`);
        if (resTime.ok) setTimeline(await resTime.json());
      } else {
        toast.error('Failed to complete task');
      }
    } catch (err) {
      toast.error('Error completing follow-up');
    }
  };

  const handleFollowupStatusChange = async (fId: string, status: 'Planned' | 'Pending' | 'Completed') => {
    try {
      const res = await fetch(`/api/customers/${id}/followups`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpId: fId, status })
      });
      if (!res.ok) throw new Error('Unable to update visit status');
      toast.success(`Visit marked ${status.toLowerCase()}`);
      const [followResponse, visitResponse, timelineResponse] = await Promise.all([
        fetch(`/api/customers/${id}/followups`), fetch(`/api/customers/${id}/visits`), fetch(`/api/customers/${id}/timeline`)
      ]);
      if (followResponse.ok) setFollowups(await followResponse.json());
      if (visitResponse.ok) setVisits(await visitResponse.json());
      if (timelineResponse.ok) setTimeline(await timelineResponse.json());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update visit status');
    }
  };

  const handleAddVisit = async (event: React.FormEvent) => {
    event.preventDefault();
    const property = visitProperties.find((item) => item._id === selectedVisitPropertyId);
    if (!property || !visitDate || !visitTime) {
      toast.error('Select a property and enter the visit date and time');
      return;
    }

    try {
      setVisitSubmitting(true);
      const res = await fetch(`/api/customers/${id}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property._id,
          propertyName: property.propertyName,
          projectName: property.projectName || '',
          location: property.location || '',
          visitedAt: new Date(`${visitDate}T${visitTime}`).toISOString(),
          notes: visitNotes.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to save visit');

      setVisits((current) => [data, ...current].sort((a, b) => +new Date(b.visitedAt) - +new Date(a.visitedAt)));
      setSelectedVisitPropertyId('');
      setVisitDate('');
      setVisitTime('');
      setVisitNotes('');
      toast.success('Property visit marked as visited');

      const resTime = await fetch(`/api/customers/${id}/timeline`);
      if (resTime.ok) setTimeline(await resTime.json());
      setCustomer((current: any) => current && !['Sold', 'Lost'].includes(current.leadStatus)
        ? { ...current, leadStatus: 'Site Visit' }
        : current);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save visit');
    } finally {
      setVisitSubmitting(false);
    }
  };

  // Update notes/requirements directly
  const handleDirectDetailsUpdate = async (field: 'notes' | 'requirement', value: string) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });

      if (res.ok) {
        toast.success(`Customer ${field} updated`);
        // Reload profile details
        fetchProfileDetails();
      } else {
        toast.error('Failed to update details');
      }
    } catch (err) {
      toast.error('Error updating details');
    }
  };

  // Sell Property details submit
  const handleRegisterSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!soldProject.trim() || !soldLoc.trim() || calculatedTotal <= 0) {
      toast.error('Project details and financial metrics are required');
      return;
    }

    try {
      const paymentHistory = [
        soldBookingAmtValue > 0 && {
          amount: soldBookingAmtValue,
          date: new Date(),
          mode: soldPaymentMode,
          remarks: 'Booking amount recorded during sale closing',
          receiptUrl: ''
        },
        soldDownPmtValue > 0 && {
          amount: soldDownPmtValue,
          date: new Date(),
          mode: soldPaymentMode,
          remarks: 'Down payment recorded during sale closing',
          receiptUrl: ''
        },
        calculatedWhiteMoney > 0 && {
          amount: calculatedWhiteMoney,
          date: new Date(),
          mode: 'Bank Transfer',
          remarks: 'A Part (White Money) total recorded during sale closing',
          receiptUrl: ''
        },
        calculatedCashMoney > 0 && {
          amount: calculatedCashMoney,
          date: soldCashDate ? new Date(soldCashDate) : new Date(),
          mode: 'Cash',
          remarks: soldCashRemarks || 'B Part (Cash) recorded during sale closing',
          receiptUrl: ''
        }
      ].filter(Boolean);

      const res = await fetch('/api/sold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: id,
          projectName: soldProject.trim(),
          societyName: soldSociety.trim(),
          location: soldLoc.trim(),
          road: soldRoad,
          squareYard: soldYardsValue,
          ratePerSquareYard: soldRateValue,
          dlcRatePerSquareYard: soldDlcRateValue,
          totalAmount: calculatedTotal,
          bookingAmount: soldBookingAmtValue,
          downPayment: soldDownPmtValue,
          paymentMode: soldPaymentMode,
          registryAmount: soldRegistryAmtValue,
          loanAmount: soldLoanAmtValue,
          chequeAmount: soldChequeAmtValue,
          rtgsAmount: soldRtgsAmtValue,
          onlineAmount: soldOnlineAmtValue,
          otherWhitePayment: soldOtherWhiteAmtValue,
          cashAmount: soldCashAmtValue,
          cashReceivedDate: soldCashDate,
          cashRemarks: soldCashRemarks.trim(),
          remainingAmount: calculatedRemaining,
          registryStatus: soldRegistryStatus,
          registryDate: soldRegistryDate ? new Date(soldRegistryDate) : undefined,
          registryNumber: soldRegistryNumber.trim(),
          registryPdfUrl: soldRegistryPdfUrl.trim(),
          fileProcessingStatus: soldFileStatus,
          loanBankName: soldLoanBankName.trim(),
          loanExecutive: soldLoanExecutive.trim(),
          processingFee: soldProcessingFeeValue,
          fileRemarks: soldFileRemarks.trim(),
          agreementStatus: 'Pending',
          paymentStatus: calculatedRemaining === 0 ? 'Full' : 'Partial',
          paymentHistory,
          bookingDate: new Date(),
          salesExecutive: soldExecutive,
          remarks: soldRemarks.trim()
        })
      });

      if (res.ok) {
        toast.success('Sale registered successfully! Customer moved to Sold Module.');
        setSoldModalOpen(false);
        fetchProfileDetails();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to register property sale');
      }
    } catch (err) {
      toast.error('Error processing deal closing');
    }
  };

  // Document Upload
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('fileType', uploadType);

      const res = await fetch(`/api/customers/${id}/documents`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        toast.success('Document uploaded to vault');
        setUploadFile(null);
        // Reload details & timeline
        fetchProfileDetails();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to upload document');
      }
    } catch (err) {
      toast.error('Error during file transfer');
    } finally {
      setUploading(false);
    }
  };

  // WhatsApp Pre-filled message URL generator
  const getWhatsAppLink = () => {
    if (!customer) return '';
    const phone = customer.whatsAppNumber;
    const msg = `Hello ${customer.fullName},\n\nHope you are doing well. This is Apex Real Estate Solutions. Regarding your requirement for a ${customer.purpose} property in ${customer.preferredLocations?.join('/')} with a budget of ${customer.budget}, we have found some excellent JDA-approved plot options that perfectly match your specifications.\n\nLet me know when we can arrange a site visit. Thank you!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  if (loading || !customer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
        <span className="text-sm text-[var(--muted)]">Syncing customer profile assets...</span>
      </div>
    );
  }

  const matchingLocations = Array.from(new Set([
    ...(customer.preferredLocations || []),
    ...matchedProperties.flatMap((property) => [property.location, property.road]).filter(Boolean),
  ]));

  return (
    <div className="space-y-6">
      
      {/* Back Button */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => router.push('/dashboard/leads')}
          className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] cursor-pointer text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-xs text-[var(--muted)]">Back to Leads Directory</span>
      </div>

      {/* HEADER INFO & ACTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20 flex items-center justify-center text-lg select-none">
            {customer.fullName.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              {customer.fullName}
              <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                customer.leadStatus === 'New' ? 'bg-blue-500/10 text-blue-500' :
                customer.leadStatus === 'Contacted' ? 'bg-sky-500/10 text-sky-500' :
                customer.leadStatus === 'Follow-up' ? 'bg-amber-500/10 text-amber-500' :
                customer.leadStatus === 'Interested' ? 'bg-violet-500/10 text-violet-500' :
                customer.leadStatus === 'Site Visit' ? 'bg-orange-500/10 text-orange-500' :
                customer.leadStatus === 'Negotiation' ? 'bg-purple-500/10 text-purple-500' :
                customer.leadStatus === 'Booked' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' :
                customer.leadStatus === 'Sold' ? 'bg-green-600 text-white' :
                'bg-red-500/10 text-red-500'
              }`}>
                {customer.leadStatus}
              </span>
            </h2>
            <p className="text-[11px] text-[var(--muted)] mt-0.5">
              Lead Score: <span className="font-bold text-blue-500">{customer.leadScore}</span> | Captured via {customer.leadSource}
            </p>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2">
          {/* Mobile Call */}
          <a
            href={`tel:${customer.mobileNumber}`}
            className="px-3.5 py-2 border border-[var(--border)] rounded-xl text-xs font-semibold hover:bg-[var(--secondary)] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Phone className="h-4 w-4 text-blue-500" /> Dial Call
          </a>

          {/* WhatsApp Text */}
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-green-600/10 hover:bg-green-600/15 border border-green-500/20 text-green-500 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 text-green-500" /> WhatsApp
          </a>

          {/* Sell Transition Button */}
          {customer.leadStatus !== 'Sold' && (
            <button
              onClick={() => {
                resetSaleAmounts();
                // Populate property details if a matching inventory record is available.
                if (matchedProperties.length > 0) {
                  setSoldProject(matchedProperties[0].propertyName);
                  setSoldSociety(matchedProperties[0].societyName || matchedProperties[0].projectName || '');
                  setSoldLoc(matchedProperties[0].location);
                  setSoldRoad(matchedProperties[0].road || '');
                  setSoldYards(matchedProperties[0].squareYard?.toString() ?? '');
                }
                setSoldModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow cursor-pointer transition-colors"
            >
              <BookmarkCheck className="h-4 w-4" /> Move to Sold Customer
            </button>
          )}
        </div>
      </div>

      {/* CORE PROFILE & TIMELINE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Client Detail Profile */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pb-2 border-b border-[var(--border)]">
              Lead Requirements & Parameters
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted)]">Investment Purpose</span>
                <span className="font-semibold">{customer.purpose}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted)]">Budget Capability</span>
                <span className="font-semibold">{customer.budget}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted)]">Locations Intent</span>
                <span className="font-semibold">{customer.preferredLocations?.join(', ')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted)]">Registration Date</span>
                <span className="font-semibold">{new Date(customer.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Direct details editable textarea */}
            <div className="space-y-1 pt-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Requirements Specification
              </label>
              <textarea
                defaultValue={customer.requirement || ''}
                onBlur={(e) => handleDirectDetailsUpdate('requirement', e.target.value)}
                rows={3}
                placeholder="Click to specify detailed buyer preferences..."
                className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[var(--ring)] transition-all resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Internal Admin Notes
              </label>
              <textarea
                defaultValue={customer.notes || ''}
                onBlur={(e) => handleDirectDetailsUpdate('notes', e.target.value)}
                rows={3}
                placeholder="Click to append follow-up feedback notes..."
                className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[var(--ring)] transition-all resize-none"
              />
            </div>
          </div>

          {/* Sold Financial detail if applicable */}
          {customer.leadStatus === 'Sold' && soldRecord && (
            <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-green-500 flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> Sold Financial Ledger
              </h3>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Property Name</span>
                  <span className="font-semibold">{soldRecord.projectName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Dimensions (Sq Yards)</span>
                  <span className="font-semibold">{soldRecord.squareYard} sqyd</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Deal Amount</span>
                  <span className="font-semibold">{formatINR(soldRecord.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Down Payment Paid</span>
                  <span className="font-semibold text-green-500">{formatINR(soldRecord.downPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Agreement Status</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                    soldRecord.agreementStatus === 'Signed' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {soldRecord.agreementStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Registry Status</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                    soldRecord.registryStatus === 'Done' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {soldRecord.registryStatus}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Chronological Timeline log & Logger widget */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Logger widget */}
          <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pb-2 border-b border-[var(--border)] mb-3">
              Log Interaction Call / Site Visit
            </h3>
            
            <form onSubmit={handleAddTimelineLog} className="flex gap-3 flex-col sm:flex-row">
              <select
                value={logType}
                onChange={(e) => setLogType(e.target.value)}
                className="p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] text-[var(--foreground)] focus:outline-none shrink-0"
              >
                <option value="Called">Called (Phone)</option>
                <option value="WhatsApp Sent">WhatsApp Sent</option>
                <option value="Site Visit">Site Visit (Completed)</option>
                <option value="Negotiation">Price Negotiation</option>
              </select>
              
              <input
                type="text"
                placeholder="Log details: 'Shared map layout, customer likes location...'"
                value={logDesc}
                onChange={(e) => setLogDesc(e.target.value)}
                className="flex-1 p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />

              <button
                type="submit"
                disabled={logSubmit || !logDesc.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer shrink-0 disabled:opacity-50"
              >
                {logSubmit ? 'Logging...' : 'Add Log'}
              </button>
            </form>
          </div>

          {/* Chronological Timeline */}
          <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl h-[350px] overflow-hidden flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pb-2 border-b border-[var(--border)] mb-3">
              Activity History Log
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {timeline.length === 0 ? (
                <div className="text-center text-xs text-[var(--muted)] py-16">
                  No chronological logs found for this customer.
                </div>
              ) : (
                timeline.map((act) => (
                  <div key={act._id} className="relative pl-5 border-l border-blue-500/20 last:border-0 pb-1 flex gap-3">
                    <span className="absolute -left-1 top-1 h-2 w-2 rounded-full bg-blue-500 border border-[var(--card)]" />
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="flex justify-between items-center gap-4">
                        <span className="font-semibold text-blue-500 bg-blue-500/10 px-1.5 py-0.2 rounded">
                          {act.type}
                        </span>
                        <span className="text-[10px] text-[var(--muted)]">
                          {new Date(act.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--foreground)] mt-1 font-medium">{act.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* BOTTOM SECTIONS: FOLLOW-UPS, MATCHING PROPERTIES, DOCUMENT VAULT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Schedulers & Reminders */}
        <div className="lg:col-span-6 p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl flex flex-col h-[400px]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pb-2 border-b border-[var(--border)] mb-3 flex items-center justify-between">
            <span>Follow-up schedule</span>
            <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded font-semibold">
              {followups.filter(f => f.status === 'Pending').length} Pending
            </span>
          </h3>

          {/* Add Followup mini form */}
          <form onSubmit={handleAddFollowup} className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl mb-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <select value={fType} onChange={(e) => { setFType(e.target.value as 'Follow-up' | 'Property Visit'); setFPropertyId(''); }} className="col-span-2 p-1.5 border rounded-lg text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none">
                <option value="Follow-up">Regular Follow-up</option>
                <option value="Property Visit">Property Visit</option>
              </select>
              <input
                type="text"
                placeholder="Title: 'Call...'"
                value={fTitle}
                onChange={(e) => setFTitle(e.target.value)}
                className="col-span-2 p-1.5 border rounded-lg text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none"
              />
              <input
                type="date"
                value={fDate}
                onChange={(e) => setFDate(e.target.value)}
                className="p-1.5 border rounded-lg text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none"
              />
              {fType === 'Property Visit' && (
                <select value={fPropertyId} onChange={(e) => setFPropertyId(e.target.value)} className="col-span-2 p-1.5 border rounded-lg text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none">
                  <option value="">Select available property / project</option>
                  {visitProperties.map((property) => <option key={property._id} value={property._id}>{property.propertyName}{property.projectName ? ` — ${property.projectName}` : ''} · {property.location}</option>)}
                </select>
              )}
              <input
                type="time"
                value={fTime}
                onChange={(e) => setFTime(e.target.value)}
                className="p-1.5 border rounded-lg text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none"
              />
              <input
                type="text"
                placeholder="Remark notes..."
                value={fRemark}
                onChange={(e) => setFRemark(e.target.value)}
                className="p-1.5 border rounded-lg text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none"
              />
              <select
                value={fPriority}
                onChange={(e) => setFPriority(e.target.value)}
                className="p-1.5 border rounded-lg text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none text-[var(--muted)]"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={fSubmit}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer flex justify-center items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> {fType === 'Property Visit' ? 'Plan property visit' : 'Book follow-up'}
            </button>
          </form>

          {/* Follow-up checklist */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {followups.length === 0 ? (
              <div className="text-center text-xs text-[var(--muted)] py-12">
                No reminders scheduled.
              </div>
            ) : (
              followups.map((task) => (
                <div key={task._id} className="p-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg flex items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <h5 className={`text-xs font-semibold truncate ${task.status === 'Completed' ? 'line-through text-[var(--muted)]' : ''}`}>
                      {task.type === 'Property Visit' ? `Property Visit: ${task.projectName || task.propertyName}` : task.title}
                    </h5>
                    <p className="text-[10px] text-[var(--muted)] truncate">
                      {new Date(task.date).toLocaleDateString()} at {task.time} | Priority:{' '}
                      <span className={`font-semibold ${
                        task.priority === 'High' ? 'text-red-500' :
                        task.priority === 'Medium' ? 'text-amber-500' :
                        'text-slate-500'
                      }`}>
                        {task.priority}
                      </span>
                    </p>
                    {task.remark && <p className="text-[10px] italic text-[var(--muted)] mt-0.5">&quot;{task.remark}&quot;</p>}
                  </div>
                  {task.type === 'Property Visit' ? (
                    <select value={task.status} onChange={(event) => handleFollowupStatusChange(task._id, event.target.value as 'Planned' | 'Pending' | 'Completed')} className={`shrink-0 rounded border border-[var(--border)] bg-[var(--card)] p-1 text-[10px] font-bold ${task.status === 'Completed' ? 'text-green-500' : task.status === 'Pending' ? 'text-amber-500' : 'text-blue-500'}`}>
                      <option value="Planned">🔵 Planned</option><option value="Pending">🟠 Pending</option><option value="Completed">🟢 Completed</option>
                    </select>
                  ) : task.status === 'Pending' ? (
                    <button
                      onClick={() => handleCompleteFollowup(task._id)}
                      className="p-1 rounded bg-[var(--card)] border border-[var(--border)] text-green-500 hover:bg-green-500/10 cursor-pointer"
                      title="Mark Task Complete"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-green-500 font-bold uppercase mr-1">
                      Done
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Matching properties engine */}
        <div className="lg:col-span-6 p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl flex flex-col h-[400px]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pb-2 border-b border-[var(--border)] mb-3 flex items-center justify-between">
            <span>Automated Matching Properties</span>
            <span className="text-[10px] text-blue-500 bg-blue-500/10 px-1.5 py-0.2 rounded font-semibold">
              {matchedProperties.length} Matches Found
            </span>
          </h3>

          <div className="mb-3 grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4">
            <select value={matchSort} onChange={(event) => setMatchSort(event.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-2"><option value="match">Best match</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="newest">Newest</option><option value="oldest">Oldest</option></select>
            <select value={matchLocation} onChange={(event) => setMatchLocation(event.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-2"><option value="">Preferred locations</option>{matchingLocations.map((location) => <option key={location} value={location}>{location}</option>)}</select>
            <select value={matchPropertyType} onChange={(event) => setMatchPropertyType(event.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-2"><option value="">All property types</option>{PROPERTY_CATEGORY_OPTIONS.map((type) => <option key={type} value={type}>{type}</option>)}</select>
            <select value={matchTolerance} onChange={(event) => setMatchTolerance(event.target.value as 'tolerant' | 'strict')} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-2"><option value="tolerant">Budget ±10%</option><option value="strict">Strict budget</option></select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {matchingLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-blue-500" /></div>
            ) : matchedProperties.length === 0 ? (
              <div className="text-center text-xs text-[var(--muted)] py-16">
                No matching properties found for this customer.
              </div>
            ) : (
              matchedProperties.map((prop) => (
                <div key={prop._id} className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-[var(--foreground)]">{prop.propertyName}</h4>
                    <span className="text-xs font-bold text-blue-500">{formatINR(prop.price)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-[var(--muted)]">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {prop.location} ({prop.road})
                    </div>
                    <div className="flex items-center gap-1">
                      <Compass className="h-3 w-3" /> {prop.facing} Facing
                    </div>
                    <div>• {prop.squareYard} Sq Yards</div>
                    <div>{formatINR(prop.pricePerSquareYard || 0)} / sq. yd</div>
                    <div className="flex gap-1.5">
                      {prop.jdaApproved && <span className="text-[9px] font-semibold text-emerald-500">JDA</span>}
                      {prop.rera && <span className="text-[9px] font-semibold text-emerald-500">RERA</span>}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center text-[10px]">
                    <span className={`px-2 py-0.2 rounded font-semibold text-[9px] ${
                      prop.status === 'Available' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {prop.status}
                    </span>
                    <span className="font-semibold text-blue-500">Match: {prop.matchScore}%</span>
                    {prop.googleMapLink && (
                      <a 
                        href={prop.googleMapLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-500 hover:underline"
                      >
                        Google Map link
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Property visits */}
        <div className="lg:col-span-12 p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pb-2 border-b border-[var(--border)] flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Building className="h-4 w-4" /> Property Visit</span>
            <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-semibold">
              {visits.length} {visits.length === 1 ? 'Visit' : 'Visits'} logged
            </span>
          </h3>

          <form onSubmit={handleAddVisit} className="grid grid-cols-1 gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 md:grid-cols-12">
            <select
              value={selectedVisitPropertyId}
              onChange={(event) => setSelectedVisitPropertyId(event.target.value)}
              className="md:col-span-5 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 text-xs focus:outline-none"
            >
              <option value="">Select property / project to mark visited</option>
              {visitProperties.map((property) => (
                <option key={property._id} value={property._id}>
                  {property.propertyName}{property.projectName ? ` — ${property.projectName}` : ''} · {property.location} {property.matchScore ? `(${property.matchScore}% match)` : ''}
                </option>
              ))}
            </select>
            <input type="date" value={visitDate} onChange={(event) => setVisitDate(event.target.value)} className="md:col-span-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 text-xs focus:outline-none" />
            <input type="time" value={visitTime} onChange={(event) => setVisitTime(event.target.value)} className="md:col-span-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 text-xs focus:outline-none" />
            <input
              value={visitNotes}
              onChange={(event) => setVisitNotes(event.target.value)}
              placeholder="Customer feedback / interest level"
              className="md:col-span-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 text-xs focus:outline-none"
            />
            <div className="md:col-span-12 flex items-center justify-between gap-3">
              <p className="text-[10px] text-[var(--muted)]">Recommended properties appear first, followed by all available inventory.</p>
              <button type="submit" disabled={visitSubmitting || visitProperties.length === 0} className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
                <Check className="h-3.5 w-3.5" /> {visitSubmitting ? 'Saving...' : 'Mark Visited'}
              </button>
            </div>
          </form>

          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Visit History</h4>
            {visits.length === 0 ? (
              <p className="rounded-lg bg-[var(--background)] p-4 text-center text-xs text-[var(--muted)]">No property visits have been recorded for this customer.</p>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {visits.map((visit) => (
                  <div key={visit._id} className="flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-xs sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div>
                      <p className="font-semibold">{visit.propertyName}{visit.projectName ? ` · ${visit.projectName}` : ''}</p>
                      <p className="mt-0.5 text-[10px] text-[var(--muted)]">{visit.location || 'Location not recorded'}</p>
                      <p className="mt-1 text-[10px] text-[var(--muted)]">Planned: {visit.plannedVisitAt ? new Date(visit.plannedVisitAt).toLocaleString() : 'Not scheduled'} · Actual: {new Date(visit.actualVisitAt || visit.visitedAt).toLocaleString()}</p>
                      <span className="mt-1 inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-500">🟢 {visit.status || 'Completed'}</span>
                      {visit.notes && <p className="mt-1 text-[11px] italic text-[var(--foreground)]">“{visit.notes}”</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Document vault (Only show or prompt if customer status is Sold) */}
        <div className="lg:col-span-12 p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pb-2 border-b border-[var(--border)] flex items-center gap-1.5">
            <FolderUp className="h-4 w-4" /> Legal & Purchase Document Vault
          </h3>

          {customer.leadStatus !== 'Sold' ? (
            <div className="p-8 text-center bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--muted)]">
              <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-2 opacity-60" />
              The Customer profile must be transitioned to the <span className="font-semibold text-green-500">Sold Customer</span> category before purchase contracts, Aadhaar cards, and receipts can be uploaded.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Document upload form */}
              <form onSubmit={handleUploadDocument} className="md:col-span-5 p-3.5 bg-[var(--background)] border border-[var(--border)] rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider">Upload New Document</h4>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-[var(--muted)] uppercase block mb-1">Document Category</label>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value)}
                      className="w-full p-2 border rounded-lg text-xs bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] focus:outline-none"
                    >
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="Agreement">Sale Agreement</option>
                      <option value="Receipt">Booking Receipt</option>
                      <option value="PDF">General PDF</option>
                      <option value="Image">Registry Image</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[var(--muted)] uppercase block mb-1">Select File</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="w-full p-2 border border-dashed rounded-lg text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer flex justify-center items-center gap-1 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" /> Transferring File...
                    </>
                  ) : (
                    'Upload to Vault'
                  )}
                </button>
              </form>

              {/* Uploaded Documents List */}
              <div className="md:col-span-7 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Vault Records</h4>
                
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {!soldRecord || !soldRecord.documents || soldRecord.documents.length === 0 ? (
                    <div className="text-center text-xs text-[var(--muted)] py-12 bg-[var(--background)] rounded-xl border">
                      No files uploaded yet.
                    </div>
                  ) : (
                    soldRecord.documents.map((doc: any, index: number) => (
                      <div key={doc._id || index} className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <FileText className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold truncate max-w-[250px]">{doc.name}</p>
                            <span className="text-[9px] text-blue-500 bg-blue-500/10 px-1 py-0.2 rounded font-bold uppercase mr-2">
                              {doc.fileType}
                            </span>
                            <span className="text-[9px] text-[var(--muted)]">
                              Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-[var(--card)] border rounded-lg text-[10px] hover:bg-[var(--secondary)] font-semibold"
                        >
                          View File
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 4. TRANSITION TO SOLD CUSTOMER MODAL */}
      {soldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          
          <div className="relative w-full max-w-4xl bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
              <h3 className="text-md font-bold flex items-center gap-1.5 text-green-500">
                <BookmarkCheck className="h-5 w-5" /> Transition to Sold Customer
              </h3>
              <button 
                onClick={() => setSoldModalOpen(false)}
                className="p-1 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterSale} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs">
                <div className="font-bold text-[var(--foreground)]">{customer.fullName}</div>
                <div className="text-[var(--muted)] mt-0.5">
                  {customer.mobileNumber} | {customer.purpose} | {customer.budget} | {customer.preferredLocations?.join(', ')}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Project Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Project Name</label>
                  <input
                    type="text"
                    value={soldProject}
                    onChange={(e) => setSoldProject(e.target.value)}
                    placeholder="Apex Greens Phase I"
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Society Name</label>
                  <input
                    type="text"
                    value={soldSociety}
                    onChange={(e) => setSoldSociety(e.target.value)}
                    placeholder="Phase II Block A"
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Location</label>
                  <input
                    type="text"
                    value={soldLoc}
                    onChange={(e) => setSoldLoc(e.target.value)}
                    placeholder="Tonk Road, Jaipur"
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Road</label>
                  <input
                    type="text"
                    value={soldRoad}
                    onChange={(e) => setSoldRoad(e.target.value)}
                    placeholder="Tonk Road"
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>

                {/* Square Yards */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Square Yards</label>
                  <input
                    type="number"
                    value={soldYards}
                    onChange={(e) => setSoldYards(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>

                {/* Rate Per Square Yard */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Rate Per Square Yard (₹)</label>
                  <input
                    type="number"
                    value={soldRate}
                    onChange={(e) => setSoldRate(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">DLC Rate Per Square Yard</label>
                  <input
                    type="number"
                    value={soldDlcRate}
                    onChange={(e) => setSoldDlcRate(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>

                {/* Booking Amount */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Booking Amount Paid (₹)</label>
                  <input
                    type="number"
                    value={soldBookingAmt}
                    onChange={(e) => setSoldBookingAmt(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>

                {/* Down Payment */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Down Payment Paid (₹)</label>
                  <input
                    type="number"
                    value={soldDownPmt}
                    onChange={(e) => setSoldDownPmt(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Payment Mode</label>
                  <select
                    value={soldPaymentMode}
                    onChange={(e) => setSoldPaymentMode(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  >
                    {PAYMENT_MODE_OPTIONS.map((mode) => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </div>

                {/* Loan Amount */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Bank Loan Amount (₹)</label>
                  <input
                    type="number"
                    value={soldLoanAmt}
                    onChange={(e) => setSoldLoanAmt(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>

                {/* Sales Executive */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Sales Executive</label>
                  <input
                    type="text"
                    value={soldExecutive}
                    onChange={(e) => setSoldExecutive(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">A Part (White Money)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-[var(--muted)] uppercase">Registry Amount</label>
                      <input type="number" value={soldRegistryAmt} onChange={(e) => setSoldRegistryAmt(e.target.value)} className="w-full p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-[var(--muted)] uppercase">Loan Amount</label>
                      <input type="number" value={soldLoanAmt} onChange={(e) => setSoldLoanAmt(e.target.value)} className="w-full p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-[var(--muted)] uppercase">Cheque Amount</label>
                      <input type="number" value={soldChequeAmt} onChange={(e) => setSoldChequeAmt(e.target.value)} className="w-full p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-[var(--muted)] uppercase">RTGS Amount</label>
                      <input type="number" value={soldRtgsAmt} onChange={(e) => setSoldRtgsAmt(e.target.value)} className="w-full p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-[var(--muted)] uppercase">Online Amount</label>
                      <input type="number" value={soldOnlineAmt} onChange={(e) => setSoldOnlineAmt(e.target.value)} className="w-full p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-[var(--muted)] uppercase">Other White Payment</label>
                      <input type="number" value={soldOtherWhiteAmt} onChange={(e) => setSoldOtherWhiteAmt(e.target.value)} className="w-full p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs font-bold border-t border-[var(--border)] pt-2">
                    <span>Total White Amount</span>
                    <span className="text-blue-500">{formatINR(calculatedWhiteMoney)}</span>
                  </div>
                </div>

                <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">B Part (Cash)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-[var(--muted)] uppercase">Cash Amount</label>
                      <input type="number" value={soldCashAmt} onChange={(e) => setSoldCashAmt(e.target.value)} className="w-full p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-[var(--muted)] uppercase">Cash Received Date</label>
                      <input type="date" value={soldCashDate} onChange={(e) => setSoldCashDate(e.target.value)} className="w-full p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--muted)] uppercase">Remarks</label>
                    <textarea value={soldCashRemarks} onChange={(e) => setSoldCashRemarks(e.target.value)} rows={2} className="w-full p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none" />
                  </div>
                  <div className="flex justify-between text-xs font-bold border-t border-[var(--border)] pt-2">
                    <span>Total Cash Amount</span>
                    <span className="text-emerald-500">{formatINR(calculatedCashMoney)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Registry Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select value={soldRegistryStatus} onChange={(e) => setSoldRegistryStatus(e.target.value)} className="w-full p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none">
                      <option value="Pending">Pending</option>
                      <option value="Done">Done</option>
                    </select>
                    <input type="date" value={soldRegistryDate} onChange={(e) => setSoldRegistryDate(e.target.value)} className="w-full p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none" />
                    <input type="text" value={soldRegistryNumber} onChange={(e) => setSoldRegistryNumber(e.target.value)} placeholder="Registry number" className="w-full p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none" />
                    <input type="text" value={soldRegistryPdfUrl} onChange={(e) => setSoldRegistryPdfUrl(e.target.value)} placeholder="Registry PDF URL" className="w-full p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none" />
                  </div>
                </div>

                <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">File Processing</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select value={soldFileStatus} onChange={(e) => setSoldFileStatus(e.target.value)} className="w-full p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none">
                      <option value="Pending">Pending</option>
                      <option value="Bank Processing">Bank Processing</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <input type="text" value={soldLoanBankName} onChange={(e) => setSoldLoanBankName(e.target.value)} placeholder="Loan bank name" className="w-full p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none" />
                    <input type="text" value={soldLoanExecutive} onChange={(e) => setSoldLoanExecutive(e.target.value)} placeholder="Loan executive" className="w-full p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none" />
                    <input type="number" value={soldProcessingFee} onChange={(e) => setSoldProcessingFee(e.target.value)} placeholder="Processing fee" className="w-full p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none" />
                  </div>
                  <textarea value={soldFileRemarks} onChange={(e) => setSoldFileRemarks(e.target.value)} rows={2} placeholder="File remarks" className="w-full p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] focus:outline-none" />
                </div>
              </div>

              <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl space-y-2 text-xs">
                {(hasDealMismatch || hasOverReceived) && (
                  <div className="p-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500 font-semibold">
                    {hasDealMismatch && <>White + Cash differs from deal amount by {formatINR(Math.abs(whiteCashVariance))}. </>}
                    {hasOverReceived && <>Total received is higher than demand amount.</>}
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    ['Demand Amount', calculatedTotal],
                    ['DLC Amount', calculatedDlcAmount],
                    ['Booking Amount', soldBookingAmtValue],
                    ['White Money', calculatedWhiteMoney],
                    ['Cash Money', calculatedCashMoney],
                    ['Loan', soldLoanAmtValue],
                    ['Balance', calculatedRemaining],
                    ['Total Received', calculatedReceived],
                    ['Pending Amount', calculatedPending],
                    ['DLC Difference', calculatedDlcDifference],
                  ].map(([label, value]) => (
                    <div key={label as string} className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                      <span className="block text-[10px] text-[var(--muted)]">{label as string}</span>
                      <span className="font-bold">{formatINR(value as number)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial calculations review */}
              <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl space-y-1 text-xs">
                <div className="flex justify-between font-bold">
                  <span>Gross Deal Amount:</span>
                  <span>{formatINR(calculatedTotal)}</span>
                </div>
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Paid (Booking + Down Payment):</span>
                  <span>{formatINR(soldBookingAmtValue + soldDownPmtValue)}</span>
                </div>
                <div className="flex justify-between text-[var(--muted)] border-b pb-1.5">
                  <span>Bank Finance (Loan):</span>
                  <span>{formatINR(soldLoanAmtValue)}</span>
                </div>
                <div className="flex justify-between font-bold text-red-500 pt-1">
                  <span>Remaining Balance:</span>
                  <span>{formatINR(calculatedRemaining)}</span>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase">Remarks / Contract Notes</label>
                <textarea
                  value={soldRemarks}
                  onChange={(e) => setSoldRemarks(e.target.value)}
                  rows={2}
                  placeholder="Registry scheduled, HDFC bank loan processed..."
                  className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-[var(--border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSoldModalOpen(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-xl text-xs font-semibold hover:bg-[var(--secondary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow"
                >
                  Confirm Contract Sale
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
