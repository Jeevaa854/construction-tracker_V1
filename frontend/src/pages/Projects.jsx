import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Search, ArrowRight } from 'lucide-react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import Badge from '../components/Badge.jsx';
import Pagination from '../components/Pagination.jsx';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [managers, setManagers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const canCreate = user?.role === 'admin' || user?.role === 'manager';

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/projects', { params: { page, search } });
      setProjects(data.projects);
      setPages(data.pages);
    } catch (err) {
      toast.error('Could not load projects');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (canCreate) {
      api
        .get('/users', { params: { role: 'manager', limit: 100 } })
        .then(({ data }) => setManagers(data.users))
        .catch(() => {});
    }
  }, [canCreate]);

  const onCreate = async (values) => {
    setSubmitting(true);
    try {
      await api.post('/projects', {
        ...values,
        estimatedBudget: Number(values.estimatedBudget),
      });
      toast.success('Project created successfully');
      setModalOpen(false);
      reset();
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        {canCreate && (
          <button onClick={() => setModalOpen(true)} className="btn-primary w-fit">
            <Plus size={18} /> New Project
          </button>
        )}
      </div>

      <div className="mb-6 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-10"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading projects...</p>
      ) : projects.length === 0 ? (
        <p className="text-gray-500">No projects found.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link to={`/projects/${project._id}`} key={project._id} className="card block hover:shadow-2xl transition">
              <div className="mb-3 flex items-center justify-between">
                <Badge value={project.status} />
                <Badge value={project.priority} />
              </div>
              <h3 className="mb-1 text-lg font-semibold">{project.name}</h3>
              <p className="mb-4 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                {project.description}
              </p>
              <div className="mb-3 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800">
                <div
                  className="h-2 rounded-full bg-primary-600"
                  style={{ width: `${project.completionPercentage || 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{project.completionPercentage || 0}% complete</span>
                <span className="flex items-center gap-1 text-primary-600">
                  View <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} pages={pages} onPageChange={setPage} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Project">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Project Name</label>
            <input className="input-field" {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              className="input-field"
              rows={3}
              {...register('description', { required: 'Description is required' })}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Manager</label>
            <select className="input-field" {...register('manager', { required: 'Manager is required' })}>
              <option value="">Select a manager</option>
              {managers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
            {errors.manager && <p className="mt-1 text-sm text-red-500">{errors.manager.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Start Date</label>
              <input
                type="date"
                className="input-field"
                {...register('startDate', { required: 'Start date is required' })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">End Date</label>
              <input
                type="date"
                className="input-field"
                {...register('endDate', { required: 'End date is required' })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Estimated Budget ($)</label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              {...register('estimatedBudget', { required: 'Budget is required', min: 0 })}
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
