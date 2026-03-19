'use client'

import { useState, useMemo, useEffect } from 'react'
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'
import { 
  TrendingUp, Calendar, Filter, ChevronDown, 
  PieChart as PieIcon, History, Store, Edit2
} from 'lucide-react'
import { Commission, ShopeeAccount } from '@/services/accountService'

interface FinancialChartsProps {
  commissions: Commission[]
  accounts?: ShopeeAccount[]
  fullView?: boolean
  onEditCommission?: (c: Commission) => void
}

const COLORS = [
  '#e11d48', '#fb7185', '#9f1239', '#fda4af', '#4c0519', '#be123c',
  '#f43f5e', '#ec4899', '#fbcfe8', '#db2777', '#9d174d'
]

type Range = '1d' | '3d' | '7d' | '30d' | '90d' | '182d' | '365d' | 'custom'

export default function FinancialCharts({ commissions, accounts = [], fullView = false, onEditCommission }: FinancialChartsProps) {
  const [mounted, setMounted] = useState(false)
  const [range, setRange] = useState<Range>('7d')
  const [customRange, setCustomRange] = useState({ start: '', end: '' })
  const [showRangeMenu, setShowRangeMenu] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Filtering Logic
  const filteredCommissions = useMemo(() => {
    if (!mounted) return []
    const now = new Date()
    return commissions.filter(c => {
      if (!c.start_date) return false
      const cDate = new Date(c.start_date)
      if (isNaN(cDate.getTime())) return false

      if (range === 'custom') {
        if (!customRange.start || !customRange.end) return true
        const start = new Date(customRange.start)
        const end = new Date(customRange.end)
        return cDate >= start && cDate <= end
      }
      
      const diffDays = (now.getTime() - cDate.getTime()) / (1000 * 3600 * 24)
      const limit = {
        '1d': 1, '3d': 3, '7d': 7, '30d': 30, '90d': 90, '182d': 182, '365d': 365
      }[range as Exclude<Range, 'custom'>] || 7
      
      return diffDays <= limit
    }).sort((a, b) => {
      const ta = new Date(a.start_date).getTime()
      const tb = new Date(b.start_date).getTime()
      return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb)
    })
  }, [commissions, range, customRange, mounted])

  // Chart Data: Multi-line Timeline (using BarChart for stability)
  const timelineData = useMemo(() => {
    if (!mounted) return []
    const groups: { [key: string]: any } = {}
    filteredCommissions.forEach(c => {
      const d = new Date(c.start_date)
      const dateKey = `${d.getDate()}/${d.getMonth() + 1}`
      const accName = accounts.find(a => a.id === c.account_id)?.username || 'Other'
      
      if (!groups[dateKey]) groups[dateKey] = { name: dateKey }
      groups[dateKey][accName] = (groups[dateKey][accName] || 0) + Number(c.amount)
    })
    return Object.values(groups)
  }, [filteredCommissions, accounts, mounted])

  const uniqueAccNames = useMemo(() => {
    const names = new Set<string>()
    filteredCommissions.forEach(c => {
      names.add(accounts.find(a => a.id === c.account_id)?.username || 'Other')
    })
    return Array.from(names)
  }, [filteredCommissions, accounts])

  // Chart Data: Pie
  const pieData = useMemo(() => {
    const groups: { [key: string]: number } = {}
    filteredCommissions.forEach(c => {
      const acc = accounts.find(a => a.id === c.account_id)?.username || 'Other'
      groups[acc] = (groups[acc] || 0) + Number(c.amount)
    })
    return Object.entries(groups).map(([name, value]) => ({ name, value }))
  }, [filteredCommissions, accounts])

  const total = filteredCommissions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)

  if (!mounted) return <div className="h-96 glass rounded-[2.5rem] animate-pulse" />

  return (
    <div className={`glass rounded-[2.5rem] p-6 md:p-8 border border-white/5 h-full transition-all space-y-10 ${fullView ? 'max-w-6xl mx-auto' : ''}`}>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <TrendingUp size={24} className="text-accent" />
            Performance
          </h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-black underline decoration-accent/30 underline-offset-4">Stable Bar Matrix V1</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={range} 
            onChange={(e) => setRange(e.target.value as Range)}
            className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-accent transition-all"
          >
            <option value="1d" className="bg-slate-900">1 Day</option>
            <option value="3d" className="bg-slate-900">3 Days</option>
            <option value="7d" className="bg-slate-900">7 Days</option>
            <option value="30d" className="bg-slate-900">30 Days</option>
            <option value="90d" className="bg-slate-900">90 Days</option>
            <option value="182d" className="bg-slate-900">1 Semester</option>
            <option value="365d" className="bg-slate-900">1 Year</option>
            <option value="custom" className="bg-slate-900">Custom Range</option>
          </select>
        </div>
      </div>

      {range === 'custom' && (
        <div className="grid grid-cols-2 gap-4">
          <input type="date" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" />
          <input type="date" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white" />
        </div>
      )}

      {/* Main Charts Row */}
      <div className="grid lg:grid-cols-3 gap-10 items-start">
        {/* Multi-Account Bar Chart (Stable) */}
        <div className="lg:col-span-2 h-[350px] relative">
          {filteredCommissions.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5 rounded-[2rem] border border-dashed border-white/10 opacity-30">
              <Filter size={40} className="text-slate-600 mb-2" />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-center px-8">No data logs found</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px' }}
                  cursor={{fill: 'rgba(255,255,255,0.02)'}}
                  formatter={(v: any) => `Rp ${Number(v).toLocaleString()}`}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', paddingTop: '10px' }} />
                {uniqueAccNames.map((name, i) => (
                  <Bar 
                    key={name}
                    dataKey={name} 
                    fill={COLORS[i % COLORS.length]} 
                    stackId="a"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Distribution */}
        <div className="h-[350px] flex flex-col glass p-6 rounded-[2rem] border border-white/5">
          <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <PieIcon size={14} /> Allocation
          </h4>
          {filteredCommissions.length === 0 ? (
            <div className="flex-1 bg-white/5 rounded-3xl border border-dashed border-white/10 opacity-20" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" isAnimationActive={false}>
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', fontSize: '10px' }}
                   formatter={(v: any) => `Rp ${Number(v).toLocaleString()}`}
                />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', paddingTop: '15px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-white/5">
        <StatItem label="Total Earnings" value={`Rp ${total.toLocaleString()}`} color="text-white" />
        <StatItem label="Total Logs" value={filteredCommissions.length.toString()} color="text-slate-400" />
        <StatItem label="Daily Average" value={`Rp ${filteredCommissions.length > 0 ? Math.round(total / (range === 'custom' ? Math.max(1, (new Date(customRange.end).getTime() - new Date(customRange.start).getTime())/(1000*3600*24)) : parseInt(range)||1)).toLocaleString() : 0}`} color="text-slate-400" />
        <StatItem label="Top Performer" value={pieData.length > 0 ? pieData.sort((a,b)=>b.value-a.value)[0].name : 'N/A'} color="text-accent" />
      </div>

      {/* History Table */}
      {fullView && filteredCommissions.length > 0 && (
        <div className="pt-12 space-y-6">
          <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
             <History size={18} className="text-accent" />
             Entries Log
          </h4>
          <div className="glass rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
             <div className="overflow-x-auto">
               <table className="w-full text-left text-[11px] border-collapse">
                 <thead className="bg-white/5">
                   <tr>
                     <th className="p-4 font-black text-slate-500 uppercase">Date</th>
                     <th className="p-4 font-black text-slate-500 uppercase">Account</th>
                     <th className="p-4 font-black text-slate-500 uppercase">Amount</th>
                     <th className="p-4 font-black text-slate-500 uppercase text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {filteredCommissions.slice(-25).reverse().map((c) => (
                     <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                       <td className="p-4 text-slate-400 font-mono">
                         {new Date(c.start_date).toLocaleDateString()}
                       </td>
                       <td className="p-4">
                         <div className="flex items-center gap-2">
                            <Store size={12} className="text-slate-600" />
                            <span className="font-bold text-white">{accounts.find(a => a.id === c.account_id)?.username || 'Unknown'}</span>
                         </div>
                       </td>
                       <td className="p-4 font-bold text-accent">
                         Rp {Number(c.amount).toLocaleString()}
                       </td>
                       <td className="p-4 text-right">
                         <button 
                            onClick={() => onEditCommission?.(c)}
                            className="p-2 bg-accent/10 text-accent rounded-lg hover:bg-accent hover:text-primary transition-all ml-auto block"
                         >
                            <Edit2 size={12} />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatItem({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{label}</p>
      <p className={`text-lg font-bold tracking-tighter truncate ${color}`}>{value}</p>
    </div>
  )
}
