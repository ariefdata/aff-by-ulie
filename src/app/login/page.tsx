'use client'

import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { LayoutDashboard, Lock, Mail, Smartphone } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const supabase = createClient()

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md glass p-8 rounded-2xl shadow-2xl relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent opacity-20 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary opacity-30 blur-3xl" />

        <div className="flex flex-col items-center mb-10 relative z-10">
          <div className="w-24 h-24 mb-6 relative animate-float">
             <Image 
                src="/logo.png" 
                alt="Aff by Ulie Logo" 
                fill 
                className="object-contain drop-shadow-[0_10px_15px_rgba(157,23,77,0.2)]"
             />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 uppercase">
            Aff by <span className="text-rose-800">Ulie</span>
          </h1>
          <p className="text-slate-500 text-center text-[10px] uppercase font-bold tracking-[0.2em] opacity-80">
            Professional Affiliate Management
          </p>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="space-y-4">
            <FeatureItem icon={<Lock className="w-4 h-4 text-rose-900/60"/>} text="Secured Account Vault" />
            <FeatureItem icon={<Smartphone className="w-4 h-4 text-rose-900/60"/>} text="SIM Lifecycle Intelligence" />
            <FeatureItem icon={<Mail className="w-4 h-4 text-rose-900/60"/>} text="Professional Logistics Tracker" />
          </div>

          <button
            onClick={handleLogin}
            className="w-full py-4 px-6 bg-rose-900 hover:bg-rose-800 text-rose-100 font-bold rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-3 active:scale-95 group overflow-hidden relative border border-white/5"
          >
            <span className="relative z-10">AKSES DASHBOARD ELITE</span>
            <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center relative z-10">
          <p className="text-[9px] text-slate-600 uppercase tracking-[0.3em] font-black">
            Dedicated to Shen Won-won
          </p>
        </div>
      </motion.div>
    </div>
  )
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-300">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
        {icon}
      </div>
      <span className="text-xs font-medium">{text}</span>
    </div>
  )
}
