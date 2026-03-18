import { createClient } from '@/utils/supabase/client'

export interface Account {
  id: string
  nickname: string
  device_name: string
  shopee_user: string
  shopee_pass: string
  email_addr: string
  email_pass: string
  wa_number: string
  sim_expiry: string
  sim_status: 'ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED' | 'WARNING'
  ktp_name: string
  npwp_num: string
  bank_name: string
  bank_acc: string
  doc_img_url: string
  samples_count: number
  income_total: number
}

export interface Activity {
  id: string
  user_id: string
  account_id: string
  type: 'SAMPLE' | 'INCOME'
  amount: number
  notes?: string
  logged_at: string
}

export const accountService = {
  async getAccounts() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async createAccount(account: Omit<Account, 'id'>) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('accounts')
      .insert([{ ...account, user_id: user?.id }])
      .select()
    
    if (error) throw error
    return data[0]
  },

  async updateAccount(id: string, updates: Partial<Account>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  async deleteAccount(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Activity Methods
  async getActivities(accountId?: string) {
    const supabase = createClient()
    let query = supabase.from('activities').select('*').order('logged_at', { ascending: false })
    if (accountId) query = query.eq('account_id', accountId)
    
    const { data, error } = await query
    if (error) throw error
    return data as Activity[]
  },

  async logActivity(activity: Omit<Activity, 'id' | 'user_id' | 'logged_at'>) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('activities')
      .insert([{ ...activity, user_id: user?.id }])
      .select()
    
    if (error) throw error
    
    // Also update account totals (incremental)
    const { data: account } = await supabase.from('accounts').select('samples_count, income_total').eq('id', activity.account_id).single()
    if (account) {
      const updates: any = {}
      if (activity.type === 'SAMPLE') updates.samples_count = (account.samples_count || 0) + activity.amount
      if (activity.type === 'INCOME') updates.income_total = (account.income_total || 0) + activity.amount
      
      await supabase.from('accounts').update(updates).eq('id', activity.account_id)
    }

    return data[0]
  }
}
