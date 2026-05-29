import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL')!;

interface RequestBody {
  memberId: string;
  emailType: string;
  customSubject?: string;
  customMessage?: string;
}

const generateEmailContent = (
  member: any,
  emailType: string,
  customMessage?: string,
  jointMember?: any,
  children?: any[]
): { subject: string; html: string } => {
  const memberName = `${member.first_name} ${member.last_name}`;

  const header = `
    <div style="background-color: #2d5016; padding: 32px 24px; text-align: center;">
      <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0; line-height: 1.3;">
        Central Region Muslim Funeral Service
      </h1>
      <p style="color: #ffffff; font-size: 14px; margin: 8px 0 0; opacity: 0.9;">CRMFS</p>
    </div>
  `;

  const footer = `
    <hr style="border-color: #e6ebf1; margin: 20px 0;">
    <div style="padding: 0 24px; text-align: center;">
      <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin: 8px 0;">
        Central Region Muslim Funeral Service<br>
        Falkirk Central Mosque<br>
        Serving the community since 2023
      </p>
      <p style="color: #8898aa; font-size: 12px; margin: 12px 0 0;">
        Questions? Contact the committee at <a href="mailto:crmfs@kelpieai.co.uk" style="color: #2d5016;">crmfs@kelpieai.co.uk</a>
      </p>
      <p style="color: #8898aa; font-size: 11px; margin: 16px 0 0;">
        © ${new Date().getFullYear()} CRMFS. All rights reserved.
      </p>
    </div>
  `;

  const customMessageBlock = customMessage ? `
    <div style="background-color: #f8faf9; border-left: 4px solid #D4AF37; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="font-size: 14px; line-height: 22px; color: #525f7f; margin: 0;">
        ${customMessage.replace(/\n/g, '<br>')}
      </p>
    </div>
  ` : '';

  if (emailType === 'renewal_reminder') {
    const renewalDate = new Date(member.next_renewal_date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return {
      subject: 'CRMFS Membership Renewal Reminder',
      html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; margin-bottom: 64px;">
    ${header}
    <div style="padding: 32px 24px;">
      <h2 style="font-size: 28px; font-weight: 700; color: #2d5016; margin: 0 0 24px; line-height: 1.3;">
        Membership Renewal Reminder
      </h2>
      <p style="font-size: 16px; color: #333; margin: 0 0 16px;">
        Assalamu Alaikum ${memberName},
      </p>
      <p style="font-size: 16px; line-height: 24px; color: #525f7f; margin: 16px 0;">
        This is a reminder that your CRMFS membership renewal is due on ${renewalDate}.
      </p>
      ${customMessageBlock}
      <p style="font-size: 16px; color: #525f7f; margin: 32px 0 0; line-height: 24px;">
        JazakAllah Khair,<br>
        <strong>CRMFS Admin Team</strong>
      </p>
    </div>
    ${footer}
  </div>
</body>
</html>
      `
    };
  }

  if (emailType === 'late_payment_warning') {
    return {
      subject: 'CRMFS Payment Overdue Notice',
      html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; margin-bottom: 64px;">
    ${header}
    <div style="padding: 32px 24px;">
      <div style="background-color: #ff9800; color: #fff; font-size: 14px; font-weight: 700; text-align: center; padding: 12px 24px; border-radius: 6px; margin: 0 0 24px; letter-spacing: 0.5px;">
        ⚠️ PAYMENT OVERDUE
      </div>
      <h2 style="font-size: 28px; font-weight: 700; color: #d32f2f; margin: 0 0 24px; line-height: 1.3;">
        Payment Overdue Notice
      </h2>
      <p style="font-size: 16px; color: #333; margin: 0 0 16px;">
        Assalamu Alaikum ${memberName},
      </p>
      <p style="font-size: 16px; line-height: 24px; color: #525f7f; margin: 16px 0;">
        We notice that your CRMFS membership payment is currently overdue. Please make your payment as soon as possible to avoid late fees and maintain your coverage.
      </p>
      ${customMessageBlock}
      <p style="font-size: 16px; color: #525f7f; margin: 32px 0 0; line-height: 24px;">
        JazakAllah Khair,<br>
        <strong>CRMFS Admin Team</strong>
      </p>
    </div>
    ${footer}
  </div>
</body>
</html>
      `
    };
  }

  if (emailType === 'membership_paused') {
    return {
      subject: 'CRMFS Membership Status Update',
      html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; margin-bottom: 64px;">
    ${header}
    <div style="padding: 32px 24px;">
      <h2 style="font-size: 28px; font-weight: 700; color: #d32f2f; margin: 0 0 24px; line-height: 1.3;">
        Membership Paused
      </h2>
      <p style="font-size: 16px; color: #333; margin: 0 0 16px;">
        Assalamu Alaikum ${memberName},
      </p>
      <p style="font-size: 16px; line-height: 24px; color: #525f7f; margin: 16px 0;">
        Your CRMFS membership has been paused. Please contact us to reactivate your membership and restore your coverage.
      </p>
      ${customMessageBlock}
      <p style="font-size: 16px; color: #525f7f; margin: 32px 0 0; line-height: 24px;">
        JazakAllah Khair,<br>
        <strong>CRMFS Admin Team</strong>
      </p>
    </div>
    ${footer}
  </div>
</body>
</html>
      `
    };
  }

  if (emailType === 'payment_confirmation') {
    return {
      subject: 'CRMFS Payment Confirmation',
      html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; margin-bottom: 64px;">
    ${header}
    <div style="padding: 32px 24px;">
      <div style="background-color: #2d5016; color: #fff; font-size: 14px; font-weight: 700; text-align: center; padding: 12px 24px; border-radius: 6px; margin: 0 0 24px; letter-spacing: 0.5px;">
        ✅ PAYMENT RECEIVED
      </div>
      <h2 style="font-size: 28px; font-weight: 700; color: #2d5016; margin: 0 0 24px; line-height: 1.3;">
        Payment Confirmation
      </h2>
      <p style="font-size: 16px; color: #333; margin: 0 0 16px;">
        Assalamu Alaikum ${memberName},
      </p>
      <p style="font-size: 16px; line-height: 24px; color: #525f7f; margin: 16px 0;">
        Thank you! We have received your payment. Your CRMFS membership is now up to date.
      </p>
      ${customMessageBlock}
      <p style="font-size: 16px; color: #525f7f; margin: 32px 0 0; line-height: 24px;">
        JazakAllah Khair,<br>
        <strong>CRMFS Admin Team</strong>
      </p>
    </div>
    ${footer}
  </div>
</body>
</html>
      `
    };
  }

  if (emailType === 'membership_activation') {
    return {
      subject: 'Welcome to CRMFS',
      html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; margin-bottom: 64px;">
    ${header}
    <div style="padding: 32px 24px;">
      <div style="background-color: #2d5016; color: #fff; font-size: 14px; font-weight: 700; text-align: center; padding: 12px 24px; border-radius: 6px; margin: 0 0 24px; letter-spacing: 0.5px;">
        🎉 MEMBERSHIP ACTIVATED
      </div>
      <h2 style="font-size: 28px; font-weight: 700; color: #2d5016; margin: 0 0 24px; line-height: 1.3;">
        Welcome to CRMFS
      </h2>
      <p style="font-size: 16px; color: #333; margin: 0 0 16px;">
        Assalamu Alaikum ${memberName},
      </p>
      <p style="font-size: 16px; line-height: 24px; color: #525f7f; margin: 16px 0;">
        Welcome to the Central Region Muslim Funeral Service! Your membership has been activated and your coverage is now in effect.
      </p>
      ${customMessageBlock}
      <p style="font-size: 16px; color: #525f7f; margin: 32px 0 0; line-height: 24px;">
        JazakAllah Khair,<br>
        <strong>CRMFS Admin Team</strong>
      </p>
    </div>
    ${footer}
  </div>
</body>
</html>
      `
    };
  }

  if (emailType === 'application_submitted') {
    const coverageRows = [
      `<tr>
        <td style="padding: 10px 12px; font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb;">Main Member</td>
        <td style="padding: 10px 12px; font-size: 14px; color: #111827; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${member.first_name} ${member.last_name}</td>
      </tr>`
    ];

    if (jointMember) {
      coverageRows.push(`<tr>
        <td style="padding: 10px 12px; font-size: 14px; color: #374151; border-bottom: 1px solid #e5e7eb;">Joint Member</td>
        <td style="padding: 10px 12px; font-size: 14px; color: #111827; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${jointMember.first_name} ${jointMember.last_name}</td>
      </tr>`);
    }

    if (children && children.length > 0) {
      const childNames = children.map((c: any) => `${c.first_name} ${c.last_name}`).join(', ');
      coverageRows.push(`<tr>
        <td style="padding: 10px 12px; font-size: 14px; color: #374151;">${children.length === 1 ? 'Child' : 'Children'}</td>
        <td style="padding: 10px 12px; font-size: 14px; color: #111827; font-weight: 600;">${childNames}</td>
      </tr>`);
    }

    return {
      subject: 'Membership Application Submitted - Awaiting Approval',
      html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; margin-bottom: 64px;">
    ${header}
    <div style="padding: 32px 24px;">

      <div style="background-color: #2d5016; color: #fff; font-size: 14px; font-weight: 700; text-align: center; padding: 12px 24px; border-radius: 6px; margin: 0 0 24px; letter-spacing: 0.5px;">
        📋 APPLICATION RECEIVED
      </div>

      <h2 style="font-size: 28px; font-weight: 700; color: #2d5016; margin: 0 0 24px; line-height: 1.3;">
        Membership Application Submitted
      </h2>

      <p style="font-size: 16px; color: #333; margin: 0 0 16px;">
        Assalamu Alaikum ${memberName},
      </p>

      <p style="font-size: 16px; line-height: 26px; color: #525f7f; margin: 0 0 24px;">
        Your membership application has been submitted successfully. Thank you for applying to the Central Region Muslim Funeral Service.
      </p>

      <div style="background-color: #fff8e1; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px 20px; margin: 0 0 28px;">
        <p style="font-size: 15px; font-weight: 700; color: #92400e; margin: 0;">
          ⚠️ Important: Your membership is NOT active until your documents are reviewed and approved by the committee.
        </p>
      </div>

      <div style="margin: 0 0 28px;">
        <h3 style="font-size: 16px; font-weight: 700; color: #2d5016; margin: 0 0 12px;">
          Your application covers the following members:
        </h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f0fdf4;">
              <th style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #2d5016; text-align: left; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb;">Role</th>
              <th style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #2d5016; text-align: left; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb;">Name</th>
            </tr>
          </thead>
          <tbody>
            ${coverageRows.join('')}
          </tbody>
        </table>
      </div>

      <div style="margin: 0 0 28px;">
        <h3 style="font-size: 16px; font-weight: 700; color: #2d5016; margin: 0 0 12px;">
          What happens next:
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 32px; vertical-align: top; padding: 6px 0;">
              <div style="width: 24px; height: 24px; background-color: #2d5016; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; color: #fff;">1</div>
            </td>
            <td style="padding: 6px 0 6px 12px; font-size: 14px; line-height: 22px; color: #525f7f;">
              The committee will send you a secure link to upload your documents (Photo ID + Proof of Address)
            </td>
          </tr>
          <tr>
            <td style="width: 32px; vertical-align: top; padding: 6px 0;">
              <div style="width: 24px; height: 24px; background-color: #2d5016; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; color: #fff;">2</div>
            </td>
            <td style="padding: 6px 0 6px 12px; font-size: 14px; line-height: 22px; color: #525f7f;">
              You will receive a separate link to sign the required declarations
            </td>
          </tr>
          <tr>
            <td style="width: 32px; vertical-align: top; padding: 6px 0;">
              <div style="width: 24px; height: 24px; background-color: #2d5016; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; color: #fff;">3</div>
            </td>
            <td style="padding: 6px 0 6px 12px; font-size: 14px; line-height: 22px; color: #525f7f;">
              The committee will review your application and documents
            </td>
          </tr>
          <tr>
            <td style="width: 32px; vertical-align: top; padding: 6px 0;">
              <div style="width: 24px; height: 24px; background-color: #2d5016; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; color: #fff;">4</div>
            </td>
            <td style="padding: 6px 0 6px 12px; font-size: 14px; line-height: 22px; color: #525f7f;">
              You will be notified when your membership is activated
            </td>
          </tr>
        </table>
      </div>

      <p style="font-size: 14px; line-height: 22px; color: #6b7280; margin: 0 0 24px;">
        Please keep your membership fees current to maintain coverage when approved.
      </p>

      ${customMessageBlock}

      <p style="font-size: 16px; color: #525f7f; margin: 32px 0 0; line-height: 24px;">
        JazakAllah Khair,<br>
        <strong>CRMFS Admin Team</strong>
      </p>
    </div>
    ${footer}
  </div>
</body>
</html>
      `
    };
  }

  return {
    subject: 'Message from CRMFS',
    html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; margin-bottom: 64px;">
    ${header}
    <div style="padding: 32px 24px;">
      <p style="font-size: 16px; color: #333; margin: 0 0 16px;">
        Assalamu Alaikum ${memberName},
      </p>
      ${customMessageBlock}
      <p style="font-size: 16px; color: #525f7f; margin: 32px 0 0; line-height: 24px;">
        JazakAllah Khair,<br>
        <strong>CRMFS Admin Team</strong>
      </p>
    </div>
    ${footer}
  </div>
</body>
</html>
    `
  };
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { memberId, emailType, customSubject, customMessage }: RequestBody = await req.json();

    if (!memberId || !emailType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: memberId and emailType' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeaders = {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    };

    const memberResponse = await fetch(`${SUPABASE_URL}/rest/v1/members?id=eq.${memberId}&select=*`, {
      headers: authHeaders
    });

    const members = await memberResponse.json();
    const member = members[0];

    if (!member) {
      return new Response(
        JSON.stringify({ error: 'Member not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let jointMember = null;
    let children: any[] = [];

    if (emailType === 'application_submitted') {
      const [jointRes, childrenRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/joint_members?member_id=eq.${memberId}&select=first_name,last_name`, {
          headers: authHeaders
        }),
        fetch(`${SUPABASE_URL}/rest/v1/children?member_id=eq.${memberId}&select=first_name,last_name`, {
          headers: authHeaders
        })
      ]);

      const jointData = await jointRes.json();
      const childrenData = await childrenRes.json();

      jointMember = jointData[0] || null;
      children = childrenData || [];
    }

    const { subject, html } = generateEmailContent(member, emailType, customMessage, jointMember, children);

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'CRMFS <crmfs@kelpieai.co.uk>',
        to: member.email,
        subject: customSubject || subject,
        html
      })
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(`Resend error: ${JSON.stringify(resendData)}`);
    }

    await fetch(`${SUPABASE_URL}/rest/v1/email_activity`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        member_id: memberId,
        email_type: emailType,
        email_subject: customSubject || subject,
        status: 'sent',
        resend_email_id: resendData.id,
        metadata: {
          custom_message: customMessage || null
        }
      })
    });

    if (emailType === 'late_payment_warning') {
      const nextCount = (member.late_warnings_count ?? 0) + 1;
      const memberPatch: Record<string, unknown> = {
        late_warnings_count: nextCount,
      };
      if (member.status === 'paused') {
        memberPatch.paused_reason = `Late payment - ${nextCount} warning${nextCount === 1 ? '' : 's'} issued`;
      }
      await fetch(`${SUPABASE_URL}/rest/v1/members?id=eq.${memberId}`, {
        method: 'PATCH',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(memberPatch)
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        emailId: resendData.id
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error: any) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
