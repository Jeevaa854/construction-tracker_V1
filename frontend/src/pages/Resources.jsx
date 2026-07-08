import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Wrench } from 'lucide-react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';
import Pagination from '../components/Pagination.jsx';

const Resources = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/resources', { params: { page, limit: 12 } });
      setResources(data.resources);
      setPages(data.pages);
    } catch (err) {
      toast.error('Could not load resources');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  useEffect(() => {
    api.get('/projects', { params: { limit: 100 } }).then(({ data }) => setProjects(data.projects)).catch(() => {});
  }, []);

  const onCreate = async (values) => {
    setSubmitting(true);
    try {
      await api.post('/resources', {
        ...values,
        quantity: Number(values.quantity),
        unitCost: Number(values.unitCost),
      });
      toast.success('Resource added');
      setModalOpen(false);
      reset();
      fetchResources();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add resource');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Resources</h1>
        {canManage && (
          <button onClick={() => setModalOpen(true)} className="btn-primary w-fit">
            <Plus size={18} /> Add Resource
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading resources...</p>
      ) : resources.length === 0 ? (
        <p className="text-gray-500">No resources found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <div key={r._id} className="card">
              <div className="mb-2 flex items-center justify-between">
                <Wrench size={18} className="text-primary-600" />
                <Badge value={r.status} />
              </div>
              <h3 className="font-semibold">{r.name}</h3>
              <p className="text-sm capitalize text-gray-500 dark:text-gray-400">{r.type}</p>
              <p className="mt-2 text-sm">
                {r.quantity} {r.unit} · ${r.unitCost.toLocaleString()} each
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Project: {r.project?.name || 'N/A'}
              </p>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} pages={pages} onPageChange={setPage} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Resource">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input className="input-field" {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>
            <select className="input-field" {...register('type', { required: true })}>
              <option value="equipment">Equipment</option>
              <option value="material">Material</option>
              <option value="tool">Tool</option>
              <option value="vehicle">Vehicle</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Project</label>
            <select className="input-field" {...register('project', { required: 'Project is required' })}>
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.project && <p className="mt-1 text-sm text-red-500">{errors.project.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Quantity</label>
              <input type="number" min="0" className="input-field" {...register('quantity', { required: true })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Unit Cost ($)</label>
              <input type="number" min="0" step="0.01" className="input-field" {...register('unitCost', { required: true })} />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Saving...' : 'Add Resource'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Resources;
