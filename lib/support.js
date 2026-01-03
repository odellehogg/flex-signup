// lib/support.js
// FLEX Support Ticket System
// Creates tickets in Airtable, sends email notifications, handles photos

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`

const OPS_EMAIL = process.env.OPS_EMAIL || 'odellehogg@gmail.com'

// ============================================================================
// TICKET CREATION
// ============================================================================

/**
 * Create a support ticket in Airtable
 * @param {Object} params - Ticket parameters
 * @param {string} params.memberId - Airtable member record ID
 * @param {string} params.memberEmail - Member's email
 * @param {string} params.memberName - Member's first name
 * @param {string} params.memberPhone - Member's phone
 * @param {string} params.issueType - Type of issue (Damaged Item, Missing Item, etc.)
 * @param {string} params.description - Issue description from user
 * @param {string} [params.photoUrl] - Optional photo URL from Twilio
 * @param {string} [params.dropId] - Optional linked drop record ID
 * @returns {Object} Created ticket with ID
 */
export async function createSupportTicket({
  memberId,
  memberEmail,
  memberName,
  memberPhone,
  issueType,
  description,
  photoUrl = null,
  dropId = null,
}) {
  // Generate ticket ID (FLX-XXXXXX format)
  const ticketId = `FLX-${Date.now().toString(36).toUpperCase()}`
  
  // Build Airtable record
  const fields = {
    'Ticket ID': ticketId,
    'Type': issueType,
    'Description': description,
    'Status': 'Open',
    'Priority': getPriority(issueType),
    'Created At': new Date().toISOString(),
    'Source': 'WhatsApp',
  }
  
  // Link to member if provided
  if (memberId) {
    fields['Member'] = [memberId]
  }
  
  // Link to drop if provided
  if (dropId) {
    fields['Drop'] = [dropId]
  }
  
  // Add photo as attachment if provided
  if (photoUrl) {
    fields['Attachments'] = [{ url: photoUrl }]
  }

  try {
    const response = await fetch(`${AIRTABLE_URL}/Issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Airtable error: ${error}`)
    }

    const record = await response.json()
    console.log(`✅ Ticket created: ${ticketId}`)

    // Send email notification to ops
    await sendTicketNotificationEmail({
      ticketId,
      memberName,
      memberEmail,
      memberPhone,
      issueType,
      description,
      photoUrl,
    })

    // Send confirmation email to member
    if (memberEmail) {
      await sendTicketConfirmationEmail({
        ticketId,
        memberName,
        memberEmail,
        issueType,
        description,
      })
    }

    return {
      id: record.id,
      ticketId,
      fields: record.fields,
    }

  } catch (error) {
    console.error(`❌ Failed to create ticket:`, error.message)
    throw error
  }
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(ticketRecordId, status, notes = null) {
  const fields = {
    'Status': status,
    'Updated At': new Date().toISOString(),
  }
  
  if (notes) {
    fields['Internal Notes'] = notes
  }

  try {
    const response = await fetch(`${AIRTABLE_URL}/Issues/${ticketRecordId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Airtable error: ${error}`)
    }

    const record = await response.json()
    console.log(`✅ Ticket ${ticketRecordId} updated to ${status}`)
    return record

  } catch (error) {
    console.error(`❌ Failed to update ticket:`, error.message)
    throw error
  }
}

/**
 * Add photo to existing ticket
 */
export async function addPhotoToTicket(ticketRecordId, photoUrl) {
  try {
    // First get existing attachments
    const getResponse = await fetch(`${AIRTABLE_URL}/Issues/${ticketRecordId}`, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      },
    })
    
    const existing = await getResponse.json()
    const existingAttachments = existing.fields['Attachments'] || []
    
    // Add new photo
    const response = await fetch(`${AIRTABLE_URL}/Issues/${ticketRecordId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          'Attachments': [...existingAttachments, { url: photoUrl }],
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Airtable error: ${error}`)
    }

    console.log(`✅ Photo added to ticket ${ticketRecordId}`)
    return await response.json()

  } catch (error) {
    console.error(`❌ Failed to add photo:`, error.message)
    throw error
  }
}

// ============================================================================
// EMAIL NOTIFICATIONS
// ============================================================================

/**
 * Send ticket notification to ops team
 */
async function sendTicketNotificationEmail({
  ticketId,
  memberName,
  memberEmail,
  memberPhone,
  issueType,
  description,
  photoUrl,
}) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const photoSection = photoUrl 
    ? `<p><strong>Photo attached:</strong><br><img src="${photoUrl}" style="max-width: 400px; border-radius: 8px;" alt="Issue photo"></p>`
    : '<p><em>No photo provided</em></p>'

  try {
    await resend.emails.send({
      from: 'FLEX Support <support@flexlaundry.co.uk>',
      to: OPS_EMAIL,
      subject: `🎫 New Ticket: ${ticketId} - ${issueType}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a5f;">New Support Ticket</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p><strong>Ticket ID:</strong> ${ticketId}</p>
            <p><strong>Type:</strong> ${issueType}</p>
            <p><strong>Priority:</strong> ${getPriority(issueType)}</p>
          </div>
          
          <div style="background: #fff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Customer Details</h3>
            <p><strong>Name:</strong> ${memberName}</p>
            <p><strong>Email:</strong> <a href="mailto:${memberEmail}">${memberEmail}</a></p>
            <p><strong>Phone:</strong> ${memberPhone}</p>
          </div>
          
          <div style="background: #fff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Issue Description</h3>
            <p style="white-space: pre-wrap;">${description}</p>
            ${photoSection}
          </div>
          
          <div style="margin-top: 30px;">
            <a href="https://flexlaundry.co.uk/ops/tickets/${ticketId}" 
               style="background: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              View in Dashboard
            </a>
            <a href="mailto:${memberEmail}?subject=RE: FLEX Support Ticket ${ticketId}" 
               style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-left: 10px;">
              Reply to Customer
            </a>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            This ticket was created via WhatsApp. Reply directly to the customer email or use the Ops Dashboard.
          </p>
        </div>
      `,
    })
    
    console.log(`✅ Ops notification sent for ${ticketId}`)
    
  } catch (error) {
    console.error(`❌ Failed to send ops notification:`, error.message)
    // Don't throw - ticket is still created even if email fails
  }
}

/**
 * Send confirmation email to member
 */
async function sendTicketConfirmationEmail({
  ticketId,
  memberName,
  memberEmail,
  issueType,
  description,
}) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    await resend.emails.send({
      from: 'FLEX Support <support@flexlaundry.co.uk>',
      to: memberEmail,
      subject: `Your FLEX Support Ticket: ${ticketId}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #1e3a5f; margin: 0;">FLEX</h1>
            <p style="color: #6b7280; margin: 5px 0;">The Fitness Laundry Experts</p>
          </div>
          
          <h2 style="color: #1e3a5f;">Hi ${memberName}!</h2>
          
          <p>We've received your support request and created a ticket.</p>
          
          <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Reference:</strong> ${ticketId}</p>
            <p style="margin: 10px 0 0 0;"><strong>Issue Type:</strong> ${issueType}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Message:</h3>
            <p style="white-space: pre-wrap; margin-bottom: 0;">${description}</p>
          </div>
          
          <h3>What happens next?</h3>
          <ul style="color: #374151; line-height: 1.8;">
            <li>Our team will review your ticket within 24 hours</li>
            <li>We'll reply to this email with an update</li>
            <li>You'll also get a WhatsApp notification</li>
          </ul>
          
          <p>If you need to add more information, just reply to this email.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 14px;">
            Thanks for using FLEX! 💪<br>
            <a href="https://flexlaundry.co.uk" style="color: #1e3a5f;">flexlaundry.co.uk</a>
          </p>
        </div>
      `,
    })
    
    console.log(`✅ Confirmation email sent to ${memberEmail}`)
    
  } catch (error) {
    console.error(`❌ Failed to send confirmation email:`, error.message)
    // Don't throw - ticket is still created even if email fails
  }
}

/**
 * Send WhatsApp notification when ticket is updated (called from Ops Dashboard)
 */
export async function sendTicketUpdateNotification(memberId, ticketId, status) {
  // Import dynamically to avoid circular dependency
  const { sendPlainText } = await import('./whatsapp.js')
  const { getMemberById } = await import('./airtable.js')
  
  try {
    const member = await getMemberById(memberId)
    if (!member) return
    
    const phone = member.fields['Phone']
    if (!phone) return
    
    const statusMessages = {
      'In Progress': `Update on ticket #${ticketId}: We're looking into this now. Check your email for details.`,
      'Resolved': `Good news! 🎉 Ticket #${ticketId} has been resolved. Check your email for details.\n\nReply MENU for main menu.`,
      'Awaiting Info': `We need more info for ticket #${ticketId}. Please check your email and reply there.`,
    }
    
    const message = statusMessages[status]
    if (message) {
      await sendPlainText(phone, message)
      console.log(`✅ Ticket update notification sent for ${ticketId}`)
    }
    
  } catch (error) {
    console.error(`❌ Failed to send ticket update notification:`, error.message)
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function getPriority(issueType) {
  const priorities = {
    'Damaged Item': 'High',
    'Missing Item': 'High',
    'Billing Issue': 'Medium',
    'Other': 'Low',
    'Collection Issue': 'Medium',
  }
  return priorities[issueType] || 'Medium'
}

/**
 * Get open tickets for a member
 */
export async function getMemberOpenTickets(memberId) {
  try {
    const response = await fetch(
      `${AIRTABLE_URL}/Issues?filterByFormula=AND({Status}!='Resolved',{Status}!='Closed')&maxRecords=10`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    )
    
    const data = await response.json()
    const records = data.records || []
    
    // Filter by member (linked record)
    return records.filter(r => {
      const memberLinks = r.fields['Member'] || []
      return memberLinks.includes(memberId)
    })
    
  } catch (error) {
    console.error(`❌ getMemberOpenTickets error:`, error.message)
    return []
  }
}

export { getPriority }
