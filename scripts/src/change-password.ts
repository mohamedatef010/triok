import { loadEnvFile } from 'node:process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Try multiple paths to find .env
for (const p of ['.env', '../.env', '../../.env', resolve(__dirname, '../../../.env')]) {
  try { loadEnvFile(p); break; } catch {}
}


import bcrypt from 'bcryptjs';
import { db, usersTable } from '@workspace/db';
import { eq } from 'drizzle-orm';

const EMAIL    = process.env.TARGET_EMAIL    || process.argv[2];
const NEW_PASS = process.env.NEW_PASSWORD    || process.argv[3];

if (!EMAIL || !NEW_PASS) {
  console.error(
    '\n>>> Usage: pnpm --filter scripts run change-password -- <email> <new_password>' +
    '\n    Or set env vars: TARGET_EMAIL=... NEW_PASSWORD=... pnpm --filter scripts run change-password\n'
  );
  process.exit(1);
}

if (NEW_PASS.length < 8) {
  console.error('\n>>> Password must be at least 8 characters long.\n');
  process.exit(1);
}

async function main() {
  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.email, EMAIL.toLowerCase().trim()));

  if (!user) {
    console.error('\n>>> User not found: ' + EMAIL + '\n');
    process.exit(1);
  }

  const newHash = await bcrypt.hash(NEW_PASS, 12);

  await db
    .update(usersTable)
    .set({ passwordHash: newHash })
    .where(eq(usersTable.id, user.id));

  console.log('\n>>> Password changed successfully for ' + user.email + ' (' + user.role + ')');
  console.log('    All existing login sessions are now IMMEDIATELY INVALIDATED.');
  console.log('    The user must log in again with the new password.\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n>>> Error:', err.message);
    process.exit(1);
  });
