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
  }
}
