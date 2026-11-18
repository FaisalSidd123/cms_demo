import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMockData } from '../hooks/useMockData';
import { TableSkeleton } from '../components/Skeletons';
import { motion, AnimatePresence } from 'framer-motion';

import {
  History,
  Search,
  ArrowUpRight,
  Calendar,
  X,
  Check,
  ChevronRight,
  Truck,
  ShieldCheck,
  Clock,
  Car,
  FileText,
  User,
  ExternalLink,
  PackageCheck
} from 'lucide-react';

export default function PortalPurchases() {
  const navigate = useNavigate();
  const { data: purchasesList, isLoading } = useMockData('purchaseHistory');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'delivered'
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const stages = ['Reserved', 'Invoiced', 'Paid', 'Shipped', 'Delivered'];

  // Sorting logic
  const handleSort = (list) => {
    if (!list) return [];
    return [...list].sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.purchaseDate) - new Date(a.purchaseDate);
      if (sortBy === 'date-asc') return new Date(a.purchaseDate) - new Date(b.purchaseDate);

      const priceA = parseInt(a.finalPrice.replace(/[$,]/g, '')) || 0;
      const priceB = parseInt(b.finalPrice.replace(/[$,]/g, '')) || 0;

      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'price-asc') return priceA - priceB;
      return 0;
    });
  };

  // Filter logic
  const filteredVehicles = handleSort(
    purchasesList?.filter(item => {
      const matchesSearch =
        item.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vin.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.statusCategory === 'active') ||
        (statusFilter === 'delivered' && item.statusCategory === 'delivered');

      return matchesSearch && matchesStatus;
    })
  );

  const activeCount = purchasesList?.filter(p => p.statusCategory === 'active').length || 0;
  const deliveredCount = purchasesList?.filter(p => p.statusCategory === 'delivered').length || 0;

  return (
    <div className="space-y-8 text-left relative">

      {/* Header */}
      <div>
        <span className="text-[10px] font-mono text-brand-red uppercase tracking-widest block mb-1">// Fleet & Acquisitions</span>
        <h2 className="text-2xl md:text-3xl font-display font-extrabold text-charcoal uppercase">
          Purchase History & Vehicle Status
        </h2>
        <p className="text-xs text-neutral-500 font-sans mt-1">
          Centrally track active orders, escrow clearance milestones, transit logistics, and delivered vehicles in your fleet.
        </p>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white border border-border-hairline p-4 shadow-xs">

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-charcoal text-white border-charcoal font-bold'
                : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            All Vehicles ({purchasesList?.length || 0})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-blue-600 text-white border-blue-600 font-bold'
                : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Active Orders ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('delivered')}
            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
              statusFilter === 'delivered'
                ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            Delivered ({deliveredCount})
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-1 max-w-lg items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by vehicle name, VIN, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-light-bg border border-border-hairline rounded-sm pl-9 pr-4 py-2 text-xs outline-hidden focus:border-brand-red transition-all text-charcoal placeholder:text-neutral-400 font-sans"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-border-hairline px-3 py-2 text-xs text-charcoal outline-hidden focus:border-brand-red cursor-pointer font-mono text-[10px] uppercase"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="price-asc">Price: Low to High</option>
          </select>
        </div>

      </div>

      {/* Main Vehicles Table */}
      {isLoading ? (
        <TableSkeleton rows={4} cols={6} />
      ) : filteredVehicles && filteredVehicles.length > 0 ? (
        <div className="bg-white border border-border-hairline shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-border-hairline text-[10px] font-mono text-neutral-400 uppercase tracking-widest select-none">
                  <th className="py-4 px-6 font-semibold">Vehicle & VIN</th>
                  <th className="py-4 px-6 font-semibold">Order / Ref</th>
                  <th className="py-4 px-6 font-semibold">Status & Stage</th>
                  <th className="py-4 px-6 font-semibold">Price</th>
                  <th className="py-4 px-6 font-semibold">Delivery Target</th>
                  <th className="py-4 px-6 font-semibold text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-hairline text-xs">
                {filteredVehicles.map((item) => {
                  const currentIdx = stages.indexOf(item.currentStage);
                  const isDelivered = item.currentStage === 'Delivered';

                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">

                      {/* Vehicle & VIN */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.vehicleDetails.image}
                            alt={item.vehicleName}
                            className="w-14 h-10 object-cover rounded-sm border border-neutral-200 shrink-0"
                          />
                          <div>
                            <span className="font-display font-bold uppercase tracking-wider text-[11px] text-charcoal block">
                              {item.vehicleName}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-mono text-neutral-400">
                                {item.vehicleDetails.year} • {item.vehicleDetails.color}
                              </span>
                              <span className="text-[9px] font-mono text-neutral-600 bg-neutral-100 px-1.5 py-0.2 rounded-xs border border-neutral-200 font-bold">
                                VIN: {item.vin.substring(0, 10)}...
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Order Ref */}
                      <td className="py-4 px-6 font-mono font-bold text-neutral-500 uppercase">
                        {item.id}
                      </td>

                      {/* Live Status & Progress */}
                      <td className="py-4 px-6">
                        <div>
                          <span
                            className={`inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm font-bold border ${
                              isDelivered
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.currentStage === 'Shipped'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isDelivered ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'
                              }`}
                            ></span>
                            {item.statusBadge}
                          </span>

                          {/* Mini Progress Dots */}
                          <div className="flex items-center gap-1.5 mt-2">
                            {stages.map((stg, i) => (
                              <div
                                key={stg}
                                title={stg}
                                className={`w-3.5 h-1.5 rounded-full transition-all ${
                                  i <= currentIdx
                                    ? isDelivered
                                      ? 'bg-emerald-500'
                                      : 'bg-brand-red'
                                    : 'bg-neutral-200'
                                }`}
                              />
                            ))}
                            <span className="text-[8px] font-mono text-neutral-400 ml-1 uppercase">
                              {item.currentStage}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6 font-display font-bold text-brand-red text-sm">
                        {item.finalPrice}
                      </td>

                      {/* Delivery Target */}
                      <td className="py-4 px-6">
                        <span className="font-mono text-neutral-600 block">
                          {new Date(item.deliveryDate).toLocaleDateString()}
                        </span>
                        <span className="text-[9px] font-sans text-neutral-400 block mt-0.5">
                          {item.etaNotice}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedVehicle(item)}
                          className="px-3 py-1.5 border border-neutral-200 hover:border-brand-red hover:bg-brand-red/5 text-charcoal hover:text-brand-red transition-all cursor-pointer inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest font-bold"
                        >
                          <span>Vehicle Status</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
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
        <div className="border border-border-hairline bg-white p-16 text-center text-neutral-400 font-sans text-xs">
          No vehicles match the selected criteria.
        </div>
      )}

      {/* VEHICLE STATUS & DOSSIER MODAL */}
      <AnimatePresence>
        {selectedVehicle && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedVehicle(null);
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
                    <Car className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-extrabold text-sm uppercase text-charcoal tracking-wide">
                        {selectedVehicle.vehicleName}
                      </h3>
                      <span className="text-[9px] font-mono bg-neutral-200 text-charcoal px-1.5 py-0.2 rounded-xs font-bold uppercase">
                        {selectedVehicle.id}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mt-0.5">
                      VIN: {selectedVehicle.vin}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-charcoal hover:bg-neutral-200/50 rounded-xs transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-6">

                {/* Hero Vehicle Banner */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-neutral-50 p-4 border border-neutral-100 rounded-xs">
                  <img
                    src={selectedVehicle.vehicleDetails.image}
                    alt={selectedVehicle.vehicleName}
                    className="w-full sm:w-36 h-24 object-cover rounded-xs border border-neutral-200"
                  />
                  <div className="flex-1 w-full text-left">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                          {selectedVehicle.vehicleDetails.year} • {selectedVehicle.vehicleDetails.color} • {selectedVehicle.vehicleDetails.type}
                        </span>
                        <h4 className="font-display font-extrabold text-lg text-charcoal uppercase mt-0.5">
                          {selectedVehicle.vehicleName}
                        </h4>
                      </div>
                      <span className="font-display font-black text-brand-red text-base">
                        {selectedVehicle.finalPrice}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-[9px] font-mono text-neutral-500 font-semibold uppercase">Assigned Advisor:</span>
                      <span className="text-[10px] font-sans font-bold text-charcoal">
                        {selectedVehicle.agent.name}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-400">
                        ({selectedVehicle.agent.contact})
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 Simple KPI Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-neutral-50 border border-neutral-200 text-left">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">Acquisition Status</span>
                    <span className="text-xs font-display font-bold text-charcoal mt-1 block uppercase">
                      {selectedVehicle.currentStage}
                    </span>
                  </div>
                  <div className="p-3 bg-neutral-50 border border-neutral-200 text-left">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">Funds Cleared</span>
                    <span className="text-xs font-display font-bold text-emerald-600 mt-1 block">
                      {selectedVehicle.financialSummary.cleared}
                    </span>
                  </div>
                  <div className="p-3 bg-neutral-50 border border-neutral-200 text-left">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">Delivery Date</span>
                    <span className="text-xs font-display font-bold text-neutral-700 mt-1 block">
                      {new Date(selectedVehicle.deliveryDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* 5-Stage Visual Progress Stepper */}
                <div className="border border-neutral-100 p-4 bg-white rounded-xs">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block mb-4">
                    // Operational Stage Milestones
                  </span>

                  <div className="relative flex justify-between items-center w-full py-2">
                    <div className="absolute left-3 right-3 h-0.5 bg-neutral-200 top-1/2 -translate-y-1/2 z-0" />
                    <div
                      className="absolute left-3 h-0.5 top-1/2 -translate-y-1/2 z-0"
                      style={{
                        width: `calc(${(stages.indexOf(selectedVehicle.currentStage) / (stages.length - 1)) * 100}% - 6px)`,
                        background: '#C0392B',
                        transition: 'width 0.4s ease'
                      }}
                    />

                    {stages.map((stageName, idx) => {
                      const curIndex = stages.indexOf(selectedVehicle.currentStage);
                      const isDone = idx < curIndex;
                      const isCurrent = idx === curIndex;

                      return (
                        <div key={stageName} className="flex flex-col items-center relative z-10">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                              isDone
                                ? 'bg-brand-red text-white'
                                : isCurrent
                                ? 'bg-white border-2 border-brand-red text-brand-red ring-4 ring-brand-red/10 scale-105'
                                : 'bg-white border border-neutral-300 text-neutral-400'
                            }`}
                          >
                            {isDone ? '✓' : idx + 1}
                          </div>
                          <span
                            className={`text-[8px] font-mono uppercase tracking-wider font-bold mt-2 whitespace-nowrap ${
                              isCurrent ? 'text-brand-red' : isDone ? 'text-charcoal' : 'text-neutral-400'
                            }`}
                          >
                            {stageName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed Stage History */}
                <div>
                  <span className="font-display font-bold text-xs uppercase tracking-wider text-charcoal mb-3 block">
                    Execution Log & Field Notes
                  </span>
                  <div className="space-y-3">
                    {selectedVehicle.stageHistory.map((step, idx) => {
                      const isPassed = idx <= stages.indexOf(selectedVehicle.currentStage);
                      return (
                        <div
                          key={step.stage}
                          className={`p-3 border text-left flex items-start gap-3 rounded-xs ${
                            isPassed
                              ? 'bg-neutral-50/70 border-neutral-200'
                              : 'bg-neutral-50/30 border-neutral-100 opacity-60'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] shrink-0 mt-0.5 ${
                              isPassed ? 'bg-emerald-600 text-white' : 'bg-neutral-300 text-white'
                            }`}
                          >
                            {isPassed ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-display font-bold text-[11px] uppercase tracking-wider text-charcoal">
                                {step.stage}
                              </span>
                              <span className="font-mono text-[9px] text-neutral-400">
                                {step.date}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-600 font-sans mt-0.5">
                              {step.note}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between shrink-0">
                <button
                  onClick={() => {
                    setSelectedVehicle(null);
                    navigate('/portal/documents');
                  }}
                  className="px-4 py-2 bg-charcoal hover:bg-neutral-800 text-white text-xs font-mono uppercase tracking-widest font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Car Documents</span>
                </button>

                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="px-4 py-2 border border-neutral-200 hover:border-neutral-300 text-charcoal text-xs font-mono uppercase tracking-widest font-semibold cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
