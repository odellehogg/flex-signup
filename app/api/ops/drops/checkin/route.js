// app/api/ops/drops/checkin/route.js
// Bulk check-in drops (status update) with laundry partner assignment and audit logging

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { updateDropScanLog } from '@/lib/airtable'
import { logDropStatusChange } from '@/lib/audit'

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

export async function POST(request) {
  // Verify auth
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('flex_ops_auth')
  if (!authCookie || authCookie.value !== process.env.OPS_AUTH_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { dropIds, newStatus, action, laundryPartner } = await request.json()

    if (!dropIds || !Array.isArray(dropIds) || dropIds.length === 0) {
      return NextResponse.json({ error: 'No drops specified' }, { status: 400 })
    }

    const results = []
    const errors = []

    for (const dropId of dropIds) {
      try {
        // Get current drop to record old status
        const getRes = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Drops/${dropId}`,
          {
            headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
          }
        )
        const currentDrop = await getRes.json()
        const oldStatus = currentDrop.fields?.['Status'] || 'Unknown'

        // Build update fields
        const updateFields = {
          'Status': newStatus,
          'Status Changed': new Date().toISOString(),
        }

        // Add laundry partner if provided
        if (laundryPartner) {
          updateFields['Laundry Partner'] = laundryPartner
          updateFields['Assignment Time'] = new Date().toISOString()
        }

        // Update the drop record
        const updateRes = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Drops/${dropId}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fields: updateFields }),
          }
        )

        if (!updateRes.ok) {
          throw new Error(`Airtable update failed: ${updateRes.status}`)
        }

        // Add scan log entry
        const scanEntry = {
          timestamp: new Date().toISOString(),
          action: action || 'status_update',
          newStatus,
          operator: 'ops_dashboard',
          laundryPartner: laundryPartner || null,
        }
        await updateDropScanLog(dropId, scanEntry)

        // Log to audit trail
        await logDropStatusChange(
          dropId, 
          oldStatus, 
          newStatus, 
          'Ops Dashboard',
          'Ops Dashboard',
          { action, laundryPartner, bagNumber: currentDrop.fields?.['Bag Number'] }
        )

        results.push({ dropId, success: true })
      } catch (error) {
        console.error(`Failed to update drop ${dropId}:`, error)
        errors.push({ dropId, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      updated: results.length,
      laundryPartner: laundryPartner || null,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json({ error: 'Failed to check in drops' }, { status: 500 })
  }
}
