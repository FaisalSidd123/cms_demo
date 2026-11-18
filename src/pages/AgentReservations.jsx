import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useMockData } from '../hooks/useMockData';
import { TableSkeleton } from '../components/Skeletons';
import { 
  CalendarRange, 
  Car, 
  User, 
  Clock, 
  Check, 
  X, 
  Plus, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FolderLock,
  FileText,
  Printer,
  Download
} from 'lucide-react';

export default function AgentReservations({ 
  sharedReservations = [], 
  onUpdateReservations, 
  sharedVehicles = [],
  onUpdateVehicles
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const isReserveFlow = location.pathname === '/agent/reserve';

  // Load client and base datasets
  const { data: clientsList, isLoading: clientsLoading } = useMockData('clients');
  const { data: vehiclesList, isLoading: vehiclesLoading } = useMockData('vehicles');
  const { data: initialRes, isLoading: resLoading } = useMockData('reservations');

  const isLoading = clientsLoading || vehiclesLoading || resLoading;

  // Local state synchronization
  const [resList, setResList] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [selectedInvoiceRes, setSelectedInvoiceRes] = useState(null);
  
  // Form states
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [holdDuration, setHoldDuration] = useState('48');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Load state parameters if redirected with pre-selected client
  useEffect(() => {
    if (location.state?.preselectedClientId) {
      setSelectedClient(location.state.preselectedClientId);
    }
  }, [location.state]);

  // Sync holds list
  useEffect(() => {
    if (sharedReservations.length > 0) {
      setResList(sharedReservations);
    } else if (initialRes) {
      setResList(initialRes);
    }
  }, [sharedReservations, initialRes]);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Status badges colors mapping
  const getStatusColor = (status, isExpiring) => {
    if (isExpiring) return 'bg-red-50 text-red-600 border-red-200 ring-2 ring-red-500/10';
    if (status === 'Pending') return 'bg-amber-50 text-amber-600 border-amber-200';
    if (status === 'Confirmed') return 'bg-blue-50 text-blue-600 border-blue-200';
    if (status === 'Converted to Sale') return 'bg-purple-50 text-purple-600 border-purple-200';
    return 'bg-neutral-50 text-neutral-400 border-neutral-200';
  };

  const checkExpiring = (res) => {
    if (res.status !== 'Pending' && res.status !== 'Confirmed') return false;
    const hoursLeft = (new Date(res.holdExpiresAt) - new Date()) / (1000 * 60 * 60);
    return hoursLeft > 0 && hoursLeft < 6;
  };

  // Actions
  const handleConvert = (resId, vehicleId) => {
    // 1. Update reservation status
    const updated = resList.map(r => r.id === resId ? { ...r, status: 'Converted to Sale' } : r);
    setResList(updated);
    onUpdateReservations(updated);

    // 2. Set vehicle status as sold in global state
    const currentVehicles = vehiclesList || sharedVehicles;
    const updatedVehicles = currentVehicles.map(v => v.id === vehicleId ? { ...v, status: 'sold' } : v);
    onUpdateVehicles(updatedVehicles);

    triggerToast(`Hold ${resId} converted to sale. VIN status marked Sold.`);
  };

  const handleCancel = (resId, vehicleId) => {
    // 1. Update reservation status to expired
    const updated = resList.map(r => r.id === resId ? { ...r, status: 'Expired' } : r);
    setResList(updated);
    onUpdateReservations(updated);

    // 2. Restore vehicle to available in global state
    const currentVehicles = vehiclesList || sharedVehicles;
    const updatedVehicles = currentVehicles.map(v => v.id === vehicleId ? { ...v, status: 'available' } : v);
    onUpdateVehicles(updatedVehicles);

    triggerToast(`Hold ${resId} cancelled. Vehicle returned to catalog.`);
  };

  const handleExtend = (resId) => {
    const updated = resList.map(r => {
      if (r.id === resId) {
        const currentExpiry = new Date(r.holdExpiresAt);
        const newExpiry = new Date(currentExpiry.getTime() + 24 * 60 * 60 * 1000).toISOString();
        return { ...r, holdExpiresAt: newExpiry, holdDurationHours: r.holdDurationHours + 24 };
      }
      return r;
    });
    setResList(updated);
    onUpdateReservations(updated);
    triggerToast(`Hold ${resId} extended by 24 hours.`);
  };

  // Form submit
  const handlePlaceHold = (e) => {
    e.preventDefault();
    if (!selectedClient || !selectedVehicle) return;

    const vehicleId = parseInt(selectedVehicle);
    const durationHours = parseInt(holdDuration);
    
    // Create new reservation
    const newResId = `res-${Math.floor(4000 + Math.random() * 9000)}`;
    const newRes = {
      id: newResId,
      clientId: selectedClient,
      vehicleId: vehicleId,
      assignedAgentId: 'agent-101',
      status: 'Pending',
      createdDate: new Date().toISOString(),
      holdDurationHours: durationHours,
      holdExpiresAt: new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
    };

    // Update global holding lists
    const updatedReservations = [newRes, ...resList];
    setResList(updatedReservations);
    onUpdateReservations(updatedReservations);

    // Set vehicle status to reserved in global state
    const currentVehicles = vehiclesList || sharedVehicles;
    const updatedVehicles = currentVehicles.map(v => v.id === vehicleId ? { ...v, status: 'reserved' } : v);
    onUpdateVehicles(updatedVehicles);

    triggerToast(`VIN locked under client file. Hold ID: ${newResId}`);
    setTimeout(() => {
      navigate('/agent/reservations');
    }, 1200);
  };

  if (isLoading) {
    return <TableSkeleton rows={4} cols={4} />;
  }

  // 1. PLACE RESERVATION FLOW
  if (isReserveFlow) {
    const currentVehicles = vehiclesList || sharedVehicles;
    const availableVehicles = currentVehicles.filter(v => v.status === 'available');

    return (
      <div className="space-y-8 text-left max-w-xl mx-auto">
        {toastMsg && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-charcoal text-white text-xs font-mono uppercase tracking-widest px-6 py-4 border border-brand-red/30 shadow-2xl">
            {toastMsg}
          </div>
        )}

        {/* Back navigation */}
        <div>
          <button 
            onClick={() => navigate('/agent/reservations')}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-brand-red transition-colors font-mono uppercase tracking-widest cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Reservations</span>
          </button>
        </div>

        {/* Header */}
        <div className="pb-4 border-b border-border-hairline">
          <span className="text-[9px] font-mono text-brand-red uppercase tracking-widest block mb-0.5">// Lock Operations</span>
          <h2 className="text-xl font-display font-extrabold text-charcoal uppercase leading-none">
            Place VIN Hold
          </h2>
          <p className="text-[11px] text-neutral-400 font-sans mt-1">
            Reserve a vehicle from catalog inventory and allocate it to a client lead folder.
          </p>
        </div>

        {/* Form panel */}
        <div className="bg-white border border-border-hairline p-6 shadow-xs">
          <form onSubmit={handlePlaceHold} className="space-y-6">
            
            {/* Step 1: Select Client */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-neutral-300" />
                <span>1. Select Client Folder</span>
              </label>
              <select
                required
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="bg-white border border-border-hairline px-3.5 py-2.5 text-xs text-charcoal outline-hidden focus:border-brand-red cursor-pointer"
              >
                <option value="">-- Choose Client --</option>
                {clientsList?.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                ))}
              </select>
            </div>

            {/* Step 2: Select Available Vehicle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-neutral-300" />
                <span>2. Select Available Vehicle</span>
              </label>
              <select
                required
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="bg-white border border-border-hairline px-3.5 py-2.5 text-xs text-charcoal outline-hidden focus:border-brand-red cursor-pointer"
              >
                <option value="">-- Choose Vehicle --</option>
                {currentVehicles.map(v => (
                  <option 
                    key={v.id} 
                    value={v.id} 
                    disabled={v.status !== 'available'}
                  >
                    {v.model} ({v.year}) - {v.price} {v.status !== 'available' ? `[${v.status.toUpperCase()}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3: Hold Duration */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-300" />
                <span>3. Configure Hold Duration</span>
              </label>
              <select
                value={holdDuration}
                onChange={(e) => setHoldDuration(e.target.value)}
                className="bg-white border border-border-hairline px-3.5 py-2.5 text-xs text-charcoal outline-hidden focus:border-brand-red cursor-pointer"
              >
                <option value="24">24 Hours (1 Day)</option>
                <option value="48">48 Hours (2 Days)</option>
                <option value="72">72 Hours (3 Days)</option>
                <option value="168">168 Hours (7 Days)</option>
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-brand-red hover:bg-brand-red-hover text-white text-xs font-bold uppercase tracking-widest py-4 flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <FolderLock className="w-4 h-4" />
              <span>Confirm hold lock</span>
            </button>

          </form>
        </div>

      </div>
    );
  }

  // 2. RESERVATIONS LIST VIEW
  const currentVehicles = vehiclesList || sharedVehicles;

  const filteredRes = resList.filter(res => {
    const client = clientsList?.find(c => c.id === res.clientId);
    const vehicle = currentVehicles.find(v => v.id === res.vehicleId);
    const isExpiring = checkExpiring(res);

    const matchesSearch =
      (client?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle?.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Expiring'
          ? isExpiring
          : statusFilter === 'Active'
            ? (res.status === 'Pending' || res.status === 'Confirmed')
            : res.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 text-left relative">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-charcoal text-white text-xs font-mono uppercase tracking-widest px-6 py-4 border border-brand-red/30 shadow-2xl">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-hairline pb-4">
        <div>
          <span className="text-[9px] font-mono text-brand-red uppercase tracking-widest block mb-0.5">// Reservation Ledger</span>
          <h2 className="text-xl md:text-2xl font-display font-extrabold text-charcoal uppercase leading-none">
            Hold Registrations
          </h2>
          <p className="text-[11px] text-neutral-400 font-sans mt-1">
            Track hold countdowns, extend reservation deadlines, or convert active locks to sales.
          </p>
        </div>
        <Link
          to="/agent/reserve"
          className="bg-brand-red hover:bg-brand-red-hover text-white text-xs font-bold uppercase tracking-widest px-5 py-3 transition-colors inline-flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Hold</span>
        </Link>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white border border-border-hairline p-4 shadow-xs">
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          {['All', 'Active', 'Expiring', 'Converted to Sale', 'Expired'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xs font-bold uppercase transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-charcoal text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search holds by client or vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-light-bg border border-border-hairline px-3 py-1.5 text-xs text-charcoal outline-hidden focus:border-brand-red font-sans"
          />
        </div>
      </div>

      {/* Grid List representation */}
      {filteredRes.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRes.map((res) => {
            const client = clientsList?.find(c => c.id === res.clientId);
            const vehicle = currentVehicles.find(v => v.id === res.vehicleId);
            const isExpiring = checkExpiring(res);
            
            // Expiry countdown calculations
            const expTime = new Date(res.holdExpiresAt);
            const hoursLeft = Math.max(0, (expTime - new Date()) / (1000 * 60 * 60));

            return (
              <div 
                key={res.id} 
                className={`border bg-white p-5 flex flex-col justify-between min-h-[250px] transition-all shadow-xs rounded-xs ${
                  isExpiring 
                    ? 'border-red-300 ring-2 ring-red-500/10 bg-red-50/10' 
                    : 'border-border-hairline'
                }`}
              >
                <div>
                  {/* Header metadata row */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-mono bg-neutral-100 text-charcoal px-2 py-0.5 font-bold uppercase tracking-wider">
                      {res.id}
                    </span>
                    
                    {/* Status Badge */}
                    <span className={`text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 border rounded-xs font-bold ${
                      getStatusColor(res.status, isExpiring)
                    }`}>
                      {isExpiring ? 'Expiring Soon' : res.status}
                    </span>
                  </div>

                  {/* Main specs info with vehicle thumbnail */}
                  <div className="flex items-start gap-4">
                    {vehicle?.thumbnailImage && (
                      <img
                        src={vehicle.thumbnailImage}
                        alt={vehicle.model}
                        className="w-16 h-12 object-cover rounded-xs border border-neutral-200 shrink-0 shadow-2xs"
                      />
                    )}
                    <div className="flex-1 grid grid-cols-2 gap-3 text-left">
                      <div>
                        <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest block">Client Lead</span>
                        <Link 
                          to={`/agent/clients/${client?.id}`}
                          className="font-display font-bold text-xs uppercase text-charcoal hover:text-brand-red hover:underline block truncate mt-0.5"
                        >
                          {client?.name || 'Allocating client...'}
                        </Link>
                        <span className="text-[9px] font-mono text-neutral-400 block mt-0.5">{client?.phone}</span>
                      </div>

                      <div>
                        <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest block">Allocated VIN</span>
                        <span className="font-mono font-bold text-xs text-charcoal block truncate mt-0.5">
                          {vehicle?.model || 'Allocating vehicle...'}
                        </span>
                        <span className="text-[9px] font-mono text-brand-red font-bold block mt-0.5">{vehicle?.price}</span>
                      </div>
                    </div>
                  </div>

                  {/* Hold Deposit & Expiry time indicator */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-between items-center text-xs text-neutral-500">
                    <span className="text-[9px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-2xs font-bold">
                      Hold Deposit: $5,000 Vault
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      {res.status === 'Pending' || res.status === 'Confirmed' ? (
                        <span className={`font-mono text-[10px] font-semibold ${isExpiring ? 'text-red-600 font-bold' : ''}`}>
                          {hoursLeft.toFixed(1)}h remaining
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-neutral-400 uppercase">
                          {res.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Operations buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-neutral-100">
                  <button
                    onClick={() => setSelectedInvoiceRes(res)}
                    className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 bg-[#0F172A] hover:bg-slate-800 text-white text-[9px] font-mono font-bold uppercase py-2 px-3 rounded-xs cursor-pointer transition-colors shadow-2xs"
                    title="Generate Holding Deposit Invoice"
                  >
                    <FileText className="w-3.5 h-3.5 text-brand-red" />
                    <span>Generate Invoice</span>
                  </button>

                  {(res.status === 'Pending' || res.status === 'Confirmed') && (
                    <>
                      <button
                        onClick={() => handleConvert(res.id, res.vehicleId)}
                        className="flex-1 min-w-[110px] bg-brand-red hover:bg-brand-red-hover text-white text-[9px] font-mono font-bold uppercase py-2 cursor-pointer transition-colors text-center rounded-xs"
                      >
                        Convert to Sale
                      </button>
                      <button
                        onClick={() => handleExtend(res.id)}
                        className="px-3 border border-neutral-200 hover:border-charcoal hover:bg-neutral-50 text-charcoal text-[9px] font-mono font-bold uppercase py-2 cursor-pointer transition-all text-center rounded-xs"
                      >
                        Extend
                      </button>
                      <button
                        onClick={() => handleCancel(res.id, res.vehicleId)}
                        className="p-2 border border-neutral-200 hover:border-red-500 hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-all cursor-pointer flex items-center justify-center rounded-xs"
                        title="Cancel Hold"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-border-hairline bg-white p-16 text-center text-neutral-400 font-sans text-xs">
          No hold registrations currently logged.
        </div>
      )}

      {/* AUTOMATIC HOLDING INVOICE MODAL */}
      {selectedInvoiceRes && (() => {
        const client = clientsList?.find(c => c.id === selectedInvoiceRes.clientId);
        const vehicle = currentVehicles.find(v => v.id === selectedInvoiceRes.vehicleId);
        const invoiceNum = `INV-HOLD-${selectedInvoiceRes.id.replace(/[^0-9]/g, '') || '4021'}`;
        const holdFee = '$5,000.00';
        const rawPriceNum = parseInt(vehicle?.price?.replace(/[^0-9]/g, '') || '65000');
        const remainingNum = Math.max(0, rawPriceNum - 5000);

        return (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            onClick={() => setSelectedInvoiceRes(null)}
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
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-brand-red uppercase tracking-widest font-bold">
                        Auto-Generated Pro-Forma Invoice
                      </span>
                      <span className="text-[8px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded-2xs font-bold">
                        Official Escrow Lock
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-display font-extrabold uppercase text-white leading-tight">
                      {invoiceNum}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedInvoiceRes(null)}
                  className="p-1.5 bg-slate-800 hover:bg-brand-red text-slate-300 hover:text-white rounded-xs transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-5 overflow-y-auto flex-1 min-h-0 space-y-5 text-xs font-sans">
                {/* Official Letterhead */}
                <div className="flex justify-between items-start border-b border-neutral-200 pb-4">
                  <div>
                    <h4 className="font-display font-extrabold text-sm uppercase text-charcoal tracking-wide">
                      KISACO AUTO SALES LTD
                    </h4>
                    <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
                      60 Montgomery Avenue, Richmond Park • Escrow Dept
                    </p>
                    <p className="text-[10px] font-mono text-neutral-400">
                      Tax Reg: JM-9482-A • SWIFT: CGASUS33
                    </p>
                  </div>
                  <div className="text-right font-mono text-[10px]">
                    <span className="text-neutral-400 uppercase block">Invoice Date</span>
                    <strong className="text-charcoal block">{new Date(selectedInvoiceRes.createdDate || Date.now()).toLocaleDateString()}</strong>
                    <span className="text-neutral-400 uppercase block mt-1">Due By</span>
                    <strong className="text-brand-red block">{new Date(selectedInvoiceRes.holdExpiresAt).toLocaleDateString()}</strong>
                  </div>
                </div>

                {/* Billed To & Vehicle Info */}
                <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-3.5 rounded-xs border border-neutral-200">
                  <div>
                    <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                      Bill To (Buyer)
                    </span>
                    <h5 className="font-display font-bold uppercase text-charcoal text-xs mt-0.5">
                      {client?.name || 'Client Lead'}
                    </h5>
                    <p className="font-mono text-[10px] text-neutral-500 mt-0.5">{client?.phone}</p>
                    <p className="font-mono text-[10px] text-neutral-500">{client?.email || 'client@kisacoauto.com'}</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                      Allocated Vehicle
                    </span>
                    <h5 className="font-display font-bold uppercase text-charcoal text-xs mt-0.5">
                      {vehicle?.model} ({vehicle?.year})
                    </h5>
                    <p className="font-mono text-[10px] text-neutral-500 mt-0.5">VIN: {vehicle?.vin || 'VIN-PENDING-HOLD'}</p>
                    <p className="font-mono text-[10px] text-neutral-500">Hold Window: {selectedInvoiceRes.holdDurationHours} Hours</p>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="border border-neutral-200 rounded-xs overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-[8px] font-mono text-neutral-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Item / Service Description</th>
                        <th className="py-2.5 px-3 text-center">Duration</th>
                        <th className="py-2.5 px-3 text-right">Amount Due Now</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
                      <tr>
                        <td className="py-2.5 px-3">
                          <strong className="font-sans font-semibold text-charcoal block">
                            Vehicle Reservation & Priority VIN Holding Deposit
                          </strong>
                          <span className="text-[9px] text-neutral-400 block font-normal">
                            Guarantees exclusive purchase option in Escrow Trust. Refundable or applied to final price.
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-neutral-500 font-sans">
                          {selectedInvoiceRes.holdDurationHours}h
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-charcoal">
                          {holdFee}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3">
                          <strong className="font-sans font-semibold text-charcoal block">
                            Escrow Vault Allocation & Title Lock
                          </strong>
                          <span className="text-[9px] text-neutral-400 block font-normal">
                            Regulatory escrow custodian holding assurance.
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-neutral-500 font-sans">
                          Included
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                          $0.00
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Total & Remaining Deal Balance Strip */}
                <div className="bg-neutral-50 border border-neutral-200 p-3.5 rounded-xs flex justify-between items-center">
                  <div>
                    <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-wider block">
                      Total Vehicle Price
                    </span>
                    <span className="font-mono text-xs font-bold text-neutral-600 block">
                      {vehicle?.price || '$65,000'}
                    </span>
                    <span className="text-[9px] font-mono text-neutral-400 mt-0.5 block">
                      Balance on Delivery: ${remainingNum.toLocaleString()}.00
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-brand-red uppercase tracking-widest font-bold block">
                      Amount Due Now
                    </span>
                    <span className="text-xl font-display font-black text-brand-red block">
                      {holdFee}
                    </span>
                  </div>
                </div>

                {/* Payment Instructions */}
                <div className="bg-white border border-dashed border-neutral-300 p-3 rounded-xs text-[10px] font-mono text-neutral-500 space-y-1">
                  <span className="font-bold uppercase text-charcoal block">Wire Payment Instructions:</span>
                  <p>Bank: First Caribbean International Bank • Account: 9942-8819-01</p>
                  <p>Beneficiary: Kisaco Auto Sales Escrow Trust • Ref: {invoiceNum}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-neutral-50 border-t border-neutral-200 p-3 sm:p-4 flex justify-between items-center shrink-0">
                <span className="text-[10px] font-mono text-neutral-400">
                  Status: <strong>Active Escrow Demand</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => triggerToast(`Invoice ${invoiceNum} sent to printer.`)}
                    className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-charcoal text-xs font-mono font-bold uppercase rounded-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerToast(`Downloaded PDF for ${invoiceNum}.`);
                      setSelectedInvoiceRes(null);
                    }}
                    className="px-4 py-1.5 bg-brand-red hover:bg-red-700 text-white text-xs font-mono font-bold uppercase rounded-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Invoice</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
