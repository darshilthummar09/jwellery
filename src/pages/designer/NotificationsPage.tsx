import { CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { useChatNotification } from '../../context/ChatNotificationContext';

export function DesignerNotificationsPage() {
  const { notifications, markAllNotificationsRead, markNotificationRead } = useChatNotification();
  const navigate = useNavigate();
  const myNotifications = notifications.filter((n) => n.role === 'designer');

  return (
    <PageContainer>
      <PageTitle title="Notifications" subtitle="Stay updated on your order assignments." className="mb-8" />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">{myNotifications.filter((n) => !n.read).length} unread</span>
          <button
            onClick={() => markAllNotificationsRead('designer')}
            className="text-xs text-emerald-600 hover:underline font-medium flex items-center gap-1"
          >
            <CheckCheck size={13} /> Mark all read
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {myNotifications.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400">No notifications yet.</div>
          ) : (
            myNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  markNotificationRead(n.id);
                  if (n.type === 'chat' && n.threadId) {
                    navigate(`/dashboard/designer/chat`);
                  } else if (n.type === 'order' && n.orderId) {
                    navigate(`/dashboard/designer/assigned-orders?id=${n.orderId}`);
                  }
                }}
                className={`flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer ${n.read ? 'opacity-60' : ''}`}
              >
                <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${n.read ? 'bg-slate-200' : 'bg-emerald-500'}`} />
                <div>
                  <p className={`text-sm font-semibold ${n.read ? 'text-slate-600' : 'text-slate-800'}`}>{n.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{n.body}</p>
                  <p className="text-[10px] text-slate-300 mt-1">{n.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageContainer>
  );
}

