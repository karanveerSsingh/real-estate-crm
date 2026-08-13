'use client';

import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Copy, FileText, Globe2, Loader2, MessageCircle, Search, Share2, Upload, Users, Video, X } from 'lucide-react';
import toast from 'react-hot-toast';

type Customer = { _id: string; fullName: string; mobileNumber: string; whatsAppNumber: string; leadStatus: string };
type SelectedFile = { id: string; file: File; previewUrl?: string };
type UploadedFile = { name: string; url: string; mimeType: string; size: number };
type Platform = 'whatsapp' | 'facebook' | 'instagram' | 'linkedin' | 'x' | 'other';
type PreparedShare = { shareId: string; customers: Customer[]; files: UploadedFile[]; message: string };

const platforms: { id: Platform; name: string; description: string }[] = [
  { id: 'whatsapp', name: 'WhatsApp', description: 'Opens a pre-filled message for each selected customer.' },
  { id: 'facebook', name: 'Facebook', description: 'Opens Facebook’s public share dialog.' },
  { id: 'instagram', name: 'Instagram', description: 'Opens Instagram; add the saved media links in the composer.' },
  { id: 'linkedin', name: 'LinkedIn', description: 'Opens LinkedIn’s public share dialog.' },
  { id: 'x', name: 'X (Twitter)', description: 'Opens an X post composer.' },
  { id: 'other', name: 'Other / device share', description: 'Uses your browser or device share options when available.' },
];

