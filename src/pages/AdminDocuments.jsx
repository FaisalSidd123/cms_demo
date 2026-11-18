import React, { useState, useEffect } from 'react';
import { useMockData } from '../hooks/useMockData';
import { TableSkeleton } from '../components/Skeletons';
import { 
  FolderOpen, 
  Plus, 
  Check, 
  X, 
  FileText, 
  Download, 
  Clock, 
  AlertTriangle,
  Send,
  User,
  Layers,
  FileSpreadsheet,
  Car,
  Hash
} from 'lucide-react';

export default function AdminDocuments({ 
  sharedInvoices = [], 
  onUpdateInvoices,
  sharedDocs = [],
  onUpdateDocs,
  sharedAudit = [],
  onUpdateAudit
}) {
  const { data: initialInvoices, isLoading: invoicesLoading } = useMockData('invoiceRequests');
  const { data: initialDocs, isLoading: docsLoading } = useMockData('agentDocuments');
  const { data: clientsList, isLoading: clientsLoading } = useMockData('clients');

  const isLoading = invoicesLoading || docsLoading || clientsLoading;

  const carInventoryOptions = [
    { model: 'Mercedes-Benz GLE', year: 2023, chassis: 'WDC1671591A928371' },
    { model: 'Porsche 911 GT3', year: 2024, chassis: 'WP0AC2A98PS298114' },
    { model: 'BMW M4 Competition', year: 2024, chassis: 'WBA43AY08PFP19823' },
    { model: 'Toyota Land Cruiser 300', year: 2023, chassis: 'JTMHX01J8N4029112' },
    { model: 'Tesla Model S', year: 2023, chassis: '5YJSA1E28PF992810' },
    { model: 'Audi RS6 Avant', year: 2023, chassis: 'WAUZZZF28NA089122' },
    { model: 'BMW 5 Series', year: 2022, chassis: 'WBA53BJ08NFP10944' },
    { model: 'Range Rover Sport', year: 2022, chassis: 'SALWR2V48NA771920' },
    { model: 'Honda Civic', year: 2023, chassis: '1HGCR2F83HA029311' }
  ];

  // Local synced states
  const [invoices, setInvoices] = useState([]);
  const [docs, setDocs] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [typeFilter, setTypeFilter] = useState('All');

  // Form states
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedCarOption, setSelectedCarOption] = useState(carInventoryOptions[0].model);
  const [chassisNumber, setChassisNumber] = useState(carInventoryOptions[0].chassis);
  const [docType, setDocType] = useState('Invoice');
  const [fileName, setFileName] = useState('');
  const [docNotes, setDocNotes] = useState('');

  const handleCarSelect = (model) => {
    setSelectedCarOption(model);
    const found = carInventoryOptions.find(c => c.model === model);
    if (found) {
      setChassisNumber(found.chassis);
      if (!fileName || fileName.startsWith('Invoice_') || fileName.startsWith('Bill_') || fileName.startsWith('Escrow_') || fileName.startsWith('Receipt_')) {
        setFileName(`${docType.replace(/\s+/g, '_')}_${found.model.replace(/\s+/g, '_')}_${found.chassis.slice(0, 8)}`);
      }
    }
  };

  // Sync initial mock sets
  useEffect(() => {
    if (sharedInvoices.length > 0) {
      setInvoices(sharedInvoices);
    } else if (initialInvoices) {
      setInvoices(initialInvoices);
    }

    if (sharedDocs.length > 0) {
      setDocs(sharedDocs);
    } else if (initialDocs) {
      setDocs(initialDocs);
    }
  }, [sharedInvoices, initialInvoices, sharedDocs, initialDocs]);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Invoice Approve / Reject
  const handleActionInvoice = (invoiceId, action) => {
    const updatedStatus = action === 'approve' ? 'Approved' : 'Rejected';
    const updated = invoices.map(inv => inv.id === invoiceId ? { ...inv, status: updatedStatus } : inv);
    
    setInvoices(updated);
    onUpdateInvoices(updated);

    // If approved, create a corresponding file scan in the documents archive automatically!
    if (action === 'approve') {
      const targetInvoice = invoices.find(i => i.id === invoiceId);
      if (targetInvoice) {
        const client = clientsList?.find(c => c.id === targetInvoice.clientId);
        const newDoc = {
          id: `adoc-${Math.floor(80 + Math.random() * 20)}`,
          clientId: targetInvoice.clientId,
          vehicleModel: targetInvoice.vehicleModel || 'Mercedes-Benz GLE',
          chassisVin: targetInvoice.chassisVin || 'WDC1671591A928371',
          type: 'Invoice',
          fileName: `KisacoAuto_Escrow_Invoice_${targetInvoice.reservationId}.pdf`,
          uploadDate: new Date().toISOString(),
          status: 'Approved'
        };
        const updatedDocs = [newDoc, ...docs];
        setDocs(updatedDocs);
        onUpdateDocs(updatedDocs);
      }
    }

    // Add administrative audit entry
    const newAudit = {
      id: `aud-${Math.floor(900 + Math.random() * 99)}`,
      adminId: 'adm-01',
      adminName: 'Chief Executive Operator',
      actionTaken: action === 'approve' ? 'Approved Invoice Request' : 'Rejected Invoice Request',
      target: `${action === 'approve' ? 'Approved' : 'Rejected'} invoice request ${invoiceId}.`,
      timestamp: new Date().toISOString()
    };
    onUpdateAudit([newAudit, ...sharedAudit]);

    triggerToast(`Invoice request ${invoiceId} ${updatedStatus.toLowerCase()} successfully.`);
  };

  // Issue new document
  const handleIssueDocument = (e) => {
    e.preventDefault();
    if (!selectedClient || !fileName) return;

    const newDoc = {
      id: `adoc-${Math.floor(100 + Math.random() * 900)}`,
      clientId: selectedClient,
      vehicleModel: selectedCarOption,
      chassisVin: chassisNumber.trim() || 'VIN-UNASSIGNED',
      type: docType,
      fileName: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
      uploadDate: new Date().toISOString(),
      status: 'Approved'
    };

    const updatedDocs = [newDoc, ...docs];
    setDocs(updatedDocs);
    onUpdateDocs(updatedDocs);

    // Add audit entry
    const newAudit = {
      id: `aud-${Math.floor(900 + Math.random() * 99)}`,
      adminId: 'adm-01',
      adminName: 'Chief Executive Operator',
      actionTaken: 'Issued Document',
      target: `Issued ${docType} for ${selectedCarOption} (Chassis: ${chassisNumber}) to client ${selectedClient}: ${fileName}.`,
      timestamp: new Date().toISOString()
    };
    onUpdateAudit([newAudit, ...sharedAudit]);

    setSelectedClient('');
    setFileName('');
    setDocNotes('');
    triggerToast(`Document issued for ${selectedCarOption} (Chassis: ${chassisNumber}).`);
  };

  if (isLoading) {
    return <TableSkeleton rows={4} cols={4} />;
  }

  const pendingInvoices = invoices.filter(inv => inv.status === 'Pending Admin Approval');

  return (
    <div className="space-y-8 text-left relative">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-charcoal text-white text-xs font-mono uppercase tracking-widest px-6 py-4 border border-brand-red/30 shadow-2xl">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div>
        <span className="text-[9px] font-mono text-brand-red uppercase tracking-widest block mb-0.5">// Operations Files</span>
        <h2 className="text-xl md:text-2xl font-display font-extrabold text-charcoal uppercase leading-none">
          Document Issuance & Control
        </h2>
        <p className="text-[11px] text-neutral-400 font-sans mt-1">
          Approve agent invoice requests, issue invoices and bills of lading, and audit buyers documentation logs.
        </p>
      </div>

      {/* Top section: Pending Requests */}
      <div className="bg-white border border-border-hairline p-5 shadow-xs">
        <span className="font-display font-bold text-xs uppercase tracking-wider text-charcoal mb-4 block flex items-center gap-1.5">
          <Clock className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
          <span>Pending Invoice Requests ({pendingInvoices.length})</span>
        </span>

        {pendingInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-[8px] font-mono text-neutral-400 uppercase tracking-widest select-none">
                  <th className="pb-3 font-semibold">Req ID</th>
                  <th className="pb-3 font-semibold">Client Folder</th>
                  <th className="pb-3 font-semibold">Hold ID</th>
                  <th className="pb-3 font-semibold">Invoice Value</th>
                  <th className="pb-3 font-semibold">Request Notes</th>
                  <th className="pb-3 font-semibold text-right">Oversight</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvoices.map((inv) => {
                  const client = clientsList?.find(c => c.id === inv.clientId);
                  return (
                    <tr key={inv.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 font-mono font-bold text-neutral-400">{inv.id}</td>
                      <td className="py-3 font-display font-bold uppercase text-[11px] text-charcoal">{client?.name}</td>
                      <td className="py-3 text-neutral-400 font-mono uppercase text-[9px]">{inv.reservationId}</td>
                      <td className="py-3 text-brand-red font-display font-bold">{inv.amount}</td>
                      <td className="py-3 text-neutral-500 font-sans max-w-xs truncate">{inv.notes}</td>
                      <td className="py-3 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleActionInvoice(inv.id, 'approve')}
                          className="p-1 border border-neutral-200 text-green-600 hover:border-green-500 hover:bg-green-50 cursor-pointer flex items-center justify-center rounded-2xs"
                          title="Approve Invoicing"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        <button
                          onClick={() => handleActionInvoice(inv.id, 'reject')}
                          className="p-1 border border-neutral-200 text-red-600 hover:border-red-500 hover:bg-red-50 cursor-pointer flex items-center justify-center rounded-2xs"
                          title="Reject Invoicing"
                        >
                          <X className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-neutral-400 text-xs font-sans">
            No pending invoice requests in queue.
          </div>
        )}
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left pane: File Repository */}
        <div className="lg:col-span-2 bg-white border border-border-hairline p-5 shadow-xs min-h-[300px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <span className="font-display font-bold text-xs uppercase tracking-wider text-charcoal flex items-center gap-1.5">
              <FolderOpen className="w-4.5 h-4.5 text-neutral-400" />
              <span>Documents Repository Archive</span>
            </span>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-1.5 text-[9px] font-mono">
              {['All', 'Invoice', 'Bill of Lading', 'Receipt', 'ID Verification'].map(f => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`px-2 py-0.5 rounded-2xs font-bold uppercase transition-all cursor-pointer ${
                    typeFilter === f
                      ? 'bg-charcoal text-white shadow-2xs'
                      : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-[8px] font-mono text-neutral-400 uppercase tracking-widest select-none">
                  <th className="pb-3 font-semibold">Buyer Entity</th>
                  <th className="pb-3 font-semibold">Car & Chassis (VIN)</th>
                  <th className="pb-3 font-semibold">File Type</th>
                  <th className="pb-3 font-semibold">File Name</th>
                  <th className="pb-3 font-semibold">Issued Date</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs
                  .filter(doc => typeFilter === 'All' || doc.type.toLowerCase().includes(typeFilter.toLowerCase()))
                  .map((doc) => {
                    const client = clientsList?.find(c => c.id === doc.clientId);
                    return (
                      <tr key={doc.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-colors">
                        <td className="py-3 font-display font-bold uppercase text-[11px] text-charcoal">{client?.name}</td>
                        <td className="py-3">
                          <span className="font-display font-bold uppercase text-[11px] text-charcoal block">
                            {doc.vehicleModel || 'General Vehicle File'}
                          </span>
                          <span className="font-mono text-[9px] text-neutral-500 bg-neutral-100 border border-neutral-200 px-1.5 py-0.2 rounded-2xs inline-block mt-0.5 font-bold">
                            Chassis: {doc.chassisVin || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 text-neutral-400 font-mono uppercase text-[9px]">{doc.type}</td>
                        <td className="py-3 text-neutral-600 font-mono break-all">{doc.fileName}</td>
                        <td className="py-3 text-neutral-400 font-mono">{new Date(doc.uploadDate).toLocaleDateString()}</td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2 font-mono text-[10px]">
                            <button
                              onClick={() => setPreviewDoc({ ...doc, clientName: client?.name })}
                              className="text-brand-red font-bold hover:underline cursor-pointer"
                            >
                              Preview
                            </button>
                            <span className="text-neutral-300">•</span>
                            <button 
                              onClick={() => triggerToast(`Simulating download: ${doc.fileName}`)}
                              className="text-neutral-500 hover:text-charcoal cursor-pointer flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right pane: Issue Document form */}
        <div className="bg-white border border-border-hairline p-5 shadow-xs">
          <span className="font-display font-bold text-xs uppercase tracking-wider text-charcoal mb-4 block flex items-center gap-1.5">
            <Send className="w-4 h-4 text-neutral-400" />
            <span>Issue Official Document</span>
          </span>

          <form onSubmit={handleIssueDocument} className="space-y-4">
            
            {/* Select Client */}
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">Select Buyer File</label>
              <select
                required
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="bg-white border border-neutral-200 px-3 py-2.5 text-xs text-charcoal outline-hidden focus:border-brand-red cursor-pointer"
              >
                <option value="">-- Choose Client --</option>
                {clientsList?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Select Car Option */}
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-mono uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-1">
                <Car className="w-3 h-3 text-neutral-500" />
                <span>Associated Vehicle Model</span>
              </label>
              <select
                value={selectedCarOption}
                onChange={(e) => handleCarSelect(e.target.value)}
                className="bg-white border border-neutral-200 px-3 py-2.5 text-xs text-charcoal outline-hidden focus:border-brand-red cursor-pointer font-sans"
              >
                {carInventoryOptions.map(car => (
                  <option key={car.chassis} value={car.model}>
                    {car.year} {car.model}
                  </option>
                ))}
                <option value="Custom Vehicle">Other / Custom Vehicle</option>
              </select>
            </div>

            {/* Chassis / VIN Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-mono uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-1">
                <Hash className="w-3 h-3 text-neutral-500" />
                <span>Chassis / VIN Number</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. WDC1671591A928371"
                value={chassisNumber}
                onChange={(e) => setChassisNumber(e.target.value.toUpperCase())}
                className="bg-white border border-border-hairline px-3.5 py-2.5 text-xs text-charcoal font-mono uppercase outline-hidden focus:border-brand-red transition-all"
              />
            </div>

            {/* Select Type */}
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">Document Type</label>
              <select
                value={docType}
                onChange={(e) => {
                  setDocType(e.target.value);
                  if (selectedCarOption) {
                    setFileName(`${e.target.value.replace(/\s+/g, '_')}_${selectedCarOption.replace(/\s+/g, '_')}_${chassisNumber.slice(0, 8)}`);
                  }
                }}
                className="bg-white border border-neutral-200 px-3 py-2.5 text-xs text-charcoal outline-hidden focus:border-brand-red cursor-pointer"
              >
                <option value="Invoice">Escrow Invoice</option>
                <option value="Receipt">Cleared Receipt</option>
                <option value="Bill of Lading">Bill of Lading</option>
              </select>
            </div>

            {/* File Name */}
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">Document Filename</label>
              <input
                type="text"
                required
                placeholder="e.g. Bill_Of_Lading_Miami_Depot"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="bg-white border border-border-hairline px-3.5 py-2.5 text-xs text-charcoal outline-hidden focus:border-brand-red transition-all"
              />
            </div>

            {/* Note details */}
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">Issuing notes</label>
              <textarea
                rows={2}
                value={docNotes}
                onChange={(e) => setDocNotes(e.target.value)}
                placeholder="Log internal details..."
                className="bg-white border border-border-hairline p-3 text-xs text-charcoal outline-hidden focus:border-brand-red transition-all resize-none placeholder:text-neutral-400"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-red hover:bg-brand-red-hover text-white text-xs font-bold uppercase tracking-widest py-3 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <span>Issue Document</span>
            </button>

          </form>
        </div>

      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-xl border border-neutral-300 shadow-2xl rounded-xs overflow-hidden text-left flex flex-col max-h-[90vh]">
            <div className="bg-[#0F172A] text-white p-4 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-mono text-brand-red uppercase tracking-widest font-bold block">
                  Official Document Viewer
                </span>
                <h4 className="text-sm font-display font-extrabold uppercase text-white truncate max-w-sm">
                  {previewDoc.fileName}
                </h4>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 bg-slate-800 hover:bg-brand-red text-slate-300 hover:text-white rounded-xs transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 bg-neutral-50 text-xs font-sans overflow-y-auto">
              {/* Dealership Header */}
              <div className="border-b-2 border-charcoal pb-3 flex justify-between items-start">
                <div>
                  <h4 className="font-display font-black text-xs uppercase tracking-wider text-charcoal">
                    Kisaco Auto Sales Ltd
                  </h4>
                  <p className="text-[9px] font-mono text-neutral-400">
                    Kingston Bonded Warehouse & Customs Logistics
                  </p>
                </div>
                <div className="text-right font-mono text-[9px] text-neutral-500">
                  <span>{new Date(previewDoc.uploadDate || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="bg-white border border-neutral-200 p-4 rounded-xs space-y-2">
                <div className="flex justify-between border-b border-neutral-100 pb-2">
                  <span className="text-neutral-400 font-mono uppercase text-[9px]">Buyer Entity</span>
                  <strong className="text-charcoal font-display uppercase">{previewDoc.clientName || 'Assigned Client'}</strong>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-2">
                  <span className="text-neutral-400 font-mono uppercase text-[9px]">Allocated Vehicle</span>
                  <strong className="text-charcoal font-display uppercase">{previewDoc.vehicleModel || 'General Vehicle File'}</strong>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-2">
                  <span className="text-neutral-400 font-mono uppercase text-[9px]">Chassis / VIN</span>
                  <span className="font-mono text-neutral-800 font-bold bg-neutral-100 px-2 py-0.5 rounded-2xs border border-neutral-200">
                    {previewDoc.chassisVin || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-2">
                  <span className="text-neutral-400 font-mono uppercase text-[9px]">Document Classification</span>
                  <strong className="text-charcoal font-mono">{previewDoc.type}</strong>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-neutral-400 font-mono uppercase text-[9px]">File Name</span>
                  <span className="text-neutral-700 font-mono break-all">{previewDoc.fileName}</span>
                </div>
              </div>

              <div className="border border-dashed border-emerald-300 p-4 bg-emerald-50/50 rounded-xs flex items-center justify-between">
                <div>
                  <span className="font-display font-bold uppercase text-[11px] text-emerald-800 block">
                    Certified Platform Clearance
                  </span>
                  <span className="font-mono text-[9px] text-emerald-600">
                    Digitally Sealed • SHA-256 Validated
                  </span>
                </div>
                <div className="border border-emerald-600 text-emerald-700 font-mono text-[8px] font-bold px-2 py-0.5 rounded-2xs uppercase">
                  Verified
                </div>
              </div>
            </div>

            <div className="bg-neutral-100 p-3.5 flex justify-end gap-2 text-xs font-mono">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-3 py-1.5 border border-neutral-300 text-charcoal font-bold uppercase rounded-xs hover:bg-neutral-200 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  triggerToast(`Downloaded ${previewDoc.fileName}.`);
                  setPreviewDoc(null);
                }}
                className="px-4 py-1.5 bg-brand-red text-white font-bold uppercase rounded-xs hover:bg-red-700 cursor-pointer"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
