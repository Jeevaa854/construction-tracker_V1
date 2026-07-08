import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Calendar, Users as UsersIcon, DollarSign, FileDown } from 'lucide-react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';

const TABS = ['Overview', 'Tasks', 'Budget', 'Progress'];

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [taskStats, setTaskStats] = useState({ totalTasks: 0, completedTasks: 0 });
  const [tasks, setTasks] = useState([]);
  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [progressLogs, setProgressLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const taskForm = useForm();
  const progressForm = useForm();

  const fetchProject = useCallback(async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data.project);
      setTaskStats(data.taskStats);
    } catch (err) {
      toast.error('Could not load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks', { params: { project: id, limit: 50 } });
      setTasks(data.tasks);
    } catch (err) {
      // silent - tab not active yet is fine
    }
  }, [id]);

  const fetchBudget = useCallback(async () => {
    try {
      const { data } = await api.get(`/budgets/project/${id}`);
      setBudget(data);
    } catch (err) {
      setBudget(null);
    }
    try {
      const { data } = await api.get('/budgets/expenses', { params: { project: id, limit: 50 } });
      setExpenses(data.expenses);
    } catch (err) {
      // ignore
    }
  }, [id]);

  const fetchProgress = useCallback(async () => {
    try {
      const { data } = await api.get('/progress', { params: { project: id, limit: 50 } });
      setProgressLogs(data.logs);
    } catch (err) {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
    fetchTasks();
    fetchBudget();
    fetchProgress();
  }, [fetchProject, fetchTasks, fetchBudget, fetchProgress]);

  const onCreateTask = async (values) => {
    setSubmitting(true);
    try {
      await api.post('/tasks', { ...values, project: id, assignedTo: [] });
      toast.success('Task created');
      setTaskModalOpen(false);
      taskForm.reset();
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitProgress = async (values) => {
    setSubmitting(true);
    try {
      await api.post('/progress', {
        ...values,
        project: id,
        completionPercentage: Number(values.completionPercentage),
        laborCount: Number(values.laborCount || 0),
      });
      toast.success('Progress log submitted');
      setProgressModalOpen(false);
      progressForm.reset();
      fetchProgress();
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit log');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadPdf = async () => {
    try {
      const response = await api.get(`/reports/project/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `project-report-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Could not generate report');
    }
  };

  if (loading) return <p className="px-6 py-10 text-gray-500">Loading project...</p>;
  if (!project) return <p className="px-6 py-10 text-gray-500">Project not found.</p>;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex gap-2">
            <Badge value={project.status} />
            <Badge value={project.priority} />
          </div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="mt-1 max-w-2xl text-gray-500 dark:text-gray-400">{project.description}</p>
        </div>
        <button onClick={downloadPdf} className="btn-secondary w-fit">
          <FileDown size={18} /> Export PDF
        </button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-3">
          <Calendar className="text-primary-600" size={20} />
          <div className="text-sm">
            <p className="text-gray-500 dark:text-gray-400">Timeline</p>
            <p className="font-medium">
              {new Date(project.startDate).toLocaleDateString()} –{' '}
              {new Date(project.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <UsersIcon className="text-primary-600" size={20} />
          <div className="text-sm">
            <p className="text-gray-500 dark:text-gray-400">Team</p>
            <p className="font-medium">{project.workers?.length || 0} workers assigned</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <DollarSign className="text-primary-600" size={20} />
          <div className="text-sm">
            <p className="text-gray-500 dark:text-gray-400">Estimated Budget</p>
            <p className="font-medium">${project.estimatedBudget?.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-primary-600 dark:text-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="card">
          <h3 className="mb-3 font-semibold">Task Completion</h3>
          <p className="text-gray-600 dark:text-gray-300">
            {taskStats.completedTasks} of {taskStats.totalTasks} tasks completed
          </p>
          <div className="mt-3 h-3 w-full rounded-full bg-gray-200 dark:bg-gray-800">
            <div
              className="h-3 rounded-full bg-green-600"
              style={{
                width: `${
                  taskStats.totalTasks
                    ? Math.round((taskStats.completedTasks / taskStats.totalTasks) * 100)
                    : 0
                }%`,
              }}
            />
          </div>

          {project.milestones?.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 font-semibold">Milestones</h3>
              <ul className="space-y-2">
                {project.milestones.map((m, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span>{m.title}</span>
                    <Badge value={m.completed ? 'completed' : 'pending'} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Tasks' && (
        <div>
          {canManage && (
            <button onClick={() => setTaskModalOpen(true)} className="btn-primary mb-4 w-fit">
              <Plus size={18} /> New Task
            </button>
          )}
          {tasks.length === 0 ? (
            <p className="text-gray-500">No tasks yet.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task._id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Due {new Date(task.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge value={task.priority} />
                    <Badge value={task.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Budget' && (
        <div className="space-y-6">
          {budget ? (
            <div className="card">
              <h3 className="mb-3 font-semibold">Budget Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Estimated</p>
                  <p className="text-lg font-bold">${budget.budget.totalEstimated.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Spent</p>
                  <p className="text-lg font-bold">${budget.totalSpent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
                  <p className="text-lg font-bold">${budget.remaining.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No budget set up for this project yet.</p>
          )}

          <div>
            <h3 className="mb-3 font-semibold">Expenses</h3>
            {expenses.length === 0 ? (
              <p className="text-gray-500">No expenses recorded.</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((e) => (
                  <div key={e._id} className="card flex items-center justify-between">
                    <div>
                      <p className="font-medium">{e.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {e.category} · {new Date(e.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">${e.amount.toLocaleString()}</span>
                      <Badge value={e.approvalStatus} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Progress' && (
        <div>
          <button onClick={() => setProgressModalOpen(true)} className="btn-primary mb-4 w-fit">
            <Plus size={18} /> Log Progress
          </button>
          {progressLogs.length === 0 ? (
            <p className="text-gray-500">No progress logs yet.</p>
          ) : (
            <div className="space-y-3">
              {progressLogs.map((log) => (
                <div key={log._id} className="card">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge value={log.type} />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(log.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mb-2 text-sm">{log.workSummary}</p>
                  <p className="text-sm font-medium text-primary-600">
                    {log.completionPercentage}% complete
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} title="New Task">
        <form onSubmit={taskForm.handleSubmit(onCreateTask)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input className="input-field" {...taskForm.register('title', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea className="input-field" rows={3} {...taskForm.register('description')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Deadline</label>
            <input type="date" className="input-field" {...taskForm.register('deadline', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Priority</label>
            <select className="input-field" {...taskForm.register('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={progressModalOpen} onClose={() => setProgressModalOpen(false)} title="Log Progress">
        <form onSubmit={progressForm.handleSubmit(onSubmitProgress)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>
            <select className="input-field" {...progressForm.register('type', { required: true })}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Work Summary</label>
            <textarea
              className="input-field"
              rows={3}
              {...progressForm.register('workSummary', { required: true })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Completion Percentage</label>
            <input
              type="number"
              min="0"
              max="100"
              className="input-field"
              {...progressForm.register('completionPercentage', { required: true })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Labor Count</label>
            <input type="number" min="0" className="input-field" {...progressForm.register('laborCount')} />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Submitting...' : 'Submit Log'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetail;
