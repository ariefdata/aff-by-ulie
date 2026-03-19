'use client'

import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, Users, Smartphone, Package, 
  TrendingUp, Settings, LogOut, Plus, Copy, 
  Check, AlertTriangle, X, Search, Trash2, Edit, CreditCard, ChevronRight, Target, FileText
} from 'lucide-react'
import Image from 'next/image'
import { 
  ShopeeAccount, Identity, Sim, Sample, Commission, 
  accountService 
} from '@/services/accountService'
import { getSimStatus } from '@/utils/simLogic'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { pushService } from '@/services/pushService'
import SampleTracker from './SampleTracker'
import FinancialCharts from './FinancialCharts'

interface DashboardClientProps {
  initialUser: any
  initialAccounts: ShopeeAccount[]
}

type View = 'DASHBOARD' | 'ACCOUNTS' | 'SAMPLES' | 'ANALYTICS' | 'SETTINGS' | 'SIMS' | 'IDENTITY'

export default function DashboardClient({ initialUser, initialAccounts }: DashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()
  
  // Master Datasets
  const [accounts, setAccounts] = useState<ShopeeAccount[]>(initialAccounts)
  const [identities, setIdentities] = useState<Identity[]>([])
  const [sims, setSims] = useState<Sim[]>([])
  const [samples, setSamples] = useState<Sample[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  
  const [activeView, setActiveView] = useState<View>('DASHBOARD')
  const [isPushEnabled, setIsPushEnabled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Modals Visibility
  const [modals, setModals] = useState({
    acc: false, comm: false, sim: false, id: false, sample: false
  })

  // Form States
  const [newAcc, setNewAcc] = useState({ username: '', email: '', password: '' })
  const [newComm, setNewComm] = useState({ account_id: '', start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], amount: 0 })
  const [newSim, setNewSim] = useState({ account_id: '', phone_number: '', expiry_date: '', has_whatsapp: false })
  const [newId, setNewId] = useState({ account_id: '', nik: '', name_ktp: '', npwp: '', bank_name: '', bank_acc: '', address: '' })
  const [newSample, setNewSample] = useState({ account_id: '', product_name: '', shop_name: '', brand_name: '' })

  // Initial Sync
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ids, sm, sp, cm] = await Promise.all([
          accountService.getIdentities(),
          accountService.getSims(),
          accountService.getSamples(),
          accountService.getCommissions()
        ])
        setIdentities(ids)
        setSims(sm)
        setSamples(sp)
        setCommissions(cm)
      } catch (e) { console.error('Sync failed', e) }
      setLoading(false)
    }
    fetchData()
    
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
    pushService.getSubscription().then(sub => setIsPushEnabled(!!sub))
  }, [])

  // Handlers
  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }
  const handleCopy = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000) }

  const createEntity = async (
    type: keyof typeof modals, 
    serviceMethod: (data: any) => Promise<any>, 
    statePayload: any, 
    setState: React.Dispatch<React.SetStateAction<any[]>>, 
    resetState: () => void
  ) => {
    try {
      if ('account_id' in statePayload && !statePayload.account_id) {
        throw new Error('Silakan pilih akun Shopee terlebih dahulu.')
      }
      const added = await serviceMethod(statePayload)
      setState(prev => [added, ...prev])
      setModals({...modals, [type]: false})
      resetState()
    } catch (e: any) { 
      console.error(e)
      alert(`Gagal menyimpan: ${e.message || 'Error tidak dikenal'}`) 
    }
  }

  // View Renderers
  const renderContent = () => {
    if (loading) return <LoadingPulse />

    switch (activeView) {
      case 'DASHBOARD': return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
             <StatCard label="Total Komisi" value={`Rp ${commissions.reduce((acc, c) => acc + (Number(c.amount) || 0), 0).toLocaleString()}`} sub="Life-time" color="text-green-400" />
             <StatCard label="Total Sampel" value={samples.length.toString()} sub="Logistik" color="text-amber-400" />
             <StatCard label="Akun Aktif" value={accounts.length.toString()} sub="Shopee Asset" color="text-rose-400" />
             <StatCard label="SIM Warning" value={sims.filter(s => getSimStatus(s.expiry_date).alert).length.toString()} sub="Attention Req" color="text-red-400" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <FinancialCharts commissions={commissions} />
            <SampleTracker samples={samples} />
          </div>
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2"><TrendingUp size={20} className="text-accent" /> Recent Assets</h3>
              <button onClick={() => setActiveView('ACCOUNTS')} className="text-xs font-black text-accent uppercase tracking-widest hover:brightness-125 transition-all">Lihat Semua</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {accounts.slice(0, 4).map(acc => <AccountSimpleCard key={acc.id} account={acc} onCopy={handleCopy} copiedId={copiedId} />)}
            </div>
          </section>
        </div>
      )
      case 'ACCOUNTS': return (
        <div className="space-y-6">
          <SectionHeader title="Daftar Akun Shopee" sub="Kelola kredensial dan aset utama Anda." onAdd={() => setModals({...modals, acc: true})} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {accounts.map(acc => <AccountSimpleCard key={acc.id} account={acc} onCopy={handleCopy} copiedId={copiedId} onDelete={async (id) => { if(confirm('Hapus?')) { await accountService.deleteAccount(id); setAccounts(accounts.filter(a => a.id !== id)) } }} />)}
          </div>
        </div>
      )
      case 'SIMS': return (
        <div className="space-y-6">
          <SectionHeader title="SIM Lifecycle" sub="Monitor masa aktif dan WhatsApp." onAdd={() => setModals({...modals, sim: true})} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sims.map(sim => <EntityCard key={sim.id} title={sim.phone_number} sub={accounts.find(a => a.id === sim.account_id)?.username || 'Orphan'} status={getSimStatus(sim.expiry_date)} onDelete={() => accountService.deleteSim(sim.id).then(() => setSims(sims.filter(s => s.id !== sim.id)))} />)}
          </div>
        </div>
      )
      case 'IDENTITY': return (
        <div className="space-y-6">
          <SectionHeader title="Identity Profiles" sub="Data KYC dan Rekening Bank." onAdd={() => setModals({...modals, id: true})} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {identities.map(id => <EntityCard key={id.id} title={id.name_ktp} sub={id.nik} extra={accounts.find(a => a.id === id.account_id)?.username} onDelete={() => accountService.deleteIdentity(id.id).then(() => setIdentities(identities.filter(i => i.id !== id.id)))} />)}
          </div>
        </div>
      )
      case 'SAMPLES': return (
        <div className="space-y-6">
          <SectionHeader title="Sampel Logistik" sub="Tracker barang dan review." onAdd={() => setModals({...modals, sample: true})} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {samples.map(s => <EntityCard key={s.id} title={s.product_name} sub={s.brand_name} extra={s.shop_name} onDelete={() => accountService.deleteSample(s.id).then(() => setSamples(samples.filter(i => i.id !== s.id)))} />)}
          </div>
        </div>
      )
      case 'ANALYTICS': return <div className="max-w-6xl mx-auto"><FinancialCharts commissions={commissions} fullView /></div>
      case 'SETTINGS': return <SettingsView user={initialUser} onLogout={handleLogout} onPushToggle={() => {}} isPushEnabled={isPushEnabled} />
      default: return null
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col glass border-r border-white/10 p-6 fixed h-full z-20">
        <div className="flex items-center gap-3 mb-12">
          <Image src="/logo.png" alt="Logo" width={40} height={40} className="accent-glow rounded-xl" />
          <h2 className="text-xl font-bold text-white tracking-tight uppercase">Srikandi Elite</h2>
        </div>
        <nav className="flex-1 space-y-1">
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeView === 'DASHBOARD'} onClick={() => setActiveView('DASHBOARD')} />
          <NavItem icon={<Users size={18} />} label="Accounts" active={activeView === 'ACCOUNTS'} onClick={() => setActiveView('ACCOUNTS')} />
          <NavItem icon={<Smartphone size={18} />} label="SIM Sims" active={activeView === 'SIMS'} onClick={() => setActiveView('SIMS')} />
          <NavItem icon={<FileText size={18} />} label="Identity" active={activeView === 'IDENTITY'} onClick={() => setActiveView('IDENTITY')} />
          <NavItem icon={<Package size={18} />} label="Samples" active={activeView === 'SAMPLES'} onClick={() => setActiveView('SAMPLES')} />
          <NavItem icon={<TrendingUp size={18} />} label="Analytics" active={activeView === 'ANALYTICS'} onClick={() => setActiveView('ANALYTICS')} />
        </nav>
        <NavItem icon={<Settings size={18} />} label="Settings" active={activeView === 'SETTINGS'} onClick={() => setActiveView('SETTINGS')} />
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-32">
        <header className="flex justify-between items-center mb-8 sticky top-0 bg-slate-950/80 backdrop-blur-xl py-4 z-30">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{activeView}</h1>
            <p className="text-[10px] text-slate-700 font-black tracking-[0.5em] uppercase">Dedicated to Shen Won-won</p>
          </div>
          <button onClick={() => setModals({...modals, comm: true})} className="p-4 bg-accent rounded-2xl text-primary shadow-xl accent-glow active:scale-95 transition-all">
            <Plus size={24} strokeWidth={3} />
          </button>
        </header>

        {renderContent()}
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/10 px-4 py-2 flex justify-between items-center z-40 bg-slate-950/80 backdrop-blur-xl">
         <MobileNavItem icon={<LayoutDashboard size={20} />} label="Dash" active={activeView === 'DASHBOARD'} onClick={() => setActiveView('DASHBOARD')} />
         <MobileNavItem icon={<Users size={20} />} label="Acc" active={activeView === 'ACCOUNTS'} onClick={() => setActiveView('ACCOUNTS')} />
         <MobileNavItem icon={<Smartphone size={20} />} label="SIM" active={activeView === 'SIMS'} onClick={() => setActiveView('SIMS')} />
         <MobileNavItem icon={<Package size={20} />} label="Samp" active={activeView === 'SAMPLES'} onClick={() => setActiveView('SAMPLES')} />
         <MobileNavItem icon={<TrendingUp size={20} />} label="Stats" active={activeView === 'ANALYTICS'} onClick={() => setActiveView('ANALYTICS')} />
      </nav>

      <EntityModals 
        modals={modals} 
        setModals={setModals} 
        accounts={accounts}
        newAcc={newAcc} setNewAcc={setNewAcc}        handleCreateAcc={() => createEntity('acc', accountService.createAccount, newAcc, setAccounts, () => setNewAcc({username:'',email:'',password:''}))}
        newComm={newComm} setNewComm={setNewComm} handleCreateComm={(e: React.FormEvent) => { e.preventDefault(); createEntity('comm', accountService.createCommission, newComm, setCommissions as any, () => setNewComm({account_id:'', start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], amount: 0})) }}
        newSim={newSim} setNewSim={setNewSim} handleCreateSim={(e: React.FormEvent) => { e.preventDefault(); createEntity('sim', accountService.createSim, newSim, setSims as any, () => setNewSim({account_id:'', phone_number:'', expiry_date:'', has_whatsapp: false})) }}
        newId={newId} setNewId={setNewId} handleCreateId={(e: React.FormEvent) => { e.preventDefault(); createEntity('id', accountService.createIdentity, newId, setIdentities as any, () => setNewId({account_id:'', nik:'', name_ktp:'', npwp:'', bank_name:'', bank_acc:'', address:''})) }}
        newSample={newSample} setNewSample={setNewSample} handleCreateSample={(e: React.FormEvent) => { e.preventDefault(); createEntity('sample', accountService.createSample, newSample, setSamples as any, () => setNewSample({account_id:'', product_name:'', shop_name:'', brand_name:''})) }}
      />
    </div>
  )
}

