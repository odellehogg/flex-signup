// lib/email.js
// ============================================================================
// EMAIL FUNCTIONS USING RESEND
// MVP VERSION - Includes support ticket email with reply-to
// ============================================================================

import { COMPANY } from './constants.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = `FLEX <hello@flexlaundry.co.uk>`;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@flexlaundry.co.uk';

// ============================================================================
// CORE SEND FUNCTION
// ============================================================================

async function sendEmail({ to, subject, html, text, replyTo = null }) {
  try {
    const payload = {
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    };

    // Add reply-to if specified
    if (replyTo) {
      payload.reply_to = replyTo;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
      throw new Error(result.message || 'Failed to send email');
    }

    console.log(`Email sent to ${to}: ${result.id}`);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// ============================================================================
// CUSTOMER EMAILS
// ============================================================================

export async function sendWelcomeEmail({ to, firstName, planName, gymName }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to FLEX! 🎉</h1>
        </div>
        <div class="content">
          <p>Hey ${firstName},</p>
          <p>Thanks for joining FLEX! Your <strong>${planName}</strong> plan is now active.</p>
          
          <div class="highlight">
            <h3>Your Details</h3>
            <p>📍 <strong>Gym:</strong> ${gymName}</p>
            <p>📱 <strong>WhatsApp:</strong> ${COMPANY.phoneFormatted}</p>
            <p>💬 <strong>Text us anytime</strong> to start a drop or track your order</p>
          </div>

          <h3>How it works:</h3>
          <ol>
            <li>Drop your sweaty gym clothes in a FLEX bag at ${gymName}</li>
            <li>We collect and clean with activewear-safe products</li>
            <li>Pick up fresh clothes within 48 hours</li>
          </ol>

          <p>Ready to make your first drop? Just text <strong>DROP</strong> to ${COMPANY.phoneFormatted}!</p>

          <p style="text-align: center; margin-top: 30px;">
            <a href="${COMPANY.website}/portal" class="button">View Your Account</a>
          </p>
        </div>
        <div class="footer">
          <p>${COMPANY.name} | ${COMPANY.tagline}</p>
          <p>Questions? Reply to this email or text us on WhatsApp</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to FLEX, ${firstName}!

Your ${planName} plan is now active at ${gymName}.

How it works:
1. Drop your sweaty gym clothes in a FLEX bag at reception
2. We collect and clean with activewear-safe products
3. Pick up fresh clothes within 48 hours

Ready to start? Text DROP to ${COMPANY.phoneFormatted}

Questions? Reply to this email or text us on WhatsApp.

${COMPANY.name} | ${COMPANY.tagline}
  `;

  return sendEmail({
    to,
    subject: `Welcome to FLEX, ${firstName}! 🎉`,
    html,
    text,
  });
}

export async function sendReadyForPickupEmail({ to, firstName, bagNumber, gymName }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .bag-number { font-size: 32px; font-weight: bold; color: #667eea; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Clothes Are Ready! ✨</h1>
        </div>
        <div class="content">
          <p>Hey ${firstName},</p>
          <p>Great news - your FLEX bag is ready for pickup!</p>
          
          <div class="highlight">
            <p>Bag Number</p>
            <p class="bag-number">${bagNumber}</p>
            <p>📍 Pick up at: <strong>${gymName}</strong> reception</p>
          </div>

          <p>Just ask for your FLEX bag at reception. Easy!</p>
          
          <p>See you at the gym! 💪</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Your FLEX bag ${bagNumber} is ready! ✨`,
    html,
    text: `Hey ${firstName}, your FLEX bag ${bagNumber} is ready for pickup at ${gymName} reception!`,
  });
}

export async function sendVerificationEmail({ to, firstName, code }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .code-box { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Phone Number</h1>
        </div>
        <div class="content">
          <p>Hey ${firstName},</p>
          <p>Your verification code is:</p>
          
          <div class="code-box">
            <p class="code">${code}</p>
          </div>

          <div class="warning">
            <strong>⏱️ This code expires in 10 minutes</strong><br>
            Don't share this code with anyone.
          </div>

          <p>Didn't request this? You can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Your FLEX verification code: ${code}`,
    html,
    text: `Hey ${firstName}, your FLEX verification code is: ${code}\n\nThis code expires in 10 minutes.`,
  });
}

export async function sendMagicLinkEmail({ to, firstName, loginUrl }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 18px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Login Link</h1>
        </div>
        <div class="content">
          <p>Hey ${firstName},</p>
          <p>Click below to access your FLEX account:</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" class="button">Log In to FLEX</a>
          </p>

          <div class="warning">
            <strong>⏱️ This link expires in 15 minutes</strong><br>
            Don't share this link - it's your personal access.
          </div>

          <p>Didn't request this? You can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Your FLEX Login Link',
    html,
    text: `Hey ${firstName}, here's your login link: ${loginUrl}\n\nThis link expires in 15 minutes.`,
  });
}

// ============================================================================
// SUPPORT TICKET EMAIL (NEW)
// This email goes to support inbox with reply-to set to customer
// ============================================================================

