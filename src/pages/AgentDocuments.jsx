import React, { useState, useEffect } from 'react';
import { useMockData } from '../hooks/useMockData';
import { TableSkeleton } from '../components/Skeletons';
import { 
  FileCheck, 
  FileText, 
  Download, 
  Check, 
  Clock, 
  FolderOpen,
  Search,
  Eye,
  ShieldCheck,
  X,
  Car,
  User
} from 'lucide-react';

export default function AgentDocuments() {
  const { data: initialTx, isLoading: txLoading } = useMockData('transactions');
  const { data: clientsList, isLoading: clientsLoading } = useMockData('clients');
  const { data: initialDocs, isLoading: docsLoading } = useMockData('agentDocuments');

  const isLoading = txLoading || clientsLoading || docsLoading;

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Compile all official deal documents linked with vehicle & customer
  const compiledDocs = [];

  if (initialTx) {
    initialTx.forEach(tx => {
      if (tx.documents && tx.documents.length > 0) {
        tx.documents.forEach(doc => {
          compiledDocs.push({
            id: doc.id,
            name: doc.name,
            type: doc.type,
            fileSize: doc.fileSize || '320 KB',
            issueDate: doc.issueDate || tx.dueDate,
            status: doc.status || 'Verified',
            hash: doc.hash,
            options: doc.options,
            // Vehicle link
            vehicleModel: tx.vehicleModel,
            vehicleYear: tx.vehicleYear,
            vehicleVin: tx.vehicleVin,
            vehicleImage: tx.vehicleImage,
            txId: tx.id,
            // Customer link
            customerName: tx.customerName,
            customerEmail: tx.customerEmail,
            customerPhone: tx.customerPhone
          });
        });
      }
    });
  }

  // Also include buyer KYC docs with customer link
  if (initialDocs && clientsList) {
    initialDocs.forEach(d => {
      const client = clientsList.find(c => c.id === d.clientId);
      compiledDocs.push({
        id: d.id,
        name: `${d.type} - Certified Buyer File`,
        type: d.type,
        fileSize: '450 KB',
        issueDate: d.uploadDate,
        status: d.status === 'Approved' ? 'Verified' : d.status,
        hash: 'SHA256:c948201948201948201948201948201948201948201948201948201948201948',
        options: { fileFormat: 'PDF/A', encryption: 'AES-256' },
        vehicleModel: 'Customer Dossier Archive',
        vehicleYear: '2024',
        vehicleVin: `KYC-${d.id.toUpperCase()}`,
        vehicleImage: client?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
        txId: 'KYC-VAULT',
        customerName: client?.name || 'Assigned Lead',
        customerEmail: client?.email || 'buyer@kisacoauto.com',
        customerPhone: client?.phone || '+1 (305) 555-0100'
      });
    });
  }

  // Filter documents
  const filteredDocs = compiledDocs.filter(doc => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.vehicleVin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'All'
        ? true
        : categoryFilter === 'Contracts'
          ? (doc.type.toLowerCase().includes('contract') || doc.type.toLowerCase().includes('purchase'))
          : categoryFilter === 'Inspections'
            ? doc.type.toLowerCase().includes('inspection')
            : categoryFilter === 'Customs'
              ? (doc.type.toLowerCase().includes('customs') || doc.type.toLowerCase().includes('release'))
              : true;

    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return <TableSkeleton rows={5} cols={5} />;
  }

  return (
    <div className="space-y-8 text-left relative pb-16">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-[#0F172A] text-white text-xs font-mono uppercase tracking-widest px-6 py-4 border-l-4 border-brand-red shadow-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-hairline pb-4">
        <div>
          <span className="text-[9px] font-mono text-brand-red uppercase tracking-widest block mb-0.5 font-bold">
            // Deal Documents & Title Vault
          </span>
          <h2 className="text-xl md:text-2xl font-display font-extrabold text-charcoal uppercase leading-none">
            Vehicle Documents & Records
          </h2>
          <p className="text-[11px] text-neutral-400 font-sans mt-1">
            Access certified contracts, mechanical inspection certificates, and customs releases by vehicle and customer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-neutral-500 bg-white border border-neutral-200 px-3 py-1.5 rounded-xs">
            {compiledDocs.length} Certified Records in Vault
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-border-hairline p-4 shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 rounded-xs">
        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto select-none">
          {[
            { id: 'All', label: 'All Documents', count: compiledDocs.length },
            { id: 'Contracts', label: 'Contracts & Agreements', count: compiledDocs.filter(d => d.type.toLowerCase().includes('contract') || d.type.toLowerCase().includes('purchase')).length },
            { id: 'Inspections', label: '150-Point Inspections', count: compiledDocs.filter(d => d.type.toLowerCase().includes('inspection')).length },
            { id: 'Customs', label: 'Customs Releases', count: compiledDocs.filter(d => d.type.toLowerCase().includes('customs') || d.type.toLowerCase().includes('release')).length }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                categoryFilter === cat.id
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[9px] font-mono px-1 py-0.2 rounded-2xs ${
                categoryFilter === cat.id ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-600'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by car, VIN, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-light-bg border border-border-hairline rounded-xs pl-9 pr-4 py-1.5 text-xs outline-hidden focus:border-brand-red text-charcoal placeholder:text-neutral-400 font-sans"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Full-width Documents Table */}
      <div className="bg-white border border-border-hairline shadow-xs overflow-hidden rounded-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/80 border-b border-border-hairline text-[9px] font-mono text-neutral-400 uppercase tracking-wider select-none">
                <th className="py-3 px-4 font-semibold">Document & Type</th>
                <th className="py-3 px-4 font-semibold">Allocated Car / Vehicle</th>
                <th className="py-3 px-4 font-semibold">Customer / Buyer</th>
                <th className="py-3 px-4 font-semibold">File Specs</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-hairline">
              {filteredDocs.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => setPreviewDoc(doc)}
                  className="hover:bg-neutral-50/60 transition-colors group cursor-pointer"
                >
                  {/* Column 1: Document & Type */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xs bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0 border border-brand-red/20">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="leading-tight">
                        <span className="font-display font-bold uppercase text-xs text-charcoal block group-hover:text-brand-red transition-colors">
                          {doc.name}
                        </span>
                        <span className="text-[9px] font-mono text-neutral-400 block mt-0.5">
                          {doc.type} • Doc Ref: {doc.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Vehicle */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={doc.vehicleImage}
                        alt={doc.vehicleModel}
                        className="w-11 h-8 object-cover rounded-xs border border-neutral-200 shrink-0"
                      />
                      <div className="leading-tight">
                        <span className="font-display font-bold uppercase text-[11px] text-charcoal block">
                          {doc.vehicleModel} ({doc.vehicleYear})
                        </span>
                        <span className="text-[9px] font-mono text-neutral-400 block mt-0.5">
                          VIN: {doc.vehicleVin}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Column 3: Customer */}
                  <td className="py-3.5 px-4">
                    <div className="leading-tight">
                      <span className="font-display font-bold uppercase text-[11px] text-charcoal block">
                        {doc.customerName}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-400 block mt-0.5">
                        {doc.customerEmail}
                      </span>
                    </div>
                  </td>

                  {/* Column 4: File Specs */}
                  <td className="py-3.5 px-4 font-mono text-[10px] text-neutral-500">
                    <div>{doc.fileSize}</div>
                    <div className="text-[9px] text-neutral-400 mt-0.5">
                      {new Date(doc.issueDate || Date.now()).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Column 5: Status */}
                  <td className="py-3.5 px-4">
                    <span className="text-[8px] font-mono uppercase px-2 py-0.5 rounded-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {doc.status}
                    </span>
                  </td>

                  {/* Column 6: Actions */}
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="px-2.5 py-1 bg-neutral-100 hover:bg-[#0F172A] hover:text-white text-charcoal text-[9px] font-mono font-bold uppercase rounded-xs transition-colors cursor-pointer"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => triggerToast(`Downloading PDF for ${doc.name}...`)}
                        className="p-1.5 border border-neutral-200 hover:bg-neutral-100 text-neutral-500 hover:text-charcoal rounded-xs cursor-pointer transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SIMPLIFIED & SCROLLABLE DOCUMENT PREVIEW MODAL               */}
      {/* ============================================================ */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white w-full max-w-2xl border border-neutral-200 shadow-2xl rounded-xs overflow-hidden flex flex-col max-h-[85vh] my-auto text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#0F172A] text-white p-4 sm:p-5 flex justify-between items-center shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xs bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-mono text-brand-red uppercase tracking-widest font-bold block">
                    Certified Record Preview
                  </span>
                  <h3 className="text-base sm:text-lg font-display font-extrabold uppercase text-white leading-tight">
                    {previewDoc.name}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 bg-slate-800 hover:bg-brand-red text-slate-300 hover:text-white rounded-xs transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 overflow-y-auto flex-1 min-h-0 space-y-5 text-xs font-sans">
              {/* Document Certificate Sheet */}
              <div className="flex justify-between items-start border-b-2 border-charcoal pb-4">
                <div>
                  <h4 className="font-display font-extrabold text-sm uppercase text-charcoal tracking-wide">
                    KISACO AUTO SALES LTD
                  </h4>
                  <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mt-0.5">
                    Official Vehicle Registry & Title Escrow Custody
                  </p>
                  <p className="text-[9px] text-neutral-400 font-mono mt-0.5">
                    60 Montgomery Avenue, Richmond Park • Tax ID: JM-9482-A
                  </p>
                </div>
                <div className="text-right font-mono text-[10px]">
                  <span className="text-brand-red font-bold uppercase block">{previewDoc.type}</span>
                  <span className="text-neutral-500 block">Doc ID: {previewDoc.id}</span>
                  <span className="text-neutral-400 block">{new Date(previewDoc.issueDate || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Linked Car & Customer Details Box */}
              <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-xs grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                    Vehicle Assigned
                  </span>
                  <h5 className="font-display font-bold uppercase text-charcoal text-xs mt-1">
                    {previewDoc.vehicleModel} ({previewDoc.vehicleYear})
                  </h5>
                  <p className="font-mono text-[10px] text-neutral-500 mt-0.5">VIN: {previewDoc.vehicleVin}</p>
                </div>
                <div>
                  <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                    Registered Client / Buyer
                  </span>
                  <h5 className="font-display font-bold uppercase text-charcoal text-xs mt-1">
                    {previewDoc.customerName}
                  </h5>
                  <p className="font-mono text-[10px] text-neutral-500 mt-0.5">{docEmailOrPhone(previewDoc)}</p>
                </div>
              </div>

              {/* Certified Metadata */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-charcoal block">
                  Document Metadata & Options
                </span>
                {previewDoc.options ? (
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-white p-3 rounded-xs border border-neutral-200">
                    {Object.entries(previewDoc.options).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-neutral-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                        <strong className="text-charcoal">{String(v)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-neutral-500 font-sans italic bg-white p-3 border border-neutral-200 rounded-xs">
                    Standard certified document verified by authorized brokerage agents and counter-signed in escrow.
                  </p>
                )}
              </div>

              {/* Official Cryptographic Stamp */}
              <div className="border border-dashed border-neutral-300 p-4 rounded-xs bg-white flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-display font-bold text-xs uppercase">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Cryptographic Audit Proof: {previewDoc.status}</span>
                  </div>
                  <span className="font-mono text-[9px] text-neutral-400 block break-all">
                    {previewDoc.hash || 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'}
                  </span>
                </div>

                <div className="border-2 border-emerald-600 text-emerald-700 px-3 py-1 text-center font-display font-extrabold uppercase text-[10px] tracking-widest shrink-0 rotate-[-2deg]">
                  OFFICIALLY SEALED
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-neutral-50 border-t border-neutral-200 p-3 sm:p-4 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-mono text-neutral-500">
                File Size: <strong className="text-charcoal">{previewDoc.fileSize}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerToast(`Print command sent for ${previewDoc.name}.`)}
                  className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-charcoal text-xs font-mono font-bold uppercase rounded-xs transition-colors cursor-pointer"
                >
                  Print
                </button>
                <button
                  onClick={() => {
                    triggerToast(`Downloaded ${previewDoc.name}.`);
                    setPreviewDoc(null);
                  }}
                  className="px-4 py-1.5 bg-brand-red hover:bg-red-700 text-white text-xs font-mono font-bold uppercase rounded-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function docEmailOrPhone(doc) {
  if (doc.customerEmail && doc.customerPhone) {
    return `${doc.customerEmail} • ${doc.customerPhone}`;
  }
  return doc.customerEmail || doc.customerPhone || 'Contact on file';
}
