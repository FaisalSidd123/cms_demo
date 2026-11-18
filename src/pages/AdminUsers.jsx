import React, { useState } from 'react';
import { useMockData } from '../hooks/useMockData';
import { TableSkeleton } from '../components/Skeletons';
import {
  Users,
  Search,
  UserCheck,
  UserX,
  ArrowRight,
  Calendar,
  Mail,
  Phone,
  CheckCircle,
  Eye,
  EyeOff,
  Briefcase,
  X,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  FileText,
  CreditCard,
  Building,
  Clock,
  Car,
  Download,
  Printer,
  ChevronRight,
  Lock,
  Star,
  Award,
  Share2
} from 'lucide-react';

export default function AdminUsers({
  sharedClients = [],
  onUpdateClients,
  sharedAgents = [],
  onUpdateAgents,
  sharedReservations = [],
  sharedActivities = [],
  sharedTransactions = [],
  sharedVehicles = []
}) {
  const { data: initialClients, isLoading: clientsLoading } = useMockData('clients');
  const { data: initialAgents, isLoading: agentsLoading } = useMockData('agentsRoster');
  const { data: initialTx, isLoading: txLoading } = useMockData('transactions');
  const { data: initialVehicles, isLoading: vehiclesLoading } = useMockData('vehicles');
  const { data: initialPurchases, isLoading: purchasesLoading } = useMockData('purchaseHistory');

  const isLoading = clientsLoading || agentsLoading || txLoading || vehiclesLoading;

  const clients = sharedClients.length > 0 ? sharedClients : (initialClients || []);
  const agents = sharedAgents.length > 0 ? sharedAgents : (initialAgents || []);
  const transactions = sharedTransactions.length > 0 ? sharedTransactions : (initialTx || []);
  const vehicles = sharedVehicles.length > 0 ? sharedVehicles : (initialVehicles || []);
  const purchases = initialPurchases || [];

  const [activeTab, setActiveTab] = useState('customers'); // 'customers' or 'agents'
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Selected entities for full modals
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Reassign agent
  const handleReassignAgent = (clientId, newAgentId) => {
    const updated = clients.map(c => c.id === clientId ? { ...c, assignedAgentId: newAgentId } : c);
    onUpdateClients(updated);
    const agentName = agents.find(a => a.id === newAgentId)?.name || newAgentId;
    triggerToast(`Customer reassigned to Agent ${agentName}.`);

    // If modal is open for this customer, update it
    if (selectedCustomer && selectedCustomer.id === clientId) {
      setSelectedCustomer(prev => ({ ...prev, assignedAgentId: newAgentId }));
    }
  };

  // Toggle Customer status
  const handleToggleCustomerStatus = (clientId, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const updated = clients.map(c => c.id === clientId ? { ...c, status: nextStatus } : c);
    onUpdateClients(updated);
    triggerToast(`Customer account set to: ${nextStatus}`);

    if (selectedCustomer && selectedCustomer.id === clientId) {
      setSelectedCustomer(prev => ({ ...prev, status: nextStatus }));
    }
  };

  // Toggle Agent status
  const handleToggleAgentStatus = (agentId, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const updated = agents.map(a => a.id === agentId ? { ...a, status: nextStatus } : a);
    onUpdateAgents(updated);
    triggerToast(`Agent account set to: ${nextStatus}`);

    if (selectedAgent && selectedAgent.id === agentId) {
      setSelectedAgent(prev => ({ ...prev, status: nextStatus }));
    }
  };

  const getClientStatusColor = (status) => {
    if (status === 'Active Lead' || status === 'Active') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'In Progress') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-neutral-100 text-neutral-500 border-neutral-200';
  };

  // Helper to compute a customer's total spend from purchases & transactions
  const getCustomerTotalSpend = (clientId) => {
    const clientTx = transactions.filter(t => t.customerId === clientId && t.paymentStatus === 'Paid');
    const txTotal = clientTx.reduce((acc, t) => acc + (parseInt(t.totalAmount?.replace(/[^0-9]/g, '')) || 0), 0);

    const clientPurchases = purchases.filter(p => p.id === 'pur-8420' && clientId === 'cust-9428');
    const purTotal = clientPurchases.reduce((acc, p) => acc + (parseInt(p.finalPrice?.replace(/[^0-9]/g, '')) || 0), 0);

    const grand = txTotal + purTotal;
    return grand > 0 ? `$${grand.toLocaleString()}` : '$0';
  };

  // Helper to get all transactions for a client
  const getCustomerTransactions = (clientId) => {
    return transactions.filter(t => t.customerId === clientId);
  };

  // Helper to get all payments/milestones for a client
  const getCustomerRecentPayments = (clientId) => {
    const clientTx = transactions.filter(t => t.customerId === clientId);
    const payments = [];
    clientTx.forEach(tx => {
      if (tx.milestones) {
        tx.milestones.forEach(m => {
          payments.push({
            ...m,
            txId: tx.id,
            vehicleModel: tx.vehicleModel,
            vehicleVin: tx.vehicleVin
          });
        });
      }
    });
    return payments;
  };

  // Helper to get agent sales & profit stats
  const getAgentPerformance = (agentId) => {
    const agentTx = transactions.filter(t => t.agentId === agentId);
    const closedTx = agentTx.filter(t => t.paymentStatus === 'Paid');

    const totalSalesNum = agentTx.reduce((acc, t) => acc + (parseInt(t.totalAmount?.replace(/[^0-9]/g, '')) || 0), 0);
    const clearedSalesNum = closedTx.reduce((acc, t) => acc + (parseInt(t.amountPaid?.replace(/[^0-9]/g, '')) || 0), 0);

    // 3% standard agent commission
    const commissionNum = Math.round(clearedSalesNum * 0.03);
    // Estimated dealership net profit (approx 9-10% of vehicle sales)
    const dealershipProfitNum = Math.round(clearedSalesNum * 0.095);

    return {
      agentTx,
      closedTx,
      totalSalesNum,
      clearedSalesNum,
      commissionFormatted: `$${commissionNum.toLocaleString()}`,
      dealershipProfitFormatted: `$${dealershipProfitNum.toLocaleString()}`,
      salesFormatted: `$${(clearedSalesNum || totalSalesNum).toLocaleString()}`
    };
  };

  // Filtering
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAgents = agents.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <TableSkeleton rows={4} cols={4} />;
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
          <span className="text-[10px] font-mono text-brand-red uppercase tracking-widest block mb-0.5">
            // Personnel & Customer Registers
          </span>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold text-charcoal uppercase leading-none tracking-tight">
            Customers & Sales Agents
          </h2>
          <p className="text-xs text-neutral-500 font-sans mt-1">
            Manage buyer profiles, inspect purchases & cleared escrow payments, evaluate agent commission earnings, and audit portfolio accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-neutral-500 bg-white border border-neutral-200 px-3 py-1.5 rounded-xs">
            {clients.length} Clients • {agents.length} Active Advisors
          </span>
        </div>
      </div>

      {/* Tabs & Search Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white border border-border-hairline p-4 shadow-xs">

        {/* Toggle between Customers & Sales Agents */}
        <div className="flex gap-2 select-none">
          <button
            onClick={() => { setActiveTab('customers'); setSearchTerm(''); }}
            className={`px-4 py-2 text-xs font-display font-bold uppercase tracking-wider rounded-xs transition-all cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-[#0F172A] text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Customers ({clients.length})
          </button>
          <button
            onClick={() => { setActiveTab('agents'); setSearchTerm(''); }}
            className={`px-4 py-2 text-xs font-display font-bold uppercase tracking-wider rounded-xs transition-all cursor-pointer ${
              activeTab === 'agents'
                ? 'bg-[#0F172A] text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Sales Agents ({agents.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder={activeTab === 'customers' ? "Search customers by name, ID, email..." : "Search agents by name, ID..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-light-bg border border-border-hairline rounded-xs pl-9 pr-4 py-2 text-xs outline-hidden focus:border-brand-red transition-all text-charcoal placeholder:text-neutral-400 font-sans"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

      </div>

      {/* 1. CUSTOMERS TAB */}
      {activeTab === 'customers' && (
        <div className="bg-white border border-border-hairline shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50/80 border-b border-border-hairline text-[9px] font-mono text-neutral-400 uppercase tracking-widest select-none">
                  <th className="py-3.5 px-6 font-semibold">Customer Dossier</th>
                  <th className="py-3.5 px-6 font-semibold">Contact Email & Phone</th>
                  <th className="py-3.5 px-6 font-semibold">Assigned Sales Advisor</th>
                  <th className="py-3.5 px-6 font-semibold">Lifetime Spend</th>
                  <th className="py-3.5 px-6 font-semibold">Holds & Deals</th>
                  <th className="py-3.5 px-6 font-semibold">Status</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Oversight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-hairline">
                {filteredClients.map((client) => {
                  const clientHolds = sharedReservations.filter(r => r.clientId === client.id) || [];
                  const activeHoldsCount = clientHolds.filter(r => r.status === 'Pending' || r.status === 'Confirmed').length;
                  const clientTx = getCustomerTransactions(client.id);
                  const totalSpend = getCustomerTotalSpend(client.id);

                  return (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedCustomer(client)}
                      className="hover:bg-neutral-50/60 transition-colors group cursor-pointer"
                    >
                      {/* Identity */}
                      <td className="py-3.5 px-6 font-medium text-charcoal">
                        <div className="flex items-center gap-3">
                          <img
                            src={client.avatarUrl}
                            alt={client.name}
                            className="w-9 h-9 rounded-full object-cover border border-neutral-200 shrink-0 group-hover:border-brand-red transition-colors"
                          />
                          <div>
                            <span className="font-display font-bold uppercase tracking-wider text-xs block group-hover:text-brand-red transition-colors">
                              {client.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[8px] font-mono text-neutral-400 uppercase">
                                Ref: {client.id}
                              </span>
                              <span className="text-[8px] font-mono bg-neutral-100 text-neutral-600 px-1 py-0.2 rounded-2xs">
                                KYC Verified
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-6 font-mono text-[11px] text-neutral-500">
                        <div>{client.email}</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">{client.phone}</div>
                      </td>

                      {/* Assigned Agent Re-assignment Dropdown */}
                      <td className="py-3.5 px-6" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={client.assignedAgentId}
                          onChange={(e) => handleReassignAgent(client.id, e.target.value)}
                          className="bg-white border border-neutral-200 px-2 py-1 text-[10px] font-mono uppercase tracking-wider cursor-pointer text-neutral-700 outline-hidden focus:border-brand-red rounded-xs"
                        >
                          {agents.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Lifetime Spend */}
                      <td className="py-3.5 px-6 font-display font-bold text-xs text-brand-red">
                        {totalSpend}
                      </td>

                      {/* Holds & Deals count */}
                      <td className="py-3.5 px-6 font-mono text-[10px] text-neutral-500">
                        <span className="font-bold text-charcoal">{clientTx.length} Deals</span>
                        <span className="text-neutral-400 block">• {activeHoldsCount} Active Hold</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-6">
                        <span className={`text-[8px] font-mono uppercase px-2 py-0.5 border rounded-xs font-bold ${getClientStatusColor(client.status)}`}>
                          {client.status}
                        </span>
                      </td>

                      {/* Row actions */}
                      <td className="py-3.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedCustomer(client)}
                            className="px-2.5 py-1 bg-neutral-100 hover:bg-[#0F172A] hover:text-white text-charcoal text-[9px] font-mono font-bold uppercase rounded-xs transition-colors cursor-pointer"
                          >
                            View Dossier
                          </button>
                          <button
                            onClick={() => handleToggleCustomerStatus(client.id, client.status === 'Inactive' ? 'Inactive' : 'Active')}
                            className={`p-1.5 border cursor-pointer rounded-xs transition-colors ${
                              client.status === 'Inactive'
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-neutral-200 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50'
                            }`}
                            title={client.status === 'Inactive' ? "Activate Account" : "Suspend Account"}
                          >
                            {client.status === 'Inactive' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
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
      )}

      {/* 2. SALES AGENTS TAB */}
      {activeTab === 'agents' && (
        <div className="bg-white border border-border-hairline shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50/80 border-b border-border-hairline text-[9px] font-mono text-neutral-400 uppercase tracking-widest select-none">
                  <th className="py-3.5 px-6 font-semibold">Sales Advisor</th>
                  <th className="py-3.5 px-6 font-semibold">Contact Email & Phone</th>
                  <th className="py-3.5 px-6 font-semibold">Assigned Leads</th>
                  <th className="py-3.5 px-6 font-semibold">Closed Deals</th>
                  <th className="py-3.5 px-6 font-semibold">Revenue Cleared</th>
                  <th className="py-3.5 px-6 font-semibold">Commission (3%)</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Performance Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-hairline">
                {filteredAgents.map((agent) => {
                  const agentClients = clients.filter(c => c.assignedAgentId === agent.id);
                  const perf = getAgentPerformance(agent.id);

                  return (
                    <tr
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      className="hover:bg-neutral-50/60 transition-colors group cursor-pointer"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-6 font-medium text-charcoal">
                        <div className="flex items-center gap-3">
                          <img
                            src={agent.avatarUrl}
                            alt={agent.name}
                            className="w-9 h-9 rounded-full object-cover border border-neutral-200 shrink-0 group-hover:border-brand-red transition-colors"
                          />
                          <div>
                            <span className="font-display font-bold uppercase tracking-wider text-xs block group-hover:text-brand-red transition-colors">
                              {agent.name}
                            </span>
                            <span className="text-[8px] font-mono text-neutral-400 block uppercase mt-0.5">
                              ID: {agent.id} • Rating: 4.9 ★
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email & Phone */}
                      <td className="py-3.5 px-6 font-mono text-[11px] text-neutral-500">
                        <div>{agent.email}</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">{agent.phone}</div>
                      </td>

                      {/* Leads */}
                      <td className="py-3.5 px-6 font-mono text-neutral-600 font-bold">
                        {agentClients.length} accounts
                      </td>

                      {/* Closed */}
                      <td className="py-3.5 px-6 font-mono text-neutral-600 font-bold">
                        {agent.dealsClosedCount} deals
                      </td>

                      {/* Sales */}
                      <td className="py-3.5 px-6 font-display font-bold text-charcoal text-xs">
                        {perf.salesFormatted || agent.salesValue}
                      </td>

                      {/* Commission */}
                      <td className="py-3.5 px-6 font-display font-bold text-brand-red text-xs">
                        {perf.commissionFormatted}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedAgent(agent)}
                            className="px-2.5 py-1 bg-neutral-100 hover:bg-[#0F172A] hover:text-white text-charcoal text-[9px] font-mono font-bold uppercase rounded-xs transition-colors cursor-pointer"
                          >
                            Inspect Sales
                          </button>
                          <button
                            onClick={() => handleToggleAgentStatus(agent.id, agent.status)}
                            className={`p-1.5 border cursor-pointer rounded-xs transition-colors ${
                              agent.status === 'Inactive'
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-neutral-200 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50'
                            }`}
                            title={agent.status === 'Inactive' ? "Activate Agent" : "Set On Leave"}
                          >
                            {agent.status === 'Inactive' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
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
      )}

      {/* ============================================================ */}
      {/* 3. CUSTOMER DETAIL MODAL (Simplified & Scrollable)           */}
      {/* ============================================================ */}
      {selectedCustomer && (() => {
        const clientTx = getCustomerTransactions(selectedCustomer.id);
        const recentPayments = getCustomerRecentPayments(selectedCustomer.id);
        const assignedAdvisor = agents.find(a => a.id === selectedCustomer.assignedAgentId);
        const totalSpend = getCustomerTotalSpend(selectedCustomer.id);

        const totalClearedNum = clientTx.reduce((acc, t) => acc + (parseInt(t.amountPaid?.replace(/[^0-9]/g, '')) || 0), 0);
        const totalBalanceNum = clientTx.reduce((acc, t) => acc + (parseInt(t.balanceDue?.replace(/[^0-9]/g, '')) || 0), 0);

        return (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            onClick={() => setSelectedCustomer(null)}
          >
            <div
              className="bg-white w-full max-w-2xl border border-neutral-200 shadow-2xl rounded-xs overflow-hidden flex flex-col max-h-[85vh] my-auto text-left relative"
              onClick={(e) => e.stopPropagation()}
            >

              {/* Modal Header */}
              <div className="bg-[#0F172A] text-white p-4 sm:p-5 flex justify-between items-center shrink-0 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedCustomer.avatarUrl}
                    alt={selectedCustomer.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-brand-red shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-display font-extrabold uppercase text-white leading-tight">
                        {selectedCustomer.name}
                      </h3>
                      <span className={`text-[8px] font-mono uppercase px-1.5 py-0.2 rounded-2xs font-bold ${getClientStatusColor(selectedCustomer.status)}`}>
                        {selectedCustomer.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                      <span>{selectedCustomer.email}</span>
                      <span>•</span>
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCustomer(null)}
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
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">Total Spend</span>
                    <span className="text-base sm:text-lg font-display font-extrabold text-brand-red block mt-0.5">
                      {totalSpend}
                    </span>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xs text-left">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">Paid</span>
                    <span className="text-base sm:text-lg font-display font-bold text-emerald-700 block mt-0.5">
                      ${totalClearedNum.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xs text-left">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">Balance Due</span>
                    <span className="text-base sm:text-lg font-display font-bold text-charcoal block mt-0.5">
                      ${totalBalanceNum.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 1. Vehicle Purchases */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center border-b border-neutral-200 pb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-brand-red" />
                      <span>Purchased Vehicles ({clientTx.length})</span>
                    </span>
                  </div>

                  {clientTx.length > 0 ? (
                    <div className="space-y-2">
                      {clientTx.map(tx => (
                        <div key={tx.id} className="border border-neutral-200 p-3 rounded-xs bg-neutral-50/60 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={tx.vehicleImage}
                              alt={tx.vehicleModel}
                              className="w-12 h-9 object-cover rounded-xs border border-neutral-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-display font-bold text-xs uppercase text-charcoal block truncate">
                                {tx.vehicleModel} ({tx.vehicleYear})
                              </span>
                              <span className="text-[9px] font-mono text-neutral-400 block">
                                VIN: {tx.vehicleVin}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-xs text-charcoal block">
                              {tx.totalAmount}
                            </span>
                            <span className={`text-[8px] font-mono uppercase px-1.5 py-0.2 rounded-2xs font-bold inline-block mt-0.5 ${
                              tx.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {tx.paymentStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-neutral-200 bg-neutral-50 p-4 text-center text-neutral-400 text-xs rounded-xs">
                      No vehicle purchases on record.
                    </div>
                  )}
                </div>

                {/* 2. Recent Payments */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center border-b border-neutral-200 pb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-brand-red" />
                      <span>Recent Payments ({recentPayments.length})</span>
                    </span>
                  </div>

                  {recentPayments.length > 0 ? (
                    <div className="border border-neutral-200 rounded-xs overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-neutral-50 border-b border-neutral-200 text-[8px] font-mono text-neutral-400 uppercase tracking-wider">
                          <tr>
                            <th className="py-2 px-3">Milestone</th>
                            <th className="py-2 px-3">Vehicle</th>
                            <th className="py-2 px-3">Amount</th>
                            <th className="py-2 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-mono text-[10px]">
                          {recentPayments.map((p, idx) => (
                            <tr key={idx} className="hover:bg-neutral-50/50">
                              <td className="py-2 px-3 font-sans font-semibold text-charcoal">{p.title}</td>
                              <td className="py-2 px-3 text-neutral-500">{p.vehicleModel}</td>
                              <td className="py-2 px-3 font-bold text-charcoal">{p.amount}</td>
                              <td className="py-2 px-3 text-right">
                                <span className={`text-[8px] font-mono uppercase px-1.5 py-0.2 rounded-2xs font-bold ${
                                  p.status === 'Cleared'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="border border-neutral-200 bg-neutral-50 p-4 text-center text-neutral-400 text-xs rounded-xs">
                      No payments on record.
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-neutral-50 border-t border-neutral-200 p-3 sm:p-4 flex justify-between items-center shrink-0">
                <span className="text-[10px] font-mono text-neutral-500">
                  Assigned Agent: <strong className="text-charcoal">{assignedAdvisor?.name || 'Unassigned'}</strong>
                </span>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white font-mono uppercase text-xs font-bold rounded-xs cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ============================================================ */}
      {/* 4. SALES AGENT DETAIL MODAL (Simplified & Scrollable)        */}
      {/* ============================================================ */}
      {selectedAgent && (() => {
        const perf = getAgentPerformance(selectedAgent.id);
        const agentClients = clients.filter(c => c.assignedAgentId === selectedAgent.id);
        const agentHolds = sharedReservations.filter(r => r.assignedAgentId === selectedAgent.id);

        return (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            onClick={() => setSelectedAgent(null)}
          >
            <div
              className="bg-white w-full max-w-2xl border border-neutral-200 shadow-2xl rounded-xs overflow-hidden flex flex-col max-h-[85vh] my-auto text-left relative"
              onClick={(e) => e.stopPropagation()}
            >

              {/* Modal Header */}
              <div className="bg-[#0F172A] text-white p-4 sm:p-5 flex justify-between items-center shrink-0 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedAgent.avatarUrl}
                    alt={selectedAgent.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-brand-red shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-display font-extrabold uppercase text-white leading-tight">
                        {selectedAgent.name}
                      </h3>
                      <span className="text-[8px] font-mono uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded-2xs font-bold">
                        {selectedAgent.status || 'Active'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                      <span>{selectedAgent.email}</span>
                      <span>•</span>
                      <span>{selectedAgent.phone}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAgent(null)}
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
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">Total Sales</span>
                    <span className="text-base sm:text-lg font-display font-extrabold text-charcoal block mt-0.5">
                      {perf.salesFormatted || selectedAgent.salesValue}
                    </span>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xs text-left">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">Commission (3%)</span>
                    <span className="text-base sm:text-lg font-display font-extrabold text-brand-red block mt-0.5">
                      {perf.commissionFormatted}
                    </span>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xs text-left">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">Deals Closed</span>
                    <span className="text-base sm:text-lg font-display font-bold text-emerald-700 block mt-0.5">
                      {selectedAgent.dealsClosedCount} Deals
                    </span>
                  </div>
                </div>

                {/* 1. Recent Vehicle Sales */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center border-b border-neutral-200 pb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-brand-red" />
                      <span>Recent Car Sales ({perf.agentTx.length})</span>
                    </span>
                  </div>

                  {perf.agentTx.length > 0 ? (
                    <div className="border border-neutral-200 rounded-xs overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-neutral-50 border-b border-neutral-200 text-[8px] font-mono text-neutral-400 uppercase tracking-wider">
                          <tr>
                            <th className="py-2 px-3">Vehicle</th>
                            <th className="py-2 px-3">Buyer</th>
                            <th className="py-2 px-3">Sale Price</th>
                            <th className="py-2 px-3">Commission</th>
                            <th className="py-2 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-mono text-[10px]">
                          {perf.agentTx.map(tx => (
                            <tr key={tx.id} className="hover:bg-neutral-50/50">
                              <td className="py-2 px-3 font-sans font-semibold text-charcoal">
                                {tx.vehicleModel}
                              </td>
                              <td className="py-2 px-3 text-neutral-600 font-sans uppercase">
                                {tx.customerName}
                              </td>
                              <td className="py-2 px-3 font-bold text-charcoal">
                                {tx.totalAmount}
                              </td>
                              <td className="py-2 px-3 font-bold text-brand-red">
                                {tx.agentCommission || '$2,245'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <span className={`text-[8px] font-mono uppercase px-1.5 py-0.2 rounded-2xs font-bold ${
                                  tx.paymentStatus === 'Paid'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {tx.paymentStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="border border-neutral-200 bg-neutral-50 p-4 text-center text-neutral-400 text-xs rounded-xs">
                      No car sales on record for this agent.
                    </div>
                  )}
                </div>

                {/* 2. Active Reserved Holds (if any) */}
                {agentHolds.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center border-b border-neutral-200 pb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-brand-red" />
                        <span>Active Vehicle Holds ({agentHolds.length})</span>
                      </span>
                    </div>

                    <div className="space-y-2">
                      {agentHolds.map(h => {
                        const client = clients.find(c => c.id === h.clientId);
                        const vehicle = vehicles.find(v => v.id === h.vehicleId);
                        return (
                          <div key={h.id} className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xs flex justify-between items-center">
                            <div>
                              <span className="font-display font-bold uppercase text-[11px] text-charcoal block">
                                {vehicle?.model || 'Reserved Vehicle'}
                              </span>
                              <span className="text-[9px] font-mono text-neutral-500">
                                Client: {client?.name}
                              </span>
                            </div>
                            <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-2xs bg-blue-50 text-blue-700 font-bold">
                              {h.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="bg-neutral-50 border-t border-neutral-200 p-3 sm:p-4 flex justify-between items-center shrink-0">
                <span className="text-[10px] font-mono text-neutral-500">
                  Agent ID: <strong className="text-charcoal">{selectedAgent.id}</strong> • Assigned Leads: {agentClients.length}
                </span>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="px-4 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white font-mono uppercase text-xs font-bold rounded-xs cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