// Sub-Components
function SectionHeader({ title, sub, onAdd }: { title: string, sub: string, onAdd: () => void }) {
  return (
    <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-[2rem] border border-white/5">
       <div><h3 className="text-xl font-bold text-white">{title}</h3><p className="text-xs text-slate-500">{sub}</p></div>
       <button onClick={onAdd} className="p-4 bg-white/5 rounded-2xl text-white border border-white/10 hover:bg-white/10 transition-all"><Plus size={20} /></button>
    </div>
  )
}

function AccountSimpleCard({ account, onCopy, copiedId, onDelete }: { account: ShopeeAccount, onCopy: (t: string, id: string) => void, copiedId: string | null, onDelete?: (id: string) => void }) {
  return (
    <div className="glass p-5 rounded-3xl border border-white/5 hover:border-accent/30 transition-all group relative">
      <div className="flex justify-between items-start mb-4">
        <div><h4 className="text-lg font-bold text-white">{account.username}</h4><p className="text-[10px] text-slate-500 font-mono italic">Shopee Asset</p></div>
        {onDelete && <button onClick={() => onDelete(account.id)} className="p-2 text-slate-700 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>}
      </div>
      <div className="space-y-3">
        <CredentialBox label="User/Email" val={account.email} onCopy={() => onCopy(account.email, account.id + 'e')} isCopied={copiedId === account.id + 'e'} />
        <CredentialBox label="Password" val="••••••••" onCopy={() => onCopy(account.password, account.id + 'p')} isCopied={copiedId === account.id + 'p'} />
      </div>
    </div>
  )
}

function EntityCard({ title, sub, extra, status, onDelete }: { title: string, sub: string, extra?: string, status?: any, onDelete: () => void }) {
  return (
    <div className="glass p-5 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-lg font-bold text-white truncate">{title}</h4>
        <button onClick={onDelete} className="p-1.5 text-slate-800 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
      </div>
      <p className="text-xs text-slate-500 mb-1">{sub}</p>
      {extra && <p className="text-[10px] text-accent font-black uppercase tracking-widest">{extra}</p>}
      {status && <div className={`mt-3 inline-block px-2 py-1 rounded-lg text-[9px] font-black uppercase border border-current/20 ${status.color} bg-current/5`}>{status.status}</div>}
    </div>
  )
}

function CredentialBox({ label, val, onCopy, isCopied }: { label: string, val: string, onCopy: () => void, isCopied: boolean }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 border border-white/5 relative group/cred overflow-hidden">
      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="text-xs text-white truncate font-medium pr-6">{val || 'N/A'}</p>
      <button onClick={onCopy} className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isCopied ? 'bg-green-500 text-white opacity-100' : 'bg-white/5 text-slate-400 opacity-0 group-hover/cred:opacity-100'}`}>
        {isCopied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  )
}

interface EntityModalProps {
  modals: any; setModals: any; accounts: ShopeeAccount[];
  newAcc: any; setNewAcc: any; handleCreateAcc: () => void;
  newComm: any; setNewComm: any; handleCreateComm: (e: React.FormEvent) => void;
  newSim: any; setNewSim: any; handleCreateSim: (e: React.FormEvent) => void;
  newId: any; setNewId: any; handleCreateId: (e: React.FormEvent) => void;
  newSample: any; setNewSample: any; handleCreateSample: (e: React.FormEvent) => void;
}

function EntityModals({ modals, setModals, accounts, newAcc, setNewAcc, handleCreateAcc, newComm, setNewComm, handleCreateComm, newSim, setNewSim, handleCreateSim, newId, setNewId, handleCreateId, newSample, setNewSample, handleCreateSample }: EntityModalProps) {
  return (
    <AnimatePresence>
      {/* Commission Modal (Primary +) */}
      {modals.comm && (
        <Modal title="Catat Komisi Harian" onClose={() => setModals({...modals, comm: false})}>
          <form onSubmit={handleCreateComm} className="space-y-4">
             <AccountSelect accounts={accounts} value={newComm.account_id} onChange={(v: string) => setNewComm({...newComm, account_id: v})} />
             <div className="grid grid-cols-2 gap-4">
               <FormInput label="Mulai Tanggal" type="date" value={newComm.start_date} onChange={(v: string) => setNewComm({...newComm, start_date: v})} required />
               <FormInput label="Sampai Tanggal" type="date" value={newComm.end_date} onChange={(v: string) => setNewComm({...newComm, end_date: v})} required />
             </div>
             <FormInput label="Besar Komisi (Rp)" type="number" value={newComm.amount.toString()} onChange={(v: string) => setNewComm({...newComm, amount: parseFloat(v) || 0})} required />
             <SubmitButton label="Simpan Komisi" />
          </form>
        </Modal>
      )}

      {/* Shopee Account Modal */}
      {modals.acc && (
        <Modal title="Tambah Akun Shopee" onClose={() => setModals({...modals, acc: false})}>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateAcc() }} className="space-y-4">
            <FormInput label="Username Shopee" value={newAcc.username} onChange={(v: string) => setNewAcc({...newAcc, username: v})} required />
            <FormInput label="Email Terkait" value={newAcc.email} onChange={(v: string) => setNewAcc({...newAcc, email: v})} required />
            <FormInput label="Password" type="password" value={newAcc.password} onChange={(v: string) => setNewAcc({...newAcc, password: v})} required />
            <SubmitButton label="Simpan Akun Master" />
          </form>
        </Modal>
      )}

      {/* SIM Modal */}
      {modals.sim && (
        <Modal title="Tambah Data SIM" onClose={() => setModals({...modals, sim: false})}>
          <form onSubmit={handleCreateSim} className="space-y-4">
             <AccountSelect accounts={accounts} value={newSim.account_id} onChange={(v: string) => setNewSim({...newSim, account_id: v})} />
             <FormInput label="Nomor Telepon" value={newSim.phone_number} onChange={(v: string) => setNewSim({...newSim, phone_number: v})} required />
             <FormInput label="Masa Aktif" type="date" value={newSim.expiry_date} onChange={(v: string) => setNewSim({...newSim, expiry_date: v})} required />
             <div className="flex items-center gap-3 p-4 glass rounded-2xl border border-white/5">
                <input type="checkbox" checked={newSim.has_whatsapp} onChange={(e) => setNewSim({...newSim, has_whatsapp: e.target.checked})} className="w-5 h-5 rounded accent-rose-500" />
                <span className="text-sm text-slate-300 font-bold">Terdaftar WhatsApp</span>
             </div>
             <SubmitButton label="Save SIM" />
          </form>
        </Modal>
      )}

      {/* Identity Modal */}
      {modals.id && (
        <Modal title="Lengkapi Identitas (KYC)" onClose={() => setModals({...modals, id: false})}>
          <form onSubmit={handleCreateId} className="space-y-4 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
             <AccountSelect accounts={accounts} value={newId.account_id} onChange={(v: string) => setNewId({...newId, account_id: v})} />
             <div className="grid grid-cols-2 gap-4">
                <FormInput label="NIK (KTP)" value={newId.nik} onChange={(v: string) => setNewId({...newId, nik: v})} required />
                <FormInput label="Nama Lengkap" value={newId.name_ktp} onChange={(v: string) => setNewId({...newId, name_ktp: v})} required />
                <FormInput label="NPWP" value={newId.npwp} onChange={(v: string) => setNewId({...newId, npwp: v})} />
                <FormInput label="Bank" value={newId.bank_name} onChange={(v: string) => setNewId({...newId, bank_name: v})} required />
             </div>
             <FormInput label="Nomor Rekening" value={newId.bank_acc} onChange={(v: string) => setNewId({...newId, bank_acc: v})} required />
             <FormInput label="Alamat Sesuai KTP" value={newId.address} onChange={(v: string) => setNewId({...newId, address: v})} />
             <SubmitButton label="Simpan Profile" />
          </form>
        </Modal>
      )}

      {/* Sample Modal */}
      {modals.sample && (
        <Modal title="Request Sampel Baru" onClose={() => setModals({...modals, sample: false})}>
          <form onSubmit={handleCreateSample} className="space-y-4">
             <AccountSelect accounts={accounts} value={newSample.account_id} onChange={(v: string) => setNewSample({...newSample, account_id: v})} />
             <FormInput label="Nama Produk" value={newSample.product_name} onChange={(v: string) => setNewSample({...newSample, product_name: v})} required />
             <div className="grid grid-cols-2 gap-4">
                <FormInput label="Shop Name" value={newSample.shop_name} onChange={(v: string) => setNewSample({...newSample, shop_name: v})} required />
                <FormInput label="Brand" value={newSample.brand_name} onChange={(v: string) => setNewSample({...newSample, brand_name: v})} required />
             </div>
             <SubmitButton label="Record Request" />
          </form>
        </Modal>
      )}
    </AnimatePresence>
  )
}

// UI Elements
function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden" onClick={e => e.stopPropagation()}>
         <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center"><h2 className="text-xl font-bold text-white tracking-tight">{title}</h2><button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400"><X size={20} /></button></div>
         <div className="p-8">{children}</div>
      </motion.div>
    </div>
  )
}

function AccountSelect({ accounts, value, onChange }: { accounts: ShopeeAccount[], value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-tighter ml-1 text-accent flex items-center gap-1"><Users size={12} /> Pilih Akun Parent *</label>
      <select value={value} onChange={e => onChange(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50 transition-all appearance-none cursor-pointer">
        <option value="" className="bg-slate-900">-- Pilih Akun --</option>
        {accounts.map(acc => <option key={acc.id} value={acc.id} className="bg-slate-900">{acc.username}</option>)}
      </select>
    </div>
  )
}

function SubmitButton({ label }: { label: string }) {
  return <button type="submit" className="w-full py-5 rounded-[1.5rem] bg-white text-slate-950 text-xs font-black uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all mt-4">{label}</button>
}

function FormInput({ label, value, onChange, type = 'text', required = false, placeholder = '' }: { label: string, value: string, onChange: (v: string) => void, type?: string, required?: boolean, placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label} {required && <span className="text-rose-500">*</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all placeholder:text-slate-700" />
    </div>
  )
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all ${active ? 'bg-accent/10 text-accent font-semibold border border-accent/20 shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
      {icon}<span className="text-sm">{label}</span>
      {active && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 bg-accent rounded-full" />}
    </button>
  )
}

function MobileNavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${active ? 'text-accent' : 'text-slate-600'}`}>
      {icon}<span className="text-[9px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  )
}

