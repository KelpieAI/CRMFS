import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  memberId: string;
  emailType: 'document_upload' | 'declarations_signature';
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with service role for database operations (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated using their JWT
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError?.message }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { memberId, emailType } = body;

    if (!memberId || !emailType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get member details
    const { data: member, error: memberError } = await supabaseAdmin
      .from("members")
      .select("id, email, first_name, last_name")
      .eq("id", memberId)
      .single();

    if (memberError || !member) {
      return new Response(
        JSON.stringify({ error: "Member not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Invalidate old tokens of this type for this member
    const { error: invalidateError } = await supabaseAdmin
      .from("email_tokens")
      .update({
        is_valid: false,
        invalidated_reason: "New token generated",
        invalidated_at: new Date().toISOString(),
      })
      .eq("member_id", memberId)
      .eq("token_type", emailType)
      .eq("is_valid", true);

    if (invalidateError) {
      console.error("Error invalidating old tokens:", invalidateError);
    }

    // Generate new token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create new email token
    const { error: tokenError } = await supabaseAdmin
      .from("email_tokens")
      .insert({
        member_id: memberId,
        token: token,
        token_type: emailType,
        email_sent_to: member.email,
        expires_at: expiresAt.toISOString(),
        sent_by_user_id: user.id,
        is_valid: true,
        resent_count: 0,
      });

    if (tokenError) {
      console.error("Error creating token:", tokenError);
      return new Response(
        JSON.stringify({ error: "Failed to create email token" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log activity
    await supabaseAdmin.from("activity_log").insert({
      member_id: memberId,
      action_type: emailType === 'document_upload' ? 'email_sent' : 'email_sent',
      description: `Resent ${emailType === 'document_upload' ? 'document upload' : 'declarations signature'} email to ${member.email}`,
      performed_by: user.id,
    });

    // Generate the magic link URL
    const appUrl = Deno.env.get("APP_URL") || "http://localhost:5173";
    const magicLinkPath = emailType === 'document_upload'
      ? '/upload-documents'
      : '/sign-declarations';
    const magicLink = `${appUrl}${magicLinkPath}?token=${token}`;

    // NOTE: In production, you would send an actual email here using a service like:
    // - Resend
    // - SendGrid
    // - AWS SES
    // - Postmark
    // For now, we'll just return the magic link so it can be manually shared

    console.log(`Magic link for ${member.first_name} ${member.last_name}:`, magicLink);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email token generated successfully",
        // In development, return the link so it can be used/tested
        magicLink: magicLink,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in resend-member-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
