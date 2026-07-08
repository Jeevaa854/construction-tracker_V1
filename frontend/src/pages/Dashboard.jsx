import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Building2, ListChecks, Users, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="card flex items-center gap-4">
    <div className={`rounded-xl p-3 ${accent}`}>
      <Icon className="text-white" size={22} />
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/projects?limit=100')
      .then(({ data }) => setProjects(data.projects))
      .catch(() => toast.error('Could not load projects'))
      .finally(() => setLoading(false));
  }, []);

  const statusCounts = ['planning', 'in-progress', 'on-hold', 'completed'].map((status) => ({
    status,
    count: projects.filter((p) => p.status === status).length,
  }));

  const totalBudget = projects.reduce((sum, p) => sum + (p.estimatedBudget || 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
      <p className="mb-8 text-gray-500 dark:text-gray-400 capitalize">Role: {user?.role}</p>

      <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Building2} label="Total Projects" value={projects.length} accent="bg-primary-600" />
        <StatCard
          icon={ListChecks}
          label="In Progress"
          value={projects.filter((p) => p.status === 'in-progress').length}
          accent="bg-amber-500"
        />
        <StatCard
          icon={Users}
          label="Completed"
          value={projects.filter((p) => p.status === 'completed').length}
          accent="bg-green-600"
        />
        <StatCard
          icon={DollarSign}
          label="Total Budget"
          value={`$${totalBudget.toLocaleString()}`}
          accent="bg-purple-600"
        />
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">Projects by Status</h2>
        {loading ? (
          <p className="text-gray-500">Loading chart...</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statusCounts}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
