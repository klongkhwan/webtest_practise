import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { BACKUP_TABLES, buildBackupPayload } from '@/lib/backup/export.js';
import { sendBackupEmail } from '@/lib/backup/email.js';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function secretsMatch(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.BACKUP_SECRET_KEY;

    if (!secret) {
      return NextResponse.json(
        { error: 'Backup is not configured' },
        { status: 500 }
      );
    }

    const providedSecret = request.headers.get('x-backup-secret') ?? '';

    if (!secretsMatch(providedSecret, secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseAdmin;

    if (!supabase) {
      return NextResponse.json(
        { error: 'Backup client unavailable' },
        { status: 500 }
      );
    }

    const payload = await buildBackupPayload({
      tables: [...BACKUP_TABLES],
      fetchTable: async (table) => {
        const { data, error } = await supabase.from(table).select('*');

        if (error) {
          throw new Error(`Failed to export ${table}: ${error.message}`);
        }

        return data ?? [];
      },
    });

    const filename = `backup-${payload.generatedAt
      .replace(/[:.]/g, '-')
      .replace('T', '_')}.json`;

    const rowSummary = BACKUP_TABLES.map(
      (table) => `${table}: ${payload.tables[table]?.length ?? 0}`
    ).join('\n');

    const emailResult = await sendBackupEmail({
      payload,
      filename,
      subject: `LMS database backup ${payload.generatedAt.slice(0, 10)}`,
      text: [
        `LMS database backup generated at ${payload.generatedAt}.`,
        '',
        'Table row counts:',
        rowSummary,
      ].join('\n'),
    });

    return NextResponse.json({
      status: 'ok',
      generatedAt: payload.generatedAt,
      filename,
      email: {
        messageId: emailResult.messageId ?? null,
        dryRun: Boolean(emailResult.dryRun),
      },
      tables: BACKUP_TABLES,
    });
  } catch (error) {
    console.error('Backup API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate backup' },
      { status: 500 }
    );
  }
}
