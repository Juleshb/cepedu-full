/**
 * Create or update an admin user and a savings account.
 *
 * Usage (from server/):
 *   node scripts/create-admin.js --email you@example.com --name "Test Admin" --password "your-password"
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1 || !process.argv[index + 1]) return '';
  return process.argv[index + 1];
}

async function generateAccountNumber() {
  while (true) {
    const accountNumber = Math.floor(100000 + Math.random() * 900000);
    const existing = await prisma.account.findUnique({ where: { accountnumber: accountNumber } });
    if (!existing) return accountNumber;
  }
}

async function main() {
  const email = arg('email').trim().toLowerCase();
  const name = arg('name').trim();
  const password = arg('password');

  if (!email || !name || !password) {
    console.error('Required: --email --name --password');
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email } });

  const user = existing
    ? await prisma.user.update({
        where: { email },
        data: {
          name,
          password_hash,
          role: 'admin',
          first_time_login: false,
          otp: null,
          otp_expiry: null,
        },
      })
    : await prisma.user.create({
        data: {
          name,
          email,
          password_hash,
          role: 'admin',
          first_time_login: false,
        },
      });

  let account = await prisma.account.findFirst({ where: { user_id: user.user_id } });
  if (!account) {
    account = await prisma.account.create({
      data: {
        user_id: user.user_id,
        balance: 0,
        accountnumber: await generateAccountNumber(),
      },
    });
  }

  console.log({
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
    accountnumber: account.accountnumber,
    created: !existing,
  });

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
