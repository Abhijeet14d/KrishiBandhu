import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, MessageSquare, FileText, Plus, Pencil, Trash2,
  Loader2, Search, ChevronDown, X, ExternalLink, Shield, BarChart3,
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

  // Dark mode
  const [darkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Stats
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Schemes
  const [schemes, setSchemes] = useState([]);
  const [isLoadingSchemes, setIsLoadingSchemes] = useState(true);
  const [schemeFilter, setSchemeFilter] = useState('all'); // all, central, state

  // Users
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [showUsers, setShowUsers] = useState(false);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);
  const [form, setForm] = useState(emptySchemeForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState('schemes'); // schemes, users

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
    if (showUsers || activeTab === 'users') {
      fetchUsers(userSearch);
    }
  }, [showUsers, activeTab]);

  const handleUserSearch = (e) => {
    e.preventDefault();
    fetchUsers(userSearch);
  };

  // ─── Form Handlers ───────────────────────────────────────────────────────

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
      // Clear state if switching to central
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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                </div>
                <p className="text-indigo-200 text-sm mt-1">Manage users, schemes & monitor platform</p>
              </div>
            </div>
            <div className="text-right text-sm text-indigo-200">
              <p>Signed in as <span className="font-semibold text-white">{user?.name}</span></p>
              <p className="text-xs">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Cards */}
        {isLoadingStats ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<Users className="w-6 h-6" />} label="Total Users" value={stats.totalUsers} color="blue" />
            <StatCard icon={<MessageSquare className="w-6 h-6" />} label="Total Queries" value={stats.totalQueries} color="green" />
            <StatCard icon={<BarChart3 className="w-6 h-6" />} label="Conversations" value={stats.totalConversations} color="purple" />
            <StatCard icon={<FileText className="w-6 h-6" />} label="Active Schemes" value={stats.activeSchemes} color="orange" />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('schemes')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'schemes'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Government Schemes
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Users
          </button>
        </div>

        {/* ─── Schemes Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'schemes' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Government Schemes</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage central and state-specific schemes for farmers</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Filter */}
                <select
                  value={schemeFilter}
                  onChange={(e) => setSchemeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                  <option value="all">All Types</option>
                  <option value="central">Central</option>
                  <option value="state">State</option>
                </select>
                <button
                  onClick={openCreateForm}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Scheme
                </button>
              </div>
            </div>

            {isLoadingSchemes ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : schemes.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No schemes found</p>
                <p className="text-sm">Click "Add Scheme" to create the first one</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">Title</th>
                      <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">Type</th>
                      <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium hidden md:table-cell">Category</th>
                      <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium hidden lg:table-cell">State</th>
                      <th className="text-center py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">Active</th>
                      <th className="text-center py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemes.map((scheme) => (
                      <tr key={scheme._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-2">
                          <div className="font-medium text-gray-900 dark:text-white">{scheme.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{scheme.description}</div>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            scheme.type === 'central'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {scheme.type === 'central' ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                            {scheme.type === 'central' ? 'Central' : 'State'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-600 dark:text-gray-300 hidden md:table-cell">{scheme.category || '—'}</td>
                        <td className="py-3 px-2 text-gray-600 dark:text-gray-300 hidden lg:table-cell">{scheme.state || 'All India'}</td>
                        <td className="py-3 px-2 text-center">
                          <button onClick={() => handleToggleActive(scheme)} title={scheme.isActive ? 'Deactivate' : 'Activate'}>
                            {scheme.isActive
                              ? <ToggleRight className="w-6 h-6 text-green-500 mx-auto" />
                              : <ToggleLeft className="w-6 h-6 text-gray-400 mx-auto" />
                            }
                          </button>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-center gap-2">
                            {scheme.link && (
                              <a href={scheme.link} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" title="Open portal">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button onClick={() => openEditForm(scheme)} className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(scheme)} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400" title="Delete">
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
        )}

        {/* ─── Users Tab ───────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registered Users</h2>
              <form onSubmit={handleUserSearch} className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 w-60"
                  />
                </div>
                <button type="submit" className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Search
                </button>
              </form>
            </div>

            {isLoadingUsers ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-center py-8 text-gray-500 dark:text-gray-400">No users found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">Name</th>
                      <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">Email</th>
                      <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium hidden md:table-cell">Phone</th>
                      <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium hidden lg:table-cell">State</th>
                      <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium hidden lg:table-cell">Role</th>
                      <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">{u.name}</td>
                        <td className="py-3 px-2 text-gray-600 dark:text-gray-300">{u.email}</td>
                        <td className="py-3 px-2 text-gray-600 dark:text-gray-300 hidden md:table-cell">{u.phone || '—'}</td>
                        <td className="py-3 px-2 text-gray-600 dark:text-gray-300 hidden lg:table-cell">{u.location?.state || '—'}</td>
                        <td className="py-3 px-2 hidden lg:table-cell">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-500 dark:text-gray-400 text-xs">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Create / Edit Scheme Modal ──────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingScheme ? 'Edit Scheme' : 'Add New Scheme'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g. PM-KISAN Samman Nidhi"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Brief description of the scheme"
                />
              </div>

              {/* Type + State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="central">Central (All India)</option>
                    <option value="state">State-Specific</option>
                  </select>
                </div>
                {form.type === 'state' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State *</label>
                    <select
                      name="state"
                      value={form.state}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <input
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g. Income Support, Crop Insurance"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ministry</label>
                  <input
                    name="ministry"
                    value={form.ministry}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g. Ministry of Agriculture"
                  />
                </div>
              </div>

              {/* Benefits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Benefits</label>
                <input
                  name="benefits"
                  value={form.benefits}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g. ₹6,000 per year in 3 installments"
                />
              </div>

              {/* Eligibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Eligibility</label>
                <input
                  name="eligibility"
                  value={form.eligibility}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g. All land-holding farmer families"
                />
              </div>

              {/* Government Portal Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Government Portal Link
                </label>
                <input
                  name="link"
                  value={form.link}
                  onChange={handleFormChange}
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://pmkisan.gov.in"
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className="focus:outline-none"
                >
                  {form.isActive
                    ? <ToggleRight className="w-8 h-8 text-green-500" />
                    : <ToggleLeft className="w-8 h-8 text-gray-400" />
                  }
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {form.isActive ? 'Visible to farmers' : 'Hidden from farmers'}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingScheme ? 'Update Scheme' : 'Create Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ───────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Scheme</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Stat Card Component ──────────────────────────────────────────────────────

const colorMap = {
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorMap[color]}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value?.toLocaleString() ?? 0}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  </div>
);

export default AdminDashboard;
