import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const download = async (url, filename) => {
  try {
    const response = await api.get(url, { responseType: 'blob' });
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    toast.error('Could not generate report');
  }
};

const Reports = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => {
    api.get('/projects', { params: { limit: 100 } }).then(({ data }) => {
      setProjects(data.projects);
      if (data.projects.length > 0) setSelectedProject(data.projects[0]._id);
    }).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">Reports</h1>

      <div className="card mb-6">
        <label className="mb-2 block text-sm font-medium">Select Project</label>
        <select className="input-field" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => download(`/reports/project/${selectedProject}/pdf`, `project-report-${selectedProject}.pdf`)}
          disabled={!selectedProject}
          className="card flex items-center gap-4 text-left transition hover:shadow-2xl disabled:opacity-50"
        >
          <FileDown className="text-red-500" size={28} />
          <div>
            <p className="font-semibold">Project Report (PDF)</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Full project summary, tasks, and budget snapshot.
            </p>
          </div>
        </button>

        <button
          onClick={() =>
            download(`/reports/project/${selectedProject}/budget/excel`, `budget-report-${selectedProject}.xlsx`)
          }
          disabled={!selectedProject}
          className="card flex items-center gap-4 text-left transition hover:shadow-2xl disabled:opacity-50"
        >
          <FileSpreadsheet className="text-green-600" size={28} />
          <div>
            <p className="font-semibold">Budget Report (Excel)</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Itemized expense breakdown for this project.
            </p>
          </div>
        </button>

        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button
            onClick={() => download('/reports/workers/excel', 'worker-report.xlsx')}
            className="card flex items-center gap-4 text-left transition hover:shadow-2xl"
          >
            <FileSpreadsheet className="text-purple-600" size={28} />
            <div>
              <p className="font-semibold">Worker Report (Excel)</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Task completion stats across all workers.
              </p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default Reports;
