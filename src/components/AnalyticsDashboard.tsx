import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, CheckCircle2, Clock, Activity, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Stats {
  totalEarnings: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

interface AnalyticsDashboardProps {
  userId: string;
}

export default function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    // Mock chart data
    setChartData([
      { name: 'Mon', earnings: 45, tasks: 3 },
      { name: 'Tue', earnings: 52, tasks: 4 },
      { name: 'Wed', earnings: 38, tasks: 2 },
      { name: 'Thu', earnings: 65, tasks: 5 },
      { name: 'Fri', earnings: 48, tasks: 3 },
      { name: 'Sat', earnings: 85, tasks: 6 },
      { name: 'Sun', earnings: 72, tasks: 4 },
    ]);
  }, [userId]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/analytics/summary/${userId}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const StatCard = ({ icon: Icon, label, value, subValue, color }: any) => (
    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <TrendingUp className="w-3 h-3 text-emerald-500" />
      </div>
      <div>
        <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{label}</p>
        <p className="text-xl font-black text-white tracking-tight">{value}</p>
        <p className="text-[9px] text-emerald-500 font-bold uppercase">{subValue}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 p-6 bg-black/40 backdrop-blur-xl rounded-[32px] border border-white/10 h-full overflow-hidden">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-electric-blue/20 flex items-center justify-center text-electric-blue">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-tight">Performance Analytics</h2>
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Urban Intelligence Metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Activity} 
          label="Total Earnings" 
          value={`€${(stats?.totalEarnings ?? 0).toFixed(2)}`} 
          subValue="+12.5% vs last week"
          color="bg-emerald-500/10 text-emerald-500"
        />
        <StatCard 
          icon={Target} 
          label="Tasks Completed" 
          value={stats?.completedTasks || 0} 
          subValue="+3 today"
          color="bg-electric-blue/10 text-electric-blue"
        />
        <StatCard 
          icon={CheckCircle2} 
          label="Success Rate" 
          value={`${(stats?.completionRate ?? 0).toFixed(1)}%`} 
          subValue="Optimal performance"
          color="bg-purple-500/10 text-purple-500"
        />
        <StatCard 
          icon={Clock} 
          label="Avg. Response" 
          value="14.2m" 
          subValue="-2m faster"
          color="bg-yellow-500/10 text-yellow-500"
        />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Earnings Velocity</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-[8px] text-white/40 uppercase font-bold">Revenue</span></div>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Task Volume</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-electric-blue" /> <span className="text-[8px] text-white/40 uppercase font-bold">Volume</span></div>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Line type="stepAfter" dataKey="tasks" stroke="#00d2ff" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
