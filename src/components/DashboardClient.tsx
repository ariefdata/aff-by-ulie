'use client'

import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, Users, Smartphone, Package, 
  TrendingUp, Settings, LogOut, Plus, Copy, 
  Check, AlertTriangle, X, Search, ExternalLink, ChevronRight,
  FileText, Target, CreditCard
} from 'lucide-react'
import Image from 'next/image'
import { Account, accountService } from '@/services/accountService'
import { getSimStatus } from '@/utils/simLogic'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { pushService } from '@/services/pushService'
import SampleTracker from './SampleTracker'
import FinancialCharts from './FinancialCharts'
// useEffect is already imported above

interface DashboardClientProps {
  initialUser: any
  initialAccounts: Account[]
}

type View = 'DASHBOARD' | 'ACCOUNTS' | 'SAMPLES' | 'ANALYTICS' | 'SETTINGS' | 'SIMS'

export default function DashboardClient({ initialUser, initialAccounts }: DashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts)
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<View>('DASHBOARD')
  
  const [isPushEnabled, setIsPushEnabled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isBannerDismissed, setIsBannerDismissed] = useState(false)
  
  useEffect(() => {
    // Check if running as standalone
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
      setIsStandalone(!!isStandaloneMode)
    }
    
    checkStandalone()
    
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    const checkPush = async () => {
      // ... (rest of useEffect logic)
      const sub = await pushService.getSubscription()
      setIsPushEnabled(!!sub)
    }
    checkPush()
    
    // Check for SIM Alerts
    const alertedAccounts = accounts.filter(a => getSimStatus(a.sim_expiry).alert)
    if (alertedAccounts.length > 0) {
      pushService.sendLocalNotification(
        '⚠️ SIM Lifecycle Alert',
        `${alertedAccounts.length} akun memerlukan perhatian (Masa Tenggang/Expired).`
      )
    }
  }, [accounts])

  const handlePushToggle = async () => {
    if (isPushEnabled) {
      const success = await pushService.unsubscribe()
      if (success) setIsPushEnabled(false)
    } else {
      const sub = await pushService.register()
      if (sub) setIsPushEnabled(true)
    }
  }
  
  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }
    setDeferredPrompt(null)
    setShowInstallBanner(false)
  }

  // Form State
  // ... (rest of code)
  const [newAcc, setNewAcc] = useState<Partial<Account>>({
    sim_status: 'ACTIVE',
    samples_count: 0,
    income_total: 0,
    nickname: '',
    device_name: '',
    shopee_user: '',
    shopee_pass: '',
    email_addr: '',
    email_pass: '',
    wa_number: '',
    sim_expiry: '',
  })

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const added = await accountService.createAccount(newAcc as Omit<Account, 'id'>)
      setAccounts([added, ...accounts])
      setIsAddModalOpen(false)
      setNewAcc({ nickname: '', device_name: '', shopee_user: '', shopee_pass: '', email_addr: '', email_pass: '', wa_number: '', sim_expiry: '' })
    } catch (error) {
      console.error('Failed to add account', error)
      alert('Gagal menambah akun. Pastikan koneksi Supabase benar.')
    }
  }

  const renderContent = () => {
    switch (activeView) {
      case 'DASHBOARD':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <FinancialCharts />
              <SampleTracker />
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={20} className="text-accent" />
                Daftar Akun Master
              </h3>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {accounts.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    className="col-span-full glass rounded-3xl p-20 flex flex-col items-center justify-center text-center w-full"
                  >
                    <Users className="w-16 h-16 text-slate-600 mb-6" />
                    <p className="text-slate-400 max-w-xs">Belum ada akun terdaftar dalam sistem.</p>
                  </motion.div>
                ) : (
                  accounts.slice(0, 4).map(acc => (
                    <AccountCard key={acc.id} account={acc} onCopy={handleCopy} copiedId={copiedId} />
                  ))
                )}
              </div>
              {accounts.length > 4 && (
                <button onClick={() => setActiveView('ACCOUNTS')} className="text-accent text-sm font-medium hover:underline">
                  Lihat Semua Akun ({accounts.length})
                </button>
              )}
            </div>
          </div>
        )
      case 'ACCOUNTS':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Manajemen Akun Shopee</h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {accounts.map(acc => (
                <AccountCard key={acc.id} account={acc} onCopy={handleCopy} copiedId={copiedId} />
              ))}
            </div>
          </div>
        )
      case 'SAMPLES':
        return <div className="max-w-4xl mx-auto"><SampleTracker /></div>
      case 'ANALYTICS':
        return <div className="max-w-4xl mx-auto"><FinancialCharts /></div>
      case 'SETTINGS':
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="glass p-8 rounded-3xl border border-white/5">
               <h3 className="text-xl font-bold text-white mb-6">Profil Pengguna</h3>
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-2xl font-bold text-primary">
                    {initialUser.email?.[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{initialUser.email?.split('@')[0]}</p>
                    <p className="text-slate-500 text-sm">{initialUser.email}</p>
                  </div>
               </div>
               
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div>
                      <p className="text-sm font-bold text-white">Push Notifications</p>
                      <p className="text-[10px] text-slate-500 italic opacity-60">Alert SIM & Deadline Sampel</p>
                    </div>
                    <div 
                      onClick={handlePushToggle}
                      className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${isPushEnabled ? 'bg-rose-900' : 'bg-slate-800'}`}
                    >
                       <motion.div 
                        animate={{ x: isPushEnabled ? 24 : 0 }}
                        className={`absolute left-1 top-1 w-4 h-4 rounded-full shadow-lg ${isPushEnabled ? 'bg-rose-400' : 'bg-slate-600'}`} 
                       />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 opacity-50 cursor-not-allowed">
                    <div>
                      <p className="text-sm font-bold text-white">Telegram Bot Integration</p>
                      <p className="text-[10px] text-slate-500">Coming Soon</p>
                    </div>
                    <div className="w-12 h-6 bg-slate-800 rounded-full relative">
                       <div className="absolute left-1 top-1 w-4 h-4 bg-slate-600 rounded-full" />
                    </div>
                  </div>
               </div>
            </div>
            
            <div className="glass p-8 rounded-3xl border border-white/5 bg-rose-500/5 border-rose-500/10">
               <h3 className="text-sm font-bold text-rose-400 mb-4 uppercase tracking-widest">Zone Bahaya</h3>
               <p className="text-xs text-slate-500 mb-6">Keluar dari sesi ini akan menghapus akses cepat hingga Anda login kembali.</p>
               <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 bg-rose-500/10 text-rose-500 rounded-xl text-sm font-bold hover:bg-rose-500/20 transition-all"
               >
                  <LogOut size={16} /> Keluar Sekarang
               </button>
            </div>
          </div>
        )
      case 'SIMS':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white uppercase tracking-tighter">SIM Asset Control</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map(acc => {
                const { status, color, alert } = getSimStatus(acc.sim_expiry)
                return (
                  <div key={acc.id + '-sim'} className="glass p-6 rounded-3xl border border-white/5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded-xl bg-current/10 ${color}`}>
                          <Smartphone size={20} />
                        </div>
                        <div className={`px-2 py-1 rounded-lg text-[9px] font-black border border-current/20 ${color} bg-current/5 uppercase`}>
                          {status}
                        </div>
                      </div>
                      <h4 className="font-bold text-white text-lg mb-1">{acc.wa_number || 'No Number'}</h4>
                      <p className="text-xs text-slate-500 mb-4">Linked to: <span className="text-rose-900/80 font-bold">{acc.nickname}</span></p>
                    </div>
                    <div className="pt-4 border-t border-white/5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-bold">Expiry Date</span>
                        <span className={`font-mono ${alert ? color : 'text-slate-400'}`}>{acc.sim_expiry || 'NOT SET'}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Desktop */}
      {/* Top Manual Install Banner (Mobile Only) */}
      {!isStandalone && !isBannerDismissed && (
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 px-4 pt-4 pointer-events-none">
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass p-3 rounded-2xl border border-rose-900/20 shadow-xl flex items-center justify-between pointer-events-auto"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 relative rounded-xl overflow-hidden border border-white/10">
                <Image src="/logo.png" alt="Srikandi" fill className="object-cover" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white leading-tight">Srikandi Elite</p>
                <p className="text-[8px] text-slate-500 uppercase tracking-widest">App Mode</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={deferredPrompt ? handleInstall : () => alert('Buka menu browser ( ⋮ ) lalu klik "Install App" atau "Tambahkan ke Layar Utama".')}
                className="px-4 py-2 bg-rose-900 text-rose-100 text-[10px] font-black rounded-lg uppercase tracking-widest border border-white/5 active:scale-95"
              >
                {deferredPrompt ? 'Instal App' : 'Cara Pasang'}
              </button>
              <button 
                onClick={() => setIsBannerDismissed(true)}
                className="p-2 text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* PWA Install Banner (Bottom Popup) */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-auto md:right-8 md:w-80 z-[60]"
          >
            <div className="glass p-6 rounded-3xl border border-rose-900/30 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-900/10 to-transparent pointer-events-none" />
              <button 
                onClick={() => setShowInstallBanner(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
              >
                <X size={16} />
              </button>
              
              <div className="flex gap-4 items-center mb-4">
                <div className="w-12 h-12 relative rounded-2xl overflow-hidden shadow-lg border border-white/10">
                  <Image src="/logo.png" alt="Srikandi Elite" fill className="object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Srikandi Elite App</h4>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Native Experience</p>
                </div>
              </div>
              
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Pasang aplikasi di layar utama Anda untuk akses lebih cepat dan notifikasi real-time.
              </p>
              
              <button 
                onClick={handleInstall}
                className="w-full py-3 bg-rose-900 hover:bg-rose-800 text-rose-100 text-xs font-black rounded-xl transition-all uppercase tracking-widest border border-white/5 active:scale-95"
              >
                Instal Sekarang
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="hidden md:flex w-64 flex-col glass border-r border-white/10 p-6 fixed h-full z-20">
        <div className="flex items-center gap-3 mb-12">
          <Image src="/logo.png" alt="Logo" width={40} height={40} className="accent-glow rounded-xl" />
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">Srikandi <span className="text-rose-900/80">Elite</span></h2>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard Control" active={activeView === 'DASHBOARD'} onClick={() => setActiveView('DASHBOARD')} />
          <NavItem icon={<Users size={18} />} label="Shopee Accounts" active={activeView === 'ACCOUNTS'} onClick={() => setActiveView('ACCOUNTS')} />
          <NavItem icon={<Smartphone size={18} />} label="SIM Intelligence" active={activeView === 'SIMS'} onClick={() => setActiveView('SIMS')} />
          <NavItem icon={<Package size={18} />} label="Sampel & Logistik" active={activeView === 'SAMPLES'} onClick={() => setActiveView('SAMPLES')} />
          <NavItem icon={<TrendingUp size={18} />} label="Analitik Komisi" active={activeView === 'ANALYTICS'} onClick={() => setActiveView('ANALYTICS')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-1">
          <NavItem icon={<Settings size={18} />} label="Pengaturan" active={activeView === 'SETTINGS'} onClick={() => setActiveView('SETTINGS')} />
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-rose-400 hover:bg-rose-900/10 rounded-xl transition-all group"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Keluar</span>
          </button>
          
          <div className="mt-4 px-4">
            <p className="text-[8px] text-slate-800 uppercase font-black tracking-[0.4em] leading-relaxed group-hover:text-rose-900/40 transition-colors">
              Dedicated to<br/>Shen Won-won
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-32 md:pb-8">
        <header className="flex items-center justify-between mb-8 sticky top-0 py-4 z-30 md:static md:p-0 bg-slate-950/50 backdrop-blur-xl -mx-4 px-4 md:bg-transparent md:backdrop-blur-none">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-white mb-1 tracking-tight">{activeView === 'DASHBOARD' ? 'Elite Control Panel' : activeView}</h1>
            <p className="text-slate-700 text-[8px] uppercase font-black tracking-[0.5em]">Dedicated to Shen Won-won</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveView('SETTINGS')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeView === 'SETTINGS' ? 'bg-rose-900/20 text-rose-400' : 'bg-white/5 text-slate-400'}`}
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="w-10 h-10 rounded-xl bg-accent text-primary flex items-center justify-center shadow-lg active:scale-[0.98] transition-all accent-glow"
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>
        </header>

        {/* Quick Stats Overlay (Only on main dashboard) */}
        {activeView === 'DASHBOARD' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Akun" value={accounts.length.toString()} sub="Verified" />
            <StatCard label="SIM Alert" value={accounts.filter(a => getSimStatus(a.sim_expiry).alert).length.toString()} sub="Action Needed" color="text-orange-400" />
            <StatCard label="Sampel" value="0" sub="Pending" color="text-amber-400" />
            <StatCard label="Income" value="Rp 0" sub="Weekly Est" color="text-green-400" />
          </div>
        )}

        {renderContent()}
      </main>

      {/* Add Account Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h2 className="text-xl font-bold text-white tracking-tight">Daftarkan Akun Baru</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddAccount} className="p-6 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar pb-24">
                <div className="space-y-6">
                  {/* Account Basics */}
                  <section>
                    <h3 className="text-rose-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                       <LayoutDashboard size={14} /> Shopee Asset
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput label="Nickname Shopee" value={newAcc.nickname || ''} onChange={(v: string) => setNewAcc({...newAcc, nickname: v})} required placeholder="e.g. Ulie_Shop_01" />
                      <FormInput label="Detail Device (HP)" value={newAcc.device_name || ''} onChange={(v: string) => setNewAcc({...newAcc, device_name: v})} placeholder="e.g. Infinix - HP 01" />
                      <FormInput label="Username Shopee" value={newAcc.shopee_user || ''} onChange={(v: string) => setNewAcc({...newAcc, shopee_user: v})} required />
                      <FormInput label="Password Shopee" type="password" value={newAcc.shopee_pass || ''} onChange={(v: string) => setNewAcc({...newAcc, shopee_pass: v})} required />
                    </div>
                  </section>

                  {/* Email & Communication */}
                  <section>
                    <h3 className="text-rose-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                       <Smartphone size={14} /> SIM & Identity
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput label="Nomor WA (Pusat)" value={newAcc.wa_number || ''} onChange={(v: string) => setNewAcc({...newAcc, wa_number: v})} placeholder="08..." />
                      <FormInput label="Masa Aktif SIM" type="date" value={newAcc.sim_expiry || ''} onChange={(v: string) => setNewAcc({...newAcc, sim_expiry: v})} />
                      <FormInput label="Email Address" value={newAcc.email_addr || ''} onChange={(v: string) => setNewAcc({...newAcc, email_addr: v})} />
                      <FormInput label="Email Password" type="password" value={newAcc.email_pass || ''} onChange={(v: string) => setNewAcc({...newAcc, email_pass: v})} />
                      <FormInput label="Nama KTP" value={newAcc.ktp_name || ''} onChange={(v: string) => setNewAcc({...newAcc, ktp_name: v})} />
                      <FormInput label="Nomor NPWP" value={newAcc.npwp_num || ''} onChange={(v: string) => setNewAcc({...newAcc, npwp_num: v})} />
                    </div>
                  </section>

                  {/* Financial & Tracking */}
                  <section>
                    <h3 className="text-rose-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                       <TrendingUp size={14} /> Financial & Assets
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput label="Nama Bank" value={newAcc.bank_name || ''} onChange={(v: string) => setNewAcc({...newAcc, bank_name: v})} placeholder="e.g. BCA" />
                      <FormInput label="Nomor Rekening" value={newAcc.bank_acc || ''} onChange={(v: string) => setNewAcc({...newAcc, bank_acc: v})} />
                      <FormInput label="Total Sampel Diambil" type="number" value={newAcc.samples_count?.toString() || '0'} onChange={(v: string) => setNewAcc({...newAcc, samples_count: parseInt(v) || 0})} />
                      <FormInput label="Total Komisi (Rp)" type="number" value={newAcc.income_total?.toString() || '0'} onChange={(v: string) => setNewAcc({...newAcc, income_total: parseFloat(v) || 0})} />
                    </div>
                  </section>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full py-4 rounded-2xl bg-accent text-primary font-bold shadow-lg hover:bg-amber-500 transition-all active:scale-[0.98] border-b-4 border-amber-800"
                >
                  SAVE ASSET TO SYSTEM
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Nav - Bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/10 px-4 py-2 flex justify-between items-center z-40 bg-slate-950/80 backdrop-blur-xl">
         <MobileNavItem icon={<LayoutDashboard size={20} />} label="Dash" active={activeView === 'DASHBOARD'} onClick={() => setActiveView('DASHBOARD')} />
         <MobileNavItem icon={<Users size={20} />} label="Accounts" active={activeView === 'ACCOUNTS'} onClick={() => setActiveView('ACCOUNTS')} />
         <MobileNavItem icon={<Smartphone size={20} />} label="SIM" active={activeView === 'SIMS'} onClick={() => setActiveView('SIMS')} />
         <MobileNavItem icon={<Package size={20} />} label="Samples" active={activeView === 'SAMPLES'} onClick={() => setActiveView('SAMPLES')} />
         <MobileNavItem icon={<TrendingUp size={20} />} label="Stats" active={activeView === 'ANALYTICS'} onClick={() => setActiveView('ANALYTICS')} />
      </nav>

      {/* Floating Add Button for Mobile (Bottom Right) */}
      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-accent text-primary rounded-full flex items-center justify-center shadow-2xl z-50 accent-glow active:scale-90 transition-transform ring-4 ring-slate-950/50"
      >
        <Plus size={28} strokeWidth={3} />
      </button>
    </div>
  )
}

function AccountCard({ account, onCopy, copiedId }: { account: Account, onCopy: (t: string, id: string) => void, copiedId: string | null }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { status, color } = getSimStatus(account.sim_expiry)
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-5 rounded-3xl border border-white/5 hover:border-accent/30 transition-all group relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-bold text-white group-hover:text-accent transition-colors">{account.nickname}</h4>
          <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
             <Smartphone size={10} /> {account.device_name || 'N/A'}
          </p>
        </div>
        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold border border-current/20 ${color} bg-current/5 uppercase tracking-tighter`}>
          SIM: {status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <CredentialBox 
          label="Shopee" 
          val={account.shopee_user} 
          onCopy={() => onCopy(account.shopee_pass, account.id + '-s')}
          isCopied={copiedId === account.id + '-s'}
        />
        <CredentialBox 
          label="Email" 
          val={account.email_addr} 
          onCopy={() => onCopy(account.email_pass, account.id + '-e')}
          isCopied={copiedId === account.id + '-e'}
        />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5 pt-4 mt-4 space-y-4"
          >
            {/* SIM & WhatsApp */}
            <div className="grid grid-cols-2 gap-4">
              <DetailRow icon={<Smartphone size={12} />} label="WA Pusat" val={account.wa_number} />
              <DetailRow icon={<AlertTriangle size={12} />} label="Masa Aktif" val={account.sim_expiry} />
            </div>

            {/* KYC Details */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
              <DetailRow icon={<Users size={12} />} label="Nama KTP" val={account.ktp_name} />
              <DetailRow icon={<FileText size={12} />} label="No. NPWP" val={account.npwp_num} />
            </div>

            {/* Bank Details */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
              <DetailRow icon={<Target size={12} />} label="Bank" val={account.bank_name} />
              <DetailRow icon={<CreditCard size={12} />} label="Rekening" val={account.bank_acc} />
            </div>

            {/* Performance */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
              <DetailRow icon={<Package size={12} />} label="Sampel" val={account.samples_count?.toString()} />
              <DetailRow icon={<TrendingUp size={12} />} label="Komisi" val={account.income_total ? `Rp ${account.income_total.toLocaleString()}` : '0'} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-3 border-t border-white/5 mt-4">
        <span className="flex items-center gap-1"><AlertTriangle size={10} className="text-slate-600" /> SIM Exp: {account.sim_expiry || 'N/A'}</span>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-accent hover:text-white transition-colors underline decoration-dotted text-[9px] uppercase tracking-widest font-bold"
        >
          {isExpanded ? 'Sembunyikan' : 'Detail Lengkap'}
        </button>
      </div>
    </motion.div>
  )
}

function DetailRow({ icon, label, val }: { icon: React.ReactNode, label: string, val?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[8px] uppercase tracking-[0.2em] text-slate-600 flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="text-[11px] text-slate-300 font-medium truncate">{val || '-'}</p>
    </div>
  )
}

function CredentialBox({ label, val, onCopy, isCopied }: { label: string, val: string, onCopy: () => void, isCopied: boolean }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 border border-white/5 relative group/cred overflow-hidden">
      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="text-xs text-white truncate font-medium pr-6">{val || 'N/A'}</p>
      <button 
        onClick={onCopy}
        className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isCopied ? 'bg-green-500 text-white opacity-100' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 opacity-0 group-hover/cred:opacity-100'}`}
      >
        {isCopied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  )
}

interface NavItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}

function NavItem({ icon, label, active = false, onClick }: NavItemProps) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all ${active ? 'bg-accent/10 text-accent font-semibold border border-accent/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  )
}

function MobileNavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${active ? 'text-accent' : 'text-slate-600'}`}>
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  )
}

function StatCard({ label, value, sub, color = "text-white" }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="glass p-5 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <h3 className={`text-2xl font-bold mb-0.5 ${color}`}>{value}</h3>
      <p className="text-[10px] text-slate-400 opacity-60">{sub}</p>
    </div>
  )
}

interface FormInputProps {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}

function FormInput({ label, value, onChange, type = 'text', required = false, placeholder = '' }: FormInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-tighter ml-1">{label} {required && <span className="text-accent">*</span>}</label>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
      />
    </div>
  )
}
