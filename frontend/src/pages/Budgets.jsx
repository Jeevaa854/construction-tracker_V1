import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, DollarSign } from 'lucide-react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';

const CATEGORIES = ['labor', 'materials', 'equipment', 'permits', 'transportation', 'miscellaneous'];

const Budgets = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [budgetInfo, setBudgetInfo] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const expenseForm = useForm();
  const budgetForm = useForm();

  useEffect(() => {
    api.get('/projects', { params: { limit: 100 } }).then(({ data }) => {
      setProjects(data.projects);
      if (data.projects.length > 0) setSelectedProject(data.projects[0]._id);
    }).catch(() => {});
  }, []);

  const fetchBudgetData = useCallback(async () => {
    if (!selectedProject) return;
    try {
      const { data } = await api.get(`/budgets/project/${selectedProject}`);
      setBudgetInfo(data);
    } catch (err) {
      setBudgetInfo(null);
    }
    try {
      const { data } = await api.get('/budgets/expenses', { params: { project: selectedProject, limit: 50 } });
      setExpenses(data.expenses);
    } catch (err) {
      setExpenses([]);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchBudgetData();
  }, [fetchBudgetData]);

  const onCreateBudget = async (values) => {
    setSubmitting(true);
    try {
      await api.post('/budgets', {
        project: selectedProject,
        totalEstimated: Number(values.totalEstimated),
      });
      toast.success('Budget created');
      setBudgetModalOpen(false);
      budgetForm.reset();
      fetchBudgetData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create budget');
    } finally {
      setSubmitting(false);
    }
  };

  const onAddExpense = async (values) => {
    setSubmitting(true);
    try {
      await api.post('/budgets/expenses', {
        ...values,
        project: selectedProject,
        amount: Number(values.amount),
      });
      toast.success('Expense recorded');
      setModalOpen(false);
      expenseForm.reset();
      fetchBudgetData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <select className="input-field w-fit" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {budgetInfo ? (
        <div className="card mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Estimated</p>
              <p className="text-xl font-bold">${budgetInfo.budget.totalEstimated.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Spent</p>
              <p className="text-xl font-bold">${budgetInfo.totalSpent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
              <p className="text-xl font-bold">${budgetInfo.remaining.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4 h-3 w-full rounded-full bg-gray-200 dark:bg-gray-800">
            <div
              className={`h-3 rounded-full ${budgetInfo.percentageUsed >= 90 ? 'bg-red-600' : 'bg-primary-600'}`}
              style={{ width: `${Math.min(budgetInfo.percentageUsed, 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="card mb-6 flex items-center justify-between">
          <p className="text-gray-500">No budget set up for this project yet.</p>
          {canManage && (
            <button onClick={() => setBudgetModalOpen(true)} className="btn-primary w-fit">
              <DollarSign size={18} /> Set Up Budget
            </button>
          )}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Expenses</h2>
        {canManage && (
          <button onClick={() => setModalOpen(true)} className="btn-primary w-fit">
            <Plus size={18} /> Record Expense
          </button>
        )}
      </div>

      {expenses.length === 0 ? (
        <p className="text-gray-500">No expenses recorded.</p>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <div key={e._id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium">{e.description}</p>
                <p className="text-sm capitalize text-gray-500 dark:text-gray-400">
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

      <Modal isOpen={budgetModalOpen} onClose={() => setBudgetModalOpen(false)} title="Set Up Budget">
        <form onSubmit={budgetForm.handleSubmit(onCreateBudget)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Total Estimated Budget ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input-field"
              {...budgetForm.register('totalEstimated', { required: true })}
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Saving...' : 'Create Budget'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Expense">
        <form onSubmit={expenseForm.handleSubmit(onAddExpense)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select className="input-field" {...expenseForm.register('category', { required: true })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <input className="input-field" {...expenseForm.register('description', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Amount ($)</label>
            <input type="number" min="0" step="0.01" className="input-field" {...expenseForm.register('amount', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Date</label>
            <input type="date" className="input-field" {...expenseForm.register('date', { required: true })} />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Saving...' : 'Record Expense'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Budgets;
