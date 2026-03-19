import { createClient } from '@/utils/supabase/client'

export interface ShopeeAccount {
  id: string
  user_id: string
  username: string
  email: string
  password: string
  created_at: string
}

export interface Identity {
  id: string
  user_id: string
  account_id: string
  nik: string
  name_ktp: string
  npwp: string
  bank_name: string
  bank_acc: string
  address: string
  created_at: string
}

export interface Sim {
  id: string
  user_id: string
  account_id: string
  phone_number: string
  expiry_date: string
  has_whatsapp: boolean
  created_at: string
}

export interface Sample {
  id: string
  user_id: string
  account_id: string
  product_name: string
  shop_name: string
  brand_name: string
  created_at: string
}

export interface Commission {
  id: string
  user_id: string
  account_id: string
  start_date: string
  end_date: string
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
  getAccounts: async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as ShopeeAccount[]
  },

  createAccount: async (account: Omit<ShopeeAccount, 'id' | 'user_id' | 'created_at'>) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('accounts').insert([{ ...account, user_id: user?.id }]).select()
    if (error) throw error
    return data[0] as ShopeeAccount
  },

  updateAccount: async (id: string, account: Partial<ShopeeAccount>) => {
    const supabase = createClient()
    const { data, error } = await supabase.from('accounts').update(account).eq('id', id).select()
    if (error) throw error
    return data[0] as ShopeeAccount
  },

  deleteAccount: async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('accounts').delete().eq('id', id)
    if (error) throw error
  },

  // Modular Entity CRUD
  getIdentities: () => _getEntities<Identity>('identities'),
  createIdentity: (data: Omit<Identity, 'id' | 'user_id' | 'created_at'>) => _createEntity<Identity>('identities', data),
  deleteIdentity: (id: string) => _deleteEntity('identities', id),
  updateIdentity: (id: string, data: Partial<Identity>) => _updateEntity<Identity>('identities', id, data),

  getSims: () => _getEntities<Sim>('sims'),
  createSim: (data: Omit<Sim, 'id' | 'user_id' | 'created_at'>) => _createEntity<Sim>('sims', data),
  deleteSim: (id: string) => _deleteEntity('sims', id),
  updateSim: (id: string, data: Partial<Sim>) => _updateEntity<Sim>('sims', id, data),

  getSamples: () => _getEntities<Sample>('samples'),
  createSample: (data: Omit<Sample, 'id' | 'user_id' | 'created_at'>) => _createEntity<Sample>('samples', data),
  deleteSample: (id: string) => _deleteEntity('samples', id),
  updateSample: (id: string, data: Partial<Sample>) => _updateEntity<Sample>('samples', id, data),

  getCommissions: () => _getEntities<Commission>('commissions'),
  createCommission: (data: Omit<Commission, 'id' | 'user_id' | 'created_at'>) => _createEntity<Commission>('commissions', data),
  deleteCommission: (id: string) => _deleteEntity('commissions', id),
  updateCommission: (id: string, data: Partial<Commission>) => _updateEntity<Commission>('commissions', id, data)
}
