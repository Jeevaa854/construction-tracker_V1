import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Lock, KeyRound } from 'lucide-react';
import api from '../api/axios.js';

const ResetPassword = () => {
  const { resetToken } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const onSubmit = async ({ password }) => {
    setSubmitting(true);
    try {
      await api.put(`/auth/reset-password/${resetToken}`, { password });
      toast.success('Password reset successfully. Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset link is invalid or expired');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 dark:from-gray-950 dark:to-gray-900">
      <div className="card w-full max-w-md">
        <h1 className="mb-1 text-2xl font-bold">Reset Password</h1>
        <p className="mb-6 text-gray-500 dark:text-gray-400">Choose a new password below.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium">
              <Lock size={16} /> New Password
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
                validate: (value) => value === watch('password') || 'Passwords do not match',
              })}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            <KeyRound size={18} /> {submitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link to="/login" className="font-medium text-primary-600 hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
