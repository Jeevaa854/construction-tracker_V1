import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HardHat, BarChart3, Users, ClipboardList } from 'lucide-react';

const features = [
  { icon: ClipboardList, title: 'Task Management', desc: 'Assign, track, and prioritize tasks across every project site.' },
  { icon: BarChart3, title: 'Budget & Progress', desc: 'Real-time budget tracking and milestone-based progress reporting.' },
  { icon: Users, title: 'Team Collaboration', desc: 'Role-based access for admins, managers, and on-site workers.' },
];

const Landing = () => {
  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
        >
          <HardHat size={32} className="text-primary-600" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl"
        >
          Build Smarter with <span className="text-primary-600">Construction Tracker</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-xl text-lg text-gray-600 dark:text-gray-300"
        >
          A complete project tracking system for construction teams — manage tasks,
          resources, budgets, and progress from one dashboard.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex gap-4"
        >
          <Link to="/register" className="btn-primary">Get Started</Link>
          <Link to="/login" className="btn-secondary">Sign In</Link>
        </motion.div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
              className="card text-left"
            >
              <Icon className="mb-4 text-primary-600" size={28} />
              <h3 className="mb-2 text-xl font-semibold">{title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Landing;
