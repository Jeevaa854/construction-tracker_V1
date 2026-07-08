import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { MessageSquare } from 'lucide-react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import Badge from '../components/Badge.jsx';
import Pagination from '../components/Pagination.jsx';
import Modal from '../components/Modal.jsx';

const STATUS_OPTIONS = ['todo', 'in-progress', 'review', 'completed', 'blocked'];

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [commentModal, setCommentModal] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks', {
        params: { page, status: statusFilter || undefined, limit: 12 },
      });
      setTasks(data.tasks);
      setPages(data.pages);
    } catch (err) {
      toast.error('Could not load tasks');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const updateStatus = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      toast.success('Task updated');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const openComments = async (task) => {
    setCommentModal(task);
    try {
      const { data } = await api.get(`/tasks/${task._id}`);
      setComments(data.task.comments || []);
    } catch (err) {
      setComments([]);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    try {
      const { data } = await api.post(`/tasks/${commentModal._id}/comments`, { text: commentText });
      setComments(data.comments);
      setCommentText('');
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <select
          className="input-field w-fit"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p className="text-gray-500">No tasks found.</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task._id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{task.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {task.project?.name} · Due {new Date(task.deadline).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge value={task.priority} />
                <select
                  className="input-field w-auto py-1.5 text-sm"
                  value={task.status}
                  onChange={(e) => updateStatus(task._id, e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button onClick={() => openComments(task)} className="btn-secondary px-3 py-1.5">
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} pages={pages} onPageChange={setPage} />

      <Modal isOpen={!!commentModal} onClose={() => setCommentModal(null)} title={commentModal?.title || 'Comments'}>
        <div className="mb-4 max-h-64 space-y-3 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c._id} className="rounded-lg bg-gray-100 p-3 text-sm dark:bg-gray-800">
                <p className="mb-1 font-medium">{c.author?.name || 'User'}</p>
                <p>{c.text}</p>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input
            className="input-field"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitComment()}
          />
          <button onClick={submitComment} className="btn-primary">
            Send
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Tasks;
