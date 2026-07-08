import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Bell, Check, Trash2 } from 'lucide-react';
import api from '../api/axios.js';
import Pagination from '../components/Pagination.jsx';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications', { params: { page, limit: 15 } });
      setNotifications(data.notifications);
      setPages(data.pages);
    } catch (err) {
      toast.error('Could not load notifications');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to update notification');
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button onClick={markAllRead} className="btn-secondary w-fit">
          <Check size={16} /> Mark all read
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-500">You're all caught up.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`card flex items-start justify-between gap-4 ${!n.isRead ? 'border-l-4 border-primary-600' : ''}`}
            >
              <div className="flex gap-3">
                <Bell size={18} className="mt-1 shrink-0 text-primary-600" />
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {!n.isRead && (
                  <button onClick={() => markRead(n._id)} className="rounded-full p-1.5 hover:bg-gray-200/50 dark:hover:bg-gray-800/50">
                    <Check size={16} />
                  </button>
                )}
                <button onClick={() => remove(n._id)} className="rounded-full p-1.5 hover:bg-gray-200/50 dark:hover:bg-gray-800/50">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} pages={pages} onPageChange={setPage} />
    </div>
  );
};

export default Notifications;
