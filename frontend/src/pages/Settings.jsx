import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Lock, Bell } from 'lucide-react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const Settings = () => {
  const { user, setUser } = useAuth();
  const [changingPassword, setChangingPassword] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefs, setPrefs] = useState(
    user?.notificationPreferences || {
      email: true,
      inApp: true,
      deadlineAlerts: true,
      budgetAlerts: true,
    }
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onChangePassword = async (values) => {
    setChangingPassword(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Password changed successfully');
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const togglePref = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const savePrefs = async () => {
    setPrefsSaving(true);
    try {
      const { data } = await api.put(`/users/${user._id}`, { notificationPreferences: prefs });
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Notification preferences saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setPrefsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="card">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Lock size={18} /> Change Password
        </h2>
        <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Current Password</label>
            <input
              type="password"
              className="input-field"
              {...register('currentPassword', { required: 'Required' })}
            />
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.currentPassword.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">New Password</label>
            <input
              type="password"
              className="input-field"
              {...register('newPassword', {
                required: 'Required',
                minLength: { value: 6, message: 'Must be at least 6 characters' },
              })}
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.newPassword.message}</p>
            )}
          </div>
          <button type="submit" disabled={changingPassword} className="btn-primary w-full">
            {changingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Bell size={18} /> Notification Preferences
        </h2>
        <div className="space-y-3">
          {[
            { key: 'email', label: 'Email notifications' },
            { key: 'inApp', label: 'In-app notifications' },
            { key: 'deadlineAlerts', label: 'Deadline alerts' },
            { key: 'budgetAlerts', label: 'Budget alerts' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between text-sm">
              {label}
              <input
                type="checkbox"
                checked={!!prefs[key]}
                onChange={() => togglePref(key)}
                className="h-5 w-5 accent-primary-600"
              />
            </label>
          ))}
        </div>
        <button onClick={savePrefs} disabled={prefsSaving} className="btn-primary mt-4 w-full">
          {prefsSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