function formatBytes(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EventsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['whatsapp']);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [preparedShare, setPreparedShare] = useState<PreparedShare | null>(null);
  const [status, setStatus] = useState<{ kind: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [whatsAppQueue, setWhatsAppQueue] = useState<Customer[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/customers')
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load customers');
        return response.json() as Promise<Customer[]>;
      })
      .then((data) => { if (active) setCustomers(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) setStatus({ kind: 'error', text: 'Unable to load customers. Please try again.' }); })
      .finally(() => { if (active) setLoadingCustomers(false); });
    return () => { active = false; };
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const term = search.trim().toLowerCase();
    return !term || [customer.fullName, customer.mobileNumber, customer.whatsAppNumber, customer.leadStatus].some((value) => value?.toLowerCase().includes(term));
  });
  const allSelected = customers.length > 0 && selectedCustomerIds.length === customers.length;

  const toggleCustomer = (id: string) => {
    setPreparedShare(null);
    setSelectedCustomerIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };
  const selectAll = () => {
    setPreparedShare(null);
    setSelectedCustomerIds(allSelected ? [] : customers.map((customer) => customer._id));
  };
  const togglePlatform = (id: Platform) => {
    setPreparedShare(null);
    setSelectedPlatforms((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files || []);
    const allowed = incoming.filter((file) => /^(image\/|video\/|application\/pdf$|text\/)|\.(docx?|xlsx?|pptx?|csv)$/i.test(`${file.type} ${file.name}`));
    if (allowed.length !== incoming.length) toast.error('Only PDFs, images, videos, and common document files are supported.');
    const next = allowed.map((file) => ({ id: `${file.name}-${file.lastModified}-${file.size}`, file, previewUrl: file.type.startsWith('image/') || file.type.startsWith('video/') ? URL.createObjectURL(file) : undefined }));
    setPreparedShare(null);
    setFiles((current) => [...current, ...next].slice(0, 10));
    if (incoming.length + files.length > 10) toast.error('Only the first 10 files are kept.');
    event.target.value = '';
  };
  const removeFile = (id: string) => {
    setPreparedShare(null);
    setFiles((current) => {
      const removed = current.find((file) => file.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((file) => file.id !== id);
    });
  };

  const copyMessage = async () => {
    if (!message.trim()) {
      setStatus({ kind: 'error', text: 'Write a message before copying it.' });
      return;
    }
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Message copied to clipboard');
      setStatus({ kind: 'success', text: 'Message copied to your clipboard.' });
    } catch {
      setStatus({ kind: 'error', text: 'Your browser could not copy the message.' });
    }
  };

  const buildMessage = (text: string, uploaded: UploadedFile[]) => `${text.trim()}${uploaded.length ? `\n\nAttachments:\n${uploaded.map((file) => `• ${file.name}: ${file.url}`).join('\n')}` : ''}`;
  const prepareShare = async () => {
    if (!selectedCustomerIds.length || !message.trim() || !selectedPlatforms.length) {
      setStatus({ kind: 'error', text: 'Select at least one customer and platform, then write a message before sharing.' });
      return;
    }
    setSharing(true);
    setPreparedShare(null);
    setWhatsAppQueue([]);
    setStatus({ kind: 'info', text: 'Uploading media and preparing secure share links…' });
    try {
      let uploadData: UploadedFile[] = [];
      if (files.length) {
        const formData = new FormData();
        files.forEach(({ file }) => formData.append('files', file));
        const uploadResponse = await fetch('/api/events/upload', { method: 'POST', body: formData });
        const responseData = await uploadResponse.json() as UploadedFile[] | { error?: string };
        if (!uploadResponse.ok || !Array.isArray(responseData)) throw new Error(Array.isArray(responseData) ? 'Unable to upload selected files.' : responseData.error || 'Unable to upload selected files.');
        uploadData = responseData;
      }
      const shareResponse = await fetch('/api/events/share', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerIds: selectedCustomerIds, platforms: selectedPlatforms, message: message.trim(), files: uploadData }),
      });
      const shareData = await shareResponse.json() as { shareId?: string; customers?: Customer[]; error?: string };
      if (!shareResponse.ok || !shareData.customers || !shareData.shareId) throw new Error(shareData.error || 'Unable to prepare sharing.');
      setPreparedShare({ shareId: shareData.shareId, customers: shareData.customers, files: uploadData, message: message.trim() });
      setStatus({ kind: 'success', text: 'Your message and optional media are ready. Use the platform buttons below to open the appropriate sharing workflow.' });
      toast.success('Event sharing is ready');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to prepare sharing.';
      setStatus({ kind: 'error', text: message });
      toast.error(message);
    } finally {
      setSharing(false);
    }
  };

  const openWhatsApp = (customer: Customer, uploaded: UploadedFile[]) => {
    const number = customer.whatsAppNumber.replace(/\D/g, '');
    if (!number) { setStatus({ kind: 'error', text: `${customer.fullName} does not have a WhatsApp number.` }); return; }
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(buildMessage(preparedShare?.message || '', uploaded))}`, '_blank', 'noopener,noreferrer');
  };
  const markShareOpened = (shareId: string) => {
    void fetch('/api/events/share', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId, status: 'opened' }),
    });
  };
  const startWhatsAppWorkflow = () => {
    if (!preparedShare) return;
    const validCustomers = preparedShare.customers.filter((customer) => customer.whatsAppNumber.replace(/\D/g, ''));
    if (!validCustomers.length) { setStatus({ kind: 'error', text: 'None of the selected customers have a WhatsApp number.' }); return; }
    const [first, ...remaining] = validCustomers;
    openWhatsApp(first, preparedShare.files);
    markShareOpened(preparedShare.shareId);
    setWhatsAppQueue(remaining);
    setStatus({ kind: 'success', text: remaining.length ? `WhatsApp opened for ${first.fullName}. Continue through the remaining ${remaining.length} customer${remaining.length === 1 ? '' : 's'}.` : `WhatsApp opened for ${first.fullName}.` });
  };
  const openNextWhatsApp = () => {
    if (!preparedShare || !whatsAppQueue.length) return;
    const [next, ...remaining] = whatsAppQueue;
    openWhatsApp(next, preparedShare.files);
    markShareOpened(preparedShare.shareId);
    setWhatsAppQueue(remaining);
    setStatus({ kind: 'success', text: remaining.length ? `WhatsApp opened for ${next.fullName}. ${remaining.length} remaining.` : `WhatsApp opened for ${next.fullName}. All selected customers are complete.` });
  };
  const openSocialShare = (platform: Exclude<Platform, 'whatsapp' | 'instagram' | 'other'>) => {
    if (!preparedShare) return;
    const url = preparedShare.files[0]?.url;
    const text = buildMessage(preparedShare.message, preparedShare.files);
    if (!url && platform !== 'x') {
      void navigator.clipboard.writeText(text).catch(() => undefined);
      window.open(platform === 'facebook' ? 'https://www.facebook.com/' : 'https://www.linkedin.com/', '_blank', 'noopener,noreferrer');
      markShareOpened(preparedShare.shareId);
      setStatus({ kind: 'success', text: `${platform === 'facebook' ? 'Facebook' : 'LinkedIn'} opened. The message was copied when your browser allowed it; paste it into the platform composer.` });
      return;
    }
    const target = platform === 'facebook' ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
      : platform === 'linkedin' ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
      : `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
    window.open(target, '_blank', 'noopener,noreferrer');
    markShareOpened(preparedShare.shareId);
    setStatus({ kind: 'success', text: `${platform === 'x' ? 'X' : platform[0].toUpperCase() + platform.slice(1)} share window opened.` });
  };
  const openInstagram = async () => {
    if (!preparedShare) return;
    try { await navigator.clipboard.writeText(buildMessage(preparedShare.message, preparedShare.files)); } catch { /* Clipboard permission is optional. */ }
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    markShareOpened(preparedShare.shareId);
    setStatus({ kind: 'success', text: 'Instagram opened. The media links were copied when your browser allowed it; add media manually in Instagram’s composer.' });
  };
  const openDeviceShare = async () => {
    if (!preparedShare) return;
    try {
      if (navigator.share) await navigator.share({ title: 'Event message', text: buildMessage(preparedShare.message, preparedShare.files), url: preparedShare.files[0]?.url });
      else { await navigator.clipboard.writeText(buildMessage(preparedShare.message, preparedShare.files)); toast.success('Share message copied to your clipboard.'); }
      markShareOpened(preparedShare.shareId);
      setStatus({ kind: 'success', text: 'Your device sharing workflow is ready.' });
    } catch (error) { if ((error as Error).name !== 'AbortError') setStatus({ kind: 'error', text: 'The device share workflow could not be opened.' }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold text-blue-500">EVENTS</p><h2 className="text-2xl font-bold">Share event media</h2><p className="mt-1 text-sm text-[var(--muted)]">Select customers, add media, choose platforms, then use the safe share workflow.</p></div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-500"><Users className="mr-2 inline h-4 w-4" />{selectedCustomerIds.length} customer{selectedCustomerIds.length === 1 ? '' : 's'} selected</div>
      </div>

      {status && <div className={`rounded-xl border px-4 py-3 text-sm ${status.kind === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-600' : status.kind === 'success' ? 'border-green-500/30 bg-green-500/10 text-green-600' : 'border-blue-500/30 bg-blue-500/10 text-blue-500'}`}>{status.kind === 'success' && <CheckCircle2 className="mr-2 inline h-4 w-4" />}{status.text}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold">1. Select customers</h3><p className="text-xs text-[var(--muted)]">Search by name, phone, WhatsApp number, or status.</p></div><button type="button" onClick={selectAll} disabled={!customers.length} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold hover:bg-[var(--secondary)] disabled:opacity-50">{allSelected ? 'Deselect All' : 'Select All'}</button></div>
          <div className="relative mb-3"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--muted)]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers" className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-blue-500" /></div>
          <div className="max-h-[390px] space-y-2 overflow-y-auto pr-1">
            {loadingCustomers ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-blue-500" /></div> : filteredCustomers.length ? filteredCustomers.map((customer) => <label key={customer._id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] p-3 hover:bg-[var(--secondary)]"><input type="checkbox" checked={selectedCustomerIds.includes(customer._id)} onChange={() => toggleCustomer(customer._id)} className="h-4 w-4 accent-blue-600" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{customer.fullName}</span><span className="block truncate text-xs text-[var(--muted)]">{customer.whatsAppNumber || customer.mobileNumber} · {customer.leadStatus}</span></span></label>) : <p className="py-10 text-center text-sm text-[var(--muted)]">No customers found.</p>}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5"><div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-semibold">2. Write your message</h3><p className="text-xs text-[var(--muted)]">Use any text or emoji. This message is prepared for the selected platform.</p></div><span className="text-xs text-[var(--muted)]">{message.length}/4000</span></div><textarea value={message} maxLength={4000} onChange={(event) => { setMessage(event.target.value); setPreparedShare(null); }} placeholder="Hello, we have a new property available on Diggi Road. Please contact us for more details. ✨" rows={6} className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm outline-none focus:ring-1 focus:ring-blue-500" /><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={copyMessage} disabled={!message.trim()} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold hover:bg-[var(--secondary)] disabled:opacity-50"><Copy className="mr-1 inline h-3.5 w-3.5" />Copy message</button><button type="button" onClick={() => { setMessage(''); setPreparedShare(null); }} disabled={!message} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold hover:bg-[var(--secondary)] disabled:opacity-50">Clear message</button></div>{message.trim() && <div className="mt-3 rounded-xl bg-[var(--secondary)] p-3"><p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Message preview</p><p className="whitespace-pre-wrap text-sm">{message}</p></div>}</section>
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5"><div className="mb-4"><h3 className="font-semibold">3. Attach media or files <span className="font-normal text-[var(--muted)]">(optional)</span></h3><p className="text-xs text-[var(--muted)]">PDF, images, videos, and documents. Up to 10 files; videos up to 50MB and others up to 10MB.</p></div><input ref={inputRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" className="hidden" onChange={addFiles} /><button type="button" onClick={() => inputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-500/50 bg-blue-500/5 px-4 py-7 text-sm font-semibold text-blue-500 hover:bg-blue-500/10"><Upload className="h-5 w-5" />Choose files</button><div className="mt-3 space-y-2">{files.map((selected) => <div key={selected.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-2"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--secondary)]">{selected.file.type.startsWith('image/') && selected.previewUrl ? <span aria-label="Image preview" role="img" className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${selected.previewUrl})` }} /> : selected.file.type.startsWith('video/') ? <Video className="h-5 w-5 text-blue-500" /> : <FileText className="h-5 w-5 text-blue-500" />}</div><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{selected.file.name}</span><span className="text-xs text-[var(--muted)]">{formatBytes(selected.file.size)}</span></span><button type="button" onClick={() => removeFile(selected.id)} aria-label={`Remove ${selected.file.name}`} className="rounded-lg p-2 text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500"><X className="h-4 w-4" /></button></div>)}</div></section>
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5"><div className="mb-4"><h3 className="font-semibold">4. Select platform</h3><p className="text-xs text-[var(--muted)]">Platforms open their official share interfaces—no passwords are stored in this CRM.</p></div><div className="grid gap-2 sm:grid-cols-2">{platforms.map((platform) => <label key={platform.id} className="flex cursor-pointer gap-3 rounded-xl border border-[var(--border)] p-3 hover:bg-[var(--secondary)]"><input type="checkbox" checked={selectedPlatforms.includes(platform.id)} onChange={() => togglePlatform(platform.id)} className="mt-0.5 h-4 w-4 accent-blue-600" /><span><span className="block text-sm font-semibold">{platform.name}</span><span className="block text-xs text-[var(--muted)]">{platform.description}</span></span></label>)}</div></section>
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold">5. Share now</h3><p className="text-xs text-[var(--muted)]">Your message is required; attachments are optional and uploaded securely when selected.</p></div><button type="button" onClick={prepareShare} disabled={sharing || !selectedCustomerIds.length || !message.trim() || !selectedPlatforms.length} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">{sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}{sharing ? 'Preparing…' : 'Share Now'}</button></div>
        <div className="mt-4 grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-xs sm:grid-cols-3"><span><strong>{selectedCustomerIds.length}</strong> selected customer{selectedCustomerIds.length === 1 ? '' : 's'}</span><span><strong>{files.length}</strong> attachment{files.length === 1 ? '' : 's'}</span><span><strong>{selectedPlatforms.map((platform) => platforms.find((item) => item.id === platform)?.name).join(', ') || 'No platform'}</strong></span></div>
        {preparedShare && <div className="mt-5 border-t border-[var(--border)] pt-4"><p className="mb-3 text-sm font-semibold">Open sharing workflow</p><div className="flex flex-wrap gap-2">{selectedPlatforms.includes('whatsapp') && <button type="button" onClick={startWhatsAppWorkflow} className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-500"><MessageCircle className="mr-1 inline h-4 w-4" />Open WhatsApp</button>}{whatsAppQueue.length > 0 && <button type="button" onClick={openNextWhatsApp} className="rounded-lg border border-green-500/40 px-3 py-2 text-xs font-semibold text-green-600 hover:bg-green-500/10">Open next WhatsApp ({whatsAppQueue.length})</button>}{selectedPlatforms.includes('facebook') && <button type="button" onClick={() => openSocialShare('facebook')} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold hover:bg-[var(--secondary)]">Open Facebook</button>}{selectedPlatforms.includes('instagram') && <button type="button" onClick={openInstagram} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold hover:bg-[var(--secondary)]">Open Instagram</button>}{selectedPlatforms.includes('linkedin') && <button type="button" onClick={() => openSocialShare('linkedin')} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold hover:bg-[var(--secondary)]">Open LinkedIn</button>}{selectedPlatforms.includes('x') && <button type="button" onClick={() => openSocialShare('x')} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold hover:bg-[var(--secondary)]">Open X</button>}{selectedPlatforms.includes('other') && <button type="button" onClick={openDeviceShare} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold hover:bg-[var(--secondary)]"><Globe2 className="mr-1 inline h-4 w-4" />Device share</button>}</div></div>}
      </section>
    </div>
  );
}
