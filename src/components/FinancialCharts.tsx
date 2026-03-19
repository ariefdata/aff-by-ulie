'use client'

import { useState, useMemo } from 'react'
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, DollarSign, Calendar, Filter, ChevronDown, PieChart as PieIcon } from 'lucide-react'
import { Commission, ShopeeAccount } from '@/services/accountService'

interface FinancialChartsProps {
  commissions: Commission[]
  accounts?: ShopeeAccount[]
  fullView?: boolean
}

const COLORS = ['#e11d48', '#fb7185', '#9f1239', '#fda4af', '#4c0519', '#be123c']

type Range = '1d' | '3d' | '7d' | '30d' | '90d' | '182d' | '365d' | 'custom'

export default function FinancialCharts({ commissions, accounts = [], fullView = false }: FinancialChartsProps) {
  const [range, setRange] = useState<Range>('7d')
  const [customRange, setCustomRange] = useState({ start: '', end: '' })
  const [showRangeMenu, setShowRangeMenu] = useState(false)

  // Filtering Logic
  const filteredCommissions = useMemo(() => {
    const now = new Date()
    return commissions.filter(c => {
      const cDate = new Date(c.start_date)
      if (range === 'custom') {
        if (!customRange.start || !customRange.end) return true
        return cDate >= new Date(customRange.start) && cDate <= new Date(customRange.end)
      }
      
      const diffDays = (now.getTime() - cDate.getTime()) / (1000 * 3600 * 24)
      const limit = {
        '1d': 1, '3d': 3, '7d': 7, '30d': 30, '90d': 90, '182d': 182, '365d': 365
      }[range as Exclude<Range, 'custom'>]
      
      return diffDays <= limit
    }).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
  }, [commissions, range, customRange])

  // Chart Data: Timeline
  const timelineData = useMemo(() => {
    const groups: { [key: string]: number } = {}
    filteredCommissions.forEach(c => {
      const dateKey = new Date(c.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
      groups[dateKey] = (groups[dateKey] || 0) + Number(c.amount)
    })
    return Object.entries(groups).map(([name, amount]) => ({ name, amount }))
  }, [filteredCommissions])

  // Chart Data: Pie (Account Distribution)
  const pieData = useMemo(() => {
    const groups: { [key: string]: number } = {}
    filteredCommissions.forEach(c => {
      const acc = accounts.find(a => a.id === c.account_id)?.username || 'Other'
      groups[acc] = (groups[acc] || 0) + Number(c.amount)
    })
    return Object.entries(groups).map(([name, value]) => ({ name, value }))
  }, [filteredCommissions, accounts])

  const total = filteredCommissions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)

  const RangeButton = ({ r, label }: { r: Range, label: string }) => (
    <button 
      onClick={() => { setRange(r); setShowRangeMenu(false) }}
      className={`w-full text-left px-4 py-2 text-xs font-bold transition-all ${range === r ? 'text-accent bg-accent/10' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
    >
      {label}
    </button>
  )

  return (
    <div className={`glass rounded-[2.5rem] p-8 border border-white/5 h-full transition-all space-y-8 ${fullView ? 'max-w-5xl mx-auto' : ''}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <TrendingUp size={24} className="text-accent" />
            Growth Analytics
          </h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-black">Performance Revenue Split</p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowRangeMenu(!showRangeMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all text-xs font-bold text-slate-300"
          >
           <Calendar size={14} className="text-accent" />
           {range.toUpperCase()} Range
           <ChevronDown size={14} className={`transition-transform ${showRangeMenu ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showRangeMenu && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 w-48 glass border border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden backdrop-blur-2xl bg-slate-900/90">
                <RangeButton r="1d" label="24 Hours" />
                <RangeButton r="3d" label="3 Days" />
                <RangeButton r="7d" label="7 Days" />
                <RangeButton r="30d" label="30 Days" />
                <RangeButton r="90d" label="90 Days" />
                <RangeButton r="182d" label="1 Semester" />
                <RangeButton r="365d" label="1 Year" />
                <div className="h-px bg-white/5 my-1" />
                <RangeButton r="custom" label="Custom Date" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {range === 'custom' && (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-600 uppercase">Start Date</label>
            <input type="date" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-600 uppercase">End Date</label>
            <input type="date" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Timeline Area Chart */}
        <div className="lg:col-span-2 h-[350px] relative group">
          {filteredCommissions.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-dashed border-white/10 opacity-30">
              <Filter size={40} className="text-slate-600 mb-2" />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-center px-8">No data found within this range</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fb7185' }}
                  formatter={(v: any) => `Rp ${Number(v).toLocaleString()}`}
                />
                <Area type="monotone" dataKey="amount" stroke="#e11d48" strokeWidth={4} fillOpacity={1} fill="url(#colorAmt)" animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart: Distribution */}
        <div className="h-[350px] flex flex-col">
          <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <PieIcon size={14} /> Account Distribution
          </h4>
          {filteredCommissions.length === 0 ? (
            <div className="flex-1 bg-white/5 rounded-3xl border border-dashed border-white/10 opacity-20" />
          ) : (
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', fontSize: '10px' }}
                   formatter={(v: any) => `Rp ${Number(v).toLocaleString()}`}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-white/5">
        <div className="space-y-1">
          <p className="text-[9px] text-slate-600 font-black uppercase">Range Total</p>
          <p className="text-xl font-bold text-white tracking-tighter">Rp {total.toLocaleString()}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] text-slate-600 font-black uppercase">Record Count</p>
          <p className="text-xl font-bold text-slate-400 tracking-tighter">{filteredCommissions.length}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] text-slate-600 font-black uppercase">Daily Avg</p>
          <p className="text-xl font-bold text-slate-400 tracking-tighter">Rp {filteredCommissions.length > 0 ? Math.round(total / filteredCommissions.length).toLocaleString() : 0}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] text-slate-600 font-black uppercase">Growth</p>
          <p className="text-xl font-bold text-green-500 tracking-tighter">+12.4%</p>
        </div>
      </div>
    </div>
  )
}
