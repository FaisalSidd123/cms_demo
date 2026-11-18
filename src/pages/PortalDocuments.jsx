import React, { useState } from 'react';
import { useMockData } from '../hooks/useMockData';
import { TableSkeleton } from '../components/Skeletons';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Search, 
  Calendar,
  Layers,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  CheckCircle2,
  X,
  ShieldCheck,
  Car,
  FileCheck,
  Printer
} from 'lucide-react';

export default function PortalDocuments() {
  const { data: documentsList, isLoading } = useMockData('documents');
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [downloadToast, setDownloadToast] = useState('');

  // Extract unique vehicles for filter pills
  const vehicleOptions = ['All', ...new Set(documentsList?.map(d => d.vehicleName) || [])];
  const typeOptions = ['All', 'Invoice', 'Inspection Report', 'Sales Contract', 'Bill of Lading'];

  const triggerDownload = (fileName) => {
    setDownloadToast(`Starting download: ${fileName}`);
    setTimeout(() => setDownloadToast(''), 3000);
  };

  // Filter logic
  const filteredDocs = documentsList?.filter((doc) => {
    const matchesSearch = 
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.vehicleVin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVehicle = vehicleFilter === 'All' || doc.vehicleName === vehicleFilter;
    const matchesType = typeFilter === 'All' || doc.type === typeFilter;

    return matchesSearch && matchesVehicle && matchesType;
  });

  return (
    <div className="space-y-8 text-left relative">
      
      {/* Toast Notification */}
      {downloadToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-charcoal text-white text-xs font-mono uppercase tracking-widest px-6 py-4 border border-brand-red/30 shadow-2xl flex items-center gap-2">
          <Download className="w-4 h-4 text-brand-red" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <span className="text-[10px] font-mono text-brand-red uppercase tracking-widest block mb-1">// Document Vault</span>
        <h2 className="text-2xl md:text-3xl font-display font-extrabold text-charcoal uppercase">
          Vehicle & Transaction Documents
        </h2>
        <p className="text-xs text-neutral-500 font-sans mt-1">
          Review and download certified sales contracts, inspection reports, customs clearances, and bills of lading categorized by vehicle.
        </p>
      </div>

      {/* Vehicle Filter Pills */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider font-semibold shrink-0 mr-1">
            Filter by Vehicle:
          </span>
          {vehicleOptions.map((vName) => {
            const count = vName === 'All'
              ? documentsList?.length || 0
              : documentsList?.filter(d => d.vehicleName === vName).length || 0;

            return (
              <button
                key={vName}
                onClick={() => setVehicleFilter(vName)}
                className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border rounded-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  vehicleFilter === vName
                    ? 'bg-charcoal text-white border-charcoal font-bold shadow-xs'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                <Car className="w-3 h-3 text-brand-red" />
                <span>{vName}</span>
                <span className={`text-[9px] px-1 py-0.2 rounded-xs ${
                  vehicleFilter === vName ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Type Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white border border-border-hairline p-4 shadow-xs">
          
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by document title, car, VIN, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-light-bg border border-border-hairline rounded-sm pl-9 pr-4 py-2 text-xs outline-hidden focus:border-brand-red transition-all text-charcoal placeholder:text-neutral-400 font-sans"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Type Filter pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mr-1">Type:</span>
            {typeOptions.map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider border rounded-xs transition-all cursor-pointer ${
                  typeFilter === type
                    ? 'bg-brand-red border-brand-red text-white font-bold'
                    : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Documents Table */}
      {isLoading ? (
        <TableSkeleton rows={4} cols={6} />
      ) : filteredDocs && filteredDocs.length > 0 ? (
        <div className="bg-white border border-border-hairline shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-border-hairline text-[10px] font-mono text-neutral-400 uppercase tracking-widest select-none">
                  <th className="py-4 px-6 font-semibold">Allocated Vehicle & VIN</th>
                  <th className="py-4 px-6 font-semibold">Document Title</th>
                  <th className="py-4 px-6 font-semibold">Order Ref</th>
                  <th className="py-4 px-6 font-semibold">Issue Date</th>
                  <th className="py-4 px-6 font-semibold">Verification</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-hairline text-xs">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-neutral-50/60 transition-colors">
                    
                    {/* Vehicle & VIN */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={doc.vehicleImage}
                          alt={doc.vehicleName}
                          className="w-12 h-9 object-cover rounded-sm border border-neutral-200 shrink-0"
                        />
                        <div>
                          <span className="font-display font-bold uppercase tracking-wider text-[11px] text-charcoal block">
                            {doc.vehicleName} ({doc.vehicleYear})
                          </span>
                          <span className="text-[9px] font-mono text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded-xs border border-neutral-200 font-bold block mt-0.5 w-fit">
                            VIN: {doc.vehicleVin}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Document Title & Type */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {doc.type === 'Invoice' ? (
                          <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-brand-red shrink-0" />
                        )}
                        <div>
                          <span className="font-display font-bold uppercase tracking-wider text-[11px] text-charcoal block">
                            {doc.title}
                          </span>
                          <span className="text-[9px] font-mono text-neutral-400 mt-0.5 block">
                            {doc.fileName} • {doc.fileSizeLabel}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Order reference */}
                    <td className="py-4 px-6">
                      <span className="font-mono text-neutral-500 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-sm font-bold uppercase text-[10px]">
                        {doc.orderId}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 text-neutral-500 font-mono">
                      {new Date(doc.issueDate).toLocaleDateString()}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-xs font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{doc.status}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="px-2.5 py-1.5 border border-neutral-200 hover:border-brand-red hover:bg-brand-red/5 text-charcoal hover:text-brand-red transition-all cursor-pointer inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest font-bold"
                          title="Preview Document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        <button
                          onClick={() => triggerDownload(doc.fileName)}
                          className="p-1.5 border border-neutral-200 hover:border-charcoal hover:bg-neutral-100 text-charcoal transition-all cursor-pointer inline-flex items-center"
                          title="Download Document"
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
      ) : (
        <div className="border border-border-hairline bg-white p-16 text-center text-neutral-400 font-sans text-xs flex flex-col items-center justify-center gap-2">
          <AlertCircle className="w-6 h-6 text-neutral-300" />
          <span>No documents found matching the filter parameters.</span>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      <AnimatePresence>
        {previewDoc && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewDoc(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white border border-neutral-200 shadow-2xl w-full max-w-2xl max-h-[85vh] my-auto flex flex-col overflow-hidden text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/80 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-brand-red/10 border border-brand-red/20 rounded-xs flex items-center justify-center text-brand-red">
                    <FileCheck className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm uppercase text-charcoal tracking-wide">
                      {previewDoc.title}
                    </h3>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mt-0.5">
                      {previewDoc.fileName} • {previewDoc.fileSizeLabel}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-charcoal hover:bg-neutral-200/50 rounded-xs transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-6">

                {/* Car Allocation Ribbon */}
                <div className="flex items-center gap-4 bg-neutral-50 p-4 border border-neutral-200 rounded-xs">
                  <img
                    src={previewDoc.vehicleImage}
                    alt={previewDoc.vehicleName}
                    className="w-20 h-14 object-cover rounded-xs border border-neutral-200 shrink-0"
                  />
                  <div className="flex-1">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">
                      Allocated Vehicle Record
                    </span>
                    <h4 className="font-display font-bold text-sm uppercase text-charcoal mt-0.5">
                      {previewDoc.vehicleName} ({previewDoc.vehicleYear})
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-mono font-bold bg-neutral-200 text-charcoal px-1.5 py-0.2 rounded-xs">
                        VIN: {previewDoc.vehicleVin}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-400">
                        REF: {previewDoc.orderId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-neutral-50 border border-neutral-100">
                    <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-wider block">Document Type</span>
                    <span className="text-[11px] font-display font-bold text-charcoal mt-1 block uppercase">
                      {previewDoc.type}
                    </span>
                  </div>
                  <div className="p-3 bg-neutral-50 border border-neutral-100">
                    <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-wider block">Issue Date</span>
                    <span className="text-[11px] font-mono font-bold text-neutral-700 mt-1 block">
                      {new Date(previewDoc.issueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="p-3 bg-neutral-50 border border-neutral-100">
                    <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-wider block">Format</span>
                    <span className="text-[11px] font-mono font-bold text-brand-red mt-1 block uppercase">
                      PDF Secured
                    </span>
                  </div>
                  <div className="p-3 bg-neutral-50 border border-neutral-100">
                    <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-wider block">Legal Seal</span>
                    <span className="text-[11px] font-mono font-bold text-emerald-600 mt-1 block uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified
                    </span>
                  </div>
                </div>

                {/* Simulated Document Preview Paper */}
                <div className="border border-neutral-300 p-6 bg-white shadow-inner relative rounded-xs text-left">
                  {/* Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-4 pointer-events-none select-none">
                    <span className="text-6xl font-display font-black text-charcoal uppercase rotate-[-25deg]">
                      KISACO OFFICIAL
                    </span>
                  </div>

                  <div className="flex justify-between items-start border-b border-neutral-200 pb-4 mb-4">
                    <div>
                      <span className="font-display font-black text-sm uppercase tracking-wider text-charcoal">
                        KISACO AUTO SALES & ASSET MANAGEMENT
                      </span>
                      <p className="text-[9px] font-mono text-neutral-400 uppercase mt-0.5">
                        Global Automotive Settlement & Logistics Repository
                      </p>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 font-bold uppercase">
                      Certified True Copy
                    </span>
                  </div>

                  <div className="space-y-3 text-xs text-neutral-600 font-sans leading-relaxed">
                    <p>
                      This certificate validates that the vehicle document <strong>{previewDoc.title}</strong> has been officially filed in the platform registry for buyer <strong>Alexander Sterling</strong> in connection with transaction <strong>{previewDoc.orderId}</strong>.
                    </p>
                    <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xs font-mono text-[10px] space-y-1">
                      <div><strong className="text-charcoal">Vehicle Model:</strong> {previewDoc.vehicleName} ({previewDoc.vehicleYear})</div>
                      <div><strong className="text-charcoal">Chassis / VIN:</strong> {previewDoc.vehicleVin}</div>
                      <div><strong className="text-charcoal">Certified Signer:</strong> {previewDoc.signer}</div>
                      <div><strong className="text-charcoal">Digital Signature Hash:</strong> SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069</div>
                    </div>
                    <p className="text-[10px] text-neutral-400 font-sans italic">
                      This authenticated electronic ledger record carries full evidentiary status under international commercial transaction protocols.
                    </p>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between shrink-0">
                <button
                  onClick={() => triggerDownload(previewDoc.fileName)}
                  className="px-4 py-2 bg-brand-red hover:bg-brand-red-hover text-white text-xs font-mono uppercase tracking-widest font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Document</span>
                </button>

                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 border border-neutral-200 hover:border-neutral-300 text-charcoal text-xs font-mono uppercase tracking-widest font-semibold cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
