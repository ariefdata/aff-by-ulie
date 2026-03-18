import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/DashboardClient'
import { accountService } from '@/services/accountService'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Fetch initial accounts on server
  let initialAccounts = []
  try {
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error) {
      initialAccounts = accounts || []
    }
  } catch (err) {
    console.error('Initial fetch failed', err)
  }

  return <DashboardClient initialUser={user} initialAccounts={initialAccounts} />
}
