"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import { 
  Euro, CreditCard, TrendingUp, Calendar, AlertCircle, 
  Users, MousePointerClick, Timer, MonitorSmartphone, 
  Activity, Download, ArrowUpRight, ArrowDownRight, Globe,
  Loader2, CheckCircle2
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell, ComposedChart, Line
} from "recharts";
import EcommerceKPIs from "@/components/admin/EcommerceKPIs";
import TokenGuardStats from "@/components/admin/TokenGuardStats";
import CountryStats from "@/components/admin/CountryStats";
import RecentActivityList from "@/components/admin/RecentActivityList";
import { DateRangePicker } from "@/components/admin/DateRangePicker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRanges, setTimeRanges] = useState<{sales: string, traffic: string, system: string}>({
    sales: '30', traffic: '30', system: '30'
  });
  const [customDateRanges, setCustomDateRanges] = useState<{sales: DateRange | undefined, traffic: DateRange | undefined, system: DateRange | undefined}>({
    sales: undefined,
    traffic: undefined,
    system: undefined
  });
  const [activeTab, setActiveTab] = useState<'sales' | 'traffic' | 'system'>('sales');
  const [realtimeUsers, setRealtimeUsers] = useState<number>(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const currentRange = timeRanges[activeTab];
        let url = `/api/admin/analytics?days=${currentRange}`;
        
        if (currentRange === 'custom') {
          const range = customDateRanges[activeTab];
          if (range?.from && range?.to) {
            url += `&from=${format(range.from, 'yyyy-MM-dd')}&to=${format(range.to, 'yyyy-MM-dd')}`;
          } else {
            url = `/api/admin/analytics?days=30`; // Default if not selected
          }
        }

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });

        const json = await res.json();
        if (!json.success) {
          setError(json.error || "Failed to load analytics");
        } else {
          setData(json);
          setRealtimeUsers(json.advanced.kpi.realtime);
        }
      } catch (err) {
        console.error(err);
        setError("An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [activeTab, timeRanges, customDateRanges]);

  // Simulate real-time fluctuations
  useEffect(() => {
    if (!data) return;
    const interval = setInterval(() => {
      setRealtimeUsers(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const next = prev + change;
        return next > 0 ? next : 1;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [data]);

  const handleExportCSV = async () => {
    if (!data) return;
    
    setIsExporting(true);
    setExportSuccess(false);

    // Simulate small processing delay for UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    let headers = [];
    let rows = [];
    let prefix = '';

    if (activeTab === 'sales') {
      headers = ['Date', 'Orders', 'Revenue (€)'];
      rows = data.advanced.revenueChart.map((row: any) => [row.date, row.orders, row.revenue]);
      prefix = 'sales';
    } else if (activeTab === 'traffic') {
      headers = ['Date', 'Pageviews', 'Unique Users'];
      rows = data.advanced.trafficChart.map((row: any) => [row.date, row.pageviews, row.uniques]);
      prefix = 'traffic';
    } else {
      headers = ['Time', 'Type', 'Message'];
      rows = data.advanced.logs.map((log: any) => [log.time, log.type, `"${log.message.replace(/"/g, '""')}"`]);
      prefix = 'system_logs';
    }
    
    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${prefix}_export_${timeRanges[activeTab]}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExporting(false);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const TrendIndicator = ({ trend }: { trend: string }) => {
    const isPositive = trend.startsWith('+');
    return (
      <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
        {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
        {trend}
      </span>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a] border border-white/10 p-4 rounded-xl shadow-xl z-50 relative">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm font-bold mt-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="text-white">{entry.name}:</span>
              <span style={{ color: entry.color }}>{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const RevenueTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#111] border border-white/10 p-4 rounded-xl shadow-2xl z-50 relative min-w-[200px]">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 pb-2 border-b border-white/5">{label}</p>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center gap-6">
              <span className="text-gray-400 text-sm">Przychód:</span>
              <span className="text-emerald-400 font-bold text-sm">€{data.revenue}</span>
            </div>
            <div className="flex justify-between items-center gap-6">
              <span className="text-gray-400 text-sm">Zamówienia:</span>
              <span className="text-white font-bold text-sm">{data.orders}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Tabs & Toolbar */}
      <div className="flex flex-col gap-4">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-[#111] border border-white/10 p-2 rounded-2xl overflow-x-auto hide-scrollbar">
          {[
            { id: 'sales', label: 'Sales & Overview', icon: <Euro className="w-4 h-4" /> },
            { id: 'traffic', label: 'Traffic & Audience', icon: <Users className="w-4 h-4" /> },
            { id: 'system', label: 'System & Health (NFA Tool)', icon: <Activity className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-accent/20 text-accent border border-accent/30' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Toolbar specific to active tab */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111] border border-white/10 p-4 rounded-2xl">
          <div className="flex flex-wrap xl:flex-nowrap xl:items-center gap-2 bg-[#1a1a1a] rounded-xl p-1 border border-white/5">
            <div className="flex items-center gap-1">
              {['today', '7', '30', 'all'].map((val) => {
                const labels: any = { today: 'Today', '7': 'Last 7 Days', '30': 'Last 30 Days', all: 'All Time' };
                const isSelected = timeRanges[activeTab] === val;
                return (
                  <button 
                    type="button"
                    key={val}
                    onClick={() => setTimeRanges(prev => ({ ...prev, [activeTab]: val }))}
                    className={`flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${isSelected ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                  >
                    {labels[val]}
                  </button>
                );
              })}
              
              <div className="xl:border-l border-white/10 xl:ml-1 pl-1">
                <DateRangePicker 
                  date={customDateRanges[activeTab]} 
                  setDate={(r) => {
                    setCustomDateRanges(prev => ({...prev, [activeTab]: r}));
                    setTimeRanges(prev => ({...prev, [activeTab]: 'custom'}));
                  }}
                  isActive={timeRanges[activeTab] === 'custom'}
                  onOpen={() => setTimeRanges(prev => ({...prev, [activeTab]: 'custom'}))}
                />
              </div>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleExportCSV}
            disabled={!data || isExporting || exportSuccess}
            className={`flex items-center justify-center min-w-[140px] gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50
              ${exportSuccess ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20'}`}
          >
            {isExporting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Exporting...</>
            ) : exportSuccess ? (
              <><CheckCircle2 className="w-4 h-4" /> Exported!</>
            ) : (
              <><Download className="w-4 h-4" /> Export CSV</>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-28 bg-white/5 rounded-2xl"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-white/5 rounded-2xl"></div>
            <div className="h-96 bg-white/5 rounded-2xl"></div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-red-400 font-bold">{error}</p>
        </div>
      ) : data ? (
        <>
          {/* =========================================
              TAB: SALES & OVERVIEW
             ========================================= */}
          {activeTab === 'sales' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              {/* Sales KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <EcommerceKPIs data={data} hideTrends={timeRanges['sales'] === 'all'} />
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {/* Revenue & Orders Chart */}
                <div className="w-full bg-[#111] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Euro className="w-5 h-5 text-gray-400" /> Revenue & Orders
                  </h3>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.advanced.revenueChart} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickMargin={15} tickLine={false} axisLine={false} tickFormatter={(val) => { if (typeof val === 'string' && val.includes(' ')) return val; const d = new Date(val); return `${d.getDate()}/${d.getMonth()+1}`; }} />
                        <YAxis stroke="#71717a" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(val) => `€${val}`} />
                        <RechartsTooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} content={<RevenueTooltip />} />
                        <Area type="monotone" dataKey="revenue" name="Przychód" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Countries and Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CountryStats data={data} />
                  <RecentActivityList data={data} />
                </div>
              </div>
            </div>
          )}

          {/* =========================================
              TAB: TRAFFIC & AUDIENCE
             ========================================= */}
          {activeTab === 'traffic' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-[#111] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-500" /> Unique Users
                    </h3>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-black text-white">{data.advanced.kpi.uniqueUsers.value}</p>
                    {timeRanges['traffic'] !== 'all' && <TrendIndicator trend={data.advanced.kpi.uniqueUsers.trend} />}
                  </div>
                </div>

                <div className="bg-[#111] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <MousePointerClick className="w-4 h-4 text-blue-500" /> Sessions
                    </h3>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-black text-white">{data.advanced.kpi.sessions.value}</p>
                    {timeRanges['traffic'] !== 'all' && <TrendIndicator trend={data.advanced.kpi.sessions.trend} />}
                  </div>
                </div>

                <div className="bg-[#111] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Timer className="w-4 h-4 text-purple-500" /> Avg. Time
                    </h3>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-black text-white">{data.advanced.kpi.avgTime.value}</p>
                    {timeRanges['traffic'] !== 'all' && <TrendIndicator trend={data.advanced.kpi.avgTime.trend} />}
                  </div>
                </div>

                <div className="bg-[#111] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-orange-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-4 h-4 text-orange-500" /> Bounce Rate
                    </h3>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-black text-white">{data.advanced.kpi.bounceRate.value}</p>
                    {timeRanges['traffic'] !== 'all' && <TrendIndicator trend={data.advanced.kpi.bounceRate.trend} />}
                  </div>
                </div>

                <div className="bg-[#111] border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-center items-center">
                  <div className="absolute top-2 right-2 flex gap-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  </div>
                  <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 text-center">Right Now</h3>
                  <p className="text-4xl font-black text-white text-center flex items-center justify-center gap-2">
                    {realtimeUsers} <span className="text-sm font-normal text-gray-500 uppercase tracking-widest">Active</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#111] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-gray-400" /> Traffic Overview
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.advanced.trafficChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorUniques" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickMargin={10} tickFormatter={(val) => { if (typeof val === 'string' && val.includes(' ')) return val; const d = new Date(val); return `${d.getDate()}/${d.getMonth()+1}`; }} />
                        <YAxis stroke="#52525b" fontSize={12} axisLine={false} tickLine={false} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="pageviews" name="Pageviews" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                        <Area type="monotone" dataKey="uniques" name="Unique Users" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorUniques)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <MonitorSmartphone className="w-5 h-5 text-gray-400" /> Devices
                  </h3>
                  <div className="flex-1 w-full min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.advanced.devices}
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {data.advanced.devices.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Top Pages</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-gray-500 text-xs uppercase tracking-widest">
                          <th className="pb-3 font-bold">Page Path</th>
                          <th className="pb-3 font-bold text-right">Views</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {data.advanced.topPages.map((page: any, i: number) => (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 font-mono text-sm text-blue-400">{page.path}</td>
                            <td className="py-3 text-right font-bold text-white">{page.views.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================
              TAB: SYSTEM & HEALTH
             ========================================= */}
          {activeTab === 'system' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex flex-col gap-6">
                  <TokenGuardStats data={data} />

                  <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Core Web Vitals</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(data.advanced.vitals).map(([key, vital]: [string, any]) => {
                        const colors = {
                          good: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                          warning: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
                          poor: 'text-red-400 bg-red-500/10 border-red-500/20'
                        };
                        const colorClass = colors[vital.status as keyof typeof colors];
                        return (
                          <div key={key} className={`border rounded-xl p-4 flex flex-col items-center justify-center ${colorClass}`}>
                            <span className="text-[10px] font-bold uppercase tracking-widest mb-1">{key}</span>
                            <span className="text-2xl font-black">{vital.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex-1">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Errors & Logs</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {data.advanced.logs.map((log: any, i: number) => {
                        let badge = '';
                        if (log.type === 'error') badge = 'bg-red-500/20 text-red-400 border-red-500/20';
                        else if (log.type === 'warning') badge = 'bg-orange-500/20 text-orange-400 border-orange-500/20';
                        else if (log.type === '404') badge = 'bg-blue-500/20 text-blue-400 border-blue-500/20';
                        
                        return (
                          <div key={i} className="flex gap-3 text-sm bg-black/40 p-3 rounded-lg border border-white/5 font-mono">
                            <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded font-bold border shrink-0 h-fit ${badge}`}>
                              {log.type}
                            </span>
                            <div>
                              <p className="text-gray-300 break-all">{log.message}</p>
                              <p className="text-[10px] text-gray-600 mt-1">{log.time}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}

    </div>
  );
}
