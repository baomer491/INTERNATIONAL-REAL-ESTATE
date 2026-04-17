import { store } from './store';

const ARCHIVE_KEY = 'ireo_last_auto_archive';
const ARCHIVE_INTERVAL_DAYS = 7;

export function checkAndAutoArchive(): number {
  if (typeof window === 'undefined') return 0;

  try {
    const lastRun = localStorage.getItem(ARCHIVE_KEY);
    const today = new Date().toISOString().slice(0, 10);

    if (lastRun === today) return 0;

    const reports = store.getReports();
    const now = Date.now();
    const sevenDaysMs = ARCHIVE_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
    let archivedCount = 0;
    const archivedReportNumbers: string[] = [];

    for (const report of reports) {
      if (report.status !== 'approved') continue;

      const updatedMs = new Date(report.updatedAt).getTime();
      if (now - updatedMs >= sevenDaysMs) {
        store.updateReport(report.id, { status: 'archived' });
        archivedCount++;
        archivedReportNumbers.push(report.reportNumber);
      }
    }

    if (archivedCount > 0) {
      store.addNotification({
        type: 'system',
        title: `تمت أرشفة ${archivedCount} تقرير تلقائياً`,
        message: `تمت أرشفة التقارير: ${archivedReportNumbers.join('، ')} (معتمدة منذ أكثر من ${ARCHIVE_INTERVAL_DAYS} أيام)`,
        priority: 'low',
      });
    }

    localStorage.setItem(ARCHIVE_KEY, today);
    return archivedCount;
  } catch {
    return 0;
  }
}
