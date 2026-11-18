import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMockData } from '../hooks/useMockData';
import { DashboardSkeleton } from '../components/Skeletons';
import { 
  Users, 
  CalendarClock, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  Target,
  FileText,
  Zap,
  ChevronRight
} from 'lucide-react';

export default function AgentDashboard() {
  const navigate = useNavigate();
  const { data: agent, isLoading: agentLoading } = useMockData('agents');
  const { data: clientsList, isLoading: clientsLoading } = useMockData('clients');
  const { data: reservationsList, isLoading: resLoading } = useMockData('reservations');
  const { data: vehiclesList, isLoading: vehiclesLoading } = useMockData('vehicles');
  const { data: activityList, isLoading: activityLoading } = useMockData('activityLog');

  const isLoading = agentLoading || clientsLoading || resLoading || vehiclesLoading || activityLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Filter reservations relevant to agent-101
  const agentReservations = reservationsList?.filter(r => r.assignedAgentId === 'agent-101') || [];
  const activeResCount = agentReservations.filter(r => r.status === 'Pending' || r.status === 'Confirmed').length;
  
  // Expiration soon holds (< 24 hours left)
  const closingSoon = agentReservations
    .filter(r => {
      if (r.status !== 'Pending' && r.status !== 'Confirmed') return false;
      const timeLeftHours = (new Date(r.holdExpiresAt) - new Date()) / (1000 * 60 * 60);
      return timeLeftHours > 0 && timeLeftHours < 24;
    })
    .sort((a, b) => new Date(a.holdExpiresAt) - new Date(b.holdExpiresAt));

  const closedCount = agent?.dealsClosedCount || 0;
  const chartData = agent?.monthlySalesTrend || [];
  const maxVal = Math.max(...chartData.map(d => d.sales)) || 1;

  // Pipeline funnel data (mock based on client statuses)
  const agentClients = clientsList?.filter(c => c.assignedAgentId === 'agent-101') || [];
  const pipeline = [
    { stage: 'Active Lead', count: agentClients.filter(c => c.status === 'Active Lead').length, color: '#3B82F6', bgColor: 'bg-blue-50' },
    { stage: 'In Progress', count: agentClients.filter(c => c.status === 'In Progress').length, color: '#F59E0B', bgColor: 'bg-amber-50' },
    { stage: 'Closing', count: activeResCount, color: '#C0392B', bgColor: 'bg-red-50' },
    { stage: 'Closed', count: agentClients.filter(c => c.status === 'Closed').length, color: '#10B981', bgColor: 'bg-emerald-50' }
  ];
  const maxPipeline = Math.max(...pipeline.map(p => p.count), 1);

  // Commission target progress
  const commissionEarned = 11535;
  const commissionTarget = 15000;
  const commissionPct = Math.min(100, Math.round((commissionEarned / commissionTarget) * 100));

  // Top clients by deal value (mock enrichment)
  const topClients = [
    { name: 'Alexander Sterling', vehicle: 'Mercedes-Benz GLE', value: '$68,000', status: 'In Progress', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80' },
    { name: 'Diana Prince', vehicle: 'Range Rover Sport', value: '$94,000', status: 'In Progress', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&q=80' },
    { name: 'Tony Stark', vehicle: 'Porsche 911', value: '$112,000', status: 'In Progress', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&q=80' }
  ];

  return (
    <div className="space-y-8 text-left">
      
      {/* Agent Profile Header */}
      <div className="dash-hero-card p-5 flex items-center gap-5 animate-fade-slide-up">
        <div className="relative z-10 flex items-center gap-4 flex-1">
          <div className="relative">
            <img 
              src={agent?.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&q=80'} 
              alt="Agent" 
              className="w-14 h-14 rounded-full object-cover border-2 border-brand-red"
            />
          </div>
          <div>
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mb-0.5">// CRM Console</span>
            <h2 className="text-2xl md:text-3xl font-display font-extrabold text-white uppercase leading-none">
              {agent?.name || 'Sarah'}'s Workspace
            </h2>
            <p className="text-xs text-neutral-500 font-sans mt-1.5">
              Monitor pipeline activities, expiring holdings, and commission metrics.
            </p>
          </div>
        </div>
        <div className="relative z-10 hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 border border-white/20 rounded-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Online</span>
        </div>
      </div>

      {/* Quick Action Strip */}
      <div className="flex flex-wrap gap-3 animate-fade-slide-up" style={{ animationDelay: '80ms' }}>
        <Link to="/agent/reserve" className="quick-action-btn font-mono">
          <Zap className="w-3.5 h-3.5" />
          New Reservation
        </Link>
        <Link to="/agent/pipeline" className="quick-action-btn font-mono">
          <Target className="w-3.5 h-3.5" />
          View Pipeline
        </Link>
        <Link to="/agent/documents" className="quick-action-btn font-mono">
          <FileText className="w-3.5 h-3.5" />
          Generate Invoice
        </Link>
        <Link to="/agent/clients" className="quick-action-btn font-mono">
          <Users className="w-3.5 h-3.5" />
          Client Roster
        </Link>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        
        {/* Card 1: Active Clients */}
        <div className="dash-card dash-card--blue p-4 flex flex-col justify-between h-24 animate-fade-slide-up">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">Active Clients</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-black text-charcoal">{agentClients.length}</span>
            <span className="text-[9px] font-mono text-emerald-500 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />+2
            </span>
          </div>
        </div>

        {/* Card 2: Active Reservations */}
        <div className="dash-card dash-card--amber p-4 flex flex-col justify-between h-24 animate-fade-slide-up">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">Active Holds</span>
            <CalendarClock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-black text-charcoal">{activeResCount}</span>
            <span className="text-[9px] font-mono text-amber-500 font-bold">Reserved</span>
          </div>
        </div>

        {/* Card 3: Completed Sales */}
        <div className="dash-card dash-card--green p-4 flex flex-col justify-between h-24 animate-fade-slide-up">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">Month Completed</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-black text-charcoal">{closedCount}</span>
            <span className="text-[10px] font-mono bg-green-50 text-green-600 px-1.5 py-0.5 uppercase tracking-wide font-bold">Closed</span>
          </div>
        </div>

        {/* Card 4: Monthly Commission */}
        <div className="dash-hero-card p-4 flex flex-col justify-between h-24 animate-fade-slide-up">
          <div className="flex justify-between items-start relative z-10">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">Commission MTD</span>
            <DollarSign className="w-4 h-4 text-brand-red" />
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-display font-black gradient-text">{agent?.totalCommissionEarned}</span>
            <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />+8.2%
            </span>
          </div>
        </div>

      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Performance Graph & Pipeline + Holds */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Enhanced Performance SVG Chart */}
          <div className="dash-panel p-5 text-left animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex justify-between items-center mb-6 border-b border-neutral-100 pb-3">
              <span className="font-display font-bold text-sm uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                <TrendingUp className="w-4.5 h-4.5 text-brand-red" />
                <span>Operational Sales Volume</span>
              </span>
              <span className="text-[9px] font-mono text-neutral-400 uppercase">Current Month: {agent?.totalSalesThisMonth}</span>
            </div>

            {/* Enhanced SVG Bar Chart with gradient fills */}
            <div className="w-full h-48 mt-4">
              <svg viewBox="0 0 500 180" width="100%" height="100%" className="overflow-visible font-mono text-[9px] text-neutral-400">
                {/* Subtle grid */}
                <line x1="30" y1="10" x2="480" y2="10" stroke="#F5F5F5" strokeWidth="1" />
                <line x1="30" y1="50" x2="480" y2="50" stroke="#F5F5F5" strokeWidth="1" />
                <line x1="30" y1="90" x2="480" y2="90" stroke="#F5F5F5" strokeWidth="1" />
                <line x1="30" y1="130" x2="480" y2="130" stroke="#F5F5F5" strokeWidth="1" />

                {/* Gradient def */}
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E74C3C" />
                    <stop offset="100%" stopColor="#C0392B" />
                  </linearGradient>
                  <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A92A1E" />
                    <stop offset="100%" stopColor="#C0392B" />
                  </linearGradient>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C0392B" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#C0392B" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Labels */}
                <text x="5" y="15" fill="#A3A3A3" textAnchor="start">Max</text>
                <text x="5" y="135" fill="#A3A3A3" textAnchor="start">$0</text>

                {/* Area fill under trend line */}
                <path
                  d={`M${50 + 14} ${130 - (chartData[0]?.sales / maxVal) * 120} ${chartData.map((d, i) => `L${50 + i * 72 + 14} ${130 - (d.sales / maxVal) * 120}`).join(' ')} L${50 + (chartData.length - 1) * 72 + 14} 130 L${50 + 14} 130 Z`}
                  fill="url(#areaGrad)"
                  className="animate-fade-in"
                />

                {/* Trend line overlay */}
                <polyline
                  points={chartData.map((d, i) => `${50 + i * 72 + 14},${130 - (d.sales / maxVal) * 120}`).join(' ')}
                  fill="none"
                  stroke="#C0392B"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  opacity="0.4"
                  className="animate-fade-in"
                />

                {/* Bars */}
                {chartData.map((d, idx) => {
                  const x = 50 + idx * 72;
                  const barHeight = (d.sales / maxVal) * 120;
                  const y = 130 - barHeight;
                  
                  return (
                    <g key={d.month} className="group chart-bar" style={{ animationDelay: `${idx * 0.1}s` }}>
                      <rect
                        x={x}
                        y={y}
                        width="28"
                        height={barHeight}
                        fill="url(#barGrad)"
                        className="hover:fill-brand-red-hover transition-colors duration-200"
                        rx="2"
                      />
                      {/* Hover tooltip */}
                      <rect
                        x={x - 4}
                        y={y - 22}
                        width="36"
                        height="16"
                        rx="3"
                        fill="#1A1A1A"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                      <text
                        x={x + 14}
                        y={y - 10}
                        fill="white"
                        textAnchor="middle"
                        className="font-bold opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[8px]"
                      >
                        ${(d.sales / 1000).toFixed(0)}k
                      </text>
                      {/* Dot on top of bar */}
                      <circle
                        cx={x + 14}
                        cy={y}
                        r="3"
                        fill="white"
                        stroke="#C0392B"
                        strokeWidth="2"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                      {/* Month Label */}
                      <text
                        x={x + 14}
                        y="148"
                        fill="#737373"
                        textAnchor="middle"
                        className="uppercase font-semibold text-[9px]"
                      >
                        {d.month}
                      </text>
                    </g>
                  );
                })}
                {/* Baseline */}
                <line x1="30" y1="130" x2="480" y2="130" stroke="#1A1A1A" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          {/* Pipeline Funnel + Commission Target Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Pipeline Funnel */}
            <div className="dash-panel p-5 animate-fade-slide-up" style={{ animationDelay: '250ms' }}>
              <span className="font-display font-bold text-sm uppercase tracking-wider text-charcoal flex items-center gap-1.5 mb-5">
                <Target className="w-4.5 h-4.5 text-brand-red" />
                <span>Client Pipeline</span>
              </span>
              <div className="space-y-3">
                {pipeline.map((stage, idx) => (
                  <div key={stage.stage} className="flex items-center gap-3 animate-fade-slide-up" style={{ animationDelay: `${300 + idx * 60}ms` }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: stage.color }}></div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-semibold w-24">{stage.stage}</span>
                    <div className="flex-1 bg-neutral-100 h-6 rounded-sm overflow-hidden relative">
                      <div 
                        className="h-full rounded-sm progress-fill flex items-center px-2"
                        style={{ 
                          width: `${Math.max(20, (stage.count / maxPipeline) * 100)}%`,
                          background: stage.color
                        }}
                      >
                        <span className="text-[9px] font-mono text-white font-bold">{stage.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Commission Tracker */}
            <div className="dash-panel p-5 animate-fade-slide-up" style={{ animationDelay: '300ms' }}>
              <span className="font-display font-bold text-sm uppercase tracking-wider text-charcoal flex items-center gap-1.5 mb-5">
                <DollarSign className="w-4.5 h-4.5 text-brand-red" />
                <span>Commission Target</span>
              </span>
              
              {/* Circular progress */}
              <div className="flex items-center gap-5">
                <svg width="90" height="90" viewBox="0 0 90 90" className="shrink-0">
                  <circle cx="45" cy="45" r="36" fill="none" stroke="#F5F5F5" strokeWidth="8" />
                  <circle 
                    cx="45" cy="45" r="36" fill="none" stroke="#C0392B" strokeWidth="8"
                    strokeDasharray={`${(commissionPct / 100) * (2 * Math.PI * 36)} ${2 * Math.PI * 36}`}
                    strokeLinecap="round"
                    transform="rotate(-90 45 45)"
                    style={{ animation: 'ringFill 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both' }}
                  />
                  <text x="45" y="42" textAnchor="middle" className="font-display font-black text-[16px]" fill="#1A1A1A">
                    {commissionPct}%
                  </text>
                  <text x="45" y="55" textAnchor="middle" className="font-mono text-[7px] uppercase" fill="#A3A3A3">
                    Of Target
                  </text>
                </svg>
                <div className="flex flex-col gap-2">
                  <div>
                    <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest block">Earned</span>
                    <span className="text-sm font-display font-black text-brand-red">${commissionEarned.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest block">Target</span>
                    <span className="text-sm font-display font-black text-charcoal">${commissionTarget.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest block">Remaining</span>
                    <span className="text-sm font-display font-bold text-neutral-500">${(commissionTarget - commissionEarned).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Expiring Holds Table */}
          <div className="dash-panel p-5 animate-fade-slide-up" style={{ animationDelay: '350ms' }}>
            <div className="flex justify-between items-center mb-6">
              <span className="font-display font-bold text-sm uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                <CalendarClock className="w-4.5 h-4.5 text-brand-red" />
                <span>Deals Closing Soon</span>
              </span>
              {closingSoon.length > 0 && (
                <span className="text-[9px] font-mono bg-amber-50 text-amber-600 px-1.5 py-0.5 uppercase tracking-wider font-bold flex items-center gap-1">
                  <span className="live-dot live-dot--amber" style={{ width: 5, height: 5 }}></span>
                  {closingSoon.length} urgent hold{closingSoon.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {closingSoon.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 text-[9px] font-mono text-neutral-400 uppercase tracking-widest">
                      <th className="pb-3 font-semibold">Client</th>
                      <th className="pb-3 font-semibold">Vehicle</th>
                      <th className="pb-3 font-semibold">Time Remaining</th>
                      <th className="pb-3 font-semibold text-right font-mono">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closingSoon.map((res) => {
                      const client = clientsList?.find(c => c.id === res.clientId);
                      const vehicle = vehiclesList?.find(v => v.id === res.vehicleId);
                      const hoursLeft = (new Date(res.holdExpiresAt) - new Date()) / (1000 * 60 * 60);
                      
                      return (
                        <tr key={res.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 transition-colors">
                          <td className="py-3 font-display font-bold uppercase text-[11px] text-charcoal">{client?.name}</td>
                          <td className="py-3 text-neutral-500 font-mono font-bold uppercase">{vehicle?.model}</td>
                          <td className="py-3 text-brand-red font-mono font-bold uppercase flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{hoursLeft.toFixed(1)} hours left</span>
                          </td>
                          <td className="py-3 text-right">
                            <Link 
                              to="/agent/reservations"
                              className="text-[9px] font-mono uppercase tracking-widest text-brand-red hover:underline font-bold"
                            >
                              Manage
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-400 text-xs font-sans">
                No holds are nearing expiration. Excellent pipeline parameters.
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Priority Clients + Recent activities + Scheduled Test Drives */}
        <div className="space-y-6">

          {/* Test Drives & Inspections Schedule */}
          <div className="dash-panel p-5 animate-fade-slide-up" style={{ animationDelay: '220ms' }}>
            <div className="flex justify-between items-center mb-3 border-b border-neutral-100 pb-2">
              <span className="font-display font-bold text-xs uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4 text-brand-red" />
                VIP Appointments & Drives
              </span>
              <span className="text-[9px] font-mono bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-2xs font-bold">
                Today
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                { time: '11:30 AM', client: 'Diana Prince', vehicle: 'Range Rover Sport', type: 'PDI Inspection Walkthrough', status: 'Confirmed' },
                { time: '02:00 PM', client: 'Tony Stark', vehicle: 'Porsche 911 (Guards Red)', type: 'Escrow Wire Signoff', status: 'In Escrow' },
                { time: '04:30 PM', client: 'Bruce Wayne', vehicle: 'Toyota Land Cruiser', type: 'Settlement Grace Review', status: 'Urgent' }
              ].map((apt, i) => (
                <div key={i} className="p-2.5 bg-neutral-50 border border-neutral-100 rounded-xs space-y-1 text-left">
                  <div className="flex justify-between items-baseline">
                    <span className="font-mono text-[9px] font-bold text-brand-red">{apt.time}</span>
                    <span className={`text-[8px] font-mono uppercase px-1 py-0.2 rounded-2xs font-bold ${
                      apt.status === 'Urgent' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                  <div className="font-display font-bold text-xs text-charcoal uppercase">{apt.client}</div>
                  <div className="text-[10px] text-neutral-500 font-mono">{apt.vehicle} • {apt.type}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Priority Clients */}
          <div className="dash-panel p-5 animate-fade-slide-up" style={{ animationDelay: '250ms' }}>
            <span className="font-display font-bold text-sm uppercase tracking-wider text-charcoal mb-4 block flex items-center gap-1.5">
              <Users className="w-4 h-4 text-brand-red" />
              Priority Clients
            </span>

            <div className="space-y-3">
              {topClients.map((client, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 border border-neutral-100 hover:border-brand-red/30 transition-all hover:bg-neutral-50/50 cursor-pointer group">
                  <img src={client.avatar} alt={client.name} className="w-9 h-9 rounded-full object-cover border border-neutral-200 group-hover:border-brand-red transition-colors" />
                  <div className="flex-1 min-w-0">
                    <span className="font-display font-bold text-[11px] uppercase text-charcoal block truncate">{client.name}</span>
                    <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-wider block truncate">{client.vehicle}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-display font-bold text-brand-red block">{client.value}</span>
                    <span className="text-[8px] font-mono text-neutral-400 uppercase">{client.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <Link 
              to="/agent/clients"
              className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 hover:text-brand-red mt-3 flex items-center gap-1 font-bold pt-3 border-t border-neutral-100"
            >
              <span>View All Clients</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Recent Activities */}
          <div className="dash-panel p-5 flex flex-col justify-between animate-fade-slide-up" style={{ animationDelay: '300ms' }}>
            <div>
              <span className="font-display font-bold text-sm uppercase tracking-wider text-charcoal mb-4 block flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-red" />
                Recent Workspace Log
              </span>

              <div className="flex flex-col gap-3.5">
                {activityList?.slice(0, 5).map((act, idx) => (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs leading-relaxed animate-fade-slide-up" style={{ animationDelay: `${350 + idx * 40}ms` }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-red mt-1.5 shrink-0"></div>
                    <div className="flex-1 flex flex-col text-left">
                      <span className="text-neutral-700 font-semibold">{act.description}</span>
                      <span className="text-[8px] font-mono text-neutral-400 mt-0.5 uppercase">
                        {new Date(act.timestamp).toLocaleDateString()} at {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/agent/activity"
              className="text-xs font-bold uppercase tracking-widest text-charcoal hover:text-brand-red flex items-center gap-1 mt-6 border-t border-neutral-100 pt-4 cursor-pointer"
            >
              <span>View Full activity feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
