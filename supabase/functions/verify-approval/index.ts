import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const queryToken = url.searchParams.get("token")?.trim();
    let bodyToken: string | null = null;
    if (req.method !== "GET") {
      try {
        const body = await req.json();
        bodyToken = body?.token?.trim() ?? null;
      } catch {
        bodyToken = null;
      }
    }
    const token = queryToken || bodyToken;

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("approval_signatures")
      .select(`
        token,
        payload_hash,
        issued_at,
        decisions (
          decision,
          decision_date,
          notes,
          applications (
            title,
            reference_number,
            applicant_id
          )
        )
      `)
      .eq("token", token)
      .maybeSingle();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const applicantId = data.decisions?.applications?.applicant_id;
    let applicantName = null;
    if (applicantId) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", applicantId)
        .maybeSingle();
      applicantName = profileData?.full_name ?? null;
    }

    return new Response(
      JSON.stringify({
        valid: true,
        issued_at: data.issued_at,
        decision: data.decisions?.decision,
        decision_date: data.decisions?.decision_date,
        reference_number: data.decisions?.applications?.reference_number,
        title: data.decisions?.applications?.title,
        applicant_name: applicantName,
        payload_hash: data.payload_hash,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
