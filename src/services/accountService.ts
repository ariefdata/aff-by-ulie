import { createClient } from '@/utils/supabase/client'

export interface ShopeeAccount {
  id: string
  user_id: string
  username: string
  email: string
  password?: string
  created_at: string
}

export interface ShopeeAffiliateAccount {
  id: string
  master_id: string
  user_id: string
  username: string
  email: string
  password: string
  created_at: string
}

export interface ShopeePayAccount {
  id: string
  master_id: string
  user_id: string
  name_ktp: string
  nik: string
  ktp_image_url?: string
  created_at: string
}

export interface Identity {
  id: string
  user_id: string
  affiliate_id: string
  nik: string
  name_ktp: string
  npwp: string
  bank_name: string
  bank_acc: string
  bank_acc_image_url?: string
  address: string
  created_at: string
}

export interface Sim {
  id: string
  user_id: string
  affiliate_id?: string
  pay_id?: string
  phone_number: string
  expiry_date: string
  has_whatsapp: boolean
  created_at: string
}

export interface Sample {
  id: string
  user_id: string
  affiliate_id: string
  product_name: string
  shop_name: string
  brand_name: string
  created_at: string
}

export interface Commission {
  id: string
  user_id: string
  affiliate_id: string
  date: string
  amount: number
  created_at: string
}

// Generic Helpers
const _getEntities = async <T>(table: string): Promise<T[]> => {
  const supabase = createClient()
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as T[]
}

const _createEntity = async <T>(table: string, payload: any): Promise<T> => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from(table).insert([{ ...payload, user_id: user?.id }]).select()
  if (error) throw error
  return data[0] as T
}

const _deleteEntity = async (table: string, id: string): Promise<void> => {
  const supabase = createClient()
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

const _updateEntity = async <T>(table: string, id: string, payload: any): Promise<T> => {
  const supabase = createClient()
  const { data, error } = await supabase.from(table).update(payload).eq('id', id).select()
  if (error) throw error
  return data[0] as T
}

// Service Methods
export const accountService = {
  getAccounts: () => _getEntities<ShopeeAccount>('accounts'),
  createAccount: (data: { email: string, username: string, password?: string }) => _createEntity<ShopeeAccount>('accounts', data),
  updateAccount: (id: string, data: { email?: string, username?: string, password?: string }) => _updateEntity<ShopeeAccount>('accounts', id, data),
  deleteAccount: (id: string) => _deleteEntity('accounts', id),

  // Affiliate
  getAffiliateAccounts: () => _getEntities<ShopeeAffiliateAccount>('shopee_affiliate_accounts'),
  createAffiliateAccount: (data: Omit<ShopeeAffiliateAccount, 'id' | 'user_id' | 'created_at'>) => _createEntity<ShopeeAffiliateAccount>('shopee_affiliate_accounts', data),
  updateAffiliateAccount: (id: string, data: Partial<ShopeeAffiliateAccount>) => _updateEntity<ShopeeAffiliateAccount>('shopee_affiliate_accounts', id, data),
  deleteAffiliateAccount: (id: string) => _deleteEntity('shopee_affiliate_accounts', id),

  // Pay
  getPayAccounts: () => _getEntities<ShopeePayAccount>('shopee_pay_accounts'),
  createPayAccount: (data: Omit<ShopeePayAccount, 'id' | 'user_id' | 'created_at'>) => _createEntity<ShopeePayAccount>('shopee_pay_accounts', data),
  updatePayAccount: (id: string, data: Partial<ShopeePayAccount>) => _updateEntity<ShopeePayAccount>('shopee_pay_accounts', id, data),
  deletePayAccount: (id: string) => _deleteEntity('shopee_pay_accounts', id),

  // Modular Entity CRUD
  getIdentities: () => _getEntities<Identity>('identities'),
  createIdentity: (data: Omit<Identity, 'id' | 'user_id' | 'created_at'>) => _createEntity<Identity>('identities', data),
  deleteIdentity: (id: string) => _deleteEntity('identities', id),
  updateIdentity: (id: string, data: Partial<Identity>) => _updateEntity<Identity>('identities', id, data),

  getSims: () => _getEntities<Sim>('sims'),
  createSim: (data: Omit<Sim, 'id' | 'user_id' | 'created_at'>) => _createEntity<Sim>('sims', data),
  deleteSim: (id: string) => _deleteEntity('sims', id),
  updateSim: (id: string, data: Partial<Sim>) => _updateEntity<Sim>('sims', id, data),

  getCommissions: () => _getEntities<Commission>('commissions'),
  createCommission: (data: { affiliate_id: string, date: string, amount: number }) => _createEntity<Commission>('commissions', data),
  updateCommission: (id: string, data: { affiliate_id?: string, date?: string, amount?: number }) => _updateEntity<Commission>('commissions', id, data),
  deleteCommission: (id: string) => _deleteEntity('commissions', id),

  getSamples: () => _getEntities<Sample>('samples'),
  createSample: (data: { affiliate_id: string, product_name: string, shop_name: string, brand_name: string }) => _createEntity<Sample>('samples', data),
  updateSample: (id: string, data: { affiliate_id?: string, product_name?: string, shop_name?: string, brand_name?: string }) => _updateEntity<Sample>('samples', id, data),
  deleteSample: (id: string) => _deleteEntity('samples', id),

  // File Upload
  uploadDocument: async (file: File): Promise<string> => {
    const supabase = createClient()
    const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`
    const { data, error } = await supabase.storage
      .from('account-documents')
      .upload(fileName, file)
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('account-documents')
      .getPublicUrl(data.path)
      
    return publicUrl
  }
}
