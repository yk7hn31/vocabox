import 'server-only';
import postgres from 'postgres';

let client: ReturnType<typeof postgres> | undefined;

export function db() {
  if (!client) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not configured.');
    client = postgres(connectionString, { prepare: false, max: 5 });
  }
  return client;
}
