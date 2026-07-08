import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { UserPlus, Mail, Lock, User, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: 'worker',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone,
        role: values.role,
      });
      toast.success('Account created! Welcome aboard.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-12 dark:from-gray-950 dark:to-gray-900">
      <div className="card w-full max-w-md">
        <h1 className="mb-1 text-2xl font-bold">Create Account</h1>
        <p className="mb-6 text-gray-500 dark:text-gray-400">
          Join Construction Tracker
          {selectedRole && ` as a ${selectedRole}`}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium">
              <User size={16} /> Full Name
            </label>
            <input
              className="input-field"
              placeholder="John Doe"
              {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Too short' } })}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium">
              <Mail size={16} /> Email
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium">
              <Phone size={16} /> Phone (optional)
            </label>
            <input className="input-field" placeholder="+1 555 000 1234" {...register('phone')} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <select
              className="input-field"
              {...register('role', { required: 'Role is required' })}
            >
              <option value="worker">Worker</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>}
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium">
              <Lock size={16} /> Password
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="At least 6 characters"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Must be at least 6 characters' },
              })}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium">
              <Lock size={16} /> Confirm Password
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="Re-enter password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === watch('password') || 'Passwords do not match',
              })}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            <UserPlus size={18} /> {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