export async function sendSupportTicketEmail({ 
  to, 
  replyTo, 
  memberName, 
  memberEmail, 
  memberPhone,
  ticketId, 
  description, 
  hasPhoto = false 
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert { background: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; }
        .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .message { background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px 0; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; width: 100px; color: #666; }
        .footer { color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="alert">
          <h2 style="margin: 0;">🎫 Support Ticket #${ticketId}</h2>
        </div>
        
        <div class="details">
          <table>
            <tr><td class="label">From:</td><td><strong>${memberName}</strong></td></tr>
            <tr><td class="label">Email:</td><td><a href="mailto:${memberEmail}">${memberEmail}</a></td></tr>
            <tr><td class="label">Phone:</td><td>${memberPhone}</td></tr>
            ${hasPhoto ? '<tr><td class="label">Photo:</td><td>📎 Attached via WhatsApp</td></tr>' : ''}
          </table>
        </div>

        <h3>Message:</h3>
        <div class="message">
          ${description.replace(/\n/g, '<br>')}
        </div>

        <div class="footer">
          <p><strong>Reply directly to this email</strong> to respond to ${memberName}.</p>
          <p>Your reply will be sent to: ${memberEmail}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Support Ticket #${ticketId}
═══════════════════════════

From: ${memberName}
Email: ${memberEmail}
Phone: ${memberPhone}
${hasPhoto ? 'Photo: Attached via WhatsApp\n' : ''}

Message:
─────────────────────────
${description}
─────────────────────────

Reply directly to this email to respond to ${memberName}.
  `;

  return sendEmail({
    to,
    replyTo: replyTo || memberEmail, // When you reply, it goes to the customer
    subject: `🎫 FLEX Support #${ticketId} from ${memberName}`,
    html,
    text,
  });
}

// ============================================================================
// OPS NOTIFICATION EMAILS
// ============================================================================

export async function sendOpsNewMemberEmail({ firstName, lastName, email, phone, plan, gymName }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; width: 120px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success">
          <h2>🎉 New FLEX Member!</h2>
        </div>
        <table>
          <tr><td class="label">Name:</td><td>${firstName} ${lastName || ''}</td></tr>
          <tr><td class="label">Email:</td><td>${email}</td></tr>
          <tr><td class="label">Phone:</td><td>${phone}</td></tr>
          <tr><td class="label">Plan:</td><td>${plan}</td></tr>
          <tr><td class="label">Gym:</td><td>${gymName}</td></tr>
        </table>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: SUPPORT_EMAIL,
    subject: `🎉 New FLEX Member: ${firstName}`,
    html,
    text: `New member signup!\nName: ${firstName} ${lastName || ''}\nEmail: ${email}\nPlan: ${plan}\nGym: ${gymName}`,
  });
}

// Alias for ops ticket notification
export async function sendOpsNewTicketEmail(ticketData) {
  return sendSupportTicketEmail({
    to: SUPPORT_EMAIL,
    replyTo: ticketData.memberEmail,
    memberName: ticketData.memberName,
    memberEmail: ticketData.memberEmail,
    memberPhone: ticketData.memberPhone,
    ticketId: ticketData.ticketId || 'NEW',
    description: ticketData.description,
    hasPhoto: ticketData.hasPhoto || false,
  });
}

// Pause confirmation email
export async function sendPauseConfirmationEmail({ to, firstName, resumeDate }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Subscription Paused ⏸️</h1>
        </div>
        <div class="content">
          <p>Hey ${firstName},</p>
          <p>Your FLEX subscription has been paused.</p>
          <p>It will automatically resume on <strong>${resumeDate}</strong>.</p>
          <p>Want to resume early? Log into your portal at ${COMPANY.website}/portal</p>
          <p>See you soon! 💪</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Your FLEX subscription is paused',
    html,
    text: `Hey ${firstName}, your FLEX subscription has been paused. It will resume on ${resumeDate}.`,
  });
}

// Cancellation email
export async function sendCancellationEmail({ to, firstName }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6b7280; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>We're sorry to see you go 😢</h1>
        </div>
        <div class="content">
          <p>Hey ${firstName},</p>
          <p>Your FLEX subscription has been cancelled.</p>
          <p>You'll continue to have access until the end of your current billing period.</p>
          <p>Changed your mind? You can resubscribe anytime:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${COMPANY.website}/pricing" class="button">View Plans</a>
          </p>
          <p>Thanks for being a FLEX member. We hope to see you again!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Your FLEX subscription has been cancelled',
    html,
    text: `Hey ${firstName}, your FLEX subscription has been cancelled. You can resubscribe anytime at ${COMPANY.website}/pricing`,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export { sendEmail };

export default {
  sendEmail,
  sendWelcomeEmail,
  sendReadyForPickupEmail,
  sendVerificationEmail,
  sendMagicLinkEmail,
  sendSupportTicketEmail,
  sendOpsNewMemberEmail,
  sendOpsNewTicketEmail,
  sendPauseConfirmationEmail,
  sendCancellationEmail,
};
