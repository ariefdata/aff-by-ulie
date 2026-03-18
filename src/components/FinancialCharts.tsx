'use client'

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell
} from 'recharts'
import { TrendingUp, DollarSign } from 'lucide-react'

const data: any[] = []

const COLORS = ['#e11d48', '#881337', '#4c0519', '#fb7185']

export default function FinancialCharts() {
  return (
    <div className="glass rounded-3xl p-6 border border-white/10 h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-accent" />
          Income Performance
        </h3>
        <div className="flex items-center gap-1 text-slate-500 font-bold bg-white/5 px-3 py-1 rounded-full text-xs underline decoration-dotted">
           <TrendingUp size={14} /> 0%
        </div>
      </div>

      <div className="h-[250px] w-full mb-8 flex flex-col items-center justify-center border border-white/5 rounded-2xl bg-white/5 opacity-50">
        <DollarSign size={32} className="text-slate-600 mb-2" />
        <p className="text-slate-500 text-[10px] italic font-mono uppercase tracking-widest">No Commission Data Found</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
           <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Total Komisi</p>
           <p className="text-xl font-bold text-white tracking-tighter">Rp 0</p>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
           <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Target Bulan Ini</p>
           <p className="text-xl font-bold text-slate-400 tracking-tighter">Rp 0 <span className="text-[10px] text-slate-600">0%</span></p>
        </div>
      </div>
    </div>
  )
}
