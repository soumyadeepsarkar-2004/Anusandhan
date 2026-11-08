/**
 * Cross-Platform Notification Service for Anusandhan (अनुसंधान).
 * Manages native push & local alerts across Android, iOS, Windows Desktop, and Web.
 */

export class NotificationService {
  private static permissionGranted = false;

  /**
   * Request user permission for notifications.
   */
  static async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      if (Notification.permission === 'granted') {
        this.permissionGranted = true;
        return true;
      }

      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        this.permissionGranted = permission === 'granted';
        return this.permissionGranted;
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
    }

    return false;
  }

  /**
   * Dispatches an immediate native notification.
   */
  static async sendNotification(title: string, body: string, icon = '/brand-emblem.svg'): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    try {
      new Notification(title, {
        body,
        icon,
        badge: '/favicon.svg'
      });
    } catch (err) {
      console.warn('Failed to display native notification:', err);
    }
  }

  /**
   * Dispatches notification when offline outbox queue completes synchronization.
   */
  static async notifyOutboxSynced(count: number): Promise<void> {
    await this.sendNotification(
      'Outbox Synchronized Successfully',
      `${count} queued cold email${count > 1 ? 's were' : ' was'} safely dispatched with anti-spam jitter.`
    );
  }

  /**
   * Alerts student about upcoming fellowship deadlines (DAAD, Mitacs, CERN).
   */
  static async notifyDeadlineAlert(programName: string, daysLeft: number): Promise<void> {
    await this.sendNotification(
      `Fellowship Deadline Alert: ${programName}`,
      `Only ${daysLeft} days remaining to submit your application. Letter of Invitation required!`
    );
  }

  /**
   * Alerts student when a 7-day polite bump is due for review.
   */
  static async notifyFollowUpDue(professorName: string): Promise<void> {
    await this.sendNotification(
      '7-Day Follow-Up Ready for Review',
      `${professorName} has not replied in 7 days. Your 3-sentence polite bump is ready for 1-click review.`
    );
  }
}
