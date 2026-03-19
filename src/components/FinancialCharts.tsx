'use client'

import { useState, useMemo, useEffect } from 'react'
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts'
import { 
  TrendingUp, Calendar, Filter, ChevronDown, 
  PieChart as PieIcon, History, Store, Edit, Trash2, AlertCircle
} from 'lucide-react'
import { Commission, ShopeeAccount } from '@/services/accountService'

interface FinancialChartsProps {
  commissions: Commission[]
  accounts?: ShopeeAccount[]
  fullView?: boolean
  onEditCommission?: (c: Commission) => void
  onDeleteCommission?: (c: Commission) => void
}

const COLORS = [
  '#f43f5e', '#fb7185', '#9f1239', '#fda4af', '#4c0519', '#be123c',
  '#e11d48', '#ec4899', '#fbcfe8', '#db2777', '#9d174d'
]

type Range = '1d' | '3d' | '7d' | '30d' | '90d' | '182d' | '365d' | 'custom'

export default function FinancialCharts(props: FinancialChartsProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div className="h-96 glass rounded-[2.5rem] animate-pulse" />

  try {
    return <FinancialChartsInner {...props} />
  } catch (err) {
    console.error('Analytics Runtime Crash:', err)
    return (
      <div className="glass rounded-[2.5rem] p-10 border border-rose-500/20 text-center space-y-4">
        <AlertCircle size={40} className="text-rose-500 mx-auto" />
        <h3 className="text-white font-bold">Grafik bermasalah</h3>
        <p className="text-slate-500 text-xs px-10">Terdapat kesalahan saat memproses data analitik. Silakan muat ulang halaman atau hubungi pengembang.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white/5 text-white rounded-xl border border-white/10 text-[10px] font-black uppercase">Muat Ulang</button>
      </div>
    )
  }
}

