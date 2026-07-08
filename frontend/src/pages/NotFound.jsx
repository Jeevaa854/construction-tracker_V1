import { Link } from 'react-router-dom';
import { HardHat } from 'lucide-react';

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 text-center dark:from-gray-950 dark:to-gray-900">
    <HardHat size={48} className="mb-4 text-primary-600" />
    <h1 className="text-6xl font-extrabold">404</h1>
    <p className="mt-2 mb-6 text-gray-600 dark:text-gray-300">
      This page doesn't exist — maybe it's still under construction.
    </p>
    <Link to="/" className="btn-primary">Back to Home</Link>
  </div>
);

export default NotFound;
