import React from 'react';
import { Link } from 'react-router-dom';
import { useMockData } from '../hooks/useMockData';
import { DashboardSkeleton } from '../components/Skeletons';
import { 
  Car, 
  FileText, 
  Heart, 
  History, 
  ArrowRight, 
  User,
  Clock,
  ArrowUpRight,
  Star,
  Shield,
  ChevronRight,
  Package,
  Eye
} from 'lucide-react';

export default function PortalDashboard() {
  const { data: activeOrders, isLoading: ordersLoading } = useMockData('orders');
  const { data: purchases, isLoading: purchasesLoading } = useMockData('purchaseHistory');
  const { data: customer, isLoading: customerLoading } = useMockData('customerProfile');
  const { data: vehiclesList, isLoading: vehiclesLoading } = useMockData('vehicles');

  const isLoading = ordersLoading || purchasesLoading || customerLoading || vehiclesLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Pre-calculate statistics
  const activeOrdersCount = activeOrders?.length || 0;
  const reservationsCount = activeOrders?.filter(o => o.currentStage === 'Reserved').length || 0;
  const pastPurchasesCount = purchases?.length || 0;
  const wishlistCount = customer?.savedVehicleIds?.length || 0;

  // Stages array for stepper
  const stages = ['Reserved', 'Invoiced', 'Paid', 'Shipped', 'Delivered'];

  // Mock spending insights data
  const spendingData = [
    { month: 'Jan', amount: 0 },
    { month: 'Feb', amount: 89000 },
    { month: 'Mar', amount: 0 },
    { month: 'Apr', amount: 0 },
    { month: 'May', amount: 0 },
    { month: 'Jun', amount: 68000 }
  ];
  const maxSpend = Math.max(...spendingData.map(d => d.amount), 1);
  const totalSpent = purchases?.reduce((sum, p) => sum + parseInt(p.finalPrice.replace(/[\$,]/g, '')), 0) || 0;

  // Account tier logic
  const tierThresholds = [
    { name: 'Silver', min: 0, max: 50000, color: '#9CA3AF' },
    { name: 'Gold', min: 50000, max: 150000, color: '#F59E0B' },
    { name: 'Platinum', min: 150000, max: 500000, color: '#8B5CF6' },
    { name: 'Elite', min: 500000, max: Infinity, color: '#C0392B' }
  ];
  const currentTier = tierThresholds.find(t => totalSpent >= t.min && totalSpent < t.max) || tierThresholds[0];
  const nextTier = tierThresholds[tierThresholds.indexOf(currentTier) + 1];
  const tierProgress = nextTier ? Math.min(100, Math.round(((totalSpent - currentTier.min) / (nextTier.min - currentTier.min)) * 100)) : 100;

  // Recently ordered vehicle (most recent order's vehicle)
  const recentOrder = activeOrders?.[0];
  const recentVehicle = recentOrder ? vehiclesList?.find(v => v.id === recentOrder.vehicleId) : null;

  // Recommended vehicles (available ones not in wishlist)
  const recommended = vehiclesList?.filter(v => v.status === 'available' && !customer?.savedVehicleIds?.includes(v.id)).slice(0, 3) || [];

  // Activity feed
  const activities = [
    { id: 1, text: 'Escrow payment verified for Mercedes-Benz GLE', time: '2h ago', type: 'payment' },
    { id: 2, text: 'Invoice generated for order ord-3029', time: '1d ago', type: 'doc' },
    { id: 3, text: 'Reservation held for Range Rover Sport', time: '2d ago', type: 'hold' },
    { id: 4, text: 'Alexander Sterling profile address updated', time: '3d ago', type: 'profile' }
  ];

  // Member since date
  const memberSince = 'February 2024';

  return (
    <div className="space-y-8 text-left">
      
      {/* Welcome Hero Banner */}
      <div className="dash-hero-card p-6 md:p-8 animate-fade-slide-up">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={customer?.avatarUrl}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-brand-red"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#1A1A1A]"></span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mb-1">// Customer Portal</span>
              <h2 className="text-2xl md:text-3xl font-display font-extrabold text-white uppercase">
                Welcome back, {customer?.name.split(' ')[0]}
              </h2>
              <p className="text-xs text-neutral-500 font-sans mt-1">
                Monitor your active orders, inspect document logs, and browse saved configurations.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 border border-white/20 bg-white/5 backdrop-blur-sm">
              <Star className="w-3.5 h-3.5" style={{ color: currentTier.color }} />
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold" style={{ color: currentTier.color }}>
                {currentTier.name} Member
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 border border-white/20 bg-white/5 backdrop-blur-sm">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-bold">Since {memberSince}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        
        {/* Card 1: Active Orders */}
        <div className="dash-card dash-card--blue p-5 flex flex-col justify-between h-24 animate-fade-slide-up">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">Active Orders</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-3xl font-display font-black text-charcoal">{activeOrdersCount}</span>
            <span className="text-[10px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 uppercase tracking-wide font-bold">In Progress</span>
          </div>
        </div>

        {/* Card 2: Reservations */}
        <div className="dash-card dash-card--amber p-5 flex flex-col justify-between h-24 animate-fade-slide-up">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">VIN Reservations</span>
            <Car className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-3xl font-display font-black text-charcoal">{reservationsCount}</span>
            <span className="text-[10px] font-mono bg-amber-50 text-amber-600 px-1.5 py-0.5 uppercase tracking-wide font-bold">
              Locks Active
            </span>
          </div>
        </div>

        {/* Card 3: Past Purchases */}
        <div className="dash-card dash-card--green p-5 flex flex-col justify-between h-24 animate-fade-slide-up">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">Total Purchases</span>
            <History className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-3xl font-display font-black text-charcoal">{pastPurchasesCount}</span>
            <span className="text-[10px] font-mono bg-green-50 text-green-600 px-1.5 py-0.5 uppercase tracking-wide font-bold">Delivered</span>
          </div>
        </div>

        {/* Card 4: Wishlist */}
        <div className="dash-card dash-card--red p-5 flex flex-col justify-between h-24 animate-fade-slide-up">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">Wishlist Vehicles</span>
            <Heart className="w-4 h-4 text-brand-red" />
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-3xl font-display font-black text-charcoal">{wishlistCount}</span>
            <span className="text-[10px] font-mono bg-neutral-50 text-neutral-600 px-1.5 py-0.5 uppercase tracking-wide font-bold">Saved</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Active Orders & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Active Order Steppers + Vehicle Spotlight */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Operations Tracking */}
          <div className="dash-panel p-6 flex flex-col justify-between animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex justify-between items-center mb-6">
              <span className="font-display font-bold text-sm uppercase tracking-wider text-charcoal">
                Active Operations Tracking
              </span>
              <Link to="/portal/orders" className="text-neutral-400 hover:text-brand-red text-xs flex items-center gap-1 transition-colors">
                <span>All Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {activeOrders && activeOrders.length > 0 ? (
              <div className="space-y-8">
                {activeOrders.slice(0, 2).map((order) => {
                  const currentIdx = stages.indexOf(order.currentStage);
                  const orderVehicle = vehiclesList?.find(v => v.id === order.vehicleId);
                  
                  return (
                    <div key={order.id} className="border border-neutral-100 p-5 rounded-sm hover:border-neutral-200 transition-colors">
                      {/* Title block with vehicle thumbnail */}
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          {orderVehicle && (
                            <img src={orderVehicle.thumbnailImage} alt={orderVehicle.model} className="w-12 h-8 object-cover rounded-sm border border-neutral-200" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono bg-neutral-100 text-charcoal px-2 py-0.5 rounded-sm uppercase tracking-wide font-bold">
                                {order.id}
                              </span>
                              <span className="text-xs text-neutral-400 font-mono tracking-wider">
                                {new Date(order.orderDate).toLocaleDateString()}
                              </span>
                            </div>
                            {orderVehicle && (
                              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider mt-0.5 block">{orderVehicle.model}</span>
                            )}
                          </div>
                        </div>
                        <Link 
                          to={`/portal/orders/${order.id}`}
                          className="text-xs text-brand-red hover:underline font-semibold flex items-center gap-0.5"
                        >
                          <span>Track details</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {/* Enhanced Stepper */}
                      <div className="relative flex justify-between items-center w-full py-4 mt-2">
                        <div className="absolute left-4 right-4 h-0.5 bg-neutral-100 top-1/2 -translate-y-1/2 z-0" />
                        <div 
                          className="absolute left-4 h-0.5 top-1/2 -translate-y-1/2 z-0"
                          style={{ 
                            width: `calc(${(currentIdx / (stages.length - 1)) * 100}% - 8px)`,
                            background: 'linear-gradient(90deg, #C0392B, #E74C3C)',
                            transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}
                        />

                        {stages.map((stage, idx) => {
                          const isCompleted = idx < currentIdx;
                          const isCurrent = idx === currentIdx;
                          return (
                            <div key={stage} className="flex flex-col items-center relative z-10">
                              <div 
                                className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-500 ${
                                  isCompleted 
                                    ? 'bg-brand-red border-brand-red text-white' 
                                    : isCurrent
                                      ? 'bg-white border-brand-red text-brand-red ring-4 ring-brand-red/10 scale-110'
                                      : 'bg-white border-neutral-200 text-neutral-400'
                                }`}
                              >
                                {isCompleted ? '✓' : idx + 1}
                              </div>
                              <span className={`absolute -bottom-6 text-[8px] uppercase tracking-wider font-mono font-bold whitespace-nowrap ${
                                isCurrent ? 'text-brand-red' : isCompleted ? 'text-charcoal' : 'text-neutral-400'
                              }`}>
                                {stage}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-400 text-xs font-sans">
                No active orders found. Start your buying journey in the inventory catalog.
              </div>
            )}
          </div>

          {/* Vehicle Spotlight + Spending Insights Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Vehicle Spotlight Card */}
            {recentVehicle ? (
              <div className="dash-panel p-0 overflow-hidden animate-fade-slide-up" style={{ animationDelay: '250ms' }}>
                <div className="h-36 overflow-hidden relative">
                  <img src={recentVehicle.thumbnailImage} alt={recentVehicle.model} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-[8px] font-mono uppercase tracking-widest text-white/70 font-bold bg-brand-red px-2 py-0.5">Latest Order</span>
                    <h4 className="font-display font-extrabold text-base uppercase text-white mt-1">{recentVehicle.model}</h4>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">{recentVehicle.year} · {recentVehicle.color}</span>
                      <span className="text-lg font-display font-black text-brand-red block mt-0.5">{recentVehicle.price}</span>
                    </div>
                    <Link to="/portal/orders" className="text-[9px] font-mono text-brand-red uppercase tracking-widest font-bold hover:underline flex items-center gap-0.5">
                      Track <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-neutral-100">
                    <div>
                      <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest block">Engine</span>
                      <span className="text-[10px] font-display font-bold text-charcoal">{recentVehicle.specs.engine.split(' ').slice(0, 3).join(' ')}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest block">Fuel</span>
                      <span className="text-[10px] font-display font-bold text-charcoal">{recentVehicle.specs.fuelType}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="dash-panel p-6 flex items-center justify-center text-neutral-400 text-xs animate-fade-slide-up" style={{ animationDelay: '250ms' }}>
                No recent vehicle orders to display.
              </div>
            )}

            {/* Spending Insights Chart */}
            <div className="dash-panel p-5 animate-fade-slide-up" style={{ animationDelay: '300ms' }}>
              <span className="font-display font-bold text-sm uppercase tracking-wider text-charcoal flex items-center gap-1.5 mb-4">
                <History className="w-4 h-4 text-brand-red" />
                <span>Spending Insights</span>
              </span>
              <div className="w-full h-32">
                <svg viewBox="0 0 300 120" width="100%" height="100%" className="overflow-visible">
                  <defs>
                    <linearGradient id="spendArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C0392B" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#C0392B" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  <line x1="20" y1="10" x2="280" y2="10" stroke="#F5F5F5" strokeWidth="1" />
                  <line x1="20" y1="50" x2="280" y2="50" stroke="#F5F5F5" strokeWidth="1" />
                  <line x1="20" y1="90" x2="280" y2="90" stroke="#F5F5F5" strokeWidth="1" />

                  {/* Area fill */}
                  <path
                    d={`M${20} ${90 - (spendingData[0].amount / maxSpend) * 80} ${spendingData.map((d, i) => `L${20 + i * 52} ${90 - (d.amount / maxSpend) * 80}`).join(' ')} L${20 + (spendingData.length - 1) * 52} 90 L20 90 Z`}
                    fill="url(#spendArea)"
                  />
                  {/* Line */}
                  <polyline
                    points={spendingData.map((d, i) => `${20 + i * 52},${90 - (d.amount / maxSpend) * 80}`).join(' ')}
                    fill="none"
                    stroke="#C0392B"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  {/* Dots */}
                  {spendingData.map((d, i) => (
                    <g key={i}>
                      {d.amount > 0 && (
                        <circle cx={20 + i * 52} cy={90 - (d.amount / maxSpend) * 80} r="3.5" fill="white" stroke="#C0392B" strokeWidth="2" />
                      )}
                      <text x={20 + i * 52} y="105" textAnchor="middle" className="font-mono text-[8px] uppercase font-semibold" fill="#A3A3A3">
                        {d.month}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
                <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest">Total Invested</span>
                <span className="text-sm font-display font-black text-brand-red">${totalSpent.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Profile + Loyalty + Activities */}
        <div className="flex flex-col gap-6">
          
          {/* Loyalty / Account Status */}
          <div className="dash-panel p-6 animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
            <span className="font-display font-bold text-sm uppercase tracking-wider text-charcoal mb-4 block flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-brand-red" />
              Account Status
            </span>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center border-2" style={{ borderColor: currentTier.color }}>
                <Star className="w-6 h-6" style={{ color: currentTier.color }} />
              </div>
              <h4 className="font-display font-extrabold text-sm uppercase mt-3" style={{ color: currentTier.color }}>{currentTier.name} Tier</h4>
              <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block mt-0.5">Total Spent: ${totalSpent.toLocaleString()}</span>
            </div>

            {nextTier && (
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest">Progress to {nextTier.name}</span>
                  <span className="text-[8px] font-mono text-neutral-600 font-bold">{tierProgress}%</span>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                  <div className="h-full rounded-full progress-fill" style={{ width: `${tierProgress}%`, background: nextTier.color }}></div>
                </div>
                <span className="text-[8px] font-mono text-neutral-400 mt-1.5 block">
                  ${(nextTier.min - totalSpent).toLocaleString()} more to unlock {nextTier.name}
                </span>
              </div>
            )}
          </div>

          {/* User Profile Card */}
          <div className="dash-panel p-6 text-center flex flex-col justify-between items-center animate-fade-slide-up" style={{ animationDelay: '250ms' }}>
            <div className="w-14 h-14 rounded-full overflow-hidden bg-neutral-100 border-2 border-brand-red">
              <img
                src={customer?.avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-sm uppercase text-charcoal mt-2">{customer?.name}</h3>
              <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest mt-0.5">{customer?.email}</p>
            </div>
            <Link 
              to="/portal/profile" 
              className="text-xs font-bold uppercase tracking-wider text-brand-red hover:underline mt-3 inline-flex items-center gap-1"
            >
              <User className="w-3.5 h-3.5" />
              <span>Edit Account Settings</span>
            </Link>
          </div>

          {/* Recent Activity Log */}
          <div className="dash-panel p-6 flex-1 text-left flex flex-col justify-between animate-fade-slide-up" style={{ animationDelay: '300ms' }}>
            <span className="font-display font-bold text-sm uppercase tracking-wider text-charcoal mb-4 block flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-red" />
              Recent Activity
            </span>
            
            <div className="flex flex-col gap-3.5">
              {activities.map((act, idx) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs leading-relaxed animate-fade-slide-up" style={{ animationDelay: `${350 + idx * 40}ms` }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-red mt-1.5 shrink-0"></div>
                  <div className="flex-1 flex flex-col">
                    <span className="text-neutral-700 font-semibold">{act.text}</span>
                    <span className="text-[9px] font-mono text-neutral-400 mt-0.5 uppercase">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Recommended Vehicles Carousel */}
      {recommended.length > 0 && (
        <div className="animate-fade-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="flex justify-between items-center mb-4">
            <span className="font-display font-bold text-sm uppercase tracking-wider text-charcoal flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-brand-red" />
              Recommended For You
            </span>
            <Link to="/" className="text-[9px] font-mono text-neutral-400 hover:text-brand-red uppercase tracking-widest font-bold flex items-center gap-1 transition-colors">
              Browse All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommended.map((vehicle, idx) => (
              <Link 
                key={vehicle.id} 
                to={`/inventory/${vehicle.id}`}
                className="dash-panel p-0 overflow-hidden group block animate-fade-slide-up"
                style={{ animationDelay: `${450 + idx * 60}ms` }}
              >
                <div className="h-32 overflow-hidden relative">
                  <img 
                    src={vehicle.thumbnailImage} 
                    alt={vehicle.model} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-4">
                  <h4 className="font-display font-extrabold text-xs uppercase text-charcoal">{vehicle.model}</h4>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">{vehicle.year} · {vehicle.bodyType}</span>
                    <span className="text-sm font-display font-black text-brand-red">{vehicle.price}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action Navigation Grid */}
      <div className="dash-panel p-6 animate-fade-slide-up" style={{ animationDelay: '500ms' }}>
        <span className="font-display font-bold text-sm uppercase tracking-wider text-charcoal mb-4 block">
          Workspace Quick Links
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          
          <Link
            to="/"
            className="quick-action-btn font-mono justify-center flex-col gap-2 py-5"
          >
            <Car className="w-5 h-5 text-brand-red" />
            <span>Browse Inventory</span>
          </Link>

          <Link
            to="/portal/orders"
            className="quick-action-btn font-mono justify-center flex-col gap-2 py-5"
          >
            <Package className="w-5 h-5 text-brand-red" />
            <span>Track Orders</span>
          </Link>

          <Link
            to="/portal/documents"
            className="quick-action-btn font-mono justify-center flex-col gap-2 py-5"
          >
            <FileText className="w-5 h-5 text-brand-red" />
            <span>Transaction Docs</span>
          </Link>

          <Link
            to="/portal/profile"
            className="quick-action-btn font-mono justify-center flex-col gap-2 py-5"
          >
            <User className="w-5 h-5 text-brand-red" />
            <span>Account Settings</span>
          </Link>

        </div>
      </div>

    </div>
  );
}
