// app/api/ops/bags/action/route.js
// Bag management actions

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { issueBagToMember, returnBag, markBagUnreturned, updateBagCondition } from '@/lib/airtable'
import { logBagAction } from '@/lib/audit'

export async function POST(request) {
  // Verify auth
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('flex_ops_auth')
  if (!authCookie || authCookie.value !== process.env.OPS_AUTH_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { bagId, action, memberId, condition } = await request.json()

    if (!bagId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let result

    switch (action) {
      case 'issue':
        if (!memberId) {
          return NextResponse.json({ error: 'Member ID required' }, { status: 400 })
        }
        result = await issueBagToMember(bagId, memberId)
        await logBagAction(bagId, 'Issued to member', 'ops_dashboard', 'Ops Dashboard', { memberId })
        break

      case 'return':
        result = await returnBag(bagId)
        await logBagAction(bagId, 'Returned', 'ops_dashboard', 'Ops Dashboard')
        break

      case 'mark_unreturned':
        result = await markBagUnreturned(bagId)
        await logBagAction(bagId, 'Marked unreturned', 'ops_dashboard', 'Ops Dashboard')
        break

      case 'update_condition':
        if (!condition) {
          return NextResponse.json({ error: 'Condition required' }, { status: 400 })
        }
        result = await updateBagCondition(bagId, condition)
        await logBagAction(bagId, `Condition updated to ${condition}`, 'ops_dashboard', 'Ops Dashboard')
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Bag action error:', error)
    return NextResponse.json({ error: 'Action failed' }, { status: 500 })
  }
}
