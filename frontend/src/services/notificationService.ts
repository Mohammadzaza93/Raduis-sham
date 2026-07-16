import api from './api';

export interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'warning' | 'danger' | 'info' | 'success';
}

class NotificationServiceClass {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  constructor() {
    this.loadNotifications();
    // جلب الإشعارات كل دقيقة
    setInterval(() => this.fetchNotifications(), 60000);
  }

  async fetchNotifications() {
    try {
      const response = await api.get('/dashboard/notifications');
      if (response.data && response.data.success) {
        const newNotifications = (response.data.data || []).map((n: any) => ({
          id: n.id || Date.now(),
          title: n.title || 'إشعار جديد',
          message: n.message || '',
          time: n.time || 'الآن',
          read: false,
          type: n.type || 'info'
        }));
        this.notifications = [...newNotifications, ...this.notifications].slice(0, 50);
        this.saveNotifications();
        this.notifyListeners();
      } else {
        // بيانات تجريبية إذا لم يكن هناك API
        this.addDemoNotifications();
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      this.addDemoNotifications();
    }
  }

  private addDemoNotifications() {
    if (this.notifications.length === 0) {
      this.notifications = [
        { id: 1, title: 'مرحباً بك في النظام', message: 'تم تسجيل دخولك بنجاح إلى نظام إدارة ISP', time: 'الآن', read: false, type: 'success' },
        { id: 2, title: 'اشتراكات ستنتهي قريباً', message: 'يوجد 5 عملاء سينتهي اشتراكهم خلال 3 أيام', time: 'منذ ساعة', read: false, type: 'warning' },
      ];
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  loadNotifications() {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try {
        this.notifications = JSON.parse(saved);
      } catch(e) { console.error(e); }
    }
  }

  saveNotifications() {
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
  }

  getNotifications(): Notification[] {
    return this.notifications;
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markAsRead(id: number) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.notifyListeners();
  }

  addNotification(notification: Notification) {
    this.notifications.unshift(notification);
    this.saveNotifications();
    this.notifyListeners();
  }

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }
}

export const notificationService = new NotificationServiceClass();
export type { Notification as NotificationType };