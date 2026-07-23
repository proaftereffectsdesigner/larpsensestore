import { Clock, ShoppingCart, UserPlus, Zap, ShieldAlert } from "lucide-react";

export default function RecentActivityList({ data }: { data: any }) {
  if (!data) return null;

  const recentActivity = data?.advanced?.recentActivity;

  if (!recentActivity) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <ShoppingCart className="w-4 h-4 text-emerald-400" />;
      case 'user': return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'topup': return <Zap className="w-4 h-4 text-purple-400" />;
      case 'security': return <ShieldAlert className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'purchase': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'user': return 'bg-blue-500/10 border-blue-500/20';
      case 'topup': return 'bg-purple-500/10 border-purple-500/20';
      case 'security': return 'bg-red-500/10 border-red-500/20';
      default: return 'bg-white/5 border-white/10';
    }
  };

  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-gray-400" /> Recent Activity
      </h3>
      
      <div className="relative border-l border-white/10 ml-3 space-y-6">
        {recentActivity.map((activity: any, idx: number) => (
          <div key={idx} className="relative pl-6">
            <div className={`absolute -left-3.5 top-0.5 w-7 h-7 rounded-full border flex items-center justify-center ${getIconBg(activity.type)}`}>
              {getIcon(activity.type)}
            </div>
            <div>
              <p className="text-sm text-gray-200 font-medium leading-tight">
                {activity.message}
              </p>
              <p className="text-xs text-gray-500 mt-1 font-bold tracking-wide">
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
