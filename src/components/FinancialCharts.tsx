'use client'

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  AreaChart, Area
} from 'recharts'
import { TrendingUp, DollarSign, Calendar } from 'lucide-react'
import { Commission } from '@/services/accountService'

interface FinancialChartsProps {
  commissions: Commission[]
  fullView?: boolean
}

export default function FinancialCharts({ commissions, fullView = false }: FinancialChartsProps) {
  // Process data for chart
  const chartData = commissions.slice(-7).map(c => ({
    name: new Date(c.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    amount: Number(c.amount) || 0
  }))

  const total = commissions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)

  return (
    <div className={`glass rounded-[2.5rem] p-8 border border-white/5 h-full transition-all ${fullView ? 'max-w-4xl mx-auto' : ''}`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <TrendingUp size={24} className="text-accent" />
            Performance {fullView && 'Analytics'}
          </h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-black">Verified Commissions Log</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
           <Calendar size={14} className="text-rose-400" />
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Last 7 Entries</span>
        </div>
      </div>

      <div className="h-[300px] w-full mb-8 relative group">
        {commissions.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-dashed border-white/10 opacity-40">
            <DollarSign size={40} className="text-slate-600 mb-2" />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No Data Available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}} 
              />
              <YAxis 
                hide 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                itemStyle={{ color: '#fb7185' }}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#e11d48" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorAmt)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
           <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Life-time Total</p>
           <p className="text-2xl font-bold text-white tracking-tighter">Rp {total.toLocaleString()}</p>
        </div>
        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
           <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Average Entry</p>
           <p className="text-2xl font-bold text-slate-400 tracking-tighter">
             Rp {commissions.length > 0 ? Math.round(total / commissions.length).toLocaleString() : 0}
           </p>
        </div>
      </div>
    </div>
  )
}
