import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const accounts = [
      { email: "chef@kitchen.com", password: "chef123456", displayName: "Bếp Trưởng", role: "chef" },
      { email: "staff@kitchen.com", password: "staff123456", displayName: "Nhân Viên Bếp", role: "kitchen_member" },
    ];

    const results = [];

    for (const account of accounts) {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(u => u.email === account.email);
      
      if (existing) {
        // Ensure role exists
        await supabase.from("user_roles").upsert({
          user_id: existing.id,
          role: account.role,
        }, { onConflict: "user_id,role" });
        results.push({ email: account.email, status: "already exists, role ensured" });
        continue;
      }

      // Create user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: { display_name: account.displayName },
      });

      if (createError) {
        results.push({ email: account.email, status: `error: ${createError.message}` });
        continue;
      }

      // Assign role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: newUser.user.id,
        role: account.role,
      });

      results.push({
        email: account.email,
        status: roleError ? `created but role error: ${roleError.message}` : "created with role",
      });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
