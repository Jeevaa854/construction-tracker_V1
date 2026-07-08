import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { User, Camera } from 'lucide-react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: { name: user?.name, phone: user?.phone },
  });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const { data } = await api.put(`/users/${user._id}`, values);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const onAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const { data } = await api.put('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">Profile</h1>

      <div className="card mb-6 flex items-center gap-5">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary-100 dark:bg-primary-900/40">
            {user?.avatar?.url ? (
              <img src={user.avatar.url} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <User size={32} className="text-primary-600" />
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-primary-600 p-1.5 text-white shadow">
            <Camera size={14} />
            <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} disabled={uploading} />
          </label>
        </div>
        <div>
          <p className="text-lg font-semibold">{user?.name}</p>
          <p className="text-sm capitalize text-gray-500 dark:text-gray-400">{user?.role}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold">Edit Details</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Full Name</label>
            <input className="input-field" {...register('name')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input className="input-field" {...register('phone')} />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
