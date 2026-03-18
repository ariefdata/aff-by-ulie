'use client'

import { Package, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Sample } from '@/services/accountService'

interface SampleTrackerProps {
  samples: Sample[]
}

export default function SampleTracker({ samples }: SampleTrackerProps) {
  return (
    <div className="glass rounded-[2.5rem] p-8 border border-white/5 h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <Package size={24} className="text-accent" />
            Supply Tracking
          </h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-black">Sample Logistics & Requests</p>
        </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {samples.length === 0 ? (
          <div className="py-20 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center opacity-30">
             <Package size={48} className="mb-4 text-slate-600" />
             <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No Samples Registered</p>
          </div>
        ) : (
          samples.slice(0, 10).map((sample) => (
            <div key={sample.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-accent/20 transition-all hover:bg-white/[0.07]">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate mb-1">{sample.product_name}</h4>
                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-lg border border-amber-900/30 text-amber-500 bg-amber-500/5 uppercase tracking-tighter whitespace-nowrap">
                    {sample.brand_name || 'Generic'}
                  </span>
                  <span className="text-[10px] text-slate-600 flex items-center gap-1 font-medium truncate">
                    <Clock size={10} strokeWidth={3} /> {sample.shop_name}
                  </span>
                </div>
              </div>
              <div className="ml-4 flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 text-slate-700 group-hover:text-accent group-hover:bg-accent/10 transition-all">
                <CheckCircle2 size={20} />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-white/5">
        <div className="flex items-center gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
           <AlertCircle size={18} className="text-amber-500 shrink-0" />
           <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
             Daftar sampel yang baru saja diinput akan muncul di sini. 
             Detail lengkap tersedia di menu <span className="text-amber-500 font-bold">Samples</span>.
           </p>
        </div>
      </div>
    </div>
  )
}
