// app/api/ops/members/search/route.js
// Search for members by phone, email, name, or bag number

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

export async function GET(request) {
  // Verify auth
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('flex_ops_auth')
  if (!authCookie || authCookie.value !== process.env.OPS_AUTH_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 })
  }

  try {
    // Build filter formula - search across multiple fields
    const searchTerm = query.trim()
    
    // Check if it's a phone number (starts with + or digits)
    const isPhone = /^[\+\d]/.test(searchTerm)
    
    // Check if it's a bag number (starts with B)
    const isBagNumber = /^B\d+$/i.test(searchTerm)
    
    // Check if it's an email
    const isEmail = searchTerm.includes('@')

    let filterFormula
    if (isBagNumber) {
      filterFormula = `{Bag Number} = '${searchTerm.toUpperCase()}'`
    } else if (isPhone) {
      const normalized = searchTerm.replace(/[^\d]/g, '')
      filterFormula = `OR(
        FIND('${normalized}', SUBSTITUTE({Phone}, '+', '')),
        FIND('${normalized}', {Phone})
      )`
    } else if (isEmail) {
      filterFormula = `LOWER({Email}) = '${searchTerm.toLowerCase()}'`
    } else {
      // Name search
      filterFormula = `OR(
        FIND(LOWER('${searchTerm}'), LOWER({First Name})),
        FIND(LOWER('${searchTerm}'), LOWER({Last Name})),
        FIND(LOWER('${searchTerm}'), LOWER({Email}))
      )`
    }

    // Search members
    const membersUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Members?filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=1`
    const membersRes = await fetch(membersUrl, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    })
    const membersData = await membersRes.json()

    if (!membersData.records || membersData.records.length === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const member = membersData.records[0]
    const memberId = member.id
    const fields = member.fields

    // Get recent drops for this member
    const dropsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Drops?filterByFormula=${encodeURIComponent(`FIND('${memberId}', ARRAYJOIN({Member}))`)}&sort%5B0%5D%5Bfield%5D=Drop%20Date&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=5`
    const dropsRes = await fetch(dropsUrl, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    })
    const dropsData = await dropsRes.json()

    const recentDrops = (dropsData.records || []).map(drop => ({
      bagNumber: drop.fields['Bag Number'],
      status: drop.fields['Status'],
      date: drop.fields['Drop Date'],
    }))

    // Calculate drops used this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const dropsThisMonth = (dropsData.records || []).filter(drop => {
      const dropDate = new Date(drop.fields['Drop Date'])
      return dropDate >= startOfMonth
    }).length

    // Get drops allowed based on plan
    const plan = fields['Subscription Tier'] || 'Essential'
    const dropsAllowed = plan === 'Unlimited' ? 16 : 10

    return NextResponse.json({
      member: {
        id: memberId,
        firstName: fields['First Name'],
        lastName: fields['Last Name'],
        email: fields['Email'],
        phone: fields['Phone'],
        gym: fields['Gym'],
        bagNumber: fields['Bag Number'],
        plan: fields['Subscription Tier'],
        status: fields['Status'],
        createdAt: fields['Created'],
        nextBilling: fields['Next Billing Date'],
        dropsUsed: dropsThisMonth,
        dropsAllowed,
        recentDrops,
      }
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
