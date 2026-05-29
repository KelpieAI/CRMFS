import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Email template for renewal reminders
const generateRenewalEmail = (memberName: string, renewalDate: string, daysUntilRenewal: number, amountDue: number, paymentUrl: string, unsubscribeUrl: string) => {
  const urgencyLevel = daysUntilRenewal <= 7 ? 'urgent' : daysUntilRenewal <= 14 ? 'soon' : 'upcoming'
  const urgencyColor = urgencyLevel === 'urgent' ? '#d32f2f' : urgencyLevel === 'soon' ? '#ff9800' : '#2d5016'
  
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
      ${urgencyLevel === 'urgent' ? '<div style="background-color: ' + urgencyColor + '; color: #fff; font-size: 14px; font-weight: 700; text-align: center; padding: 12px 24px; border-radius: 6px; margin: 0 0 24px; letter-spacing: 0.5px;">🔔 URGENT REMINDER</div>' : ''}
      
      <h2 style="font-size: 28px; font-weight: 700; color: #2d5016; margin: 0 0 24px; line-height: 1.3;">
        Membership Renewal Reminder
      </h2>

      <p style="font-size: 16px; color: #333; margin: 0 0 16px;">
        Assalamu Alaikum ${memberName},
      </p>

      <p style="font-size: 16px; line-height: 24px; color: #525f7f; margin: 16px 0;">
        ${urgencyLevel === 'urgent' 
          ? `This is an important reminder that your CRMFS membership renews in just ${daysUntilRenewal} days on ${renewalDate}.`
          : urgencyLevel === 'soon'
          ? `Your CRMFS membership will renew soon on ${renewalDate} (in ${daysUntilRenewal} days).`
          : `This is a friendly reminder that your CRMFS membership will renew on ${renewalDate}.`
        }
      </p>

      <!-- Amount Due Box -->
      <div style="background-color: #f8faf9; border: 2px solid #2d5016; border-radius: 8px; padding: 24px; text-align: center; margin: 32px 0;">
        <p style="font-size: 14px; color: #8898aa; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">Amount Due</p>
        <p style="font-size: 48px; font-weight: 700; color: #2d5016; margin: 0; line-height: 1;">£${amountDue.toFixed(2)}</p>
        <p style="font-size: 14px; color: #8898aa; margin: 8px 0 0;">Annual Membership Fee</p>
      </div>

      <p style="font-size: 16px; line-height: 24px; color: #525f7f; margin: 16px 0;">
        To continue your coverage and avoid any late payment fees, please make your payment before ${renewalDate}.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${paymentUrl}" style="background-color: #2d5016; border-radius: 6px; color: #fff; font-size: 16px; font-weight: 600; text-decoration: none; display: inline-block; padding: 14px 32px;">
          Make Payment Now
        </a>
      </div>

      <!-- Info Box -->
      <div style="background-color: #fff8e1; border: 1px solid #ffd54f; border-radius: 6px; padding: 16px; font-size: 14px; line-height: 20px; color: #333; margin: 24px 0;">
        <strong>Important Information:</strong><br>
        • Payments are due by ${renewalDate}<br>
        • Late payments incur a £10 monthly fee (max £30)<br>
        • Memberships are paused after 90 days of non-payment<br>
        • You can pay in person, online, or via bank transfer
      </div>

      <p style="font-size: 16px; line-height: 24px; color: #525f7f; margin: 16px 0;">
        If you've already made your payment, please disregard this reminder. Payments can take 2-3 business days to process.
      </p>

      <p style="font-size: 16px; color: #525f7f; margin: 32px 0 0; line-height: 24px;">
        JazakAllah Khair,<br>
        <strong>CRMFS Admin Team</strong>
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
      <p style="color: #8898aa; font-size: 12px; margin: 8px 0;">
        <a href="${unsubscribeUrl}" style="color: #556cd6; text-decoration: underline;">Unsubscribe from renewal reminders</a>
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

    // Get members needing renewal reminders for different day ranges
    const daysToCheck = [30, 14, 7, 0] // 30 days, 14 days, 7 days, and overdue
    let emailsSent = 0
    let errors: any[] = []

    for (const days of daysToCheck) {
      // Call the database function to get members needing reminders
      const { data: members, error } = await supabase.rpc('get_members_needing_renewal_reminders', {
        days_before: days
      })

      if (error) {
        console.error(`Error fetching members for ${days} days:`, error)
        errors.push({ days, error: error.message })
        continue
      }

      if (!members || members.length === 0) {
        console.log(`No members need reminders for ${days} days`)
        continue
      }

      console.log(`Found ${members.length} members needing ${days}-day reminders`)

      // Send emails to each member
      for (const member of members) {
        try {
          // Generate unsubscribe token
          const { data: tokenData } = await supabase
            .from('unsubscribe_tokens')
            .insert({
              member_id: member.member_id,
              token: crypto.randomUUID(),
              email_type: 'renewal_reminder'
            })
            .select()
            .single()

          const unsubscribeUrl = `${SUPABASE_URL}/functions/v1/unsubscribe?token=${tokenData?.token}`
          const paymentUrl = `${SUPABASE_URL.replace('.supabase.co', '')}/payments`

          // Generate email HTML
          const emailHtml = generateRenewalEmail(
            member.member_name,
            member.renewal_date,
            member.days_until_renewal,
            member.amount_due,
            paymentUrl,
            unsubscribeUrl
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
              subject: days === 0 
                ? '⚠️ CRMFS Membership Overdue'
                : days <= 7
                ? `🔔 URGENT: Membership renews in ${days} days`
                : `CRMFS Membership Renewal - ${days} days`,
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
              email_type: 'renewal_reminder',
              email_subject: days === 0 ? 'Membership Overdue' : `Renewal Reminder - ${days} days`,
              status: 'sent',
              resend_email_id: resendData.id,
              sequence_day: days,
              metadata: {
                renewal_date: member.renewal_date,
                amount_due: member.amount_due,
                days_until_renewal: member.days_until_renewal
              }
            })

          emailsSent++
          console.log(`✅ Sent renewal reminder to ${member.email} (${days} days)`)

        } catch (emailError: any) {
          console.error(`Failed to send email to ${member.email}:`, emailError)
          errors.push({ 
            member: member.email, 
            days, 
            error: emailError.message 
          })

          // Log failed email
          await supabase
            .from('email_activity')
            .insert({
              member_id: member.member_id,
              email_type: 'renewal_reminder',
              email_subject: `Renewal Reminder - ${days} days`,
              status: 'failed',
              sequence_day: days,
              metadata: { error: emailError.message }
            })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
        message: `Sent ${emailsSent} renewal reminder emails`
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
