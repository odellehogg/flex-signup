// lib/email.js
// Email sending via Resend

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'FLEX <hello@flexlaundry.co.uk>'

// ============================================================================
// GENERIC EMAIL FUNCTION
// ============================================================================

export async function sendEmail({ to, subject, html, text }) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }

    return { success: true, id: data?.id }
  } catch (err) {
    console.error('Email exception:', err)
    return { success: false, error: err.message }
  }
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export async function sendWelcomeEmail(to, firstName, planName) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e3a5f; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #1e3a5f; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .step { display: flex; margin: 15px 0; }
        .step-number { background: #1e3a5f; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Welcome to FLEX! 🎉</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          <p>Thanks for joining FLEX! Your <strong>${planName}</strong> subscription is now active.</p>
          
          <h3>What's next?</h3>
          
          <div class="step">
            <div class="step-number">1</div>
            <div>
              <strong>Check WhatsApp</strong><br>
              We've sent you a welcome message with your bag number.
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">2</div>
            <div>
              <strong>Visit your gym</strong><br>
              Your FLEX bag is waiting at reception.
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">3</div>
            <div>
              <strong>Drop off after your workout</strong><br>
              Fill your bag, message us your bag number, and drop it off.
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">4</div>
            <div>
              <strong>Pick up in 48 hours</strong><br>
              We'll WhatsApp you when your fresh clothes are ready.
            </div>
          </div>
          
          <p style="margin-top: 30px;">
            <strong>Save our WhatsApp number:</strong><br>
            <a href="https://wa.me/447366907286" style="color: #1e3a5f; font-size: 18px;">+44 7530 659971</a>
          </p>
          
          <p>Questions? Just reply to this email or message us on WhatsApp.</p>
          
          <p>Let's get those gym clothes sorted! 💪</p>
          
          <p>The FLEX Team</p>
        </div>
        <div class="footer">
          <p>FLEX Active Group Ltd | <a href="https://flexlaundry.co.uk">flexlaundry.co.uk</a></p>
          <p>You're receiving this because you signed up for FLEX.</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Welcome to FLEX, ${firstName}! 🧺`,
      html,
    })

    if (error) throw error
    console.log(`✅ Welcome email sent to ${to}`)
    return data
  } catch (error) {
    console.error(`❌ Email failed:`, error)
    throw error
  }
}

export async function sendPaymentFailedEmail(to, firstName, invoiceUrl) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #1e3a5f; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Payment Issue ⚠️</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          <p>We couldn't process your latest FLEX payment. This can happen if your card expired or there were insufficient funds.</p>
          
          <p>Please update your payment method to keep your subscription active:</p>
          
          <p style="text-align: center;">
            <a href="${invoiceUrl}" class="button" style="color: white;">Update Payment Method</a>
          </p>
          
          <p>If you have any questions, just reply to this email or message us on WhatsApp.</p>
          
          <p>The FLEX Team</p>
        </div>
        <div class="footer">
          <p>FLEX Active Group Ltd | <a href="https://flexlaundry.co.uk">flexlaundry.co.uk</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Action needed: Update your FLEX payment`,
      html,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error(`❌ Email failed:`, error)
    throw error
  }
}

export async function sendDropConfirmationEmail(to, firstName, bagNumber, gymName, expectedDate) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e3a5f; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Drop Confirmed! ✓</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          <p>We've got your bag and it's on its way to be cleaned.</p>
          
          <div class="info-box">
            <p><strong>Bag Number:</strong> ${bagNumber}</p>
            <p><strong>Pickup Location:</strong> ${gymName}</p>
            <p><strong>Expected Ready:</strong> ${expectedDate}</p>
          </div>
          
          <p>We'll message you on WhatsApp when your clothes are ready for pickup.</p>
          
          <p>The FLEX Team</p>
        </div>
        <div class="footer">
          <p>FLEX Active Group Ltd | <a href="https://flexlaundry.co.uk">flexlaundry.co.uk</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Drop confirmed: Bag ${bagNumber}`,
      html,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error(`❌ Email failed:`, error)
    throw error
  }
}

