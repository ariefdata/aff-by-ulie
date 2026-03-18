'use client'

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell
} from 'recharts'
import { TrendingUp, DollarSign } from 'lucide-react'

const data = [
  { name: 'Ulie_01', income: 4500000 },
  { name: 'Ulie_02', income: 2100000 },
  { name: 'Ulie_03', income: 3800000 },
  { name: 'Ulie_04', income: 1500000 },
]

const COLORS = ['#fbbf24', '#1e1b4b', '#334155', '#475569']

export default function FinancialCharts() {
  return (
    <div className="glass rounded-3xl p-6 border border-white/10 h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-accent" />
          Income Performance
        </h3>
        <div className="flex items-center gap-1 text-green-400 font-bold bg-green-400/10 px-3 py-1 rounded-full text-xs">
           <TrendingUp size={14} /> +12.5%
        </div>
      </div>

      <div className="h-[250px] w-full mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickFormatter={(v) => `Rp${v/1000000}jt`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
              itemStyle={{ color: '#fbbf24' }}
            />
            <Bar dataKey="income" fill="#fbbf24" radius={[6, 6, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
           <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Total Komisi</p>
           <p className="text-xl font-bold text-white tracking-tighter">Rp 11.900.000</p>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
           <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Target Bulan Ini</p>
           <p className="text-xl font-bold text-slate-400 tracking-tighter">Rp 15jt <span className="text-[10px] text-slate-600">79%</span></p>
        </div>
      </div>
    </div>
  )
}
