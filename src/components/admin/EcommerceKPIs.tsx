import { Euro, TrendingUp, ShoppingCart, ArrowUpRight, ArrowDownRight } from "lucide-react";

const TrendIndicator = ({ trend }: { trend: string }) => {
  const isPositive = trend.startsWith('+');
  return (
    <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
      {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
      {trend}
    </span>
  );
};

export default function EcommerceKPIs({ data, hideTrends = false }: { data: any, hideTrends?: boolean }) {
  if (!data) return null;

  return (
    <>
      <div className="bg-[#111] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 blur-xl transition-all group-hover:bg-emerald-500/20"></div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Euro className="w-4 h-4 text-emerald-500" /> Total Revenue
          </h3>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-black text-white">€{data.summary.totalRevenue.toFixed(2)}</p>
          {!hideTrends && <TrendIndicator trend="+14.2%" />}
        </div>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 blur-xl transition-all group-hover:bg-purple-500/20"></div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-500" /> Conversion Rate
          </h3>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-black text-white">{data?.advanced?.ecommerce?.conversionRate?.value || '0%'}</p>
          {!hideTrends && <TrendIndicator trend={data?.advanced?.ecommerce?.conversionRate?.trend || '+0%'} />}
        </div>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 blur-xl transition-all group-hover:bg-blue-500/20"></div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-500" /> New Orders
          </h3>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-black text-white">{data?.advanced?.ecommerce?.newOrdersToday?.value || 0}</p>
          {!hideTrends && <TrendIndicator trend={data?.advanced?.ecommerce?.newOrdersToday?.trend || '+0%'} />}
        </div>
      </div>
    </>
  );
}
