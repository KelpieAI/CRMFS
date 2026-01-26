import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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
            action: 'status_change',
            description: `Membership automatically paused after ${daysOverdue} days overdue`,
            metadata: {
              old_status: 'active',
              new_status: 'paused',
              days_overdue: daysOverdue,
              automated: true
            }
          })

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