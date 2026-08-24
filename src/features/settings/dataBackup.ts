import { db, SCHEMA_VERSION } from '../../data/db'

interface BackupFile {
  schemaVersion: number
  exportedAt: string
  data: {
    users: unknown[]
    foodLogs: unknown[]
    dailySummaries: unknown[]
    weightHistory: unknown[]
    subscriptionStatus: unknown[]
  }
}

export async function exportBackup(): Promise<void> {
  const [users, foodLogs, dailySummaries, weightHistory, subscriptionStatus] = await Promise.all([
    db.users.toArray(),
    db.foodLogs.toArray(),
    db.dailySummaries.toArray(),
    db.weightHistory.toArray(),
    db.subscriptionStatus.toArray(),
  ])

  const backup: BackupFile = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: { users, foodLogs, dailySummaries, weightHistory, subscriptionStatus },
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

export async function importBackup(file: File): Promise<void> {
  const text = await file.text()
  const parsed = JSON.parse(text) as BackupFile

  if (!parsed.data || typeof parsed.schemaVersion !== 'number') {
    throw new Error('File backup tidak valid.')
  }

  await db.transaction(
    'rw',
    [db.users, db.foodLogs, db.dailySummaries, db.weightHistory, db.subscriptionStatus],
    async () => {
      await Promise.all([
        db.users.clear(),
        db.foodLogs.clear(),
        db.dailySummaries.clear(),
        db.weightHistory.clear(),
        db.subscriptionStatus.clear(),
      ])
      await Promise.all([
        db.users.bulkAdd(parsed.data.users as never[]),
        db.foodLogs.bulkAdd(parsed.data.foodLogs as never[]),
        db.dailySummaries.bulkAdd(parsed.data.dailySummaries as never[]),
        db.weightHistory.bulkAdd(parsed.data.weightHistory as never[]),
        db.subscriptionStatus.bulkAdd(parsed.data.subscriptionStatus as never[]),
      ])
    },
  )
}
