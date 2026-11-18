import React, { useState } from 'react';
import { useMockData } from '../hooks/useMockData';
import { TableSkeleton } from '../components/Skeletons';
import {
  CreditCard,
  Search,
  CheckCircle,
  Clock,
  Lock,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  X,
  FileText,
  DollarSign,
  Download,
  AlertTriangle,
  Plus
} from 'lucide-react';

export default function AdminPayments({
  sharedTransactions = [],
  onUpdateTransactions
}) {
  const { data: initialTx, isLoading } = useMockData('transactions');
  const transactions = sharedTransactions?.length > 0 ? sharedTransactions : (initialTx || []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Cleared, Pending
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [copiedRef, setCopiedRef] = useState('');

  // Form states for Add Payment
  const [selectedTxId, setSelectedTxId] = useState('');
  const [paymentTitle, setPaymentTitle] = useState('Escrow Hold Deposit');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('SWIFT Bank Wire');
  const [paymentStatus, setPaymentStatus] = useState('Cleared');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentRef, setPaymentRef] = useState('');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleCopy = (ref) => {
    navigator.clipboard?.writeText(ref);
    setCopiedRef(ref);
    triggerToast(`Reference ${ref} copied to clipboard!`);
    setTimeout(() => setCopiedRef(''), 2000);
  };

  // Extract all payment milestones with parent transaction metadata
  const allPayments = [];
  transactions.forEach((tx) => {
    if (tx.milestones && tx.milestones.length > 0) {
      tx.milestones.forEach((m) => {
        allPayments.push({
          ...m,
          txId: tx.id,
          orderId: tx.orderId,
          vehicleModel: tx.vehicleModel,
          vehicleYear: tx.vehicleYear,
          vehicleVin: tx.vehicleVin,
          vehicleImage: tx.vehicleImage,
          customerName: tx.customerName,
          customerEmail: tx.customerEmail,
          customerPhone: tx.customerPhone,
          agentName: tx.agentName,
          paymentBreakdown: tx.paymentBreakdown,
          totalDealAmount: tx.totalAmount
        });
      });
    }
  });

  // Calculate payment allocation metrics
  const totalClearedAmount = allPayments
    .filter(p => p.status === 'Cleared')
    .reduce((acc, p) => acc + (parseInt(p.amount?.replace(/[^0-9]/g, '')) || 0), 0);

  const totalPendingAmount = allPayments
    .filter(p => p.status === 'Pending' || p.status === 'Overdue')
    .reduce((acc, p) => acc + (parseInt(p.amount?.replace(/[^0-9]/g, '')) || 0), 0);

  const escrowVaultAmount = allPayments
    .filter(p => p.title?.toLowerCase().includes('escrow') || p.method?.toLowerCase().includes('vault'))
    .reduce((acc, p) => acc + (parseInt(p.amount?.replace(/[^0-9]/g, '')) || 0), 0);

  // Toggle milestone cleared/pending status
  const handleTogglePaymentStatus = (txId, milestoneId) => {
    const updated = transactions.map(tx => {
      if (tx.id === txId) {
        const updatedMilestones = tx.milestones.map(m => {
          if (m.id === milestoneId) {
            const nextStatus = m.status === 'Cleared' ? 'Pending' : 'Cleared';
            const paidDate = nextStatus === 'Cleared' ? new Date().toISOString() : null;
            return { ...m, status: nextStatus, paidDate };
          }
          return m;
        });

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

    if (selectedPayment && selectedPayment.id === milestoneId) {
      setSelectedPayment(prev => ({
        ...prev,
        status: prev.status === 'Cleared' ? 'Pending' : 'Cleared',
        paidDate: prev.status === 'Cleared' ? null : new Date().toISOString()
      }));
    }

    triggerToast('Payment status and fund allocation updated.');
  };

  // Add new payment milestone to an existing transaction
  const handleAddPaymentSubmit = (e) => {
    e.preventDefault();
    const effectiveTxId = selectedTxId || transactions[0]?.id;
    if (!effectiveTxId || !paymentAmount) {
      triggerToast('Please select a deal and specify a valid amount.');
      return;
    }

    const amountNum = parseInt(paymentAmount.replace(/[^0-9]/g, '')) || 0;
    if (amountNum <= 0) {
      triggerToast('Please enter an amount greater than zero.');
      return;
    }

    const targetTx = transactions.find(t => t.id === effectiveTxId);
    if (!targetTx) return;

    const newMilestone = {
      id: `ms-${Date.now()}`,
      title: paymentTitle,
      amount: `$${amountNum.toLocaleString()}`,
      dueDate: new Date(paymentDate).toISOString(),
      paidDate: paymentStatus === 'Cleared' ? new Date(paymentDate).toISOString() : null,
      status: paymentStatus,
      method: paymentMethod,
      ref: paymentRef.trim() || `WIRE-US-${Math.floor(100000 + Math.random() * 900000)}`,
      bankTrace: `CHASUS33-MT103-${Math.floor(1000 + Math.random() * 9000)}`
    };

    const updated = transactions.map(tx => {
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
    triggerToast(`Payment of $${amountNum.toLocaleString()} recorded for ${targetTx.vehicleModel}!`);
    setShowAddPaymentModal(false);
    setPaymentAmount('');
    setPaymentRef('');
  };

  // Filter payments
  const filteredPayments = allPayments.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vehicleVin.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'In Escrow'
          ? (p.title?.toLowerCase().includes('escrow') || p.method?.toLowerCase().includes('vault'))
          : p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    if (status === 'Cleared') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (status === 'Pending') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-neutral-50 text-neutral-600 border-neutral-200';
  };

  const getAllocationTag = (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('escrow') || lower.includes('deposit')) return 'Escrow Lock';
    if (lower.includes('customs') || lower.includes('duty') || lower.includes('port')) return 'Customs & Port';
    if (lower.includes('title') || lower.includes('settlement') || lower.includes('balance')) return 'Vehicle Equity';
    return 'General Allocation';
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-hairline pb-4">
        <div>
          <span className="text-[10px] font-mono text-brand-red uppercase tracking-widest block mb-0.5 font-bold">
            // Financial Inflows & Escrow Tranches
          </span>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold text-charcoal uppercase leading-none tracking-tight">
            Payments & Fund Allocations
          </h2>
          <p className="text-xs text-neutral-500 font-sans mt-1">
            Real-time tracking of buyer installments, escrow deposits, customs duty disbursements, and wire reconciliations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline text-[10px] font-mono text-neutral-500 bg-white border border-neutral-200 px-3 py-2 rounded-xs">
            {allPayments.length} Total Installments • {allPayments.filter(p => p.status === 'Cleared').length} Cleared
          </span>
          <button
            onClick={() => {
              if (transactions.length > 0 && !selectedTxId) {
                setSelectedTxId(transactions[0].id);
              }
              setShowAddPaymentModal(true);
            }}
            className="flex items-center justify-center gap-1.5 bg-brand-red hover:bg-red-700 text-white px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs rounded-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Payment</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards (Focused & Simple) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-border-hairline p-4 shadow-xs rounded-xs">
          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">
            Cleared Payments
          </span>
          <span className="text-xl md:text-2xl font-display font-extrabold text-emerald-700 block mt-1">
            ${totalClearedAmount.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
            Verified Inflows
          </span>
        </div>

        <div className="bg-white border border-border-hairline p-4 shadow-xs rounded-xs">
          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">
            Held in Escrow Vault
          </span>
          <span className="text-xl md:text-2xl font-display font-extrabold text-blue-600 block mt-1">
            ${escrowVaultAmount.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
            Custody Until Delivery
          </span>
        </div>

        <div className="bg-white border border-border-hairline p-4 shadow-xs rounded-xs">
          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">
            Pending Scheduled
          </span>
          <span className="text-xl md:text-2xl font-display font-extrabold text-amber-600 block mt-1">
            ${totalPendingAmount.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
            Awaiting Wire Clear
          </span>
        </div>

        <div className="bg-white border border-border-hairline p-4 shadow-xs rounded-xs">
          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">
            Total Tranches
          </span>
          <span className="text-xl md:text-2xl font-display font-extrabold text-charcoal block mt-1">
            {allPayments.length} Tranches
          </span>
          <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
            Across {transactions.length} Car Deals
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-border-hairline p-4 shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Status Tabs */}
        <div className="flex gap-1.5 overflow-x-auto select-none">
          {[
            { id: 'All', label: 'All Payments', count: allPayments.length },
            { id: 'Cleared', label: 'Cleared', count: allPayments.filter(p => p.status === 'Cleared').length },
            { id: 'In Escrow', label: 'In Escrow', count: allPayments.filter(p => p.title?.toLowerCase().includes('escrow') || p.method?.toLowerCase().includes('vault')).length },
            { id: 'Pending', label: 'Pending', count: allPayments.filter(p => p.status === 'Pending').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center gap-2 ${
                statusFilter === tab.id
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[9px] font-mono px-1 py-0.2 rounded-2xs ${
                statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by payer, vehicle, ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-light-bg border border-border-hairline rounded-xs pl-9 pr-4 py-1.5 text-xs outline-hidden focus:border-brand-red text-charcoal placeholder:text-neutral-400 font-sans"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-border-hairline shadow-xs overflow-hidden rounded-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/80 border-b border-border-hairline text-[9px] font-mono text-neutral-400 uppercase tracking-wider select-none">
                <th className="py-3 px-4 font-semibold">Payment / Milestone</th>
                <th className="py-3 px-4 font-semibold">Vehicle</th>
                <th className="py-3 px-4 font-semibold">Payer & Agent</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Allocation</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-hairline">
              {filteredPayments.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedPayment(p)}
                  className="hover:bg-neutral-50/60 transition-colors group cursor-pointer"
                >
                  {/* Column 1: Payment & Reference */}
                  <td className="py-3.5 px-4">
                    <div className="leading-tight">
                      <span className="font-display font-bold uppercase text-xs text-charcoal block group-hover:text-brand-red transition-colors">
                        {p.title}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[9px] text-neutral-400">
                          Ref: {p.ref}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(p.ref);
                          }}
                          className="text-neutral-400 hover:text-charcoal p-0.5 cursor-pointer"
                          title="Copy Ref"
                        >
                          {copiedRef === p.ref ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Vehicle */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={p.vehicleImage}
                        alt={p.vehicleModel}
                        className="w-10 h-7 object-cover rounded-xs border border-neutral-200 shrink-0"
                      />
                      <div className="leading-tight">
                        <span className="font-display font-bold uppercase text-[11px] text-charcoal block">
                          {p.vehicleModel}
                        </span>
                        <span className="text-[9px] font-mono text-neutral-400">
                          VIN: {p.vehicleVin?.slice(-8)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Column 3: Payer & Agent */}
                  <td className="py-3.5 px-4">
                    <div className="leading-tight">
                      <span className="font-display font-bold uppercase text-[11px] text-charcoal block">
                        {p.customerName}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-400 block mt-0.5">
                        Agent: {p.agentName}
                      </span>
                    </div>
                  </td>

                  {/* Column 4: Amount */}
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-charcoal">
                    {p.amount}
                  </td>

                  {/* Column 5: Allocation */}
                  <td className="py-3.5 px-4">
                    <span className="text-[8px] font-mono uppercase px-2 py-0.5 rounded-2xs font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                      {getAllocationTag(p.title)}
                    </span>
                  </td>

                  {/* Column 6: Status */}
                  <td className="py-3.5 px-4">
                    <span className={`text-[8px] font-mono uppercase px-2 py-0.5 rounded-2xs font-bold border ${getStatusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </td>

                  {/* Column 7: Action */}
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedPayment(p)}
                      className="px-2.5 py-1 bg-neutral-100 hover:bg-[#0F172A] hover:text-white text-charcoal text-[9px] font-mono font-bold uppercase rounded-xs transition-colors cursor-pointer"
                    >
                      Allocation
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SIMPLIFIED & SCROLLABLE PAYMENT ALLOCATION MODAL             */}
      {/* ============================================================ */}
      {selectedPayment && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="bg-white w-full max-w-2xl border border-neutral-200 shadow-2xl rounded-xs overflow-hidden flex flex-col max-h-[85vh] my-auto text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0F172A] text-white p-4 sm:p-5 flex justify-between items-center shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xs bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0 border border-brand-red/30">
                  <CreditCard className="w-5 h-5 text-brand-red" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-display font-extrabold uppercase text-white leading-tight">
                      {selectedPayment.title}
                    </h3>
                    <span className={`text-[8px] font-mono uppercase px-1.5 py-0.2 rounded-2xs font-bold ${getStatusBadge(selectedPayment.status)}`}>
                      {selectedPayment.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                    <span>Ref: <strong className="text-slate-200">{selectedPayment.ref}</strong></span>
                    <span>•</span>
                    <span>Deal: {selectedPayment.txId}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1.5 bg-slate-800 hover:bg-brand-red text-slate-300 hover:text-white rounded-xs transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-5 text-xs font-sans">
              {/* 3 Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xs text-left">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">Tranche Amount</span>
                  <span className="text-base sm:text-lg font-display font-extrabold text-charcoal block mt-0.5">
                    {selectedPayment.amount}
                  </span>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xs text-left">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">Payment Rail</span>
                  <span className="text-base sm:text-lg font-display font-bold text-brand-red block mt-0.5 truncate">
                    {selectedPayment.method}
                  </span>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xs text-left">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">Clearing Date</span>
                  <span className="text-base sm:text-lg font-display font-bold text-emerald-700 block mt-0.5">
                    {selectedPayment.paidDate ? new Date(selectedPayment.paidDate).toLocaleDateString() : 'Pending Wire'}
                  </span>
                </div>
              </div>

              {/* Fund Allocation Itemization */}
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b border-neutral-200 pb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-red" />
                    <span>Fund Allocation & Custody Distribution</span>
                  </span>
                  <span className="text-[9px] font-mono text-neutral-400">
                    Deal Total: {selectedPayment.totalDealAmount}
                  </span>
                </div>

                <div className="border border-neutral-200 rounded-xs overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-[8px] font-mono text-neutral-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-2 px-3">Disbursement Category</th>
                        <th className="py-2 px-3">Allocated Amount</th>
                        <th className="py-2 px-3 text-right">Custodian / Rail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-mono text-[10px]">
                      {selectedPayment.paymentBreakdown ? (
                        <>
                          <tr className="hover:bg-neutral-50/50">
                            <td className="py-2 px-3 font-sans font-semibold text-charcoal">Vehicle Base Equity</td>
                            <td className="py-2 px-3 font-bold text-charcoal">{selectedPayment.paymentBreakdown.vehicleBase}</td>
                            <td className="py-2 px-3 text-right text-neutral-500">Dealership Treasury</td>
                          </tr>
                          <tr className="hover:bg-neutral-50/50">
                            <td className="py-2 px-3 font-sans font-semibold text-charcoal">Escrow Hold Guarantee</td>
                            <td className="py-2 px-3 font-bold text-blue-600">{selectedPayment.paymentBreakdown.escrowHoldDeposit}</td>
                            <td className="py-2 px-3 text-right text-neutral-500">Trust Escrow Vault</td>
                          </tr>
                          <tr className="hover:bg-neutral-50/50">
                            <td className="py-2 px-3 font-sans font-semibold text-charcoal">Customs & Port Duties</td>
                            <td className="py-2 px-3 font-bold text-charcoal">{selectedPayment.paymentBreakdown.customsImportDuty}</td>
                            <td className="py-2 px-3 text-right text-neutral-500">Revenue Authority</td>
                          </tr>
                          <tr className="hover:bg-neutral-50/50">
                            <td className="py-2 px-3 font-sans font-semibold text-charcoal">Title & Registration</td>
                            <td className="py-2 px-3 font-bold text-charcoal">{selectedPayment.paymentBreakdown.documentationRegistration}</td>
                            <td className="py-2 px-3 text-right text-neutral-500">Transport Registry</td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td className="py-2 px-3 font-sans font-semibold text-charcoal">Installment Tranche Allocation</td>
                          <td className="py-2 px-3 font-bold text-charcoal">{selectedPayment.amount}</td>
                          <td className="py-2 px-3 text-right text-neutral-500">{selectedPayment.method}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vehicle & Buyer Summary Box */}
              <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xs grid grid-cols-2 gap-3 text-[10px] font-mono">
                <div>
                  <span className="text-neutral-400 uppercase block">Vehicle Assigned</span>
                  <strong className="text-charcoal block text-xs mt-0.5">{selectedPayment.vehicleModel} ({selectedPayment.vehicleYear})</strong>
                  <span className="text-neutral-400 block mt-0.5">VIN: {selectedPayment.vehicleVin}</span>
                </div>
                <div>
                  <span className="text-neutral-400 uppercase block">Buyer & Advisor</span>
                  <strong className="text-charcoal block text-xs mt-0.5">{selectedPayment.customerName}</strong>
                  <span className="text-neutral-400 block mt-0.5">Sales Advisor: {selectedPayment.agentName}</span>
                </div>
              </div>

              {/* Bank Confirmation Strip */}
              <div className="bg-white border border-dashed border-neutral-300 p-3 rounded-xs flex items-center justify-between text-[10px] font-mono">
                <div>
                  <span className="text-neutral-400 uppercase block">Bank Trace Number</span>
                  <strong className="text-charcoal block mt-0.5">{selectedPayment.bankTrace || 'SWIFT-MT103-CONFIRMED'}</strong>
                </div>
                <button
                  onClick={() => handleTogglePaymentStatus(selectedPayment.txId, selectedPayment.id)}
                  className={`px-3 py-1.5 text-xs font-mono uppercase font-bold rounded-xs cursor-pointer transition-colors ${
                    selectedPayment.status === 'Cleared'
                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  }`}
                >
                  {selectedPayment.status === 'Cleared' ? 'Mark as Pending' : '✓ Mark as Cleared'}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-neutral-50 border-t border-neutral-200 p-3 sm:p-4 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-mono text-neutral-500">
                Payment Ref: <strong className="text-charcoal">{selectedPayment.ref}</strong>
              </span>
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white font-mono uppercase text-xs font-bold rounded-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
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
                    value={selectedTxId || (transactions[0]?.id || '')}
                    onChange={(e) => setSelectedTxId(e.target.value)}
                    required
                    className="w-full bg-white border border-neutral-200 p-2.5 text-xs text-charcoal outline-hidden focus:border-brand-red rounded-xs font-sans cursor-pointer"
                  >
                    {transactions.map(t => (
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
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
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
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
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
                      onClick={() => setPaymentStatus('Cleared')}
                      className={`p-3 border rounded-xs cursor-pointer flex items-center gap-2.5 transition-colors ${
                        paymentStatus === 'Cleared'
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold'
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        paymentStatus === 'Cleared' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-neutral-300'
                      }`}>
                        {paymentStatus === 'Cleared' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <div>
                        <span className="text-xs uppercase font-mono block">Cleared</span>
                        <span className="text-[9px] text-neutral-400 font-sans block">Funds verified in bank</span>
                      </div>
                    </label>

                    <label
                      onClick={() => setPaymentStatus('Pending')}
                      className={`p-3 border rounded-xs cursor-pointer flex items-center gap-2.5 transition-colors ${
                        paymentStatus === 'Pending'
                          ? 'border-amber-600 bg-amber-50/50 text-amber-900 font-bold'
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        paymentStatus === 'Pending' ? 'border-amber-600 bg-amber-600 text-white' : 'border-neutral-300'
                      }`}>
                        {paymentStatus === 'Pending' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
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
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
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
