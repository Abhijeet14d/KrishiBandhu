import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, MessageSquare, FileText, Plus, Pencil, Trash2,
  Loader2, Search, X, ExternalLink, Shield, BarChart3,
  Globe, MapPin, ToggleLeft, ToggleRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import adminService from '../services/admin.service';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const emptySchemeForm = {
  title: '',
  description: '',
  type: 'central',
  state: '',
  category: '',
  benefits: '',
  eligibility: '',
  link: '',
  ministry: '',
  isActive: true
};

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Stats
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Schemes
  const [schemes, setSchemes] = useState([]);
  const [isLoadingSchemes, setIsLoadingSchemes] = useState(true);
  const [schemeFilter, setSchemeFilter] = useState('all');

  // Users
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);
  const [form, setForm] = useState(emptySchemeForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState('schemes');

  useEffect(() => {
    fetchStats();
    fetchSchemes();
  }, []);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const res = await adminService.getAdminStats();
      if (res.success) setStats(res.data);
    } catch (err) {
      toast.error('Failed to load stats');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchSchemes = async () => {
    setIsLoadingSchemes(true);
    try {
      const params = {};
      if (schemeFilter !== 'all') params.type = schemeFilter;
      const res = await adminService.getAdminSchemes(params);
      if (res.success) setSchemes(res.data);
    } catch (err) {
      toast.error('Failed to load schemes');
    } finally {
      setIsLoadingSchemes(false);
    }
  };

  const fetchUsers = async (search = '') => {
    setIsLoadingUsers(true);
    try {
      const res = await adminService.getAllUsers({ search, limit: 50 });
      if (res.success) setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [schemeFilter]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(userSearch);
    }
  }, [activeTab]);

  const handleUserSearch = (e) => {
    e.preventDefault();
    fetchUsers(userSearch);
  };

  // Form Handlers
  const openCreateForm = () => {
    setEditingScheme(null);
    setForm(emptySchemeForm);
    setShowForm(true);
  };

  const openEditForm = (scheme) => {
    setEditingScheme(scheme);
    setForm({
      title: scheme.title,
      description: scheme.description,
      type: scheme.type,
      state: scheme.state || '',
      category: scheme.category || '',
      benefits: scheme.benefits || '',
      eligibility: scheme.eligibility || '',
      link: scheme.link || '',
      ministry: scheme.ministry || '',
      isActive: scheme.isActive
    });
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'type' && value === 'central' ? { state: '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    if (form.type === 'state' && !form.state.trim()) {
      toast.error('Please select a state for state-level schemes');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingScheme) {
        const res = await adminService.updateScheme(editingScheme._id, form);
        if (res.success) {
          toast.success('Scheme updated');
          setShowForm(false);
          fetchSchemes();
        }
      } else {
        const res = await adminService.createScheme(form);
        if (res.success) {
          toast.success('Scheme created');
          setShowForm(false);
          fetchSchemes();
          fetchStats();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save scheme');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await adminService.deleteScheme(deleteTarget._id);
      if (res.success) {
        toast.success('Scheme deleted');
        setDeleteTarget(null);
        fetchSchemes();
        fetchStats();
      }
    } catch (err) {
      toast.error('Failed to delete scheme');
    }
  };

  const handleToggleActive = async (scheme) => {
    try {
      const res = await adminService.updateScheme(scheme._id, { isActive: !scheme.isActive });
      if (res.success) {
        toast.success(scheme.isActive ? 'Scheme deactivated' : 'Scheme activated');
        fetchSchemes();
      }
    } catch (err) {
      toast.error('Failed to update scheme');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="topbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="btn-ghost"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-neutral-400" />
                  <h1 className="text-lg font-semibold text-neutral-900">Admin Dashboard</h1>
                </div>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="text-neutral-900 font-medium">{user?.name}</p>
              <p className="text-xs text-neutral-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats Cards */}
        {isLoadingStats ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fadeIn">
            <StatCard 
              icon={<Users className="w-5 h-5" />} 
              label="Total Users" 
              value={stats.totalUsers} 
            />
            <StatCard 
              icon={<MessageSquare className="w-5 h-5" />} 
              label="Total Queries" 
              value={stats.totalQueries} 
            />
            <StatCard 
              icon={<BarChart3 className="w-5 h-5" />} 
              label="Conversations" 
              value={stats.totalConversations} 
            />
            <StatCard 
              icon={<FileText className="w-5 h-5" />} 
              label="Active Schemes" 
              value={stats.activeSchemes} 
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-neutral-100 p-1 rounded-sm w-fit">
          <button
            onClick={() => setActiveTab('schemes')}
            className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'schemes'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Schemes
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
        </div>

        {/* Schemes Tab */}
        {activeTab === 'schemes' && (
          <div className="card animate-fadeIn">
            <div className="card-header flex-col sm:flex-row gap-4">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">Government Schemes</h2>
                <p className="text-sm text-neutral-500 mt-0.5">Manage central and state-specific schemes</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={schemeFilter}
                  onChange={(e) => setSchemeFilter(e.target.value)}
                  className="select text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="central">Central</option>
                  <option value="state">State</option>
                </select>
                <button onClick={openCreateForm} className="btn-primary">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Scheme
                </button>
              </div>
            </div>

            <div className="card-body p-0">
              {isLoadingSchemes ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                </div>
              ) : schemes.length === 0 ? (
                <div className="empty-state py-12">
                  <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-600 font-medium">No schemes found</p>
                  <p className="text-sm text-neutral-500 mt-1">Click "Add Scheme" to create one</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 px-4 text-neutral-500 font-medium text-xs uppercase tracking-wider">Title</th>
                        <th className="text-left py-3 px-4 text-neutral-500 font-medium text-xs uppercase tracking-wider">Type</th>
                        <th className="text-left py-3 px-4 text-neutral-500 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Category</th>
                        <th className="text-left py-3 px-4 text-neutral-500 font-medium text-xs uppercase tracking-wider hidden lg:table-cell">State</th>
                        <th className="text-center py-3 px-4 text-neutral-500 font-medium text-xs uppercase tracking-wider">Status</th>
                        <th className="text-center py-3 px-4 text-neutral-500 font-medium text-xs uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schemes.map((scheme) => (
                        <tr key={scheme._id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-neutral-900">{scheme.title}</div>
                            <div className="text-xs text-neutral-500 line-clamp-1 max-w-xs">{scheme.description}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`chip ${scheme.type === 'central' ? 'chip-active' : ''}`}>
                              {scheme.type === 'central' ? (
                                <Globe className="w-3 h-3 mr-1" />
                              ) : (
                                <MapPin className="w-3 h-3 mr-1" />
                              )}
                              {scheme.type === 'central' ? 'Central' : 'State'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-neutral-600 hidden md:table-cell">
                            {scheme.category || '—'}
                          </td>
                          <td className="py-3 px-4 text-neutral-600 hidden lg:table-cell">
                            {scheme.state || 'All India'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button 
                              onClick={() => handleToggleActive(scheme)} 
                              title={scheme.isActive ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
                              className="inline-flex items-center justify-center"
                            >
                              {scheme.isActive ? (
                                <ToggleRight className="w-6 h-6 text-primary-500" />
                              ) : (
                                <ToggleLeft className="w-6 h-6 text-neutral-400" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1">
                              {scheme.link && (
                                <a 
                                  href={scheme.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="btn-icon"
                                  title="Open portal"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                              <button 
                                onClick={() => openEditForm(scheme)} 
                                className="btn-icon"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setDeleteTarget(scheme)} 
                                className="btn-icon hover:!text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="card animate-fadeIn">
            <div className="card-header flex-col sm:flex-row gap-4">
              <h2 className="text-base font-semibold text-neutral-900">Registered Users</h2>
              <form onSubmit={handleUserSearch} className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="input pl-9 w-60"
                  />
                </div>
                <button type="submit" className="btn-primary">
                  Search
                </button>
              </form>
            </div>

            <div className="card-body p-0">
              {isLoadingUsers ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                </div>
              ) : users.length === 0 ? (
                <div className="empty-state py-12">
                  <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-600 font-medium">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 px-4 text-neutral-500 font-medium text-xs uppercase tracking-wider">Name</th>
                        <th className="text-left py-3 px-4 text-neutral-500 font-medium text-xs uppercase tracking-wider">Email</th>
                        <th className="text-left py-3 px-4 text-neutral-500 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Phone</th>
                        <th className="text-left py-3 px-4 text-neutral-500 font-medium text-xs uppercase tracking-wider hidden lg:table-cell">State</th>
                        <th className="text-left py-3 px-4 text-neutral-500 font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Role</th>
                        <th className="text-left py-3 px-4 text-neutral-500 font-medium text-xs uppercase tracking-wider">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                          <td className="py-3 px-4 font-medium text-neutral-900">{u.name}</td>
                          <td className="py-3 px-4 text-neutral-600">{u.email}</td>
                          <td className="py-3 px-4 text-neutral-600 hidden md:table-cell">{u.phone || '—'}</td>
                          <td className="py-3 px-4 text-neutral-600 hidden lg:table-cell">{u.location?.state || '—'}</td>
                          <td className="py-3 px-4 hidden lg:table-cell">
                            <span className={`chip ${u.role === 'admin' ? 'chip-active' : ''}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-neutral-500 text-xs">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Create / Edit Scheme Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div 
            className="modal w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h3 className="text-base font-semibold text-neutral-900">
                {editingScheme ? 'Edit Scheme' : 'Add New Scheme'}
              </h3>
              <button onClick={() => setShowForm(false)} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  required
                  className="input"
                  placeholder="e.g. PM-KISAN Samman Nidhi"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  required
                  rows={3}
                  className="input resize-none"
                  placeholder="Brief description of the scheme"
                />
              </div>

              {/* Type + State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleFormChange}
                    className="select"
                  >
                    <option value="central">Central (All India)</option>
                    <option value="state">State-Specific</option>
                  </select>
                </div>
                {form.type === 'state' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="state"
                      value={form.state}
                      onChange={handleFormChange}
                      required
                      className="select"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Category + Ministry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Category</label>
                  <input
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    className="input"
                    placeholder="e.g. Income Support"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Ministry</label>
                  <input
                    name="ministry"
                    value={form.ministry}
                    onChange={handleFormChange}
                    className="input"
                    placeholder="e.g. Ministry of Agriculture"
                  />
                </div>
              </div>

              {/* Benefits */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Benefits</label>
                <input
                  name="benefits"
                  value={form.benefits}
                  onChange={handleFormChange}
                  className="input"
                  placeholder="e.g. ₹6,000 per year in 3 installments"
                />
              </div>

              {/* Eligibility */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Eligibility</label>
                <input
                  name="eligibility"
                  value={form.eligibility}
                  onChange={handleFormChange}
                  className="input"
                  placeholder="e.g. All land-holding farmer families"
                />
              </div>

              {/* Portal Link */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Government Portal Link</label>
                <input
                  name="link"
                  value={form.link}
                  onChange={handleFormChange}
                  type="url"
                  className="input"
                  placeholder="https://pmkisan.gov.in"
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3 py-2">
                <label className="text-sm font-medium text-neutral-700">Status</label>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className="focus:outline-none"
                >
                  {form.isActive ? (
                    <ToggleRight className="w-7 h-7 text-primary-500" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-neutral-400" />
                  )}
                </button>
                <span className="text-sm text-neutral-500">
                  {form.isActive ? 'Active - Visible to farmers' : 'Inactive - Hidden'}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  {editingScheme ? 'Update Scheme' : 'Create Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div 
            className="modal w-full max-w-md animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-50 rounded-sm flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-base font-semibold text-neutral-900">Delete Scheme</h3>
              </div>
              <p className="text-sm text-neutral-600 mb-6">
                Are you sure you want to delete <span className="font-medium text-neutral-900">"{deleteTarget.title}"</span>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="btn-primary bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value }) => (
  <div className="card p-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-neutral-100 rounded-sm flex items-center justify-center text-neutral-600">
        {icon}
      </div>
      <div>
        <p className="text-xl font-semibold text-neutral-900">{value?.toLocaleString() ?? 0}</p>
        <p className="text-xs text-neutral-500">{label}</p>
      </div>
    </div>
  </div>
);

export default AdminDashboard;
