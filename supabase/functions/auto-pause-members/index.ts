import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

serve(async (req) => {
  try {
    // Initialize Supabase client with service role (needed to update member status)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Find members who are 90+ days overdue and still active
    const { data: members, error: fetchError } = await supabase
      .from('members')
      .select('id, first_name, last_name, email, next_renewal_date')
      .eq('status', 'active')
      .lte('next_renewal_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    if (fetchError) {
      throw new Error(`Database error: ${fetchError.message}`)
    }

    if (!members || members.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          membersPaused: 0,
          message: 'No members need to be paused'
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${members.length} members to pause`)

    let membersPaused = 0
    const errors: any[] = []

    // Pause each member
    for (const member of members) {
      try {
        const daysOverdue = Math.floor(
          (Date.now() - new Date(member.next_renewal_date).getTime()) / (1000 * 60 * 60 * 24)
        )

        // Update member status to paused
        const { error: updateError } = await supabase
          .from('members')
          .update({
            status: 'paused',
            paused_reason: `Automatically paused after ${daysOverdue} days of non-payment`,
            paused_date: new Date().toISOString()
          })
          .eq('id', member.id)

        if (updateError) {
          throw new Error(`Failed to pause member: ${updateError.message}`)
        }

        // Log the activity
        await supabase
          .from('activity_log')
          .insert({
            member_id: member.id,
            description: `Membership automatically paused after ${daysOverdue} days overdue`,
            metadata: {
              old_status: 'active',
              new_status: 'paused',
              days_overdue: daysOverdue,
              automated: true
            }
          })

        // Send membership paused email
        try {
          const emailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Membership Paused</title>
              </head>
              <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                          <td style="background-color: #2d5016; padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Central Region Muslim Funeral Service</h1>
                            <p style="color: #D4AF37; margin: 5px 0 0 0; font-size: 14px;">CRMFS</p>
                          </td>
                        </tr>
                        
                        <!-- Paused Badge -->
                        <tr>
                          <td style="padding: 30px; text-align: center;">
                            <div style="background-color: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                              ⚠️ MEMBERSHIP PAUSED
                            </div>
                          </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                          <td style="padding: 0 40px 30px 40px;">
                            <h2 style="color: #2d5016; margin: 0 0 20px 0; font-size: 22px;">Assalamu Alaikum ${member.first_name} ${member.last_name},</h2>
                            
                            <p style="color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                              Your CRMFS membership has been automatically paused due to non-payment of your annual membership fee.
                            </p>
                            
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                              <p style="color: #856404; margin: 0; font-weight: 600;">Your coverage is now suspended</p>
                              <p style="color: #856404; margin: 10px 0 0 0; font-size: 14px;">While your membership is paused, you are not covered by CRMFS funeral services.</p>
                            </div>
                            
                            <h3 style="color: #2d5016; margin: 30px 0 15px 0; font-size: 18px;">Reactivation Information</h3>
                            
                            <p style="color: #333333; line-height: 1.6; margin: 0 0 15px 0;">
                              To reactivate your membership, you will need to pay:
                            </p>
                            
                            <ul style="color: #333333; line-height: 1.8; margin: 0 0 20px 0;">
                              <li>Joining fee (age-based: £75-£500)</li>
                              <li>Annual membership fee: £100</li>
                            </ul>
                            
                            <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
                              <p style="color: #155724; margin: 0; font-weight: 600;">Good news!</p>
                              <p style="color: #155724; margin: 10px 0 0 0; font-size: 14px;">All late payment fees (£30) will be waived when you reactivate your membership.</p>
                            </div>
                            
                            <p style="color: #333333; line-height: 1.6; margin: 20px 0;">
                              Please contact the committee to arrange reactivation of your membership.
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                              <a href="mailto:info@crmfs.org" style="background-color: #2d5016; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Contact Committee</a>
                            </div>
                          </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                          <td style="background-color: #f8f9fa; padding: 20px 40px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="color: #6c757d; margin: 0 0 10px 0; font-size: 14px;">Central Region Muslim Funeral Service</p>
                            <p style="color: #6c757d; margin: 0 0 10px 0; font-size: 14px;">Falkirk Central Mosque</p>
                            <p style="color: #6c757d; margin: 0; font-size: 12px;">Serving the community since 2023</p>
                            <p style="color: #adb5bd; margin: 15px 0 0 0; font-size: 11px;">© ${new Date().getFullYear()} CRMFS. All rights reserved.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
          `

          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'CRMFS <crmfs@kelpieai.co.uk>',
              to: [member.email],
              subject: 'CRMFS Membership Paused - Action Required',
              html: emailHtml
            })
          })

          if (resendResponse.ok) {
            const emailData = await resendResponse.json()
            
            // Log email to activity
            await supabase
              .from('email_activity')
              .insert({
                member_id: member.id,
                email_type: 'membership_paused',
                email_subject: 'CRMFS Membership Paused - Action Required',
                status: 'sent',
                resend_email_id: emailData.id,
                metadata: {
                  days_overdue: daysOverdue,
                  automated: true
                }
              })

            console.log(`📧 Sent paused notification to ${member.email}`)
          } else {
            const errorText = await resendResponse.text()
            console.error(`Failed to send email to ${member.email}:`, errorText)
          }
        } catch (emailError: any) {
          console.error(`Email error for ${member.email}:`, emailError.message)
          // Don't fail the whole operation if email fails
        }

        membersPaused++
        console.log(`✅ Paused member: ${member.first_name} ${member.last_name} (${daysOverdue} days overdue)`)

      } catch (memberError: any) {
        console.error(`Failed to pause member ${member.id}:`, memberError)
        errors.push({
          member_id: member.id,
          member_email: member.email,
          error: memberError.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        membersPaused,
        totalChecked: members.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Paused ${membersPaused} members automatically`
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