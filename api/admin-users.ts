import { getSupabaseAdmin, requireUser } from './auth'

type Role = 'user' | 'employee' | 'admin'

function json(status: number, data: unknown) {
  return { status, data }
}

async function requireAdmin(req: any) {
  const user = await requireUser(req)
  const supabase = getSupabaseAdmin()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const isAdmin = user.app_metadata?.role === 'admin' || profile?.role === 'admin' ||
    user.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()
  if (!isAdmin) throw new Error('Admin access required.')
  return { user, supabase }
}

export async function handleAdminUsers(req: any, body: any = {}) {
  const { user, supabase } = await requireAdmin(req)

  if (req.method === 'GET') {
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    if (authError) return json(500, { error: authError.message })
    const { data: profiles, error: profileError } = await supabase.from('profiles').select('id, email, role, display_name')
    if (profileError) return json(500, { error: profileError.message })
    const profileMap = new Map((profiles || []).map(profile => [profile.id, profile]))
    return json(200, {
      users: (authData.users || []).map(authUser => ({
        id: authUser.id,
        email: authUser.email || profileMap.get(authUser.id)?.email || '',
        displayName: profileMap.get(authUser.id)?.display_name || authUser.user_metadata?.name || '',
        role: profileMap.get(authUser.id)?.role || authUser.app_metadata?.role || 'user',
        createdAt: authUser.created_at
      }))
    })
  }

  if (req.method !== 'POST') return json(405, { error: 'Method not allowed.' })
  const targetId = typeof body.userId === 'string' ? body.userId : ''
  const role: Role = body.role
  if (!targetId || !['user', 'employee', 'admin'].includes(role)) return json(400, { error: 'Invalid user or role.' })
  if (targetId === user.id && role !== 'admin') return json(400, { error: 'You cannot remove your own admin access.' })

  const { data: updatedUser, error: authError } = await supabase.auth.admin.updateUserById(targetId, {
    app_metadata: { role }
  })
  if (authError || !updatedUser.user) return json(500, { error: authError?.message || 'Could not update auth role.' })

  const { error: profileError } = await supabase.from('profiles').update({ role }).eq('id', targetId)
  if (profileError) return json(500, { error: profileError.message })
  return json(200, { ok: true, role })
}

export default async function handler(req: any, res: any) {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const result = await handleAdminUsers(req, body || {})
    return res.status(result.status).json(result.data)
  } catch (error: any) {
    const message = error?.message || 'Could not manage users.'
    const status = message.includes('Authentication') || message.includes('token') ? 401 : message.includes('Admin access') ? 403 : 400
    return res.status(status).json({ error: message })
  }
}
