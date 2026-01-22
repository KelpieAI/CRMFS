import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Email template for late payment warnings
const generateLatePaymentEmail = (
  memberName: string, 
  warningNumber: number, 
  daysOverdue: number, 
  lateFeeTotal: number, 
  totalAmountDue: number, 
  paymentUrl: string
) => {
  const isFinalWarning = warningNumber === 3
  const warningColor = warningNumber === 1 ? '#ff9800' : warningNumber === 2 ? '#ff5722' : '#d32f2f'
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; margin-bottom: 64px;">
    
    <!-- Header -->
    <div style="background-color: #2d5016; padding: 32px 24px; text-align: center;">
      <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0; line-height: 1.3;">
        Central Region Muslim Funeral Service
      </h1>
      <p style="color: #ffffff; font-size: 14px; margin: 8px 0 0; opacity: 0.9;">CRMFS</p>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px;">
      <!-- Warning Badge -->
      <div style="background-color: ${warningColor}; color: #fff; font-size: 14px; font-weight: 700; text-align: center; padding: 12px 24px; border-radius: 6px; margin: 0 0 24px; letter-spacing: 0.5px;">
        ${isFinalWarning ? '⚠️ FINAL WARNING' : `WARNING ${warningNumber} OF 3`}
      </div>
      
      <h2 style="font-size: 28px; font-weight: 700; color: #d32f2f; margin: 0 0 24px; line-height: 1.3;">
        ${isFinalWarning ? 'Final Notice: ' : ''}Payment Overdue
      </h2>

      <p style="font-size: 16px; color: #333; margin: 0 0 16px;">
        Assalamu Alaikum ${memberName},
      </p>

      <p style="font-size: 16px; line-height: 24px; color: #525f7f; margin: 16px 0;">
        ${isFinalWarning 
          ? `This is your <strong>final warning</strong>. Your CRMFS membership payment is now <strong>${daysOverdue} days overdue</strong>.`
          : `Your CRMFS membership payment is currently <strong>${daysOverdue} days overdue</strong>.`
        }
      </p>

      <!-- Amount Due Box -->
      <div style="background-color: #ffebee; border: 2px solid #d32f2f; border-radius: 8px; padding: 24px; text-align: center; margin: 32px 0;">
        <p style="font-size: 14px; color: #8898aa; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">Total Amount Due</p>
        <p style="font-size: 48px; font-weight: 700; color: #d32f2f; margin: 0; line-height: 1;">£${totalAmountDue.toFixed(2)}</p>
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #ffcdd2;">
          <p style="font-size: 14px; color: #525f7f; margin: 4px 0;">Annual Membership: £100.00</p>
          <p style="font-size: 14px; color: ${warningColor}; margin: 4px 0;">Late Fees (${warningNumber} ${warningNumber === 1 ? 'month' : 'months'}): £${lateFeeTotal.toFixed(2)}</p>
        </div>
      </div>

      ${isFinalWarning ? `
        <div style="background-color: #ffebee; border: 2px solid #d32f2f; border-radius: 6px; padding: 20px; margin: 24px 0;">
          <p style="font-size: 16px; line-height: 24px; color: #d32f2f; margin: 0;">
            <strong>⚠️ IMPORTANT:</strong> If payment is not received within the next few days, your membership will be automatically paused and your funeral coverage will be suspended.
          </p>
        </div>
      ` : `
        <p style="font-size: 16px; line-height: 24px; color: #525f7f; margin: 16px 0;">
          Late payment fees accumulate at £10 per month. Currently, you have been charged £${lateFeeTotal.toFixed(2)} in late fees.
        </p>
      `}

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${paymentUrl}" style="background-color: ${warningColor}; border-radius: 6px; color: #fff; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block; padding: 14px 32px;">
          ${isFinalWarning ? 'Pay Now to Avoid Suspension' : 'Make Payment Now'}
        </a>
      </div>

      <!-- Timeline Info Box -->
      <div style="background-color: #fff8e1; border: 1px solid #ffd54f; border-radius: 6px; padding: 16px; font-size: 14px; line-height: 20px; color: #333; margin: 24px 0;">
        <strong>Late Payment Timeline:</strong><br>
        • 30 days overdue: £10 late fee (Warning 1)${warningNumber === 1 ? ' ← <strong>You are here</strong>' : ''}<br>
        • 60 days overdue: £20 late fee total (Warning 2)${warningNumber === 2 ? ' ← <strong>You are here</strong>' : ''}<br>
        • 90 days overdue: £30 late fee total (Warning 3)${warningNumber === 3 ? ' ← <strong>You are here</strong>' : ''}<br>
        • After 90 days: Membership paused, coverage suspended
      </div>

      ${isFinalWarning ? `
        <div style="background-color: #e3f2fd; border: 1px solid #2196f3; border-radius: 6px; padding: 16px; margin: 24px 0;">
          <p style="font-size: 14px; line-height: 20px; color: #1976d2; margin: 0;">
            <strong>If your membership is paused:</strong><br>
            You'll need to pay a reactivation fee plus annual membership. However, all late fees (£30) will be waived as a one-time courtesy.
          </p>
        </div>
      ` : ''}

      <p style="font-size: 16px; line-height: 24px; color: #525f7f; margin: 16px 0;">
        <strong>Payment Options:</strong><br>
        • Online via our member portal<br>
        • Bank transfer (contact us for details)<br>
        • Cash or card in person at Falkirk Central Mosque
      </p>

      <p style="font-size: 16px; line-height: 24px; color: #525f7f; margin: 16px 0;">
        If you're experiencing financial difficulties, please contact us to discuss payment arrangements. We're here to help.
      </p>

      <p style="font-size: 16px; line-height: 24px; color: #525f7f; margin: 16px 0;">
        If you've already made your payment, please disregard this notice. Payments can take 2-3 business days to process.
      </p>

      <p style="font-size: 16px; color: #525f7f; margin: 32px 0 0; line-height: 24px;">
        JazakAllah Khair,<br>
        <strong>CRMFS Admin Team</strong><br>
        📞 Contact us: [Your phone number]<br>
        ✉️ Email: [Your email]
      </p>
    </div>

    <!-- Footer -->
    <hr style="border-color: #e6ebf1; margin: 20px 0;">
    <div style="padding: 0 24px; text-align: center;">
      <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin: 8px 0;">
        Central Region Muslim Funeral Service<br>
        Falkirk Central Mosque<br>
        Serving the community since 2023
      </p>
      <p style="color: #8898aa; font-size: 11px; margin: 16px 0 0;">
        © ${new Date().getFullYear()} CRMFS. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `
}

serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get members with late payments
    const { data: members, error } = await supabase.rpc('get_members_with_late_payments')

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    if (!members || members.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          emailsSent: 0,
          message: 'No members with late payments'
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${members.length} members with late payments`)

    let emailsSent = 0
    let errors: any[] = []

    // Send warning emails to each member
    for (const member of members) {
      try {
        const paymentUrl = `${SUPABASE_URL.replace('.supabase.co', '')}/payments`
        const totalAmountDue = 100 + member.late_fee_total

        // Generate email HTML
        const emailHtml = generateLatePaymentEmail(
          member.member_name,
          member.warning_number,
          member.days_overdue,
          member.late_fee_total,
          totalAmountDue,
          paymentUrl
        )

        // Send email via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: 'CRMFS <noreply@yourdomain.com>', // UPDATE THIS!
            to: member.email,
            subject: member.warning_number === 3
              ? '⚠️ FINAL WARNING: CRMFS Membership Will Be Paused'
              : `⚠️ Late Payment Warning ${member.warning_number} of 3 - CRMFS`,
            html: emailHtml
          })
        })

        const resendData = await resendResponse.json()

        if (!resendResponse.ok) {
          throw new Error(`Resend error: ${JSON.stringify(resendData)}`)
        }

        // Log the email in activity table
        await supabase
          .from('email_activity')
          .insert({
            member_id: member.member_id,
            email_type: 'late_payment_warning',
            email_subject: `Late Payment Warning ${member.warning_number}`,
            status: 'sent',
            resend_email_id: resendData.id,
            sequence_day: member.warning_number,
            metadata: {
              days_overdue: member.days_overdue,
              late_fee_total: member.late_fee_total,
              total_amount_due: totalAmountDue
            }
          })

        emailsSent++
        console.log(`✅ Sent warning ${member.warning_number} to ${member.email} (${member.days_overdue} days overdue)`)

      } catch (emailError: any) {
        console.error(`Failed to send email to ${member.email}:`, emailError)
        errors.push({ 
          member: member.email, 
          warning: member.warning_number,
          error: emailError.message 
        })

        // Log failed email
        await supabase
          .from('email_activity')
          .insert({
            member_id: member.member_id,
            email_type: 'late_payment_warning',
            email_subject: `Late Payment Warning ${member.warning_number}`,
            status: 'failed',
            sequence_day: member.warning_number,
            metadata: { error: emailError.message }
          })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
        message: `Sent ${emailsSent} late payment warning emails`
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
