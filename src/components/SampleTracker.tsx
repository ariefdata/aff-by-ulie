'use client'

import { useState } from 'react'
import { Package, Clock, CheckCircle2, AlertCircle, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Sample {
  id: string
  product_name: string
  status: 'REQUESTED' | 'RECEIVED' | 'REVIEWED' | 'POSTED'
  deadline: string
}

export default function SampleTracker() {
  const [samples, setSamples] = useState<Sample[]>([])

  const getStatusStyle = (status: Sample['status']) => {
    switch (status) {
      case 'POSTED': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'REVIEWED': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'RECEIVED': return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
      default: return 'text-slate-400 bg-white/5 border-white/10'
    }
  }

  return (
    <div className="glass rounded-3xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Package size={20} className="text-accent" />
          Logistik Sampel
        </h3>
        <button className="p-2 hover:bg-white/5 rounded-lg transition-all text-slate-400 hover:text-white">
          <Plus size={18} />
        </button>
      </div>

      <div className="space-y-3">
        {samples.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center opacity-40">
             <Clock size={32} className="mb-3 text-slate-500" />
             <p className="text-xs text-slate-400">Belum ada sampel yang dilacak</p>
          </div>
        ) : (
          samples.map((sample) => (
            <div key={sample.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-all">
              <div>
                <h4 className="text-sm font-medium text-white mb-1">{sample.product_name}</h4>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusStyle(sample.status)}`}>
                    {sample.status}
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock size={10} /> Deadline: {sample.deadline}
                  </span>
                </div>
              </div>
              <button className="p-2 text-slate-600 hover:text-accent transition-colors">
                <CheckCircle2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-white/5">
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
           <AlertCircle size={12} className="text-amber-500" />
           <span>Deadline sampel H-3 akan masuk ke push notification otomatis.</span>
        </div>
      </div>
    </div>
  )
}
