import { db, SCHEMA_VERSION } from '../../data/db'

// Every user-owned table is backed up automatically — derived from the live
// Dexie schema instead of hand-listed, so a future new table is included by
// default. This is the fix for the actual bug: hydrationLogs/dailyNotes/
// exerciseLogs/myFoods/foodReports were each added to db.ts across P1/P2 but
// never wired into this file, so none of them were ever exported or restored.
// `foods` is the one deliberate exclusion — it's the shared seed catalog,
// recreated automatically by foodRepository.ensureSeeded(), not user data.
const EXCLUDED_FROM_BACKUP = new Set(['foods'])

function backupTableNames(): string[] {
  return db.tables.map((t) => t.name).filter((name) => !EXCLUDED_FROM_BACKUP.has(name))
}

interface BackupFile {
  schemaVersion: number
  exportedAt: string
  data: Record<string, unknown[]>
}

export async function exportBackup(): Promise<void> {
  const tableNames = backupTableNames()
  const entries = await Promise.all(tableNames.map(async (name) => [name, await db.table(name).toArray()] as const))
  const data: Record<string, unknown[]> = Object.fromEntries(entries)

  const backup: BackupFile = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fitku-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Returns the number of tables actually restored, for UI feedback. */
export async function importBackup(file: File): Promise<number> {
  const text = await file.text()
  let parsed: BackupFile
  try {
    parsed = JSON.parse(text) as BackupFile
  } catch {
    throw new Error('File bukan JSON yang valid.')
  }

  if (!parsed.data || typeof parsed.data !== 'object' || typeof parsed.schemaVersion !== 'number') {
    throw new Error('File backup tidak valid.')
  }

  // Only restore tables that are (a) present in the file and (b) still exist
  // in the current schema, and (c) actually an array. A table this file
  // doesn't mention (e.g. an old backup made before a newer feature existed)
  // is left completely untouched — restoring an old backup must never wipe
  // out newer data it never knew about.
  const currentTableNames = new Set(backupTableNames())
  const restorable = Object.keys(parsed.data).filter(
    (name) => currentTableNames.has(name) && Array.isArray(parsed.data[name]),
  )

  if (restorable.length === 0) {
    throw new Error('File backup tidak berisi data yang bisa dipulihkan.')
  }

  await db.transaction('rw', restorable.map((name) => db.table(name)), async () => {
    for (const name of restorable) {
      await db.table(name).clear()
      await db.table(name).bulkAdd(parsed.data[name] as never[])
    }
  })

  return restorable.length
}
