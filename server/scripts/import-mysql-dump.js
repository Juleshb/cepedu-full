/**
 * Load server/config/db.sql (MySQL dump) into the Postgres database in DATABASE_URL.
 *
 * Usage (from server/):
 *   node scripts/import-mysql-dump.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DUMP = path.join(__dirname, '..', 'config', 'db.sql');

function parseTuples(sql, tableName) {
  const marker = `INSERT INTO \`${tableName}\` VALUES `;
  const start = sql.indexOf(marker);
  if (start < 0) return [];
  const rows = [];
  let i = start + marker.length;
  const len = sql.length;

  const skipWs = () => {
    while (i < len && /\s/.test(sql[i])) i += 1;
  };

  const readString = () => {
    i += 1;
    let out = '';
    while (i < len) {
      const ch = sql[i];
      if (ch === '\\') {
        const next = sql[i + 1];
        const map = { n: '\n', r: '\r', t: '\t', '0': '\0', Z: '\x1a', "'": "'", '"': '"', '\\': '\\' };
        out += map[next] !== undefined ? map[next] : next;
        i += 2;
        continue;
      }
      if (ch === "'") {
        i += 1;
        return out;
      }
      out += ch;
      i += 1;
    }
    throw new Error(`Unclosed string in ${tableName}`);
  };

  const readValue = () => {
    skipWs();
    if (sql.startsWith('NULL', i)) {
      i += 4;
      return null;
    }
    if (sql[i] === "'") return readString();
    const begin = i;
    while (i < len && sql[i] !== ',' && sql[i] !== ')') i += 1;
    return sql.slice(begin, i).trim();
  };

  while (i < len) {
    skipWs();
    if (sql[i] === ';') break;
    if (sql[i] !== '(') throw new Error(`Expected row in ${tableName} at ${i}`);
    i += 1;
    const row = [];
    while (i < len) {
      row.push(readValue());
      skipWs();
      if (sql[i] === ',') {
        i += 1;
        continue;
      }
      if (sql[i] === ')') {
        i += 1;
        break;
      }
      throw new Error(`Expected comma or end of row in ${tableName}`);
    }
    rows.push(row);
    skipWs();
    if (sql[i] === ',') i += 1;
  }
  return rows;
}

function toDateOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function clip(value, max, label) {
  if (value === null || value === undefined) return null;
  const text = String(value);
  if (text.length <= max) return text;
  console.warn(`Truncated ${label} from ${text.length} to ${max} characters`);
  return text.slice(0, max);
}

function toBool(value) {
  if (value === null || value === undefined || value === '') return true;
  return Boolean(Number(value));
}

async function resetSequence(table, idColumn) {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${table}"', '${idColumn}'), COALESCE((SELECT MAX("${idColumn}") FROM "${table}"), 1), true)`
  );
}

async function main() {
  const sql = fs.readFileSync(DUMP, 'utf8');
  const users = parseTuples(sql, 'users').map((r) => ({
    user_id: Number(r[0]),
    name: clip(r[1], 100, 'users.name'),
    email: clip(r[2], 150, 'users.email'),
    password_hash: r[3],
    role: r[4] || 'user',
    created_at: toDateOrNull(r[5]),
    updated_at: toDateOrNull(r[6]),
    identification_number: clip(r[7], 50, 'users.identification_number'),
    date_of_birth: toDateOrNull(r[8]),
    place_of_birth: clip(r[9], 100, 'users.place_of_birth'),
    residence_place: clip(r[10], 100, 'users.residence_place'),
    telephone: clip(r[11], 20, 'users.telephone'),
    address: clip(r[12], 255, 'users.address'),
    position: clip(r[13], 100, 'users.position'),
    place_of_working: clip(r[14], 100, 'users.place_of_working'),
    marital_status: r[15] || null,
    spouse_name: clip(r[16], 100, 'users.spouse_name'),
    spouse_id_number: clip(r[17], 50, 'users.spouse_id_number'),
    spouse_telephone: clip(r[18], 20, 'users.spouse_telephone'),
    shares: r[19] ?? 0,
    monthly_saving: r[20] ?? 0,
    otp: clip(r[21], 6, 'users.otp'),
    otp_expiry: r[22] != null && r[22] !== '' ? BigInt(r[22]) : null,
    token_version: r[23] != null && r[23] !== '' ? Number(r[23]) : 0,
    first_time_login: toBool(r[24]),
  }));
  const accounts = parseTuples(sql, 'Accounts').map((r) => ({
    account_id: Number(r[0]),
    user_id: Number(r[1]),
    balance: r[2] ?? 0,
    created_at: toDateOrNull(r[3]),
    updated_at: toDateOrNull(r[4]),
    accountnumber: Number(r[5]),
  }));
  const adminLogs = parseTuples(sql, 'Adminlogs').map((r) => ({
    log_id: Number(r[0]),
    admin_id: Number(r[1]),
    action: r[2],
    timestamp: toDateOrNull(r[3]),
    affected_table: clip(r[4] || '', 255, 'admin_logs.affected_table'),
    details: clip(r[5] || '', 255, 'admin_logs.details'),
  }));

  const userIds = new Set(users.map((u) => u.user_id));
  const missingAccounts = accounts.filter((a) => !userIds.has(a.user_id));
  if (missingAccounts.length) {
    throw new Error(`Accounts without a user: ${missingAccounts.map((a) => a.account_id).join(', ')}`);
  }

  console.log('Dump rows:', {
    users: users.length,
    accounts: accounts.length,
    adminLogs: adminLogs.length,
  });

  console.log('Clearing Postgres tables...');
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "admin_logs", "loan_repayments", "loans", "transactions", "accounts", "users" RESTART IDENTITY CASCADE'
  );

  console.log('Inserting users...');
  for (const user of users) {
    await prisma.user.create({ data: user });
  }
  console.log('Inserting accounts...');
  for (const account of accounts) {
    await prisma.account.create({ data: account });
  }
  console.log('Inserting admin logs...');
  for (const log of adminLogs) {
    await prisma.adminLog.create({ data: log });
  }

  await resetSequence('users', 'user_id');
  await resetSequence('accounts', 'account_id');
  await resetSequence('admin_logs', 'log_id');

  const counts = {
    users: await prisma.user.count(),
    accounts: await prisma.account.count(),
    transactions: await prisma.transaction.count(),
    loans: await prisma.loan.count(),
    adminLogs: await prisma.adminLog.count(),
  };
  console.log('Postgres row counts:', counts);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Import failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
