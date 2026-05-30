declare module '@/lib/backup/export' {
  export type BackupTableName =
    | 'users'
    | 'courses'
    | 'lessons'
    | 'quizzes'
    | 'questions'
    | 'choices'
    | 'enrollments'
    | 'lesson_progress'
    | 'quiz_attempts'
    | 'answers'
    | 'certificates'
    | 'categories';

  export interface BackupPayload {
    generatedAt: string;
    tables: Record<BackupTableName, unknown[]>;
  }

  export const BACKUP_TABLES: readonly BackupTableName[];

  export function buildBackupPayload(options: {
    fetchTable: (table: BackupTableName) => Promise<unknown[] | null | undefined>;
    tables: BackupTableName[];
  }): Promise<BackupPayload>;
}

declare module '@/lib/backup/export.js' {
  export * from '@/lib/backup/export';
}

declare module '@/lib/backup/email' {
  export interface BackupAttachment {
    filename: string;
    content: Buffer;
    contentType: 'application/json';
  }

  export interface BackupEmailConfig {
    user: string;
    pass: string;
    to: string;
    from: string;
    host: string;
    port: number;
    secure: boolean;
    dryRun: boolean;
  }

  export interface SendBackupEmailOptions {
    payload: unknown;
    filename: string;
    env?: Record<string, string | undefined>;
    transportFactory?: (options: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    }) => {
      sendMail: (mailOptions: {
        from: string;
        to: string;
        subject: string;
        text: string;
        attachments: BackupAttachment[];
      }) => Promise<unknown>;
    };
    subject?: string;
    text?: string;
  }

  export interface SendBackupEmailResult {
    messageId?: string;
    dryRun?: boolean;
    attachment: BackupAttachment;
    config: BackupEmailConfig;
    [key: string]: unknown;
  }

  export function resolveBackupEmailConfig(
    env?: Record<string, string | undefined>
  ): BackupEmailConfig;

  export function createBackupAttachment(
    payload: unknown,
    filename: string
  ): BackupAttachment;

  export function sendBackupEmail(
    options: SendBackupEmailOptions
  ): Promise<SendBackupEmailResult>;
}

declare module '@/lib/backup/email.js' {
  export * from '@/lib/backup/email';
}