function FinancialChartsInner({ commissions, accounts = [], fullView = false, onEditCommission, onDeleteCommission }: FinancialChartsProps) {
  const [range, setRange] = useState<Range>('7d')
  const [customRange, setCustomRange] = useState({ start: '', end: '' })

  const filteredCommissions = useMemo(() => {
    const now = new Date()
    return commissions.filter(c => {
      if (!c.date) return false
      const cDate = new Date(c.date)
      if (isNaN(cDate.getTime())) return false

      if (range === 'custom') {
        if (!customRange.start || !customRange.end) return true
        const start = new Date(customRange.start)
        const end = new Date(customRange.end)
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return true
        return cDate >= start && cDate <= end
      }
      
      const diffDays = (now.getTime() - cDate.getTime()) / (1000 * 3600 * 24)
      const limitKey = range.replace('d', '')
      const limit = parseInt(limitKey) || 7
      
      return diffDays <= (range === '182d' ? 182 : range === '365d' ? 365 : limit)
    }).sort((a, b) => {
      const ta = new Date(a.date).getTime()
      const tb = new Date(b.date).getTime()
      return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb)
    })
  }, [commissions, range, customRange])

  const timelineData = useMemo(() => {
    const groups: { [key: string]: any } = {}
    filteredCommissions.forEach(c => {
      try {
        const d = new Date(c.date)
        if (isNaN(d.getTime())) return
        const dateKey = `${d.getDate()}/${d.getMonth() + 1}`
        const accName = accounts.find(a => a.id === c.account_id)?.username || 'Other'
        
        if (!groups[dateKey]) groups[dateKey] = { name: dateKey }
        groups[dateKey][accName] = (groups[dateKey][accName] || 0) + (Number(c.amount) || 0)
      } catch (e) {
        console.warn('Skipping invalid entry', c)
      }
    })
    return Object.values(groups)
  }, [filteredCommissions, accounts])

  const uniqueAccNames = useMemo(() => {
    const names = new Set<string>()
    filteredCommissions.forEach(c => {
      const acc = accounts.find(a => a.id === c.account_id)
      names.add(acc?.username || 'Other')
    })
    return Array.from(names)
  }, [filteredCommissions, accounts])

  const pieData = useMemo(() => {
    const groups: { [key: string]: number } = {}
    filteredCommissions.forEach(c => {
      const acc = accounts.find(a => a.id === c.account_id)?.username || 'Other'
      groups[acc] = (groups[acc] || 0) + (Number(c.amount) || 0)
    })
    return Object.entries(groups).map(([name, value]) => ({ name, value }))
  }, [filteredCommissions, accounts])

  const total = filteredCommissions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)

  const daysOfRange = useMemo(() => {
    if (range === 'custom') {
      if (!customRange.start || !customRange.end) return 7
      const start = new Date(customRange.start)
      const end = new Date(customRange.end)
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 7
      return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)))
    }
    const val = parseInt(range)
    return isNaN(val) ? 7 : (range === '182d' ? 182 : range === '365d' ? 365 : val)
  }, [range, customRange])

  const avgPerDay = daysOfRange > 0 ? Math.round(total / daysOfRange) : 0

  return (
    <div className={`glass rounded-[2.5rem] p-6 md:p-8 border border-white/5 h-full transition-all space-y-10 ${fullView ? 'max-w-6xl mx-auto' : ''}`}>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <TrendingUp size={24} className="text-rose-500 animate-pulse" />
            Performance
          </h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-black underline decoration-rose-500/30 underline-offset-4">Payout Ledger V3.0</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={range} 
            onChange={(e) => setRange(e.target.value as Range)}
            className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-rose-500 transition-all font-mono"
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
      <div className="grid lg:grid-cols-3 gap-6 md:gap-10 items-start w-full overflow-hidden">
        {/* Multi-Account Neon Area Chart */}
        <div className="lg:col-span-2 h-[300px] md:h-[400px] relative w-full">
          {filteredCommissions.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 opacity-30">
              <Filter size={40} className="text-slate-600 mb-2" />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-center px-8">No payout logs found</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  {uniqueAccNames.map((name, i) => (
                    <linearGradient key={`grad-${i}`} id={`color-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px' }}
                  cursor={{stroke: 'rgba(255,255,255,0.05)', strokeWidth: 2}}
                  formatter={(v: any) => `Rp ${(Number(v)||0).toLocaleString()}`}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', paddingTop: '10px' }} />
                {uniqueAccNames.map((name, i) => (
                  <Area 
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill={`url(#color-${i})`}
                    stackId="1"
                    isAnimationActive={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Distribution */}
        <div className="h-[300px] md:h-[400px] flex flex-col glass p-6 rounded-[2.5rem] border border-white/5 w-full">
          <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <PieIcon size={14} /> Allocation
          </h4>
          {filteredCommissions.length === 0 ? (
            <div className="flex-1 bg-white/5 rounded-3xl border border-dashed border-white/10 opacity-20" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" isAnimationActive={false}>
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', fontSize: '10px' }}
                   formatter={(v: any) => `Rp ${(Number(v)||0).toLocaleString()}`}
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
        <StatItem label="Daily Average" value={`Rp ${avgPerDay.toLocaleString()}`} color="text-slate-400" />
        <StatItem label="Top Performer" value={pieData.length > 0 ? [...pieData].sort((a,b)=>b.value-a.value)[0].name : 'N/A'} color="text-rose-500" />
      </div>

      {/* History Table */}
      {fullView && filteredCommissions.length > 0 && (
        <div className="pt-12 space-y-6">
          <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
             <History size={18} className="text-rose-500" />
             Entries Log
          </h4>
          <div className="glass rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl w-full">
             <div className="overflow-x-auto w-full">
               <table className="w-full text-left text-[11px] border-collapse min-w-[500px]">
                 <thead className="bg-white/5">
                   <tr>
                     <th className="p-4 font-black text-slate-500 uppercase">Payout Date</th>
                     <th className="p-4 font-black text-slate-500 uppercase">Account</th>
                     <th className="p-4 font-black text-slate-500 uppercase">Amount</th>
                     <th className="p-4 font-black text-slate-500 uppercase text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {filteredCommissions.slice(-25).reverse().map((c) => (
                     <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                       <td className="p-4 text-slate-400 font-mono">
                         {new Date(c.date).toLocaleDateString()}
                       </td>
                       <td className="p-4">
                         <div className="flex items-center gap-2">
                            <Store size={12} className="text-slate-600" />
                            <span className="font-bold text-white">{accounts.find(a => a.id === c.account_id)?.username || 'Unknown'}</span>
                         </div>
                       </td>
                       <td className="p-4 font-bold text-rose-500">
                         Rp {(Number(c.amount)||0).toLocaleString()}
                       </td>
                       <td className="p-4 text-right">
                         <div className="flex items-center justify-end gap-1">
                           <button 
                              onClick={() => onEditCommission?.(c)}
                              className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                              title="Ubah"
                           >
                              <Edit size={12} />
                           </button>
                           <button 
                              onClick={() => onDeleteCommission?.(c)}
                              className="p-2 bg-slate-900 text-slate-500 rounded-lg hover:bg-white hover:text-slate-900 transition-all border border-white/5"
                              title="Hapus"
                           >
                              <Trash2 size={12} />
                           </button>
                         </div>
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
