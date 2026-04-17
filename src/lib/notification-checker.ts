import { store } from './store';

const PENDING_CHECK_KEY = 'ireo_last_pending_check';
const PENDING_THRESHOLD_HOURS = 24;
const OVERDUE_THRESHOLD_DAYS = 3;

export function checkPendingNotifications(): number {
  if (typeof window === 'undefined') return 0;

  try {
    const lastRun = localStorage.getItem(PENDING_CHECK_KEY);
    const now = new Date().toISOString().slice(0, 10);

    if (lastRun === now) return 0;

    const reports = store.getReports();
    const nowMs = Date.now();
    let createdCount = 0;

    const pendingThreshold = PENDING_THRESHOLD_HOURS * 60 * 60 * 1000;
    const overdueThreshold = OVERDUE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

    for (const report of reports) {
      if (report.status !== 'pending_approval') continue;

      const submittedMs = new Date(report.approval.submittedAt || report.createdAt).getTime();
      const elapsed = nowMs - submittedMs;

      if (elapsed >= pendingThreshold) {
        const isOverdue = elapsed >= overdueThreshold;
        store.addNotification({
          type: 'reminder',
          title: isOverdue
            ? `تنبيه: تقرير ${report.reportNumber} معلق منذ ${OVERDUE_THRESHOLD_DAYS} أيام`
            : `تقرير ${report.reportNumber} معلق منذ أكثر من ${PENDING_THRESHOLD_HOURS} ساعة`,
          message: `التقرير ${report.reportNumber} للمستفيد ${report.beneficiaryName} — القطعة رقم ${report.propertyDetails.plotNumber} في ${report.propertyDetails.wilayat}`,
          priority: isOverdue ? 'high' : 'medium',
          relatedReportId: report.id,
        });
        createdCount++;
      }
    }

    localStorage.setItem(PENDING_CHECK_KEY, now);
    return createdCount;
  } catch {
    return 0;
  }
}
