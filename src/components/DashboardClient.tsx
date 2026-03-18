'use client'

import { useState } from 'react'
import { 
  LayoutDashboard, Users, Smartphone, Package, 
  TrendingUp, Settings, LogOut, Plus, Copy, 
  Check, AlertTriangle, X
} from 'lucide-react'
import Image from 'next/image'
import { Account, accountService } from '@/services/accountService'
import { getSimStatus } from '@/utils/simLogic'
import { motion, AnimatePresence } from 'framer-motion'
import { pushService } from '@/services/pushService'
import SampleTracker from './SampleTracker'
import FinancialCharts from './FinancialCharts'
import { useEffect } from 'react'

interface DashboardClientProps {
  initialUser: any
  initialAccounts: Account[]
}

type View = 'DASHBOARD' | 'ACCOUNTS' | 'SAMPLES' | 'ANALYTICS'

export default function DashboardClient({ initialUser, initialAccounts }: DashboardClientProps) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<View>('DASHBOARD')
  
  useEffect(() => {
    // Register Push Service
    pushService.register()

    // Check for SIM Alerts
    const alertedAccounts = accounts.filter(a => getSimStatus(a.sim_expiry).alert)
    if (alertedAccounts.length > 0) {
      pushService.sendLocalNotification(
        '⚠️ SIM Lifecycle Alert',
        `${alertedAccounts.length} akun memerlukan perhatian (Masa Tenggang/Expired).`
      )
    }
  }, [accounts])
  
  // Form State
  const [newAcc, setNewAcc] = useState<Partial<Account>>({
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
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col glass border-r border-white/10 p-6 fixed h-full z-20">
        <div className="flex items-center gap-3 mb-12">
          <Image src="/logo.png" alt="Logo" width={40} height={40} className="accent-glow rounded-xl" />
          <h2 className="text-xl font-bold text-white tracking-tighter">Aff by <span className="text-accent">Ulie</span></h2>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeView === 'DASHBOARD'} onClick={() => setActiveView('DASHBOARD')} />
          <NavItem icon={<Users size={18} />} label="Akun Shopee" active={activeView === 'ACCOUNTS'} onClick={() => setActiveView('ACCOUNTS')} />
          <NavItem icon={<Smartphone size={18} />} label="Manajemen SIM" onClick={() => setActiveView('ACCOUNTS')} />
          <NavItem icon={<Package size={18} />} label="Sampel & Logistik" active={activeView === 'SAMPLES'} onClick={() => setActiveView('SAMPLES')} />
          <NavItem icon={<TrendingUp size={18} />} label="Analitik Komisi" active={activeView === 'ANALYTICS'} onClick={() => setActiveView('ANALYTICS')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10 space-y-1">
          <NavItem icon={<Settings size={18} />} label="Pengaturan" />
          <button className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all group">
            <LogOut size={18} />
            <span className="text-sm font-medium">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-32 md:pb-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">{activeView === 'DASHBOARD' ? 'System Control Panel' : activeView}</h1>
            <p className="text-slate-400 text-sm italic opacity-70">Authenticated as: <span className="text-accent font-medium">{initialUser.email}</span></p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-12 h-12 rounded-2xl bg-accent text-primary flex items-center justify-center shadow-lg active:scale-[0.98] transition-all accent-glow"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
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
              <form onSubmit={handleAddAccount} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput label="Nickname Shopee" value={newAcc.nickname || ''} onChange={(v: string) => setNewAcc({...newAcc, nickname: v})} required placeholder="e.g. Ulie_Shop_01" />
                  <FormInput label="Detail Device (HP)" value={newAcc.device_name || ''} onChange={(v: string) => setNewAcc({...newAcc, device_name: v})} placeholder="e.g. Infinix - HP 01" />
                  <FormInput label="Username Shopee" value={newAcc.shopee_user || ''} onChange={(v: string) => setNewAcc({...newAcc, shopee_user: v})} required />
                  <FormInput label="Password Shopee" type="password" value={newAcc.shopee_pass || ''} onChange={(v: string) => setNewAcc({...newAcc, shopee_pass: v})} required />
                  <FormInput label="Email Address" value={newAcc.email_addr || ''} onChange={(v: string) => setNewAcc({...newAcc, email_addr: v})} />
                  <FormInput label="Email Password" type="password" value={newAcc.email_pass || ''} onChange={(v: string) => setNewAcc({...newAcc, email_pass: v})} />
                  <FormInput label="Nomor WA (Pusat)" value={newAcc.wa_number || ''} onChange={(v: string) => setNewAcc({...newAcc, wa_number: v})} placeholder="08..." />
                  <FormInput label="Masa Aktif SIM" type="date" value={newAcc.sim_expiry || ''} onChange={(v: string) => setNewAcc({...newAcc, sim_expiry: v})} />
                </div>
                
                <button 
                  type="submit" 
                  className="w-full py-4 rounded-2xl bg-accent text-primary font-bold shadow-lg hover:bg-amber-500 transition-all active:scale-[0.98]"
                >
                  SAVE SYSTEM ASSET
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Nav - Bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/10 px-6 py-3 flex justify-between items-center z-40">
         <MobileNavItem icon={<LayoutDashboard size={20} />} active={activeView === 'DASHBOARD'} onClick={() => setActiveView('DASHBOARD')} />
         <MobileNavItem icon={<Users size={20} />} active={activeView === 'ACCOUNTS'} onClick={() => setActiveView('ACCOUNTS')} />
         <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center -mt-8 shadow-lg accent-glow">
            <Plus className="text-primary w-6 h-6" onClick={() => setIsAddModalOpen(true)} />
         </div>
         <MobileNavItem icon={<Package size={20} />} active={activeView === 'SAMPLES'} onClick={() => setActiveView('SAMPLES')} />
         <MobileNavItem icon={<TrendingUp size={20} />} active={activeView === 'ANALYTICS'} onClick={() => setActiveView('ANALYTICS')} />
      </nav>
    </div>
  )
}

function AccountCard({ account, onCopy, copiedId }: { account: Account, onCopy: (t: string, id: string) => void, copiedId: string | null }) {
  const { status, color } = getSimStatus(account.sim_expiry)
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-5 rounded-3xl border border-white/5 hover:border-accent/30 transition-all group"
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
      
      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-3 border-t border-white/5">
        <span className="flex items-center gap-1"><AlertTriangle size={10} className="text-slate-600" /> SIM Exp: {account.sim_expiry || 'N/A'}</span>
        <span className="cursor-pointer hover:text-white transition-colors underline decoration-dotted text-[9px] uppercase tracking-widest font-bold">Detail Akun</span>
      </div>
    </motion.div>
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

interface MobileNavItemProps {
  icon: React.ReactNode
  active?: boolean
  onClick?: () => void
}

function MobileNavItem({ icon, active = false, onClick }: MobileNavItemProps) {
  return (
    <button onClick={onClick} className={`p-2 transition-all ${active ? 'text-accent' : 'text-slate-500 hover:text-white'}`}>
      {icon}
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
