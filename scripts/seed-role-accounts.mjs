import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || "ChangeMe123!";

const fallbackAccounts = [
  { email: "admin@mail.com", full_name: "System Admin", role: "SYSTEM_ADMIN" },
  { email: "admin.officer@mail.com", full_name: "Admin Officer", role: "ADMIN_OFFICER" },
  { email: "reviewer@mail.com", full_name: "Reviewer", role: "REVIEWER" },
  { email: "director@mail.com", full_name: "Executive Director", role: "EXECUTIVE_DIRECTOR" },
];

const accounts = process.env.SEED_ACCOUNTS_JSON
  ? JSON.parse(process.env.SEED_ACCOUNTS_JSON)
  : fallbackAccounts;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const findUserIdByEmail = async (email) => {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data?.users?.find((user) => user.email === email)?.id || null;
};

for (const account of accounts) {
  const { email, full_name, role } = account;
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: account.password || defaultPassword,
      email_confirm: true,
      user_metadata: { full_name },
    });

    let userId = data?.user?.id;

    if (error && error.message?.toLowerCase().includes("already")) {
      userId = await findUserIdByEmail(email);
    } else if (error) {
      throw error;
    }

    if (!userId) {
      console.warn(`Skipping ${email} (no user id found)`);
      continue;
    }

    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role });

    if (roleError && !String(roleError.message).includes("duplicate")) {
      throw roleError;
    }

    console.log(`Seeded ${email} as ${role}`);
  } catch (err) {
    console.error(`Failed to seed ${email}:`, err?.message || err);
  }
}
