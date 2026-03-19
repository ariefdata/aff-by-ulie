'use client'

import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, Users, Smartphone, Package, 
  TrendingUp, Settings, LogOut, Plus, Copy, 
  Check, AlertTriangle, X, Search, Trash2, Edit, FileText, Calendar
} from 'lucide-react'
import Image from 'next/image'
import { 
  ShopeeAccount, ShopeeAffiliateAccount, ShopeePayAccount,
  Identity, Sim, Sample, Commission, 
  accountService 
} from '@/services/accountService'
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
  const [affiliateAccounts, setAffiliateAccounts] = useState<ShopeeAffiliateAccount[]>([])
  const [payAccounts, setPayAccounts] = useState<ShopeePayAccount[]>([])
  const [identities, setIdentities] = useState<Identity[]>([])
  const [sims, setSims] = useState<Sim[]>([])
  const [samples, setSamples] = useState<Sample[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  
  const [activeView, setActiveView] = useState<View>('DASHBOARD')
  const [isPushEnabled, setIsPushEnabled] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)

  // Modals Visibility
  const [modals, setModals] = useState({
    acc: false, aff: false, pay: false, comm: false, sim: false, id: false, sample: false
  })
  const [editingEntity, setEditingEntity] = useState<{ type: keyof typeof modals, id: string } | null>(null)

  // Form States
  const [newAcc, setNewAcc] = useState({ username: '' })
  const [newAff, setNewAff] = useState({ master_id: '', email: '', password: '' })
  const [newPay, setNewPay] = useState({ master_id: '', name_ktp: '', nik: '', ktp_image_url: '' })
  const [newComm, setNewComm] = useState({ account_id: '', date: new Date().toISOString().split('T')[0], amount: 0 })
  const [newSim, setNewSim] = useState({ affiliate_id: '', pay_id: '', phone_number: '', expiry_date: '', has_whatsapp: false })
  const [newId, setNewId] = useState({ affiliate_id: '', nik: '', name_ktp: '', npwp: '', bank_name: '', bank_acc: '', bank_acc_image_url: '', address: '' })
  const [newSample, setNewSample] = useState({ account_id: '', product_name: '', shop_name: '', brand_name: '' })

  // Initial Sync
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [affs, pays, ids, sm, sp, cm] = await Promise.all([
          accountService.getAffiliateAccounts(),
          accountService.getPayAccounts(),
          accountService.getIdentities(),
          accountService.getSims(),
          accountService.getSamples(),
          accountService.getCommissions()
        ])
        setAffiliateAccounts(affs)
        setPayAccounts(pays)
        setIdentities(ids)
        setSims(sm)
        setSamples(sp)
        setCommissions(cm)
      } catch (e) { console.error('Sync failed', e) }
      setLoading(false)
    }
    fetchData()
    pushService.getSubscription().then(sub => {
      setIsPushEnabled(!!sub)
      console.log('Push status:', !!sub)
    })

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isIOSDevice && !isStandalone) setIsIOS(true)

    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('beforeinstallprompt fired')
      e.preventDefault()
      setDeferredPrompt(e)
    })
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDeferredPrompt(null)
  }

  const handlePushToggle = async () => {
    try {
      if (isPushEnabled) {
        await pushService.unsubscribe()
        setIsPushEnabled(false)
      } else {
        const sub = await pushService.register()
        if (sub) setIsPushEnabled(true)
      }
    } catch (e: any) {
      alert(`Push Error: ${e.message}`)
    }
  }

  const handleManualRegister = async () => {
    if (!('serviceWorker' in navigator)) return
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      console.log('Manual SW registration successful:', reg)
      alert('Service Worker berhasil didaftarkan ulang. Silakan segarkan halaman jika banner instalasi belum muncul.')
    } catch (e: any) {
      alert(`Manual Register Error: ${e.message}`)
    }
  }

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

  const handleUpdate = async (type: keyof typeof modals, updateMethod: (id: string, data: any) => Promise<any>, payload: any, setState: React.Dispatch<React.SetStateAction<any[]>>, resetState: () => void) => {
    if (!editingEntity) return
    try {
      const updated = await updateMethod(editingEntity.id, payload)
      setState(prev => prev.map(item => item.id === updated.id ? updated : item))
      setModals({...modals, [type]: false})
      setEditingEntity(null)
      resetState()
    } catch (e: any) {
      alert(`Gagal update: ${e.message}`)
    }
  }

  const handleCreateAff = () => editingEntity ? handleUpdate('aff', accountService.updateAffiliateAccount, newAff, setAffiliateAccounts as any, () => setNewAff({master_id:'', email:'', password:''})) : createEntity('aff', accountService.createAffiliateAccount, newAff, setAffiliateAccounts as any, () => setNewAff({master_id:'', email:'', password:''}))
  const handleCreatePay = () => editingEntity ? handleUpdate('pay', accountService.updatePayAccount, newPay, setPayAccounts as any, () => setNewPay({master_id:'', name_ktp:'', nik:'', ktp_image_url:''})) : createEntity('pay', accountService.createPayAccount, newPay, setPayAccounts as any, () => setNewPay({master_id:'', name_ktp:'', nik:'', ktp_image_url:''}))
  const handleCreateId = (e: React.FormEvent) => { e.preventDefault(); editingEntity ? handleUpdate('id', accountService.updateIdentity, newId, setIdentities as any, () => setNewId({affiliate_id:'', nik:'', name_ktp:'', npwp:'', bank_name:'', bank_acc:'', bank_acc_image_url:'', address:''})) : createEntity('id', accountService.createIdentity, newId, setIdentities as any, () => setNewId({affiliate_id:'', nik:'', name_ktp:'', npwp:'', bank_name:'', bank_acc:'', bank_acc_image_url:'', address:''})) }
  const handleCreateSim = (e: React.FormEvent) => { e.preventDefault(); editingEntity ? handleUpdate('sim', accountService.updateSim, newSim, setSims as any, () => setNewSim({affiliate_id:'', pay_id:'', phone_number:'', expiry_date:'', has_whatsapp: false})) : createEntity('sim', accountService.createSim, newSim, setSims as any, () => setNewSim({affiliate_id:'', pay_id:'', phone_number:'', expiry_date:'', has_whatsapp: false})) }


  // View Renderers
  const renderContent = () => {
    if (loading) return <LoadingPulse />

    switch (activeView) {
      case 'DASHBOARD': return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <StatCard label="Master Assets" value={accounts.length.toString()} sub="Global Hubs" />
             <StatCard label="Total Commission" value={`Rp ${commissions.reduce((s,c)=>s+Number(c.amount),0).toLocaleString()}`} sub="All Time Verified" color="text-accent" />
             <StatCard label="Affiliate Accounts" value={affiliateAccounts.length.toString()} sub="Sales Units" />
             <StatCard label="Shopee Pay" value={payAccounts.length.toString()} sub="Wallets" />
          </div>

           {(deferredPrompt || isIOS) && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-[2.5rem] border border-accent/20 flex flex-col md:flex-row items-center justify-between gap-4 bg-accent/5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/20 rounded-2xl text-accent"><Smartphone size={24} /></div>
                  <div>
                    <h4 className="text-white font-bold">Aplikasi Aff by Ulie</h4>
                    <p className="text-xs text-slate-500">
                      {isIOS ? 'Ketuk "Share" (kotak panah) lalu "Add to Home Screen"' : 'Instal aplikasi untuk akses lebih cepat & mudah.'}
                    </p>
                  </div>
                </div>
                {!isIOS && <button onClick={handleInstall} className="w-full md:w-auto px-8 py-3 bg-accent text-primary font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">Instal Sekarang</button>}
             </motion.div>
           )}

           <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2"><FinancialCharts commissions={commissions} accounts={accounts} onEditCommission={(c: Commission) => { setEditingEntity({type:'comm', id: c.id}); setNewComm({account_id: c.account_id, date: c.date, amount: Number(c.amount)}); setModals({...modals, comm: true}) }} /></div>
            <div><SampleTracker samples={samples} /></div>
          </div>
        </div>
      )
      case 'ACCOUNTS': return (
        <div className="space-y-10 w-full overflow-hidden">
          <SectionHeader title="Shopee Master Hubs" sub="Parent Asset Management" onAdd={() => { setEditingEntity(null); setNewAcc({username:''}); setModals({...modals, acc: true}) }} />
          <div className="space-y-12">
            {accounts.map(acc => {
              const myAffs = affiliateAccounts.filter(a => a.master_id === acc.id)
              const myPays = payAccounts.filter(p => p.master_id === acc.id)
              return (
                <div key={acc.id} className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between bg-white/5 p-4 md:p-6 rounded-[2rem] border border-white/10 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-accent/20 rounded-2xl text-accent"><LayoutDashboard size={24} /></div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-lg md:text-xl font-bold text-white uppercase truncate">{acc.username}</h4>
                          <CopyButton text={acc.username} />
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">HUB: {acc.id.slice(0,8)}</p>
                          <CopyButton text={acc.id} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-2 p-1 md:p-0 bg-black/20 md:bg-transparent rounded-2xl">
                       <div className="flex gap-1.5 flex-1 md:flex-none">
                         <button onClick={() => { setEditingEntity(null); setNewAff({...newAff, master_id: acc.id}); setModals({...modals, aff: true}) }} className="flex-1 md:flex-none px-4 py-2.5 bg-accent/10 border border-accent/20 hover:bg-accent/20 rounded-xl text-[10px] font-black uppercase text-accent transition-all">+ Affiliate</button>
                         <button onClick={() => { setEditingEntity(null); setNewPay({...newPay, master_id: acc.id}); setModals({...modals, pay: true}) }} className="flex-1 md:flex-none px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase text-slate-400 border border-white/10 border-dashed transition-all">+ Shopee Pay</button>
                       </div>
                       <div className="flex gap-1.5 pl-2 border-l border-white/10 ml-1">
                         <button onClick={() => { setEditingEntity({type:'acc', id: acc.id}); setNewAcc({username: acc.username}); setModals({...modals, acc: true}) }} className="p-2.5 md:p-2 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 transition-all border border-white/5" title="Edit Hub"><Edit size={16} /></button>
                         <button onClick={() => confirmDelete('Master Hub', () => accountService.deleteAccount(acc.id).then(() => setAccounts(accounts.filter(a => a.id !== acc.id))))} className="p-2.5 md:p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10" title="Hapus Hub"><Trash2 size={16} /></button>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 md:pl-12 border-l border-white/10">
                    {/* Affiliate Column */}
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-2">Units Affiliate ({myAffs.length})</h5>
                      {myAffs.length === 0 ? <p className="text-[10px] text-slate-800 italic ml-2">Belum ada unit affiliate</p> : myAffs.map(aff => (
                        <EntityCard
                          key={aff.id}
                          title={aff.email}
                          sub="Shopee Affiliate"
                          entityType="acc"
                          details={{ 'Email': aff.email, 'Password': aff.password }}
                          onDelete={() => confirmDelete('Affiliate', () => accountService.deleteAffiliateAccount(aff.id).then(() => setAffiliateAccounts(affiliateAccounts.filter(a => a.id !== aff.id))))}
                          onEdit={() => { setEditingEntity({type:'aff', id: aff.id}); setNewAff({master_id: aff.master_id, email: aff.email, password: aff.password}); setModals({...modals, aff: true}) }}
                        />
                      ))}
                    </div>

                    {/* Pay Column */}
                    <div className="space-y-4">
                       <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-2">Shopee Pay ({myPays.length})</h5>
                       {myPays.length === 0 ? <p className="text-[10px] text-slate-800 italic ml-2">Belum ada akun shopee pay</p> : myPays.map(pay => (
                        <EntityCard
                          key={pay.id}
                          title={pay.name_ktp}
                          sub={pay.nik}
                          entityType="acc"
                          onDelete={() => confirmDelete('Shopee Pay', () => accountService.deletePayAccount(pay.id).then(() => setPayAccounts(payAccounts.filter(a => a.id !== pay.id))))}
                          onEdit={() => { setEditingEntity({type:'pay', id: pay.id}); setNewPay({master_id: pay.master_id, name_ktp: pay.name_ktp, nik: pay.nik, ktp_image_url: pay.ktp_image_url || ''}); setModals({...modals, pay: true}) }}
                          details={pay.ktp_image_url ? { 'KTP Image': 'Click to view' } : {}}
                          onClickDetail={pay.ktp_image_url ? () => window.open(pay.ktp_image_url, '_blank') : undefined}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
      case 'SIMS': return (
        <div className="space-y-10 w-full overflow-hidden">
          <SectionHeader title="SIM Connectivity" sub="Authentication & OTP Assets" onAdd={() => { setEditingEntity(null); setNewSim({affiliate_id:'', pay_id:'', phone_number:'', expiry_date:'', has_whatsapp: false}); setModals({...modals, sim: true}) }} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sims.map(s => {
              const parentAff = affiliateAccounts.find(a => a.id === s.affiliate_id)
              const parentPay = payAccounts.find(p => p.id === s.pay_id)
              const parentLabel = parentAff ? `Aff: ${parentAff.email}` : parentPay ? `Pay: ${parentPay.name_ktp}` : 'No Parent'
              return (
                <EntityCard
                  key={s.id}
                  title={s.phone_number}
                  sub={parentLabel}
                  extra={s.expiry_date}
                  entityType="sim"
                  details={{ 'WA Status': s.has_whatsapp ? 'Terdaftar' : 'Tidak' }}
                  onDelete={() => confirmDelete('SIM', () => accountService.deleteSim(s.id).then(() => setSims(sims.filter(i => i.id !== s.id))))}
                  onEdit={() => { setEditingEntity({type:'sim', id: s.id}); setNewSim({affiliate_id: s.affiliate_id || '', pay_id: s.pay_id || '', phone_number: s.phone_number, expiry_date: s.expiry_date, has_whatsapp: s.has_whatsapp}); setModals({...modals, sim: true}) }}
                />
              )
            })}
          </div>
        </div>
      )
      case 'IDENTITY': return (
        <div className="space-y-10 w-full overflow-hidden">
          <SectionHeader title="KYC Profiles" sub="Account Verification Data" onAdd={() => { setEditingEntity(null); setNewId({affiliate_id:'', nik:'', name_ktp:'', npwp:'', bank_name:'', bank_acc:'', bank_acc_image_url:'', address:''}); setModals({...modals, id: true}) }} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {identities.map(i => {
              const parentAff = affiliateAccounts.find(a => a.id === i.affiliate_id)
              return (
                <EntityCard
                  key={i.id}
                  title={i.name_ktp}
                  sub={parentAff?.email || 'No Parent'}
                  entityType="id"
                  details={{
                    'NIK': i.nik,
                    'NPWP': i.npwp || '-',
                    'Bank': i.bank_name,
                    'Rekening': i.bank_acc,
                    'Alamat': i.address || '-',
                    'Doc Image': i.bank_acc_image_url ? 'Click to view' : ''
                  }}
                  onClickDetail={i.bank_acc_image_url ? () => window.open(i.bank_acc_image_url, '_blank') : undefined}
                  onDelete={() => confirmDelete('Identitas', () => accountService.deleteIdentity(i.id).then(() => setIdentities(identities.filter(item => item.id !== i.id))))}
                  onEdit={() => { setEditingEntity({type:'id', id: i.id}); setNewId({affiliate_id: i.affiliate_id, nik: i.nik, name_ktp: i.name_ktp, npwp: i.npwp || '', bank_name: i.bank_name, bank_acc: i.bank_acc, bank_acc_image_url: i.bank_acc_image_url || '', address: i.address || ''}); setModals({...modals, id: true}) }}
                />
              )
            })}
          </div>
        </div>
      )
      case 'SAMPLES': {
        const groupedSamples = accounts.map(acc => ({
          account: acc,
          items: samples.filter(s => s.account_id === acc.id)
        })).filter(g => g.items.length > 0)
        
        const orphanSamples = samples.filter(s => !accounts.find(a => a.id === s.account_id))

        return (
          <div className="space-y-10 w-full overflow-hidden">
            <SectionHeader title="Sample Logistics" sub="Product Requests & Tracking" onAdd={() => { setEditingEntity(null); setNewSample({account_id:'', product_name:'', shop_name:'', brand_name:''}); setModals({...modals, sample: true})}} />
            
            {groupedSamples.map(group => (
              <div key={group.account.id} className="space-y-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-2xl w-fit">
                  <Users size={14} className="text-accent" />
                  <span className="text-xs font-bold text-accent uppercase tracking-widest leading-none">{group.account.username}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map(s => <EntityCard key={s.id} title={s.product_name} sub={s.brand_name} extra={s.shop_name} onDelete={() => confirmDelete('Sample', () => accountService.deleteSample(s.id).then(() => setSamples(samples.filter(i => i.id !== s.id))))} onEdit={() => { setEditingEntity({type:'sample', id: s.id}); setNewSample({account_id: s.account_id, product_name: s.product_name, shop_name: s.shop_name, brand_name: s.brand_name}); setModals({...modals, sample: true}) }} />)}
                </div>
              </div>
            ))}

            {orphanSamples.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl w-fit">
                  <AlertTriangle size={14} className="text-rose-500" />
                  <span className="text-xs font-bold text-rose-500 uppercase tracking-widest leading-none">Orphan Samples</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orphanSamples.map(s => <EntityCard key={s.id} title={s.product_name} sub={s.brand_name} extra={s.shop_name} onDelete={() => confirmDelete('Sample', () => accountService.deleteSample(s.id).then(() => setSamples(samples.filter(i => i.id !== s.id))))} onEdit={() => { setEditingEntity({type:'sample', id: s.id}); setNewSample({account_id: s.account_id, product_name: s.product_name, shop_name: s.shop_name, brand_name: s.brand_name}); setModals({...modals, sample: true}) }} />)}
                </div>
              </div>
            )}
          </div>
        )
      }
      case 'ANALYTICS': return (
        <div className="w-full overflow-hidden">
          <FinancialCharts 
            commissions={commissions} 
            accounts={accounts} 
            fullView 
            onEditCommission={(c: Commission) => { 
              setEditingEntity({type:'comm', id: c.id}); 
              setNewComm({account_id: c.account_id, date: c.date, amount: c.amount}); 
              setModals({...modals, comm: true}); 
            }} 
            onDeleteCommission={(c: Commission) => confirmDelete('Komisi', () => accountService.deleteCommission(c.id).then(() => setCommissions(commissions.filter(item => item.id !== c.id))))} 
          />
        </div>
      )
      case 'SETTINGS': return <SettingsView user={initialUser} onLogout={handleLogout} onPushToggle={handlePushToggle} onManualRegister={handleManualRegister} isPushEnabled={isPushEnabled} />
      default: return null
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside className="hidden md:flex w-64 flex-col glass border-r border-white/10 p-6 fixed h-full z-20">
        <div className="flex items-center gap-3 mb-12">
          <Image src="/logo.png" alt="Logo" width={40} height={40} className="accent-glow rounded-xl" />
          <h2 className="text-xl font-bold text-white tracking-tight uppercase">Aff by Ulie</h2>
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

      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-32 w-full overflow-x-hidden">
        <header className="flex justify-between items-center mb-8 sticky top-0 bg-slate-950/80 backdrop-blur-xl py-4 z-30">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{activeView}</h1>
            <p className="text-[10px] text-slate-700 font-black tracking-[0.5em] uppercase">Relational Overhaul V1.2.6-Neon</p>
          </div>
        </header>
        <div className="max-w-full">
          {renderContent()}
        </div>

        {/* Global Sticky FAB */}
        <button 
          onClick={() => { setEditingEntity(null); setModals({...modals, comm: true})}}
          className="fixed bottom-24 right-6 w-12 h-12 bg-accent text-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 border-4 border-slate-950 group"
        >
          <Plus size={24} className="group-active:rotate-90 transition-transform" />
        </button>
      </main>

       <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/10 px-4 py-2 flex items-center gap-6 overflow-x-auto no-scrollbar z-40 bg-slate-950/90 backdrop-blur-2xl">
          <MobileNavItem icon={<LayoutDashboard size={20} />} label="Dash" active={activeView === 'DASHBOARD'} onClick={() => setActiveView('DASHBOARD')} />
          <MobileNavItem icon={<Users size={20} />} label="Acc" active={activeView === 'ACCOUNTS'} onClick={() => setActiveView('ACCOUNTS')} />
          <MobileNavItem icon={<FileText size={20} />} label="ID" active={activeView === 'IDENTITY'} onClick={() => setActiveView('IDENTITY')} />
          <MobileNavItem icon={<Smartphone size={20} />} label="SIM" active={activeView === 'SIMS'} onClick={() => setActiveView('SIMS')} />
          <MobileNavItem icon={<Package size={20} />} label="Samp" active={activeView === 'SAMPLES'} onClick={() => setActiveView('SAMPLES')} />
          <MobileNavItem icon={<TrendingUp size={20} />} label="Stats" active={activeView === 'ANALYTICS'} onClick={() => setActiveView('ANALYTICS')} />
          <MobileNavItem icon={<Settings size={20} />} label="Set" active={activeView === 'SETTINGS'} onClick={() => setActiveView('SETTINGS')} />
       </nav>

      <EntityModals 
        editingEntity={editingEntity} modals={modals} setModals={setModals} accounts={accounts}
        affiliateAccounts={affiliateAccounts} payAccounts={payAccounts}
        newAcc={newAcc} setNewAcc={setNewAcc} handleCreateAcc={() => editingEntity ? handleUpdate('acc', accountService.updateAccount, newAcc, setAccounts, () => setNewAcc({username:''})) : createEntity('acc', accountService.createAccount, newAcc, setAccounts, () => setNewAcc({username:''}))}
        newAff={newAff} setNewAff={setNewAff} handleCreateAff={handleCreateAff}
        newPay={newPay} setNewPay={setNewPay} handleCreatePay={handleCreatePay}
        newComm={newComm} setNewComm={setNewComm} handleCreateComm={(e: React.FormEvent) => { e.preventDefault(); editingEntity ? handleUpdate('comm', accountService.updateCommission, newComm, setCommissions as any, () => setNewComm({account_id:'', date: new Date().toISOString().split('T')[0], amount: 0})) : createEntity('comm', accountService.createCommission, newComm, setCommissions as any, () => setNewComm({account_id:'', date: new Date().toISOString().split('T')[0], amount: 0})) }}
        newSim={newSim} setNewSim={setNewSim} handleCreateSim={handleCreateSim}
        newId={newId} setNewId={setNewId} handleCreateId={handleCreateId}
        newSample={newSample} setNewSample={setNewSample} handleCreateSample={(e: React.FormEvent) => { e.preventDefault(); editingEntity ? handleUpdate('sample', accountService.updateSample, newSample, setSamples as any, () => setNewSample({account_id:'', product_name:'', shop_name:'', brand_name:''})) : createEntity('sample', accountService.createSample, newSample, setSamples as any, () => setNewSample({account_id:'', product_name:'', shop_name:'', brand_name:''})) }}
      />
    </div>
  )
}

// UI Elements
function SectionHeader({ title, sub, onAdd }: { title: string, sub: string, onAdd: () => void }) {
  return (
    <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-[2rem] border border-white/5">
       <div><h3 className="text-xl font-bold text-white">{title}</h3><p className="text-xs text-slate-500">{sub}</p></div>
       <button onClick={onAdd} className="p-4 bg-white/5 rounded-2xl text-white border border-white/10 hover:bg-white/10 transition-all"><Plus size={20} /></button>
    </div>
  )
}

interface EntityCardProps {
  title: string
  sub: string
  extra?: string
  details?: { [key: string]: string }
  status?: any
  onDelete: () => void
  onEdit: () => void
  onClickDetail?: () => void
  entityType?: 'sim' | 'id' | 'sample' | 'acc'
}

function confirmDelete(name: string, action: () => void) {
  if (confirm(`Apakah Anda yakin ingin menghapus ${name} ini?`)) {
    action()
  }
}

function CopyButton({ text, label }: { text: string, label?: string }) {
  return (
    <button 
      onClick={(e) => {
        e.stopPropagation()
        navigator.clipboard.writeText(text)
        alert(`${label || 'Data'} berhasil disalin!`)
      }}
      className="p-1.5 bg-white/5 hover:bg-accent hover:text-primary rounded-lg transition-all text-slate-500 active:scale-90"
      title="Salin"
    >
      <Copy size={12} />
    </button>
  )
}

function EntityCard({ title, sub, extra, details, onDelete, onEdit, onClickDetail, entityType }: EntityCardProps) {
  const getDaysLeft = (dateStr: string) => {
    const end = new Date(dateStr)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 3600 * 24))
    return days
  }

  const daysLeft = entityType === 'sim' && extra ? getDaysLeft(extra) : null

  return (
    <div className="relative group/card glass p-6 rounded-[2.5rem] border border-white/5 hover:border-accent/30 transition-all flex flex-col justify-between h-full hover:shadow-2xl hover:shadow-accent/5">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="w-full">
            <div className="flex items-center gap-2 group/title">
              <h4 className="text-base font-bold text-white tracking-tight break-all leading-tight">{title}</h4>
              <CopyButton text={title} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{sub}</p>
              <CopyButton text={sub} />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="p-2.5 bg-white/5 text-slate-400 hover:text-accent rounded-2xl transition-all" title="Ubah"><Edit size={14} /></button>
            <button onClick={onDelete} className="p-2.5 bg-white/5 text-slate-400 hover:text-rose-500 rounded-2xl transition-all" title="Hapus"><Trash2 size={14} /></button>
          </div>
        </div>

        {extra && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
               <span className="text-[10px] font-bold text-slate-400 uppercase">{entityType === 'sim' ? 'Exp:' : ''} {extra}</span>
               <CopyButton text={extra} />
            </div>
            {daysLeft !== null && (
              <div className={`px-3 py-1 rounded-xl border flex items-center gap-1 ${daysLeft < 30 ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
                <span className="text-[9px] font-black uppercase tracking-widest">{daysLeft > 0 ? `${daysLeft} Hari Lagi` : 'Expired'}</span>
              </div>
            )}
          </div>
        )}

        {details && (
          <div className="pt-2 space-y-2 border-t border-white/5">
            {Object.entries(details).map(([k, v]) => v && (
              <div 
                key={k} 
                onClick={() => v === 'Click to view' && onClickDetail?.()}
                className={`flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/5 group/detail ${v === 'Click to view' ? 'cursor-pointer hover:bg-white/10' : ''}`}
              >
                <div className="min-w-0">
                  <p className="text-[8px] font-black text-slate-600 uppercase leading-none mb-1">{k}</p>
                  <p className={`text-[10px] font-bold break-all leading-tight ${v === 'Click to view' ? 'text-accent underline' : 'text-slate-300'}`}>{v}</p>
                </div>
                {v !== 'Click to view' && <CopyButton text={v} label={k} />}
              </div>
            ))}
          </div>
        )}
      </div>
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
  editingEntity: any; modals: any; setModals: any; accounts: ShopeeAccount[];
  affiliateAccounts: ShopeeAffiliateAccount[]; payAccounts: ShopeePayAccount[];
  newAcc: any; setNewAcc: any; handleCreateAcc: () => void;
  newAff: any; setNewAff: any; handleCreateAff: () => void;
  newPay: any; setNewPay: any; handleCreatePay: () => void;
  newComm: any; setNewComm: any; handleCreateComm: (e: React.FormEvent) => void;
  newSim: any; setNewSim: any; handleCreateSim: (e: React.FormEvent) => void;
  newId: any; setNewId: any; handleCreateId: (e: React.FormEvent) => void;
  newSample: any; setNewSample: any; handleCreateSample: (e: React.FormEvent) => void;
}

function EntityModals({ editingEntity, modals, setModals, accounts, affiliateAccounts, payAccounts, newAcc, setNewAcc, handleCreateAcc, newAff, setNewAff, handleCreateAff, newPay, setNewPay, handleCreatePay, newComm, setNewComm, handleCreateComm, newSim, setNewSim, handleCreateSim, newId, setNewId, handleCreateId, newSample, setNewSample, handleCreateSample }: EntityModalProps) {
  return (
    <AnimatePresence>
      {modals.comm && (
        <Modal title={editingEntity ? "Edit Komisi" : "Catat Komisi Harian"} onClose={() => setModals({...modals, comm: false})}>
          <form onSubmit={handleCreateComm} className="space-y-4">
             <div className="space-y-4">
            <select value={newComm.account_id} onChange={e => setNewComm({...newComm, account_id: e.target.value})} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-accent">
              <option value="" className="bg-slate-900">Pilih Akun Shopee</option>
              {accounts.map(a => <option key={a.id} value={a.id} className="bg-slate-900">{a.username}</option>)}
            </select>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase ml-2">Tanggal Cair</label>
              <input type="date" value={newComm.date} onChange={e => setNewComm({...newComm, date: e.target.value})} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase ml-2">Nominal Komisi (IDR)</label>
              <input type="number" placeholder="Nominal Rp" value={newComm.amount} onChange={e => setNewComm({...newComm, amount: Number(e.target.value)})} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none" />
            </div>
          </div>
             <SubmitButton label={editingEntity ? "Simpan Perubahan" : "Simpan Komisi"} />
          </form>
        </Modal>
      )}

      {modals.acc && (
        <Modal title={editingEntity ? "Edit Akun Master" : "Tambah Akun Master"} onClose={() => setModals({...modals, acc: false})}>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateAcc() }} className="space-y-4">
            <FormInput label="Username Shopee" value={newAcc.username} onChange={(v: string) => setNewAcc({...newAcc, username: v})} required />
            <SubmitButton label={editingEntity ? "Simpan Perubahan" : "Simpan Akun Master"} />
          </form>
        </Modal>
      )}

      {modals.aff && (
        <Modal title={editingEntity ? "Edit Akun Affiliate" : "Tambah Akun Affiliate"} onClose={() => setModals({...modals, aff: false})}>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateAff() }} className="space-y-4">
            <AccountSelect accounts={accounts} value={newAff.master_id} onChange={(v: string) => setNewAff({...newAff, master_id: v})} />
            <FormInput label="Email Shopee" value={newAff.email} onChange={(v: string) => setNewAff({...newAff, email: v})} required />
            <FormInput label="Password" type="password" value={newAff.password} onChange={(v: string) => setNewAff({...newAff, password: v})} required />
            <SubmitButton label={editingEntity ? "Simpan" : "Simpan Affiliate"} />
          </form>
        </Modal>
      )}

      {modals.pay && (
        <Modal title={editingEntity ? "Edit Shopee Pay" : "Tambah Shopee Pay"} onClose={() => setModals({...modals, pay: false})}>
          <form onSubmit={(e) => { e.preventDefault(); handleCreatePay() }} className="space-y-4">
            <AccountSelect accounts={accounts} value={newPay.master_id} onChange={(v: string) => setNewPay({...newPay, master_id: v})} />
            <FormInput label="Nama di KTP" value={newPay.name_ktp} onChange={(v: string) => setNewPay({...newPay, name_ktp: v})} required />
            <FormInput label="NIK" value={newPay.nik} onChange={(v: string) => setNewPay({...newPay, nik: v})} required />
            <FileUpload label="Foto KTP" onUpload={(url) => setNewPay({...newPay, ktp_image_url: url})} defaultValue={newPay.ktp_image_url} />
            <SubmitButton label={editingEntity ? "Update Pay" : "Save Pay"} />
          </form>
        </Modal>
      )}

      {modals.sim && (
        <Modal title={editingEntity ? "Edit Data SIM" : "Tambah Data SIM"} onClose={() => setModals({...modals, sim: false})}>
          <form onSubmit={handleCreateSim} className="space-y-4">
             <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-tighter ml-1 text-accent flex items-center gap-1">Parent Account *</label>
                  <select 
                    value={newSim.affiliate_id || newSim.pay_id || ''} 
                    onChange={e => {
                      const val = e.target.value
                      const isAff = affiliateAccounts.some(a => a.id === val)
                      setNewSim({
                        ...newSim, 
                        affiliate_id: isAff ? val : '', 
                        pay_id: isAff ? '' : val
                      })
                    }} 
                    required 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-slate-900">-- Pilih Affiliate / Pay --</option>
                    <optgroup label="Shopee Affiliate" className="bg-slate-900">
                      {affiliateAccounts.map(a => <option key={a.id} value={a.id}>{a.email}</option>)}
                    </optgroup>
                    <optgroup label="Shopee Pay" className="bg-slate-900">
                      {payAccounts.map(p => <option key={p.id} value={p.id}>{p.name_ktp} ({p.nik})</option>)}
                    </optgroup>
                  </select>
                </div>
                <FormInput label="Nomor Telepon" value={newSim.phone_number} onChange={(v: string) => setNewSim({...newSim, phone_number: v})} required />
                <FormInput label="Masa Aktif" type="date" value={newSim.expiry_date} onChange={(v: string) => setNewSim({...newSim, expiry_date: v})} required />
                <div className="flex items-center gap-3 p-4 glass rounded-2xl border border-white/5">
                    <input type="checkbox" checked={newSim.has_whatsapp} onChange={(e) => setNewSim({...newSim, has_whatsapp: e.target.checked})} className="w-5 h-5 rounded accent-rose-500" />
                    <span className="text-sm text-slate-300 font-bold">Terdaftar WhatsApp</span>
                </div>
             </div>
             <SubmitButton label={editingEntity ? "Update SIM" : "Save SIM"} />
          </form>
        </Modal>
      )}

      {modals.id && (
        <Modal title={editingEntity ? "Edit Profile KYC" : "Lengkapi Identitas (KYC)"} onClose={() => setModals({...modals, id: false})}>
          <form onSubmit={handleCreateId} className="space-y-4 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
             <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-tighter ml-1 text-accent flex items-center gap-1">Shopee Affiliate *</label>
                  <select value={newId.affiliate_id} onChange={e => setNewId({...newId, affiliate_id: e.target.value})} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50 appearance-none cursor-pointer">
                    <option value="" className="bg-slate-900">-- Pilih Akun Affiliate --</option>
                    {affiliateAccounts.map(a => <option key={a.id} value={a.id} className="bg-slate-900">{a.email}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormInput label="NIK (KTP)" value={newId.nik} onChange={(v: string) => setNewId({...newId, nik: v})} required />
                    <FormInput label="Nama Lengkap" value={newId.name_ktp} onChange={(v: string) => setNewId({...newId, name_ktp: v})} required />
                    <FormInput label="NPWP" value={newId.npwp} onChange={(v: string) => setNewId({...newId, npwp: v})} />
                    <FormInput label="Bank" value={newId.bank_name} onChange={(v: string) => setNewId({...newId, bank_name: v})} required />
                </div>
                <FormInput label="Nomor Rekening" value={newId.bank_acc} onChange={(v: string) => setNewId({...newId, bank_acc: v})} required />
                <FileUpload label="Foto Buku Tabungan / Rekening" onUpload={(url) => setNewId({...newId, bank_acc_image_url: url})} defaultValue={newId.bank_acc_image_url} />
                <FormInput label="Alamat Sesuai KTP" value={newId.address} onChange={(v: string) => setNewId({...newId, address: v})} />
             </div>
             <SubmitButton label={editingEntity ? "Update Profile" : "Simpan Profile"} />
          </form>
        </Modal>
      )}

      {modals.sample && (
        <Modal title={editingEntity ? "Edit Request Sampel" : "Request Sampel Baru"} onClose={() => setModals({...modals, sample: false})}>
          <form onSubmit={handleCreateSample} className="space-y-4">
             <AccountSelect accounts={accounts} value={newSample.account_id} onChange={(v: string) => setNewSample({...newSample, account_id: v})} />
             <FormInput label="Nama Produk" value={newSample.product_name} onChange={(v: string) => setNewSample({...newSample, product_name: v})} required />
             <div className="grid grid-cols-2 gap-4">
                <FormInput label="Shop Name" value={newSample.shop_name} onChange={(v: string) => setNewSample({...newSample, shop_name: v})} required />
                <FormInput label="Brand" value={newSample.brand_name} onChange={(v: string) => setNewSample({...newSample, brand_name: v})} required />
             </div>
             <SubmitButton label={editingEntity ? "Update Record" : "Record Request"} />
          </form>
        </Modal>
      )}
    </AnimatePresence>
  )
}

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

function FileUpload({ label, onUpload, defaultValue = '' }: { label: string, onUpload: (url: string) => void, defaultValue?: string }) {
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState(defaultValue)

  useEffect(() => { setUrl(defaultValue) }, [defaultValue])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const publicUrl = await accountService.uploadDocument(file)
      setUrl(publicUrl)
      onUpload(publicUrl)
    } catch (e: any) {
      alert(`Upload failed: ${e.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group overflow-hidden glass rounded-xl border border-white/10 p-4 flex flex-col items-center justify-center gap-2 hover:border-accent/40 transition-all min-h-[100px] cursor-pointer">
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            <span className="text-[10px] font-black text-accent uppercase animate-pulse">Uploading...</span>
          </div>
        ) : url ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="relative w-full h-20 bg-black/40 rounded-lg overflow-hidden flex items-center justify-center">
              <img src={url} alt="Uploaded" className="object-contain h-full w-full" />
            </div>
            <button type="button" onClick={() => setUrl('')} className="text-[9px] font-black text-rose-500 uppercase hover:underline">Hapus & Ganti</button>
          </div>
        ) : (
          <>
            <Plus size={20} className="text-slate-500 group-hover:text-accent transition-colors" />
            <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-400">Pilih File Gambar</span>
            <input type="file" accept="image/*" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
          </>
        )}
      </div>
    </div>
  )
}


function FormInput({ label, value, onChange, type = 'text', required = false, placeholder = '' }: { label: string, value: string, onChange: (v: string) => void, type?: string, required?: boolean, placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label} {required && <span className="text-rose-500">*</span>}</label>
      <input type={type} min="0" value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all placeholder:text-slate-700" />
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
    <button onClick={onClick} className={`flex flex-col items-center gap-1 min-w-[50px] py-1 transition-all shrink-0 ${active ? 'text-accent' : 'text-slate-600'}`}>
      <div className={`p-1 rounded-xl transition-all ${active ? 'bg-accent/10 scale-110' : ''}`}>{icon}</div>
      <span className="text-[9px] font-bold uppercase tracking-tighter">{label}</span>
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

function SettingsView({ user, onLogout, onPushToggle, onManualRegister, isPushEnabled }: { user: any, onLogout: () => void, onPushToggle: () => void, onManualRegister: () => void, isPushEnabled: boolean }) {
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
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div><p className="text-sm font-bold text-white">Push Notifications</p><p className="text-[10px] text-slate-500 italic opacity-60">Alert SIM & Deadline Sampel</p></div>
              <div onClick={onPushToggle} className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${isPushEnabled ? 'bg-accent/40' : 'bg-slate-800'}`}><motion.div animate={{ x: isPushEnabled ? 24 : 0 }} className={`absolute left-1 top-1 w-4 h-4 rounded-full shadow-lg ${isPushEnabled ? 'bg-accent' : 'bg-slate-600'}`} /></div>
            </div>

            <button onClick={onManualRegister} className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
              <div className="text-left"><p className="text-sm font-bold text-white">Repair PWA & Push</p><p className="text-[10px] text-slate-500 italic opacity-60">Daftarkan ulang sistem di browser</p></div>
              <div className="p-2 bg-white/5 rounded-xl"><Smartphone size={16} className="text-slate-400" /></div>
            </button>
          </div>
      </div>
      <button onClick={onLogout} className="w-full py-5 bg-rose-500/10 text-rose-500 rounded-[1.5rem] text-sm font-black uppercase tracking-[0.2em] border border-rose-500/20 active:scale-95 transition-all">Sign Out System</button>
    </div>
  )
}
