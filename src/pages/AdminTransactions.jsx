import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMockData } from '../hooks/useMockData';
import { TableSkeleton } from '../components/Skeletons';
import {
  DollarSign,
  Search,
  AlertTriangle,
  FileText,
  Calendar,
  TrendingUp,
  User,
  Car,
  SlidersHorizontal,
  Clock,
  CheckCircle,
  X,
  Eye,
  Download,
  ShieldCheck,
  Building,
  CreditCard,
  FileCheck,
  Plus,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  Share2,
  RefreshCw,
  Printer,
  Sparkles,
  Lock,
  Layers,
  HelpCircle,
  Truck
} from 'lucide-react';

export default function AdminTransactions({
  sharedTransactions = [],
  onUpdateTransactions,
  sharedVehicles = [],
  sharedClients = []
}) {
  const { data: initialTx, isLoading: txLoading } = useMockData('transactions');
  const { data: clientsList, isLoading: clientsLoading } = useMockData('clients');
  const { data: vehiclesList, isLoading: vehiclesLoading } = useMockData('vehicles');
  const { data: agentsList, isLoading: agentsLoading } = useMockData('agentsRoster');

  const isLoading = txLoading || clientsLoading || vehiclesLoading;

  // Use props if provided, fallback to mock data
  const txSource = sharedTransactions?.length > 0 ? sharedTransactions : (initialTx || []);
  const vehicles = sharedVehicles?.length > 0 ? sharedVehicles : (vehiclesList || []);
  const clients = sharedClients?.length > 0 ? sharedClients : (clientsList || []);

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('All'); // All, 2026-07, 2026-06, 2026-02
  const [statusTab, setStatusTab] = useState('All'); // All, Paid, Partially Paid, Pending, Overdue
  const [methodFilter, setMethodFilter] = useState('All');
  const [agentFilter, setAgentFilter] = useState('All');
  const [selectedTx, setSelectedTx] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showNewTxModal, setShowNewTxModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentTxId, setPaymentTxId] = useState('');
  const [paymentTitle, setPaymentTitle] = useState('Escrow Hold Deposit');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethodState, setPaymentMethodState] = useState('SWIFT Bank Wire');
  const [paymentStatusState, setPaymentStatusState] = useState('Cleared');
  const [paymentDateVal, setPaymentDateVal] = useState(new Date().toISOString().slice(0, 10));
  const [paymentRefVal, setPaymentRefVal] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [copiedVin, setCopiedVin] = useState('');

  // Extract transaction date
  const getTxDate = (tx) => tx.paymentDate || tx.dueDate || tx.clearedDate;

  const getTxMonthInfo = (tx) => {
    const dateStr = getTxDate(tx);
    if (!dateStr) return { key: 'Other', label: 'Other', shortLabel: 'Other' };
    const d = new Date(dateStr);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
    const shortLabel = `${d.toLocaleString('default', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`;
    return { key, label, shortLabel };
  };

  // Build unique month options
  const uniqueMonthsMap = new Map();
  txSource.forEach(tx => {
    const info = getTxMonthInfo(tx);
    if (info.key !== 'Other' && !uniqueMonthsMap.has(info.key)) {
      uniqueMonthsMap.set(info.key, info);
    }
  });
  const sortedMonths = Array.from(uniqueMonthsMap.values()).sort((a, b) => b.key.localeCompare(a.key));
  const monthOptions = [
    { key: 'All', label: 'All Months', count: txSource.length },
    ...sortedMonths.map(m => ({
      ...m,
      count: txSource.filter(tx => getTxMonthInfo(tx).key === m.key).length,
      isCurrent: m.key === '2026-07'
    }))
  ];

  // Scoped transactions for selected month (used for KPIs & monthly dossier)
  const scopedMonthTx = txSource.filter(tx => {
    if (monthFilter === 'All') return true;
    return getTxMonthInfo(tx).key === monthFilter;
  });

  // Calculate live financial KPI metrics scoped to the active month filter
  const totalVolume = scopedMonthTx.reduce((acc, curr) => {
    const val = parseInt(curr.totalAmount?.replace(/[^0-9]/g, '')) || 0;
    return acc + val;
  }, 0);

  const totalCleared = scopedMonthTx.reduce((acc, curr) => {
    const val = parseInt(curr.amountPaid?.replace(/[^0-9]/g, '')) || 0;
    return acc + val;
  }, 0);

  const totalOutstanding = scopedMonthTx.reduce((acc, curr) => {
    const val = parseInt(curr.balanceDue?.replace(/[^0-9]/g, '')) || 0;
    return acc + val;
  }, 0);

  const totalOverdue = scopedMonthTx
    .filter(tx => tx.paymentStatus === 'Overdue')
    .reduce((acc, curr) => {
      const val = parseInt(curr.balanceDue?.replace(/[^0-9]/g, '')) || 0;
      return acc + val;
    }, 0);

  const inEscrowVault = scopedMonthTx
    .filter(tx => tx.escrowStatus?.toLowerCase().includes('escrow') || tx.paymentStatus === 'Partially Paid')
    .reduce((acc, curr) => {
      const val = parseInt(curr.amountPaid?.replace(/[^0-9]/g, '')) || 0;
      return acc + val;
    }, 0);

  const monthHoldsCount = scopedMonthTx.filter(tx =>
    tx.escrowStatus?.toLowerCase().includes('escrow') ||
    tx.paymentStatus === 'Partially Paid' ||
    tx.paymentStatus === 'Pending'
  ).length;

  const fullySettledCount = scopedMonthTx.filter(t => t.paymentStatus === 'Paid').length;

  // Trigger toast helper
  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleCopyVin = (vin) => {
    navigator.clipboard?.writeText(vin);
    setCopiedVin(vin);
    triggerToast(`VIN ${vin} copied to clipboard!`);
    setTimeout(() => setCopiedVin(''), 2000);
  };

  // Status badges colors mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Partially Paid':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Overdue':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-neutral-50 text-neutral-600 border-neutral-200';
    }
  };

  // Filter transactions
  const filteredTx = txSource.filter(tx => {
    const matchesMonth = monthFilter === 'All' || getTxMonthInfo(tx).key === monthFilter;

    const matchesSearch =
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.vehicleModel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.vehicleVin || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusTab === 'All'
        ? true
        : statusTab === 'Escrow'
          ? (tx.escrowStatus?.toLowerCase().includes('escrow') || tx.paymentStatus === 'Partially Paid')
          : tx.paymentStatus === statusTab;

    const matchesMethod = methodFilter === 'All' || tx.paymentMethod === methodFilter;
    const matchesAgent = agentFilter === 'All' || tx.agentId === agentFilter;

    return matchesMonth && matchesSearch && matchesStatus && matchesMethod && matchesAgent;
  });

  // Action: mark milestone as cleared
  const handleToggleMilestone = (txId, milestoneId) => {
    const updated = txSource.map(tx => {
      if (tx.id === txId) {
        const updatedMilestones = tx.milestones.map(m => {
          if (m.id === milestoneId) {
            const nextStatus = m.status === 'Cleared' ? 'Pending' : 'Cleared';
            const paidDate = nextStatus === 'Cleared' ? new Date().toISOString() : null;
            return { ...m, status: nextStatus, paidDate };
          }
          return m;
        });

        // Recalculate amount paid
        const newPaidNum = updatedMilestones.reduce((acc, m) => {
          if (m.status === 'Cleared') {
            return acc + (parseInt(m.amount.replace(/[^0-9]/g, '')) || 0);
          }
          return acc;
        }, 0);

        const totalNum = parseInt(tx.totalAmount.replace(/[^0-9]/g, '')) || 0;
        const balanceNum = Math.max(0, totalNum - newPaidNum);

        let newStatus = tx.paymentStatus;
        if (balanceNum === 0) newStatus = 'Paid';
        else if (newPaidNum > 0) newStatus = 'Partially Paid';
        else newStatus = 'Pending';

        return {
          ...tx,
          milestones: updatedMilestones,
          amountPaid: `$${newPaidNum.toLocaleString()}`,
          balanceDue: `$${balanceNum.toLocaleString()}`,
          paymentStatus: newStatus
        };
      }
      return tx;
    });

    if (onUpdateTransactions) onUpdateTransactions(updated);
    if (selectedTx && selectedTx.id === txId) {
      setSelectedTx(updated.find(t => t.id === txId));
    }
    triggerToast('Payment milestone status updated successfully.');
  };

  // Add new payment tranche to existing deal
  const handleAddPaymentSubmit = (e) => {
    e.preventDefault();
    const effectiveTxId = paymentTxId || selectedTx?.id || txSource[0]?.id;
    if (!effectiveTxId || !paymentAmount) {
      triggerToast('Please select a deal and enter an amount.');
      return;
    }

    const amountNum = parseInt(paymentAmount.replace(/[^0-9]/g, '')) || 0;
    if (amountNum <= 0) {
      triggerToast('Please enter an amount greater than zero.');
      return;
    }

    const targetTx = txSource.find(t => t.id === effectiveTxId);
    if (!targetTx) return;

    const newMilestone = {
      id: `ms-${Date.now()}`,
      title: paymentTitle,
      amount: `$${amountNum.toLocaleString()}`,
      dueDate: new Date(paymentDateVal).toISOString(),
      paidDate: paymentStatusState === 'Cleared' ? new Date(paymentDateVal).toISOString() : null,
      status: paymentStatusState,
      method: paymentMethodState,
      ref: paymentRefVal.trim() || `WIRE-US-${Math.floor(100000 + Math.random() * 900000)}`,
      bankTrace: `CHASUS33-MT103-${Math.floor(1000 + Math.random() * 9000)}`
    };

    const updated = txSource.map(tx => {
      if (tx.id === effectiveTxId) {
        const updatedMilestones = [...(tx.milestones || []), newMilestone];
        const newPaidNum = updatedMilestones.reduce((acc, m) => {
          if (m.status === 'Cleared') {
            return acc + (parseInt(m.amount.replace(/[^0-9]/g, '')) || 0);
          }
          return acc;
        }, 0);

        const totalNum = parseInt(tx.totalAmount.replace(/[^0-9]/g, '')) || 0;
        const balanceNum = Math.max(0, totalNum - newPaidNum);

        let newStatus = tx.paymentStatus;
        if (balanceNum === 0) newStatus = 'Paid';
        else if (newPaidNum > 0) newStatus = 'Partially Paid';
        else newStatus = 'Pending';

        return {
          ...tx,
          milestones: updatedMilestones,
          amountPaid: `$${newPaidNum.toLocaleString()}`,
          balanceDue: `$${balanceNum.toLocaleString()}`,
          paymentStatus: newStatus
        };
      }
      return tx;
    });

    if (onUpdateTransactions) onUpdateTransactions(updated);
    if (selectedTx && selectedTx.id === effectiveTxId) {
      setSelectedTx(updated.find(t => t.id === effectiveTxId));
    }
    triggerToast(`Payment of $${amountNum.toLocaleString()} recorded for ${targetTx.vehicleModel}!`);
    setShowAddPaymentModal(false);
    setPaymentAmount('');
    setPaymentRefVal('');
  };

  // Export ledger to CSV (simulated download)
  const handleExportCsv = () => {
    const headers = ['Transaction ID,Order ID,Customer,Vehicle,VIN,Total,Paid,Balance,Status,Payment Method,Due Date\n'];
    const rows = filteredTx.map(t =>
      `"${t.id}","${t.orderId}","${t.customerName}","${t.vehicleModel}","${t.vehicleVin}","${t.totalAmount}","${t.amountPaid}","${t.balanceDue}","${t.paymentStatus}","${t.paymentMethod}","${new Date(t.dueDate).toLocaleDateString()}"`
    );
    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CAR_MINDS_TRANSACTIONS_LEDGER_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    triggerToast('Financial transactions ledger downloaded.');
  };

  if (isLoading) {
    return <TableSkeleton rows={5} cols={5} />;
  }

  return (
    <div className="space-y-8 text-left relative pb-16">

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white text-xs font-mono uppercase tracking-widest px-5 py-3.5 border-l-4 border-brand-red shadow-2xl flex items-center gap-3 animate-fade-slide-up">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Quick Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-hairline pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-brand-red uppercase tracking-widest block font-bold">
              // Escrow Treasury & Deal Settlements
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-xs">
              Live Vault Active
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold text-charcoal uppercase leading-none tracking-tight">
            Vehicle Transactions & Payments
          </h2>
          <p className="text-xs text-neutral-500 font-sans mt-1.5 max-w-2xl">
            Multi-stage vehicle escrow tracking, itemized customs & registration disbursements, milestone verification, and legal document dossiers for every car sale.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto flex-wrap">
          <button
            onClick={() => {
              if (txSource.length > 0 && !paymentTxId) {
                setPaymentTxId(txSource[0].id);
              }
              setShowAddPaymentModal(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs rounded-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Payment</span>
          </button>

          <Link
            to="/admin/payments"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs rounded-xs"
          >
            <CreditCard className="w-3.5 h-3.5 text-brand-red" />
            <span>Payments & Allocations</span>
          </Link>

          <button
            onClick={handleExportCsv}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-neutral-50 border border-neutral-300 text-charcoal px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-neutral-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowNewTxModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-brand-red hover:bg-red-700 text-white px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Record Deal</span>
          </button>
        </div>
      </div>

      {/* 1. Month Time Filter Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-border-hairline p-3.5 shadow-xs rounded-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-red shrink-0" />
          <span className="text-xs font-display font-bold uppercase tracking-wider text-charcoal">
            Filter by Month:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {monthOptions.map(m => (
            <button
              key={m.key}
              onClick={() => setMonthFilter(m.key)}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
                monthFilter === m.key
                  ? 'bg-brand-red border-brand-red text-white font-bold shadow-xs'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              <span>{m.label}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-xs font-bold ${
                monthFilter === m.key ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
              }`}>
                {m.count}
              </span>
              {m.isCurrent && (
                <span className={`text-[8px] uppercase tracking-widest px-1 py-0.2 rounded-xs font-bold ${
                  monthFilter === m.key ? 'bg-white text-brand-red' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  Current
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Monthly Performance & Vehicle Holds Executive Dossier */}
      <div className="bg-[#0F172A] text-white p-4 sm:p-5 border-l-4 border-brand-red rounded-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-brand-red uppercase tracking-widest font-bold">
              // {monthFilter === 'All' ? 'Consolidated Multi-Month Portfolio' : `${monthOptions.find(m => m.key === monthFilter)?.label} Sales & Holds Dossier`}
            </span>
            {monthFilter === '2026-07' && (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono px-2 py-0.5 rounded-xs font-bold uppercase animate-pulse">
                Current Operating Month
              </span>
            )}
          </div>
          <h3 className="font-display font-extrabold text-base md:text-lg uppercase text-white mt-1">
            {monthFilter === 'All'
              ? 'Dealership Total Performance Across All Recorded Months'
              : `${monthOptions.find(m => m.key === monthFilter)?.label}: ${scopedMonthTx.length} Deals · ${monthHoldsCount} Vehicle Holds · $${totalVolume.toLocaleString()} Sales Volume`}
          </h3>
          <p className="text-xs text-slate-300 font-sans mt-0.5 max-w-2xl leading-relaxed">
            {monthFilter === 'All'
              ? `Reviewing complete dealership transactions across all operational months. Select any month above to demonstrate that specific month's vehicle holds and escrow status.`
              : `In ${monthOptions.find(m => m.key === monthFilter)?.label}, KISACO holds ${monthHoldsCount} active vehicle deposits & escrow allocations ($${inEscrowVault.toLocaleString()} locked), with $${totalCleared.toLocaleString()} settled and $${totalOutstanding.toLocaleString()} scheduled.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-stretch md:self-auto shrink-0">
          <div className="bg-white/5 border border-white/10 px-3.5 py-2 text-left rounded-xs flex-1 md:flex-none">
            <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest block">Month Sales</span>
            <span className="text-base font-display font-black text-white">${totalVolume.toLocaleString()}</span>
          </div>
          <div className="bg-white/5 border border-white/10 px-3.5 py-2 text-left rounded-xs flex-1 md:flex-none">
            <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest block">Active Vehicle Holds</span>
            <span className="text-base font-display font-black text-blue-400">{monthHoldsCount} Holds</span>
          </div>
          <div className="bg-white/5 border border-white/10 px-3.5 py-2 text-left rounded-xs flex-1 md:flex-none">
            <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest block">Cleared Deals</span>
            <span className="text-base font-display font-black text-emerald-400">{fullySettledCount} Settled</span>
          </div>
        </div>
      </div>

      {/* Financial Summary Ribbon (Clean & Focused) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1 */}
        <div className="bg-white border border-border-hairline p-4 shadow-xs rounded-xs">
          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest font-semibold block">
            Revenue Cleared ({monthFilter === 'All' ? 'All Months' : monthOptions.find(m => m.key === monthFilter)?.shortLabel})
          </span>
          <span className="text-xl md:text-2xl font-display font-extrabold text-charcoal block mt-1">
            ${totalCleared.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-emerald-600 block mt-0.5">
            {fullySettledCount} Fully Settled Deals
          </span>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-border-hairline p-4 shadow-xs rounded-xs">
          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest font-semibold block">
            Active in Escrow Holds
          </span>
          <span className="text-xl md:text-2xl font-display font-extrabold text-blue-600 block mt-1">
            ${inEscrowVault.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
            {monthHoldsCount} Locked Vehicle Holds
          </span>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-border-hairline p-4 shadow-xs rounded-xs">
          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest font-semibold block">
            Outstanding Balance
          </span>
          <span className="text-xl md:text-2xl font-display font-extrabold text-amber-600 block mt-1">
            ${totalOutstanding.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
            Scheduled Tranches
          </span>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-border-hairline p-4 shadow-xs rounded-xs">
          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest font-semibold block">
            Deal Sales Volume ({monthFilter === 'All' ? 'All Months' : monthOptions.find(m => m.key === monthFilter)?.shortLabel})
          </span>
          <span className="text-xl md:text-2xl font-display font-extrabold text-brand-red block mt-1">
            ${totalVolume.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
            {scopedMonthTx.length} Recorded Transactions
          </span>
        </div>
      </div>

      {/* Main Filter & Navigation Tabs Bar */}
      <div className="bg-white border border-border-hairline p-4 shadow-xs space-y-4">
        {/* Top Tab Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
            {[
              { id: 'All', label: 'All Transactions', count: txSource.length },
              { id: 'Paid', label: 'Cleared & Settled', count: txSource.filter(t => t.paymentStatus === 'Paid').length },
              { id: 'Partially Paid', label: 'In Escrow / Split', count: txSource.filter(t => t.paymentStatus === 'Partially Paid').length },
              { id: 'Pending', label: 'Pending Wire', count: txSource.filter(t => t.paymentStatus === 'Pending').length },
              { id: 'Overdue', label: 'Overdue Balances', count: txSource.filter(t => t.paymentStatus === 'Overdue').length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer rounded-xs flex items-center gap-2 ${
                  statusTab === tab.id
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'text-neutral-500 hover:text-charcoal hover:bg-neutral-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-xs ${
                  statusTab === tab.id ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="text-[10px] font-mono text-neutral-400">
            Showing <strong className="text-charcoal">{filteredTx.length}</strong> of {txSource.length} car deals
          </div>
        </div>

        {/* Secondary Filter Row: Search & Dropdowns */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by VIN, Vehicle, Client, Tx ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-light-bg border border-border-hairline rounded-xs pl-9 pr-4 py-2 text-xs outline-hidden focus:border-brand-red text-charcoal font-sans placeholder:text-neutral-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-charcoal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {/* Method filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-white border border-neutral-300 px-3 py-1.5 rounded-xs text-xs outline-hidden cursor-pointer text-charcoal"
            >
              <option value="All">All Payment Rails</option>
              <option value="SWIFT Bank Wire">SWIFT Bank Wire</option>
              <option value="Escrow Trust Deposit">Escrow Trust Deposit</option>
              <option value="Escrow Trust Vault">Escrow Trust Vault</option>
              <option value="Corporate Wire Transfer">Corporate Wire</option>
              <option value="Certified Bank Draft">Certified Cashier Draft</option>
              <option value="SWIFT Wire MT103">SWIFT Wire MT103</option>
            </select>

            {/* Agent filter */}
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="bg-white border border-neutral-300 px-3 py-1.5 rounded-xs text-xs outline-hidden cursor-pointer text-charcoal"
            >
              <option value="All">All Sales Agents</option>
              <option value="agent-101">Sarah Connor</option>
              <option value="agent-102">John Connor</option>
              <option value="agent-103">Ellen Ripley</option>
              <option value="agent-104">Kyle Reese</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Full-width Clean Transactions Ledger */}
      <div className="space-y-4">
        {filteredTx.length > 0 ? (
          <div className="bg-white border border-border-hairline shadow-xs overflow-hidden rounded-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-border-hairline text-[9px] font-mono text-neutral-400 uppercase tracking-wider select-none">
                    <th className="py-3 px-4 font-semibold">Vehicle & VIN</th>
                    <th className="py-3 px-4 font-semibold">Buyer & Agent</th>
                    <th className="py-3 px-4 font-semibold">Total / Paid</th>
                    <th className="py-3 px-4 font-semibold">Payment Method</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-hairline">
                  {filteredTx.map((tx) => {
                    const isOverdue = tx.paymentStatus === 'Overdue';

                    return (
                      <tr
                        key={tx.id}
                        className={`hover:bg-neutral-50/60 transition-colors group cursor-pointer ${
                          isOverdue ? 'bg-red-50/30' : ''
                        }`}
                        onClick={() => setSelectedTx(tx)}
                      >
                        {/* Column 1: Vehicle & VIN */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={tx.vehicleImage}
                              alt={tx.vehicleModel}
                              className="w-12 h-9 object-cover rounded-xs border border-neutral-200 shrink-0"
                            />
                            <div className="leading-tight">
                              <span className="font-display font-bold text-charcoal uppercase text-xs block group-hover:text-brand-red transition-colors">
                                {tx.vehicleModel} ({tx.vehicleYear})
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[9px] text-neutral-400">
                                  VIN: {tx.vehicleVin}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyVin(tx.vehicleVin);
                                  }}
                                  title="Copy VIN"
                                  className="text-neutral-400 hover:text-charcoal p-0.5 cursor-pointer"
                                >
                                  {copiedVin === tx.vehicleVin ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Buyer & Agent */}
                        <td className="py-3.5 px-4">
                          <div className="leading-tight">
                            <span className="font-display font-bold uppercase text-[11px] text-charcoal block">
                              {tx.customerName}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">
                              Agent: <strong className="text-neutral-600 font-normal">{tx.agentName}</strong>
                            </span>
                          </div>
                        </td>

                        {/* Column 3: Total & Paid */}
                        <td className="py-3.5 px-4">
                          <div className="leading-tight">
                            <span className="font-display font-bold text-charcoal text-xs block">
                              {tx.totalAmount}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-700 block mt-0.5">
                              Paid: {tx.amountPaid}
                            </span>
                          </div>
                        </td>

                        {/* Column 4: Payment Method & Date */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-600">
                          <span className="font-semibold text-charcoal block">{tx.paymentMethod}</span>
                          <span className="text-[9px] text-neutral-400 font-mono block mt-0.5">
                            {getTxDate(tx) ? new Date(getTxDate(tx)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Scheduled Pending'}
                          </span>
                        </td>

                        {/* Column 5: Status */}
                        <td className="py-3.5 px-4">
                          <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 border rounded-xs font-semibold inline-block ${getStatusColor(tx.paymentStatus)}`}>
                            {tx.paymentStatus}
                          </span>
                        </td>

                        {/* Column 6: Action */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="px-2.5 py-1 bg-neutral-100 hover:bg-[#0F172A] hover:text-white text-charcoal text-[9px] font-mono font-bold uppercase rounded-xs transition-colors cursor-pointer"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="border border-border-hairline bg-white p-12 text-center text-neutral-400 font-sans text-xs space-y-2 rounded-xs">
            <AlertTriangle className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="font-display uppercase font-bold text-charcoal">No transactions matching filter criteria.</p>
            <p className="text-[11px]">Try clearing filters or search terms.</p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* FULL CAR TRANSACTION MODAL (Simplified & Scrollable)         */}
      {/* ============================================================ */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="bg-white w-full max-w-2xl border border-neutral-200 shadow-2xl rounded-xs overflow-hidden flex flex-col max-h-[85vh] my-auto text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0F172A] text-white p-4 sm:p-5 flex justify-between items-center shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={selectedTx.vehicleImage}
                  alt={selectedTx.vehicleModel}
                  className="w-12 h-9 object-cover rounded-xs border border-slate-700 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-display font-extrabold uppercase text-white leading-tight">
                      {selectedTx.vehicleModel} ({selectedTx.vehicleYear})
                    </h3>
                    <span className={`text-[8px] font-mono uppercase px-1.5 py-0.2 rounded-2xs font-bold ${getStatusColor(selectedTx.paymentStatus)}`}>
                      {selectedTx.paymentStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                    <span>{selectedTx.id}</span>
                    <span>•</span>
                    <span>VIN: <strong className="text-slate-300 font-normal">{selectedTx.vehicleVin}</strong></span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 bg-slate-800 hover:bg-brand-red text-slate-300 hover:text-white rounded-xs transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-5 text-xs font-sans">
              {/* 3 Basic Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xs text-left">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">Total Deal</span>
                  <span className="text-base sm:text-lg font-display font-extrabold text-charcoal block mt-0.5">
                    {selectedTx.totalAmount}
                  </span>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xs text-left">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">Amount Paid</span>
                  <span className="text-base sm:text-lg font-display font-bold text-emerald-700 block mt-0.5">
                    {selectedTx.amountPaid}
                  </span>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xs text-left">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">Balance Due</span>
                  <span className="text-base sm:text-lg font-display font-bold text-brand-red block mt-0.5">
                    {selectedTx.balanceDue}
                  </span>
                </div>
              </div>

              {/* Deal Information (Customer, Agent, Rail) */}
              <div className="bg-neutral-50/70 border border-neutral-200 p-3 rounded-xs grid grid-cols-3 gap-2 text-[10px] font-mono">
                <div>
                  <span className="text-neutral-400 uppercase block">Buyer</span>
                  <strong className="text-charcoal block truncate">{selectedTx.customerName}</strong>
                </div>
                <div>
                  <span className="text-neutral-400 uppercase block">Sales Agent</span>
                  <strong className="text-charcoal block truncate">{selectedTx.agentName}</strong>
                </div>
                <div>
                  <span className="text-neutral-400 uppercase block">Payment Method</span>
                  <strong className="text-neutral-700 block truncate">{selectedTx.paymentMethod}</strong>
                </div>
              </div>

              {/* 1. Milestone Payment Schedule */}
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b border-neutral-200 pb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-brand-red" />
                    <span>Payment Milestones ({selectedTx.milestones?.length || 0})</span>
                  </span>
                  <button
                    onClick={() => {
                      setPaymentTxId(selectedTx.id);
                      setShowAddPaymentModal(true);
                    }}
                    className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-2 py-0.5 rounded-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Payment</span>
                  </button>
                </div>

                <div className="border border-neutral-200 rounded-xs overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-[8px] font-mono text-neutral-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-2 px-3">Stage</th>
                        <th className="py-2 px-3">Amount</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-mono text-[10px]">
                      {selectedTx.milestones?.map((m) => (
                        <tr key={m.id} className="hover:bg-neutral-50/50">
                          <td className="py-2 px-3 font-sans font-semibold text-charcoal">{m.title}</td>
                          <td className="py-2 px-3 font-bold text-charcoal">{m.amount}</td>
                          <td className="py-2 px-3 text-neutral-500">
                            {m.paidDate ? new Date(m.paidDate).toLocaleDateString() : new Date(m.dueDate).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => handleToggleMilestone(selectedTx.id, m.id)}
                              className={`text-[8px] font-mono uppercase px-2 py-0.5 rounded-xs font-bold border cursor-pointer transition-colors ${
                                m.status === 'Cleared'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                              }`}
                            >
                              {m.status === 'Cleared' ? '✓ Cleared' : '⏳ Pending'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Attached Car Documents */}
              {selectedTx.documents?.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center border-b border-neutral-200 pb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-brand-red" />
                      <span>Attached Documents ({selectedTx.documents.length})</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {selectedTx.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xs flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-brand-red shrink-0" />
                          <div className="min-w-0">
                            <span className="font-display font-bold uppercase text-[11px] text-charcoal block truncate">
                              {doc.name}
                            </span>
                            <span className="text-[9px] font-mono text-neutral-400">
                              {doc.type} • {doc.fileSize}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[8px] font-mono uppercase px-1.5 py-0.2 rounded-2xs font-bold bg-emerald-100 text-emerald-800">
                            {doc.status}
                          </span>
                          <button
                            onClick={() => setPreviewDoc({ ...doc, tx: selectedTx })}
                            className="px-2 py-0.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-charcoal text-[9px] font-mono font-bold rounded-xs cursor-pointer"
                          >
                            Preview
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-neutral-50 border-t border-neutral-200 p-3 sm:p-4 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-mono text-neutral-500">
                Order Ref: <strong className="text-charcoal">{selectedTx.orderId}</strong>
              </span>
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white font-mono uppercase text-xs font-bold rounded-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in overflow-y-auto"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white w-full max-w-2xl border border-neutral-300 shadow-2xl rounded-xs overflow-hidden text-left flex flex-col max-h-[85vh] my-auto"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Preview Header */}
            <div className="bg-[#0F172A] text-white p-4 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[9px] font-mono text-brand-red uppercase tracking-widest font-bold block">
                  Official Deal Document Preview
                </span>
                <h4 className="text-base font-display font-extrabold uppercase text-white">
                  {previewDoc.name}
                </h4>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 bg-slate-800 hover:bg-brand-red text-slate-300 hover:text-white rounded-xs transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stamped Document Simulation Sheet */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-[#FAFAFA] font-sans text-charcoal border-b border-neutral-200 flex-1 min-h-0">
              {/* Official Seal Header */}
              <div className="flex justify-between items-start border-b-2 border-charcoal pb-4">
                <div>
                  <h2 className="font-display font-extrabold text-lg uppercase tracking-wider text-charcoal">
                    KISACO AUTO SALES LTD
                  </h2>
                  <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                    Licensed Automotive Dealership & Escrow Custody Services
                  </p>
                  <p className="text-[9px] text-neutral-400 font-mono mt-0.5">
                    60 Montgomery Avenue, Richmond Park, Kingston • Tax ID: JM-9482-A
                  </p>
                </div>
                <div className="text-right font-mono text-[10px]">
                  <span className="text-brand-red font-bold uppercase block">{previewDoc.type}</span>
                  <span className="text-neutral-500 block">Doc ID: {previewDoc.id}</span>
                  <span className="text-neutral-400 block">{new Date(previewDoc.issueDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Vehicle & Transaction Specs Table */}
              <div className="bg-white border border-neutral-300 p-4 space-y-3 shadow-2xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] font-mono border-b border-neutral-100 pb-3">
                  <div>
                    <span className="text-neutral-400 uppercase block">Vehicle</span>
                    <strong className="text-charcoal block">{previewDoc.tx?.vehicleModel}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-400 uppercase block">VIN</span>
                    <strong className="text-charcoal block">{previewDoc.tx?.vehicleVin}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-400 uppercase block">Buyer</span>
                    <strong className="text-charcoal block">{previewDoc.tx?.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-400 uppercase block">Total Amount</span>
                    <strong className="text-brand-red block">{previewDoc.tx?.totalAmount}</strong>
                  </div>
                </div>

                {/* Document parameters / options breakdown */}
                <div className="space-y-2 text-xs">
                  <h6 className="font-display font-bold uppercase text-[11px] text-neutral-600">
                    Certified Record Metadata & Parameters
                  </h6>
                  {previewDoc.options ? (
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-neutral-50 p-2.5 rounded-xs border border-neutral-200">
                      {Object.entries(previewDoc.options).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-neutral-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                          <strong className="text-charcoal">{String(v)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-neutral-500 font-sans italic">
                      Standard transaction contract issued and registered with regional revenue and title registry.
                    </p>
                  )}
                </div>
              </div>

              {/* Cryptographic Verification Stamp */}
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

                <div className="border-2 border-emerald-600 text-emerald-700 px-3 py-1 text-center font-display font-extrabold uppercase text-[10px] tracking-widest shrink-0 rotate-[-3deg]">
                  OFFICIALLY SEALED
                </div>
              </div>
            </div>

            {/* Preview Footer */}
            <div className="bg-neutral-100 p-3.5 flex justify-between items-center text-xs font-mono shrink-0">
              <span className="text-[10px] text-neutral-500">File size: {previewDoc.fileSize}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => triggerToast(`Print command sent for ${previewDoc.name}.`)}
                  className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-50 text-charcoal font-bold uppercase rounded-xs transition-colors cursor-pointer"
                >
                  Print
                </button>
                <button
                  onClick={() => {
                    triggerToast(`Downloaded ${previewDoc.name}.`);
                    setPreviewDoc(null);
                  }}
                  className="px-4 py-1.5 bg-brand-red hover:bg-red-700 text-white font-bold uppercase rounded-xs transition-colors cursor-pointer"
                >
                  Download PDF
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* RECORD NEW TRANSACTION MODAL */}
      {showNewTxModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in overflow-y-auto"
          onClick={() => setShowNewTxModal(false)}
        >
          <div
            className="bg-white w-full max-w-xl border border-neutral-300 shadow-2xl rounded-xs overflow-hidden text-left flex flex-col max-h-[85vh] my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0F172A] text-white p-4 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[9px] font-mono text-brand-red uppercase tracking-widest font-bold block">
                  Deal Registration
                </span>
                <h4 className="text-base font-display font-extrabold uppercase text-white">
                  Record New Car Transaction
                </h4>
              </div>
              <button
                onClick={() => setShowNewTxModal(false)}
                className="p-1.5 bg-slate-800 hover:bg-brand-red text-slate-300 hover:text-white rounded-xs transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const vehicleId = parseInt(formData.get('vehicleId')) || 1;
                const vehicle = vehicles.find(v => v.id === vehicleId) || vehicles[0];
                const clientId = formData.get('clientId') || 'cust-9428';
                const client = clients.find(c => c.id === clientId) || clients[0];
                const basePriceNum = parseInt(formData.get('basePrice') || '50000');
                const escrowHoldNum = parseInt(formData.get('escrowHold') || '5000');
                const customsNum = parseInt(formData.get('customsDuty') || '3500');
                const docFeeNum = parseInt(formData.get('docFee') || '1200');
                const totalNum = basePriceNum + customsNum + docFeeNum;

                const newTx = {
                  id: `txn-${Math.floor(7010 + Math.random() * 900)}`,
                  orderId: `ord-${Math.floor(6000 + Math.random() * 1000)}`,
                  customerId: client?.id || 'cust-9428',
                  customerName: client?.name || 'Walk-In VIP Buyer',
                  customerEmail: client?.email || 'buyer@example.com',
                  customerPhone: client?.phone || '+1 (305) 555-0100',
                  customerTier: 'Preferred Buyer',
                  agentId: 'agent-101',
                  agentName: 'Sarah Connor',
                  agentCommission: `$${Math.round(totalNum * 0.03).toLocaleString()}`,
                  vehicleId: vehicle.id,
                  vehicleModel: vehicle.model,
                  vehicleYear: vehicle.year,
                  vehicleVin: `VIN${Math.floor(10000000000000000 + Math.random() * 90000000000000000)}`,
                  vehicleColor: vehicle.color || 'Custom',
                  vehicleMileage: vehicle.mileage || '1,000 mi',
                  vehicleImage: vehicle.thumbnailImage || vehicle.images?.[0],
                  location: 'Kingston Depot, Bay 01',
                  basePrice: `$${basePriceNum.toLocaleString()}`,
                  totalAmount: `$${totalNum.toLocaleString()}`,
                  amountPaid: `$${escrowHoldNum.toLocaleString()}`,
                  balanceDue: `$${(totalNum - escrowHoldNum).toLocaleString()}`,
                  paymentStatus: 'Partially Paid',
                  escrowStatus: 'Locked in Escrow',
                  paymentMethod: formData.get('paymentMethod') || 'SWIFT Bank Wire',
                  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                  clearedDate: null,
                  notes: 'Initial holding deposit received. Contract generated.',
                  paymentBreakdown: {
                    vehicleBase: `$${basePriceNum.toLocaleString()}`,
                    escrowHoldDeposit: `$${escrowHoldNum.toLocaleString()}`,
                    customsImportDuty: `$${customsNum.toLocaleString()}`,
                    documentationRegistration: `$${docFeeNum.toLocaleString()}`,
                    freightLogistics: '$1,200'
                  },
                  milestones: [
                    {
                      id: `ms-new-1`,
                      title: 'Initial Escrow Hold Deposit',
                      amount: `$${escrowHoldNum.toLocaleString()}`,
                      dueDate: new Date().toISOString(),
                      paidDate: new Date().toISOString(),
                      status: 'Cleared',
                      method: 'Escrow Trust Vault',
                      ref: 'ESC-HOLD-NEW',
                      bankTrace: 'VAULT-LOCK'
                    },
                    {
                      id: `ms-new-2`,
                      title: 'Balance Settlement on Delivery',
                      amount: `$${(totalNum - escrowHoldNum).toLocaleString()}`,
                      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                      paidDate: null,
                      status: 'Pending',
                      method: formData.get('paymentMethod') || 'SWIFT Bank Wire',
                      ref: 'INVOICED-BALANCE',
                      bankTrace: 'PENDING'
                    }
                  ],
                  documents: [
                    {
                      id: `doc-new-1`,
                      name: 'Official Pro-Forma Purchase Contract',
                      type: 'Purchase Contract',
                      fileSize: '310 KB',
                      issueDate: new Date().toISOString(),
                      status: 'Verified',
                      hash: 'SHA256:8891028301928301928301928301928301928301928301928301928301928301'
                    },
                    {
                      id: `doc-new-2`,
                      name: '150-Point Technical Inspection Clearance',
                      type: 'Mechanical Inspection',
                      fileSize: '2.5 MB',
                      issueDate: new Date().toISOString(),
                      status: 'Verified',
                      hash: 'SHA256:4491028301928301928301928301928301928301928301928301928301928301'
                    }
                  ]
                };

                const updated = [newTx, ...txSource];
                if (onUpdateTransactions) onUpdateTransactions(updated);
                setShowNewTxModal(false);
                setSelectedTx(newTx);
                triggerToast(`Transaction ${newTx.id} created with full separation!`);
              }}
              className="p-5 space-y-4 text-xs font-sans overflow-y-auto flex-1 min-h-0"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                    Select Vehicle
                  </label>
                  <select
                    name="vehicleId"
                    className="w-full bg-light-bg border border-neutral-300 p-2 text-xs rounded-xs outline-hidden text-charcoal font-sans"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.model} ({v.year}) - {v.price}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                    Assign Customer
                  </label>
                  <select
                    name="clientId"
                    className="w-full bg-light-bg border border-neutral-300 p-2 text-xs rounded-xs outline-hidden text-charcoal font-sans"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment separation inputs */}
              <div className="border border-neutral-200 p-3 bg-neutral-50 rounded-xs space-y-3">
                <span className="text-[9px] font-mono text-brand-red uppercase tracking-widest font-bold block">
                  // Itemized Deal Separation ($ USD)
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[8px] font-mono text-neutral-400 uppercase block mb-0.5">Base Price</label>
                    <input
                      type="number"
                      name="basePrice"
                      defaultValue="65000"
                      className="w-full bg-white border border-neutral-300 p-1.5 text-xs font-mono rounded-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-mono text-neutral-400 uppercase block mb-0.5">Escrow Hold</label>
                    <input
                      type="number"
                      name="escrowHold"
                      defaultValue="5000"
                      className="w-full bg-white border border-neutral-300 p-1.5 text-xs font-mono rounded-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-mono text-neutral-400 uppercase block mb-0.5">Customs & Duty</label>
                    <input
                      type="number"
                      name="customsDuty"
                      defaultValue="4200"
                      className="w-full bg-white border border-neutral-300 p-1.5 text-xs font-mono rounded-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-mono text-neutral-400 uppercase block mb-0.5">Doc & Reg Fee</label>
                    <input
                      type="number"
                      name="docFee"
                      defaultValue="1450"
                      className="w-full bg-white border border-neutral-300 p-1.5 text-xs font-mono rounded-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
                  Payment Rail / Method
                </label>
                <select
                  name="paymentMethod"
                  className="w-full bg-light-bg border border-neutral-300 p-2 text-xs rounded-xs outline-hidden text-charcoal font-sans"
                >
                  <option value="SWIFT Bank Wire">SWIFT Bank Wire</option>
                  <option value="Escrow Trust Vault">Escrow Trust Vault</option>
                  <option value="Certified Bank Draft">Certified Cashier Draft</option>
                  <option value="Corporate Wire Transfer">Corporate Wire Transfer</option>
                </select>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewTxModal(false)}
                  className="px-4 py-2 border border-neutral-300 text-charcoal font-mono uppercase text-xs font-bold rounded-xs cursor-pointer hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-red hover:bg-red-700 text-white font-mono uppercase text-xs font-bold rounded-xs cursor-pointer shadow-xs"
                >
                  Record & Lock Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BASIC ADD PAYMENT MODAL */}
      {showAddPaymentModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddPaymentModal(false);
          }}
        >
          <div
            className="bg-white border border-neutral-200 shadow-2xl w-full max-w-lg max-h-[85vh] my-auto flex flex-col overflow-hidden text-left rounded-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xs bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm uppercase text-charcoal tracking-wide">
                    Record New Payment
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">
                    Direct Fund Inflow or Scheduled Tranche
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowAddPaymentModal(false)}
                className="text-neutral-400 hover:text-charcoal p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body - Scrollable */}
            <form onSubmit={handleAddPaymentSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4">
                
                {/* 1. Target Transaction / Car Deal */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                    Select Vehicle Deal & Buyer *
                  </label>
                  <select
                    value={paymentTxId || selectedTx?.id || (txSource[0]?.id || '')}
                    onChange={(e) => setPaymentTxId(e.target.value)}
                    required
                    className="w-full bg-white border border-neutral-200 p-2.5 text-xs text-charcoal outline-hidden focus:border-brand-red rounded-xs font-sans cursor-pointer"
                  >
                    {txSource.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.vehicleModel} ({t.customerName}) — Total: {t.totalAmount} | Bal: {t.balanceDue}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Amount & Purpose */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                      Payment Amount ($ USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-neutral-400 font-bold">$</span>
                      <input
                        type="number"
                        required
                        min="1"
                        step="1"
                        placeholder="e.g. 5000"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full bg-white border border-neutral-200 pl-7 pr-3 py-2 text-xs text-charcoal outline-hidden focus:border-brand-red rounded-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                      Payment Purpose *
                    </label>
                    <select
                      value={paymentTitle}
                      onChange={(e) => setPaymentTitle(e.target.value)}
                      className="w-full bg-white border border-neutral-200 p-2 text-xs text-charcoal outline-hidden focus:border-brand-red rounded-xs font-sans cursor-pointer"
                    >
                      <option value="Escrow Hold Deposit">Escrow Hold Deposit</option>
                      <option value="Vehicle Balance Settlement">Vehicle Balance Settlement</option>
                      <option value="Customs & Port Duty Clearance">Customs & Port Duty Clearance</option>
                      <option value="Carrier Transport Surcharge">Carrier Transport Surcharge</option>
                      <option value="Documentation & Title Transfer">Documentation & Title Transfer</option>
                    </select>
                  </div>
                </div>

                {/* 3. Payment Rail / Method & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                      Payment Method *
                    </label>
                    <select
                      value={paymentMethodState}
                      onChange={(e) => setPaymentMethodState(e.target.value)}
                      className="w-full bg-white border border-neutral-200 p-2 text-xs text-charcoal outline-hidden focus:border-brand-red rounded-xs font-sans cursor-pointer"
                    >
                      <option value="SWIFT Bank Wire">SWIFT Bank Wire</option>
                      <option value="Escrow Trust Deposit">Escrow Trust Deposit</option>
                      <option value="Credit Card / Vault">Credit Card / Vault</option>
                      <option value="Certified Bank Draft">Certified Cashier Draft</option>
                      <option value="Corporate Wire Transfer">Corporate Wire Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                      Payment / Settlement Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentDateVal}
                      onChange={(e) => setPaymentDateVal(e.target.value)}
                      className="w-full bg-white border border-neutral-200 p-2 text-xs text-charcoal outline-hidden focus:border-brand-red rounded-xs font-mono"
                    />
                  </div>
                </div>

                {/* 4. Payment Status (Cleared vs Pending) */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block mb-1.5">
                    Settlement Status *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      onClick={() => setPaymentStatusState('Cleared')}
                      className={`p-3 border rounded-xs cursor-pointer flex items-center gap-2.5 transition-colors ${
                        paymentStatusState === 'Cleared'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold'
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        paymentStatusState === 'Cleared' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-neutral-300'
                      }`}>
                        {paymentStatusState === 'Cleared' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <div>
                        <span className="text-xs uppercase font-mono block">Cleared</span>
                        <span className="text-[9px] text-neutral-400 font-sans block">Funds verified in bank</span>
                      </div>
                    </label>

                    <label
                      onClick={() => setPaymentStatusState('Pending')}
                      className={`p-3 border rounded-xs cursor-pointer flex items-center gap-2.5 transition-colors ${
                        paymentStatusState === 'Pending'
                          ? 'border-amber-600 bg-amber-50/50 text-amber-900 font-bold'
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        paymentStatusState === 'Pending' ? 'border-amber-600 bg-amber-600 text-white' : 'border-neutral-300'
                      }`}>
                        {paymentStatusState === 'Pending' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <div>
                        <span className="text-xs uppercase font-mono block">Scheduled</span>
                        <span className="text-[9px] text-neutral-400 font-sans block">Awaiting buyer wire</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 5. Reference / Note */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                    Bank Reference / Tracking Trace (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WIRE-US-892014"
                    value={paymentRefVal}
                    onChange={(e) => setPaymentRefVal(e.target.value)}
                    className="w-full bg-white border border-neutral-200 p-2 text-xs text-charcoal outline-hidden focus:border-brand-red rounded-xs font-mono"
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-4 py-2 border border-neutral-200 hover:border-neutral-300 text-charcoal text-xs font-mono uppercase tracking-wider font-semibold rounded-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-red hover:bg-red-700 text-white text-xs font-mono uppercase tracking-widest font-bold rounded-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Confirm & Record Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
