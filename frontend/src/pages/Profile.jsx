import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  ArrowLeft, 
  Edit2, 
  Save, 
  X,
  Lock,
  Loader2,
  MapPin,
  Tractor,
  Droplets,
  Leaf
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { authService } from '../services/auth.service';
import dataService from '../services/data.service';

// Indian states list
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh'
];

const IRRIGATION_TYPES = [
  { value: '', label: 'Select Irrigation Type' },
  { value: 'rainfed', label: 'Rainfed' },
  { value: 'canal', label: 'Canal' },
  { value: 'tubewell', label: 'Tubewell/Borewell' },
  { value: 'drip', label: 'Drip Irrigation' },
  { value: 'sprinkler', label: 'Sprinkler' },
  { value: 'mixed', label: 'Mixed' }
];

const SOIL_TYPES = [
  { value: '', label: 'Select Soil Type' },
  { value: 'clay', label: 'Clay' },
  { value: 'sandy', label: 'Sandy' },
  { value: 'loamy', label: 'Loamy' },
  { value: 'black', label: 'Black Soil' },
  { value: 'red', label: 'Red Soil' },
  { value: 'alluvial', label: 'Alluvial' },
  { value: 'other', label: 'Other' }
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isEditingFarming, setIsEditingFarming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });

  const [locationData, setLocationData] = useState({
    state: user?.location?.state || '',
    district: user?.location?.district || '',
    city: user?.location?.city || '',
    village: user?.location?.village || '',
    pincode: user?.location?.pincode || ''
  });

  const [farmingData, setFarmingData] = useState({
    landSize: user?.farmingProfile?.landSize || '',
    primaryCrops: user?.farmingProfile?.primaryCrops?.join(', ') || '',
    irrigationType: user?.farmingProfile?.irrigationType || '',
    soilType: user?.farmingProfile?.soilType || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLocationChange = (e) => {
    setLocationData({
      ...locationData,
      [e.target.name]: e.target.value
    });
  };

  const handleFarmingChange = (e) => {
    setFarmingData({
      ...farmingData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setIsLoading(true);
      const response = await authService.updateProfile(formData);
      setUser(response.user);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!locationData.state) {
      toast.error('Please select your state');
      return;
    }

    try {
      setIsLoading(true);
      const response = await dataService.updateUserLocation(locationData);
      // Update user in store with new location
      setUser({ ...user, location: response.location });
      setIsEditingLocation(false);
      toast.success('Location updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFarming = async () => {
    try {
      setIsLoading(true);
      const profileData = {
        landSize: parseFloat(farmingData.landSize) || 0,
        primaryCrops: farmingData.primaryCrops.split(',').map(c => c.trim()).filter(c => c),
        irrigationType: farmingData.irrigationType,
        soilType: farmingData.soilType
      };
      const response = await dataService.updateFarmingProfile(profileData);
      // Update user in store with new farming profile
      setUser({ ...user, farmingProfile: response.farmingProfile });
      setIsEditingFarming(false);
      toast.success('Farming profile updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update farming profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || ''
    });
    setIsEditing(false);
  };

  const cancelLocationEdit = () => {
    setLocationData({
      state: user?.location?.state || '',
      district: user?.location?.district || '',
      city: user?.location?.city || '',
      village: user?.location?.village || '',
      pincode: user?.location?.pincode || ''
    });
    setIsEditingLocation(false);
  };

  const cancelFarmingEdit = () => {
    setFarmingData({
      landSize: user?.farmingProfile?.landSize || '',
      primaryCrops: user?.farmingProfile?.primaryCrops?.join(', ') || '',
      irrigationType: user?.farmingProfile?.irrigationType || '',
      soilType: user?.farmingProfile?.soilType || ''
    });
    setIsEditingFarming(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-12 text-white">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-12 h-12" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{user?.name}</h1>
                <p className="text-green-100 mt-1">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={cancelEdit}
                    className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{user?.name}</span>
                  </div>
                )}
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{user?.email}</span>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Verified</span>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{user?.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Change Password Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Lock className="w-5 h-5 text-gray-600 mr-3" />
                <span className="text-gray-700">Change Password</span>
              </button>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mt-6">
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <MapPin className="w-6 h-6 text-green-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">Location</h2>
              </div>
              {!isEditingLocation ? (
                <button
                  onClick={() => setIsEditingLocation(true)}
                  className="flex items-center px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Location
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={cancelLocationEdit}
                    className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveLocation}
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save
                  </button>
                </div>
              )}
            </div>

            {!user?.location?.state && !isEditingLocation && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Set your location to get personalized market prices, weather updates, and government schemes for your area.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                {isEditingLocation ? (
                  <select
                    name="state"
                    value={locationData.state}
                    onChange={handleLocationChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {user?.location?.state || 'Not set'}
                  </div>
                )}
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                {isEditingLocation ? (
                  <input
                    type="text"
                    name="district"
                    value={locationData.district}
                    onChange={handleLocationChange}
                    placeholder="Enter district"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {user?.location?.district || 'Not set'}
                  </div>
                )}
              </div>

              {/* City/Town */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City/Town</label>
                {isEditingLocation ? (
                  <input
                    type="text"
                    name="city"
                    value={locationData.city}
                    onChange={handleLocationChange}
                    placeholder="Enter city or town"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {user?.location?.city || 'Not set'}
                  </div>
                )}
              </div>

              {/* Village */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Village</label>
                {isEditingLocation ? (
                  <input
                    type="text"
                    name="village"
                    value={locationData.village}
                    onChange={handleLocationChange}
                    placeholder="Enter village name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {user?.location?.village || 'Not set'}
                  </div>
                )}
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                {isEditingLocation ? (
                  <input
                    type="text"
                    name="pincode"
                    value={locationData.pincode}
                    onChange={handleLocationChange}
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {user?.location?.pincode || 'Not set'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Farming Profile Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mt-6">
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <Tractor className="w-6 h-6 text-green-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">Farming Profile</h2>
              </div>
              {!isEditingFarming ? (
                <button
                  onClick={() => setIsEditingFarming(true)}
                  className="flex items-center px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={cancelFarmingEdit}
                    className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveFarming}
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Land Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Leaf className="w-4 h-4 inline mr-1" />
                  Land Size (in acres)
                </label>
                {isEditingFarming ? (
                  <input
                    type="number"
                    name="landSize"
                    value={farmingData.landSize}
                    onChange={handleFarmingChange}
                    placeholder="Enter land size"
                    step="0.5"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {user?.farmingProfile?.landSize ? `${user.farmingProfile.landSize} acres` : 'Not set'}
                  </div>
                )}
              </div>

              {/* Irrigation Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Droplets className="w-4 h-4 inline mr-1" />
                  Irrigation Type
                </label>
                {isEditingFarming ? (
                  <select
                    name="irrigationType"
                    value={farmingData.irrigationType}
                    onChange={handleFarmingChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {IRRIGATION_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900 capitalize">
                    {user?.farmingProfile?.irrigationType || 'Not set'}
                  </div>
                )}
              </div>

              {/* Soil Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Soil Type</label>
                {isEditingFarming ? (
                  <select
                    name="soilType"
                    value={farmingData.soilType}
                    onChange={handleFarmingChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {SOIL_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900 capitalize">
                    {user?.farmingProfile?.soilType || 'Not set'}
                  </div>
                )}
              </div>

              {/* Primary Crops */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Crops</label>
                {isEditingFarming ? (
                  <input
                    type="text"
                    name="primaryCrops"
                    value={farmingData.primaryCrops}
                    onChange={handleFarmingChange}
                    placeholder="e.g., Wheat, Rice, Cotton (comma separated)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {user?.farmingProfile?.primaryCrops?.length > 0 
                      ? user.farmingProfile.primaryCrops.join(', ')
                      : 'Not set'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Change Password</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