export async function sendReadyForPickupEmail(to, firstName, bagNumber, gymName) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Your Clothes Are Ready! 🧺</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          <p>Great news! Your fresh clothes are waiting for you.</p>
          
          <div class="info-box">
            <p style="font-size: 24px; margin: 0;"><strong>${bagNumber}</strong></p>
            <p style="color: #666; margin: 5px 0 0 0;">at ${gymName} reception</p>
          </div>
          
          <p>Just give the reception team your bag number to collect.</p>
          
          <p>See you at the gym! 💪</p>
          
          <p>The FLEX Team</p>
        </div>
        <div class="footer">
          <p>FLEX Active Group Ltd | <a href="https://flexlaundry.co.uk">flexlaundry.co.uk</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Ready for pickup: Bag ${bagNumber} at ${gymName}`,
      html,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error(`❌ Email failed:`, error)
    throw error
  }
}

// NEW: Pickup confirmation request email (fallback for WhatsApp)
export async function sendPickupConfirmEmail(to, firstName, bagNumber, gymName) {
  const whatsappLink = `https://wa.me/447366907286?text=CONFIRM_PICKUP`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .button { display: inline-block; background: #25D366; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Have You Collected Your Bag?</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          <p>Your bag <strong>${bagNumber}</strong> has been ready at <strong>${gymName}</strong> for 24 hours.</p>
          
          <div class="info-box">
            <p>Please confirm you've collected it so you can make your next drop!</p>
            <a href="${whatsappLink}" class="button" style="color: white;">✓ Yes, I've Collected It</a>
          </div>
          
          <p>If you haven't collected yet, no worries - your bag will be waiting at reception.</p>
          
          <p>The FLEX Team</p>
        </div>
        <div class="footer">
          <p>FLEX Active Group Ltd | <a href="https://flexlaundry.co.uk">flexlaundry.co.uk</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Have you collected bag ${bagNumber}?`,
      html,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error(`❌ Email failed:`, error)
    throw error
  }
}

// NEW: Pickup reminder email (fallback for WhatsApp)
export async function sendPickupReminderEmail(to, firstName, bagNumber, gymName) {
  const whatsappLink = `https://wa.me/447366907286?text=CONFIRM_PICKUP`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #dc2626; }
        .button { display: inline-block; background: #25D366; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Reminder: Your Bag Is Waiting!</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          <p>Your bag <strong>${bagNumber}</strong> has been at <strong>${gymName}</strong> for 48 hours.</p>
          
          <div class="info-box">
            <p><strong>Please collect soon and confirm pickup to continue using FLEX.</strong></p>
            <a href="${whatsappLink}" class="button" style="color: white;">✓ Yes, I've Collected It</a>
          </div>
          
          <p>Having trouble? Reply to this email or message us on WhatsApp.</p>
          
          <p>The FLEX Team</p>
        </div>
        <div class="footer">
          <p>FLEX Active Group Ltd | <a href="https://flexlaundry.co.uk">flexlaundry.co.uk</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Reminder: Bag ${bagNumber} still waiting at ${gymName}`,
      html,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error(`❌ Email failed:`, error)
    throw error
  }
}

// ============================================================================
// PAYMENT RETRY EMAILS
// ============================================================================

export async function sendPaymentRetryDay3Email(to, firstName, updateUrl) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #1e3a5f; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Payment Reminder</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          <p>We tried to process your FLEX payment a few days ago but it didn't go through.</p>
          
          <p>This can happen if your card expired or if there weren't enough funds. No worries - just update your payment method and you'll be back on track:</p>
          
          <p style="text-align: center;">
            <a href="${updateUrl}" class="button" style="color: white;">Update Payment Method</a>
          </p>
          
          <p>If you need any help, just reply to this email.</p>
          
          <p>The FLEX Team</p>
        </div>
        <div class="footer">
          <p>FLEX Active Group Ltd | <a href="https://flexlaundry.co.uk">flexlaundry.co.uk</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Payment reminder - update your FLEX payment`,
      html,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error(`❌ Email failed:`, error)
    throw error
  }
}

export async function sendPaymentRetryDay7Email(to, firstName, updateUrl) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #1e3a5f; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
        .warning-box { background: #fef2f2; border: 1px solid #dc2626; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Final Payment Notice</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          
          <div class="warning-box">
            <strong>⚠️ Your FLEX subscription will be paused in 3 days</strong> if we can't process your payment.
          </div>
          
          <p>We've tried to charge your card but it's not going through. Please update your payment method to keep your FLEX subscription active:</p>
          
          <p style="text-align: center;">
            <a href="${updateUrl}" class="button" style="color: white;">Update Payment Now</a>
          </p>
          
          <p>If your subscription is paused, you won't be able to use FLEX until the payment is sorted. But don't worry - your drops won't expire and you can resume anytime.</p>
          
          <p>Need help? Just reply to this email.</p>
          
          <p>The FLEX Team</p>
        </div>
        <div class="footer">
          <p>FLEX Active Group Ltd | <a href="https://flexlaundry.co.uk">flexlaundry.co.uk</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Urgent: Your FLEX subscription will be paused soon`,
      html,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error(`❌ Email failed:`, error)
    throw error
  }
}

// ============================================================================
// OPS ALERT EMAILS
// ============================================================================

export async function sendStuckBagAlertEmail(to, bagNumber, gymName, status, hoursSince, memberName) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #dc2626; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">⚠️ Stuck Bag Alert</h1>
        </div>
        <div class="content">
          <div class="info-box">
            <p style="margin: 0;"><strong>Bag Number:</strong> ${bagNumber}</p>
            <p style="margin: 5px 0;"><strong>Current Status:</strong> ${status}</p>
            <p style="margin: 5px 0;"><strong>Time Stuck:</strong> ${hoursSince} hours</p>
            <p style="margin: 5px 0;"><strong>Gym:</strong> ${gymName}</p>
            <p style="margin: 5px 0 0;"><strong>Customer:</strong> ${memberName}</p>
          </div>
          
          <p>This bag has not progressed through the expected workflow. Please investigate and update the status.</p>
          
          <p>A ticket has been automatically created in the Issues table.</p>
        </div>
        <div class="footer">
          <p>FLEX Ops Alert System</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `🚨 Stuck Bag Alert: ${bagNumber} at ${gymName}`,
      html,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error(`❌ Alert email failed:`, error)
    throw error
  }
}
