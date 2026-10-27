/**
 * One-time MySQL → PostgreSQL data migration.
 * Requires DB_* (MySQL) and DATABASE_URL (Postgres) in .env
 *
 * Usage: npm run migrate:mysql
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function toDateOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toBool(value) {
  if (value === null || value === undefined) return true;
  return Boolean(Number(value));
}

async function resetSequence(table, idColumn) {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${table}"', '${idColumn}'), COALESCE((SELECT MAX("${idColumn}") FROM "${table}"), 1), true)`
  );
}

async function main() {
  const mysqlPool = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cepeduh',
    waitForConnections: true,
    connectionLimit: 5,
  });

  console.log('Connected to MySQL. Reading tables...');

  const [users] = await mysqlPool.query('SELECT * FROM Users');
  const [accounts] = await mysqlPool.query('SELECT * FROM Accounts');
  const [transactions] = await mysqlPool.query('SELECT * FROM Transactions');
  const [loans] = await mysqlPool.query('SELECT * FROM Loans');
  // Controllers use LoanRepayments / AdminLogs; dump uses Loanrepayments / Adminlogs
  let repayments = [];
  let adminLogs = [];
  try {
    const [rows] = await mysqlPool.query('SELECT * FROM LoanRepayments');
    repayments = rows;
  } catch {
    const [rows] = await mysqlPool.query('SELECT * FROM Loanrepayments');
    repayments = rows;
  }
  try {
    const [rows] = await mysqlPool.query('SELECT * FROM AdminLogs');
    adminLogs = rows;
  } catch {
    const [rows] = await mysqlPool.query('SELECT * FROM Adminlogs');
    adminLogs = rows;
  }

  console.log('MySQL row counts:', {
    users: users.length,
    accounts: accounts.length,
    transactions: transactions.length,
    loans: loans.length,
    repayments: repayments.length,
    adminLogs: adminLogs.length,
  });

  console.log('Clearing Postgres tables...');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "admin_logs", "loan_repayments", "loans", "transactions", "accounts", "users" RESTART IDENTITY CASCADE');

  console.log('Inserting users...');
  for (const u of users) {
    await prisma.user.create({
      data: {
        user_id: u.user_id,
        name: u.name,
        email: u.email,
        password_hash: u.password_hash,
        role: u.role || 'user',
        created_at: toDateOrNull(u.created_at),
        updated_at: toDateOrNull(u.updated_at),
        identification_number: u.identification_number,
        date_of_birth: toDateOrNull(u.date_of_birth),
        place_of_birth: u.place_of_birth,
        residence_place: u.residence_place,
        telephone: u.telephone,
        address: u.address,
        position: u.position,
        place_of_working: u.place_of_working,
        marital_status: u.marital_status || null,
        spouse_name: u.spouse_name,
        spouse_id_number: u.spouse_id_number,
        spouse_telephone: u.spouse_telephone,
        shares: u.shares ?? 0,
        monthly_saving: u.monthly_saving ?? 0,
        otp: u.otp,
        otp_expiry: u.otp_expiry != null ? BigInt(u.otp_expiry) : null,
        token_version: u.token_version ?? 0,
        first_time_login: toBool(u.first_time_login),
      },
    });
  }

  console.log('Inserting accounts...');
  for (const a of accounts) {
    await prisma.account.create({
      data: {
        account_id: a.account_id,
        user_id: a.user_id,
        balance: a.balance ?? 0,
        created_at: toDateOrNull(a.created_at),
        updated_at: toDateOrNull(a.updated_at),
        accountnumber: a.accountnumber,
      },
    });
  }

  console.log('Inserting transactions...');
  for (const t of transactions) {
    await prisma.transaction.create({
      data: {
        transaction_id: t.transaction_id,
        account_id: t.account_id,
        transaction_type: t.transaction_type,
        amount: t.amount,
        transaction_date: toDateOrNull(t.transaction_date),
        description: t.description,
        transaction_number: t.transaction_number,
      },
    });
  }

  console.log('Inserting loans...');
  for (const l of loans) {
    await prisma.loan.create({
      data: {
        loan_id: l.loan_id,
        user_id: l.user_id,
        amount: l.amount,
        status: l.status || 'pending',
        repayment_period: l.repayment_period,
        created_at: toDateOrNull(l.created_at),
        updated_at: toDateOrNull(l.updated_at),
      },
    });
  }

  console.log('Inserting loan repayments...');
  for (const r of repayments) {
    await prisma.loanRepayment.create({
      data: {
        repayment_id: r.repayment_id,
        loan_id: r.loan_id,
        amount: r.amount,
        due_date: toDateOrNull(r.due_date),
        status: r.status || 'pending',
        payment_date: toDateOrNull(r.payment_date),
      },
    });
  }

  console.log('Inserting admin logs...');
  for (const log of adminLogs) {
    await prisma.adminLog.create({
      data: {
        log_id: log.log_id,
        admin_id: log.admin_id,
        action: log.action,
        timestamp: toDateOrNull(log.timestamp),
        affected_table: log.affected_table || '',
        details: log.details || '',
      },
    });
  }

  console.log('Resetting Postgres sequences...');
  await resetSequence('users', 'user_id');
  await resetSequence('accounts', 'account_id');
  await resetSequence('transactions', 'transaction_id');
  await resetSequence('loans', 'loan_id');
  await resetSequence('loan_repayments', 'repayment_id');
  await resetSequence('admin_logs', 'log_id');

  const counts = {
    users: await prisma.user.count(),
    accounts: await prisma.account.count(),
    transactions: await prisma.transaction.count(),
    loans: await prisma.loan.count(),
    repayments: await prisma.loanRepayment.count(),
    adminLogs: await prisma.adminLog.count(),
  };

  console.log('Postgres row counts:', counts);
  console.log('Migration completed successfully.');

  await mysqlPool.end();
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Migration failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
