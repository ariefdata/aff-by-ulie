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

export const accountService = {
  async getAccounts() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as ShopeeAccount[]
  },

  async createAccount(account: Omit<ShopeeAccount, 'id' | 'user_id' | 'created_at'>) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('accounts').insert([{ ...account, user_id: user?.id }]).select()
    if (error) throw error
    return data[0] as ShopeeAccount
  },

  async deleteAccount(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('accounts').delete().eq('id', id)
    if (error) throw error
  },

  // Modular Entity CRUD
  async getIdentities() {
    return this._getEntities<Identity>('identities')
  },
  async createIdentity(data: Omit<Identity, 'id' | 'user_id' | 'created_at'>) {
    return this._createEntity<Identity>('identities', data)
  },
  async deleteIdentity(id: string) {
    return this._deleteEntity('identities', id)
  },

  async getSims() {
    return this._getEntities<Sim>('sims')
  },
  async createSim(data: Omit<Sim, 'id' | 'user_id' | 'created_at'>) {
    return this._createEntity<Sim>('sims', data)
  },
  async deleteSim(id: string) {
    return this._deleteEntity('sims', id)
  },

  async getSamples() {
    return this._getEntities<Sample>('samples')
  },
  async createSample(data: Omit<Sample, 'id' | 'user_id' | 'created_at'>) {
    return this._createEntity<Sample>('samples', data)
  },
  async deleteSample(id: string) {
    return this._deleteEntity('samples', id)
  },

  async getCommissions() {
    return this._getEntities<Commission>('commissions')
  },
  async createCommission(data: Omit<Commission, 'id' | 'user_id' | 'created_at'>) {
    return this._createEntity<Commission>('commissions', data)
  },
  async deleteCommission(id: string) {
    return this._deleteEntity('commissions', id)
  },

  // Generic Helpers
  async _getEntities<T>(table: string) {
    const supabase = createClient()
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data as T[]
  },

  async _createEntity<T>(table: string, payload: any) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from(table).insert([{ ...payload, user_id: user?.id }]).select()
    if (error) throw error
    return data[0] as T
  },

  async _deleteEntity(table: string, id: string) {
    const supabase = createClient()
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
  }
}
