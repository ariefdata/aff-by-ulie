export type SimStatus = 'ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED' | 'WARNING'

export interface SimStatusResult {
  status: SimStatus
  color: string
  alert: boolean
}

export function getSimStatus(expiryDate: string | Date): SimStatusResult {
  const today = new Date()
  const expiry = new Date(expiryDate)
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return { status: 'EXPIRED', color: 'text-red-500', alert: true }
  if (diffDays <= 7) return { status: 'GRACE_PERIOD', color: 'text-orange-500', alert: true }
  if (diffDays <= 30) return { status: 'WARNING', color: 'text-amber-500', alert: true }
  return { status: 'ACTIVE', color: 'text-green-500', alert: false }
}
