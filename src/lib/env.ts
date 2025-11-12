const requiredEnv = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "BYBIT_ENCRYPTION_KEY"] as const;

function getEnv(name: (typeof requiredEnv)[number]) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabaseUrl: getEnv("SUPABASE_URL"),
  supabaseAnonKey: getEnv("SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  claudeApiKey: process.env.CLAUDE_API_KEY ?? "",
  semaforoModel: process.env.CLAUDE_SEMAFORO_MODEL ?? "claude-3-5-sonnet-20240620",
  bybitEncryptionKey: getEnv("BYBIT_ENCRYPTION_KEY"),
  bybitSyncDays: Number(process.env.BYBIT_SYNC_DAYS ?? "90"),
};
