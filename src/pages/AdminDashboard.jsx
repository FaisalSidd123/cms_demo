import React from 'react';
import { useMockData } from '../hooks/useMockData';
import { DashboardSkeleton } from '../components/Skeletons';
import {
  Car,
  CalendarCheck,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Wifi,
  Shield,
  Zap
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: vehiclesList, isLoading: vehiclesLoading } = useMockData('vehicles');
  const { data: clientsList, isLoading: clientsLoading } = useMockData('clients');
  const { data: reservationsList, isLoading: resLoading } = useMockData('reservations');
  const { data: agentsList, isLoading: agentsLoading } = useMockData('agents');
  const { data: activityList, isLoading: activityLoading } = useMockData('activityLog');
  const { data: auditList, isLoading: auditLoading } = useMockData('adminAuditLog');
  const { data: transactionsList, isLoading: txLoading } = useMockData('transactions');

  const isLoading = vehiclesLoading || clientsLoading || resLoading || agentsLoading || activityLoading || auditLoading || txLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Agent leaderboard roster
  const roster = [
    { name: 'Ellen Ripley', email: 'ellen.ripley@ckautocentre.com', closed: 5, revenue: '$492,000', revenueNum: 492000, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&q=80' },
    { name: 'Sarah Connor', email: 'sarah.connor@ckautocentre.com', closed: 4, revenue: '$384,500', revenueNum: 384500, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&q=80' },
    { name: 'John Connor', email: 'john.connor@ckautocentre.com', closed: 2, revenue: '$184,000', revenueNum: 184000, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80' },
    { name: 'Kyle Reese', email: 'kyle.reese@ckautocentre.com', closed: 1, revenue: '$89,000', revenueNum: 89000, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&q=80' }
  ];

  const maxRevenue = Math.max(...roster.map(a => a.revenueNum));
  const activeResCount = reservationsList?.filter(r => r.status === 'Pending' || r.status === 'Confirmed').length || 0;
  const totalRevenueVal = '$1,149,500';

  // Inventory status breakdown
  const available = vehiclesList?.filter(v => v.status === 'available').length || 0;
  const reserved = vehiclesList?.filter(v => v.status === 'reserved').length || 0;
  const sold = vehiclesList?.filter(v => v.status === 'sold').length || 0;
  const totalVehicles = vehiclesList?.length || 1;

  // Revenue by body type (mock)
  const revenueByType = [
    { type: 'SUV', value: 45, color: '#C0392B' },
    { type: 'Sedan', value: 30, color: '#1A1A1A' },
    { type: 'Sports', value: 25, color: '#737373' }
  ];

  // Donut chart calculations
  const donutRadius = 45;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let donutOffset = 0;

  // Inventory ring calculations
  const ringRadius = 45;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const availablePct = (available / totalVehicles) * 100;
  const reservedPct = (reserved / totalVehicles) * 100;
  const soldPct = (sold / totalVehicles) * 100;

  // Top selling vehicle
  const topVehicle = vehiclesList?.find(v => v.status === 'sold');

  // Unified activity feed
  const unifiedActivities = [
    ...(activityList || []).map(a => ({ ...a, origin: 'Agent Portal' })),
    ...(auditList || []).map(a => ({ id: a.id, description: `${a.adminName} (${a.actionTaken}): ${a.target}`, timestamp: a.timestamp, origin: 'Audit Log' }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Rank badge class helper
  const getRankClass = (idx) => {
    if (idx === 0) return 'rank-badge--gold';
    if (idx === 1) return 'rank-badge--silver';
    if (idx === 2) return 'rank-badge--bronze';
    return 'rank-badge--default';
  };

  return (
    <div className="space-y-8 text-left">

      {/* Welcome header */}
      <div className="flex justify-between items-start animate-fade-slide-up">
        <div>
          <span className="text-[10px] font-mono text-brand-red uppercase tracking-widest block mb-0.5">// Operations Center</span>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold text-charcoal uppercase leading-none">
            Admin Workspace          </h2>
          <p className="text-xs text-neutral-500 font-sans mt-1.5">
            Real-time platform metrics, agent performance, and administrative audit trails.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 border border-emerald-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-[10px] font-mono text-emerald-700 uppercase tracking-widest font-bold">System Live</span>
        </div>
      </div>

      {/* KPI Cards Grid — staggered entrance */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 stagger-children">

        {/* KPI: Total Inventory */}
        <div className="dash-card dash-card--blue p-4 flex flex-col justify-between h-24 animate-fade-slide-up">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block font-semibold">Inventory</span>
            <Car className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-black text-charcoal">{vehiclesList?.length || 0}</span>
            <span className="text-[9px] font-mono text-emerald-500 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />+3 MTD
            </span>
          </div>
        </div>

        {/* KPI: Active Holds */}
        <div className="dash-card dash-card--amber p-4 flex flex-col justify-between h-24 animate-fade-slide-up">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block font-semibold">Active Holds</span>
            <CalendarCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-black text-charcoal">{activeResCount}</span>
            <span className="text-[9px] font-mono text-amber-500 font-bold">Reserved</span>
          </div>
        </div>

        {/* KPI: Total Revenue — HERO CARD */}
        <div className="dash-hero-card p-4 flex flex-col justify-between h-24 lg:col-span-2 animate-fade-slide-up">
          <div className="flex justify-between items-start relative z-10">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-semibold">Total Sales Value</span>
            <DollarSign className="w-4 h-4 text-brand-red" />
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-2xl font-display font-black gradient-text">{totalRevenueVal}</span>
            <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />+12.4%
            </span>
          </div>
        </div>

        {/* KPI: Customers */}
        <div className="dash-card dash-card--green p-4 flex flex-col justify-between h-24 animate-fade-slide-up">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block font-semibold">Customers</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-black text-charcoal">{clientsList?.length || 0}</span>
            <span className="text-[9px] font-mono text-emerald-500 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />+4
            </span>
          </div>
        </div>

        {/* KPI: Sales Agents */}
        <div className="dash-card dash-card--purple p-4 flex flex-col justify-between h-24 animate-fade-slide-up">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block font-semibold">Sales Agents</span>
            <Briefcase className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-black text-charcoal">{roster.length}</span>
            <span className="text-[9px] font-mono text-neutral-500 font-bold">Active</span>
          </div>
        </div>

      </div>

      {/* Charts Row: Revenue Donut + Inventory Ring + Top Vehicle */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-slide-up" style={{ animationDelay: '200ms' }}>

        {/* Revenue Breakdown Donut */}
        <div className="dash-panel p-5">
          <span className="font-display font-bold text-sm uppercase tracking-wider text-charcoal block mb-4">Revenue by Segment</span>
          <div className="flex items-center gap-6">
            <svg width="110" height="110" viewBox="0 0 110 110" className="shrink-0">
              {revenueByType.map((seg, idx) => {
                const dashLen = (seg.value / 100) * donutCircumference;
                const dashGap = donutCircumference - dashLen;
                const currentOffset = donutOffset;
                donutOffset += dashLen;
                return (
                  <circle
                    key={seg.type}
                    cx="55" cy="55" r={donutRadius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="12"
                    strokeDasharray={`${dashLen} ${dashGap}`}
                    strokeDashoffset={-currentOffset}
                    strokeLinecap="butt"
                    style={{ animation: `ringFill 1s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.2}s both` }}
                    transform="rotate(-90 55 55)"
                  />
                );
              })}
              <text x="55" y="52" textAnchor="middle" className="font-display font-black text-[18px]" fill="#1A1A1A">
                100%
              </text>
              <text x="55" y="65" textAnchor="middle" className="font-mono text-[8px] uppercase" fill="#A3A3A3">
                Allocated
              </text>
            </svg>
            <div className="flex flex-col gap-2.5">
              {revenueByType.map(seg => (
                <div key={seg.type} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: seg.color }}></div>
                  <span className="text-xs font-mono uppercase tracking-wider text-neutral-600 font-semibold">{seg.type}</span>
                  <span className="text-xs font-display font-bold text-charcoal ml-auto">{seg.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory Status Ring */}
        <div className="dash-panel p-5">
          <span className="font-display font-bold text-sm uppercase tracking-wider text-charcoal block mb-4">Inventory Status</span>
          <div className="flex items-center gap-6">
            <svg width="110" height="110" viewBox="0 0 110 110" className="shrink-0">
              {/* Available */}
              <circle cx="55" cy="55" r={ringRadius} fill="none" stroke="#10B981" strokeWidth="10"
                strokeDasharray={`${(availablePct / 100) * ringCircumference} ${ringCircumference}`}
                strokeDashoffset={0}
                transform="rotate(-90 55 55)"
                style={{ animation: 'ringFill 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' }}
              />
              {/* Reserved */}
              <circle cx="55" cy="55" r={ringRadius} fill="none" stroke="#F59E0B" strokeWidth="10"
                strokeDasharray={`${(reservedPct / 100) * ringCircumference} ${ringCircumference}`}
                strokeDashoffset={-(availablePct / 100) * ringCircumference}
                transform="rotate(-90 55 55)"
                style={{ animation: 'ringFill 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both' }}
              />
              {/* Sold */}
              <circle cx="55" cy="55" r={ringRadius} fill="none" stroke="#EF4444" strokeWidth="10"
                strokeDasharray={`${(soldPct / 100) * ringCircumference} ${ringCircumference}`}
                strokeDashoffset={-((availablePct + reservedPct) / 100) * ringCircumference}
                transform="rotate(-90 55 55)"
                style={{ animation: 'ringFill 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both' }}
              />
              <text x="55" y="52" textAnchor="middle" className="font-display font-black text-[18px]" fill="#1A1A1A">
                {totalVehicles}
              </text>
              <text x="55" y="65" textAnchor="middle" className="font-mono text-[8px] uppercase" fill="#A3A3A3">
                Total
              </text>
            </svg>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div>
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-600 font-semibold">Available</span>
                <span className="text-xs font-display font-bold text-charcoal ml-auto">{available}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-amber-500"></div>
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-600 font-semibold">Reserved</span>
                <span className="text-xs font-display font-bold text-charcoal ml-auto">{reserved}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-red-500"></div>
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-600 font-semibold">Sold</span>
                <span className="text-xs font-display font-bold text-charcoal ml-auto">{sold}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Vehicle Card */}
        {topVehicle && (
          <div className="dash-panel p-0 overflow-hidden flex flex-col">
            <div className="h-28 overflow-hidden relative">
              <img src={topVehicle.thumbnailImage} alt={topVehicle.model} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <span className="absolute bottom-2 left-3 text-[8px] font-mono uppercase tracking-widest text-white/80 font-bold bg-brand-red px-2 py-0.5">
                Recently Sold
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-display font-extrabold text-sm uppercase text-charcoal">{topVehicle.model}</h4>
                <p className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider mt-0.5">{topVehicle.year} · {topVehicle.color}</p>
              </div>
              <span className="text-lg font-display font-black text-brand-red mt-2">{topVehicle.price}</span>
            </div>
          </div>
        )}

      </div>

      {/* Leaderboard and Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-fade-slide-up" style={{ animationDelay: '300ms' }}>

        {/* Enhanced Agent Leaderboard */}
        <div className="lg:col-span-3 dash-panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3 mb-4">
              <span className="font-display font-bold text-sm uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                <TrendingUp className="w-4.5 h-4.5 text-brand-red" />
                <span>Agent Performance Leaderboard</span>
              </span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase">Sales Month-To-Date</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                    <th className="pb-3 font-semibold w-14">Rank</th>
                    <th className="pb-3 font-semibold">Agent</th>
                    <th className="pb-3 font-semibold text-center w-16">Deals</th>
                    <th className="pb-3 font-semibold text-right" style={{ minWidth: '180px' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {roster.map((agent, idx) => (
                    <tr key={agent.name} className="hover:bg-neutral-50/50 transition-colors group">
                      <td className="py-3.5">
                        <span className={`rank-badge ${getRankClass(idx)} font-mono`}>{idx + 1}</span>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <img src={agent.avatar} alt={agent.name} className="w-8 h-8 rounded-full object-cover border border-neutral-200 group-hover:border-brand-red transition-colors" />
                          <div className="flex flex-col">
                            <span className="font-display font-bold uppercase text-xs text-charcoal">{agent.name}</span>
                            <span className="text-[9px] font-mono text-neutral-400 tracking-wide">{agent.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 text-center font-mono font-bold text-neutral-600">{agent.closed}</td>
                      <td className="py-3.5 text-right">
                        <span className="font-display font-bold text-brand-red text-sm block mb-1.5">{agent.revenue}</span>
                        <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full progress-fill"
                            style={{
                              width: `${(agent.revenueNum / maxRevenue) * 100}%`,
                              background: idx === 0 ? 'linear-gradient(90deg, #F59E0B, #D97706)' : '#C0392B'
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Platform Activity Timeline */}
        <div className="lg:col-span-2 dash-panel p-5 flex flex-col justify-between h-[420px]">
          <div>
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3 mb-4">
              <span className="font-display font-bold text-sm uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                <Clock className="w-4.5 h-4.5 text-brand-red" />
                <span>Unified Platform Activity</span>
              </span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Live</span>
            </div>

            <div className="space-y-3.5 overflow-y-auto max-h-[300px] pr-1">
              {unifiedActivities.slice(0, 8).map((act, idx) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs leading-relaxed text-left border-b border-neutral-50/60 pb-2.5 last:border-0 animate-fade-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="w-2 h-2 rounded-full bg-brand-red mt-1 shrink-0"></div>
                  <div className="flex-1 flex flex-col">
                    <span className="text-neutral-700 font-semibold">{act.description}</span>
                    <div className="flex justify-between items-center mt-1 font-mono text-[9px] text-neutral-400 uppercase">
                      <span>Ref: {act.id}</span>
                      <span className="px-1.5 py-0.5 bg-neutral-50 rounded-sm">{act.origin}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* System Health Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="dash-panel p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Wifi className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-semibold">Uptime</span>
            <span className="text-base font-display font-black text-charcoal">99.97%</span>
          </div>
        </div>
        <div className="dash-panel p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-semibold">Avg Response</span>
            <span className="text-base font-display font-black text-charcoal">142ms</span>
          </div>
        </div>
        <div className="dash-panel p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-semibold">Active Sessions</span>
            <span className="text-base font-display font-black text-charcoal">24</span>
          </div>
        </div>
        <div className="dash-panel p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
            <Shield className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-semibold">Security Score</span>
            <span className="text-base font-display font-black text-charcoal">A+</span>
          </div>
        </div>
      </div>

    </div>
  );
}
