export const BACKUP_TABLES = [
  'users',
  'courses',
  'lessons',
  'quizzes',
  'questions',
  'choices',
  'enrollments',
  'lesson_progress',
  'quiz_attempts',
  'answers',
  'certificates',
  'categories',
];

export async function buildBackupPayload({ fetchTable, tables }) {
  const entries = await Promise.all(
    tables.map(async (table) => {
      const rows = await fetchTable(table);
      return [table, Array.isArray(rows) ? rows : []];
    })
  );

  return {
    generatedAt: new Date().toISOString(),
    tables: Object.fromEntries(entries),
  };
}
