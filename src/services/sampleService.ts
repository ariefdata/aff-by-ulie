import { createClient } from '@/utils/supabase/client'

export interface Sample {
  id: string
  account_id: string
  product_name: string
  status: 'REQUESTED' | 'RECEIVED' | 'REVIEWED' | 'POSTED'
  deadline: string
}

export const sampleService = {
  async getSamples(accountId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('samples')
      .select('*')
      .eq('account_id', accountId)
    
    if (error) throw error
    return data
  },

  async createSample(sample: Omit<Sample, 'id'>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('samples')
      .insert([sample])
      .select()
    
    if (error) throw error
    return data[0]
  }
}
