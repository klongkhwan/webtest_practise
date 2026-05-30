import nodemailer from 'nodemailer';

function parseBoolean(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value ?? '').toLowerCase());
}

function parsePort(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildTransportOptions(config) {
  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  };
}

export function resolveBackupEmailConfig(env = process.env) {
  const user = String(env.BACKUP_EMAIL_USER ?? '').trim();
  const pass = String(env.BACKUP_EMAIL_PASS ?? '').trim();
  const to = String(env.BACKUP_EMAIL_TO ?? '').trim();
  const from = String(env.BACKUP_EMAIL_FROM ?? user).trim();

  if (!user || !pass || !to) {
    throw new Error(
      'Missing backup email configuration. Set BACKUP_EMAIL_USER, BACKUP_EMAIL_PASS, and BACKUP_EMAIL_TO.'
    );
  }

  const host = String(env.BACKUP_EMAIL_HOST ?? 'smtp.gmail.com').trim();
  const port = parsePort(env.BACKUP_EMAIL_PORT, host.includes('gmail') ? 465 : 587);
  const secure =
    env.BACKUP_EMAIL_SECURE !== undefined
      ? parseBoolean(env.BACKUP_EMAIL_SECURE)
      : port === 465;
  const dryRun = parseBoolean(env.BACKUP_EMAIL_DRY_RUN);

  return {
    user,
    pass,
    to,
    from,
    host,
    port,
    secure,
    dryRun,
  };
}

export function createBackupAttachment(payload, filename) {
  return {
    filename,
    content: Buffer.from(JSON.stringify(payload, null, 2), 'utf8'),
    contentType: 'application/json',
  };
}

export async function sendBackupEmail({
  payload,
  filename,
  env = process.env,
  transportFactory = nodemailer.createTransport,
  subject,
  text,
}) {
  const config = resolveBackupEmailConfig(env);
  const attachment = createBackupAttachment(payload, filename);

  if (config.dryRun) {
    return {
      messageId: 'dry-run',
      dryRun: true,
      attachment,
      config,
    };
  }

  const transporter = transportFactory(buildTransportOptions(config));
  const mailOptions = {
    from: config.from,
    to: config.to,
    subject: subject ?? `Backup export: ${filename}`,
    text:
      text ??
      `Attached is the latest LMS database backup generated at ${new Date().toISOString()}.`,
    attachments: [attachment],
  };

  const result = await transporter.sendMail(mailOptions);

  return {
    ...result,
    attachment,
    config,
  };
}