function StatCard({ label, value, sub, color = "text-white" }: { label: string, value: string, sub: string, color?: string }) {
  return (
    <div className="glass p-5 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
      <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">{label}</p>
      <h3 className={`text-xl font-bold mb-0.5 truncate ${color}`}>{value}</h3>
      <p className="text-[9px] text-slate-500 opacity-60 uppercase font-bold tracking-widest">{sub}</p>
    </div>
  )
}

function LoadingPulse() {
  return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-12 h-12 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
      <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em] animate-pulse">Syncing Relational Data...</p>
    </div>
  )
}

function SettingsView({ user, onLogout, onPushToggle, isPushEnabled }: { user: any, onLogout: () => void, onPushToggle: () => void, isPushEnabled: boolean }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass p-8 rounded-[2.5rem] border border-white/5">
          <h3 className="text-xl font-bold text-white mb-6">User Config</h3>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-2xl font-bold text-primary">{user.email?.[0].toUpperCase()}</div>
            <div>
              <p className="text-white font-bold text-lg">{user.email?.split('@')[0]}</p>
              <p className="text-slate-500 text-sm">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
            <div><p className="text-sm font-bold text-white">Push Notifications</p><p className="text-[10px] text-slate-500 italic opacity-60">Alert SIM & Deadline Sampel</p></div>
            <div onClick={onPushToggle} className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${isPushEnabled ? 'bg-accent/40' : 'bg-slate-800'}`}><motion.div animate={{ x: isPushEnabled ? 24 : 0 }} className={`absolute left-1 top-1 w-4 h-4 rounded-full shadow-lg ${isPushEnabled ? 'bg-accent' : 'bg-slate-600'}`} /></div>
          </div>
      </div>
      <button onClick={onLogout} className="w-full py-5 bg-rose-500/10 text-rose-500 rounded-[1.5rem] text-sm font-black uppercase tracking-[0.2em] border border-rose-500/20 active:scale-95 transition-all">Sign Out System</button>
    </div>
  )
}
