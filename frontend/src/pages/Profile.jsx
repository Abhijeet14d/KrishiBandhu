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
  Leaf,
  Shield,
  ChevronRight
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
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="topbar">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-ghost"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-base font-semibold text-neutral-900">Profile</h1>
          <div className="w-20" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile Header Card */}
        <div className="card animate-fadeIn mb-6">
          <div className="p-6 sm:p-8 border-b border-neutral-200">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-neutral-100 rounded-sm flex items-center justify-center flex-shrink-0">
                <User className="w-10 h-10 text-neutral-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-neutral-900 truncate">
                  {user?.name}
                </h2>
                <p className="text-sm text-neutral-500 truncate mt-1">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information Card */}
        <div className="card animate-fadeIn mb-6" style={{ animationDelay: '50ms' }}>
          <div className="card-header">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-neutral-400" />
              <h3 className="text-base font-semibold text-neutral-900">Personal Information</h3>
            </div>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="btn-ghost">
                <Edit2 className="w-4 h-4 mr-1.5" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={cancelEdit} className="btn-ghost">
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile} 
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-1.5" />
                  )}
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="card-body space-y-5">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Full Name
              </label>
              {isEditing ? (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input pl-10"
                    placeholder="Enter your full name"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-neutral-50 rounded-sm border border-neutral-200">
                  <User className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-900">{user?.name}</span>
                </div>
              )}
            </div>

            {/* Email Field (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-3 px-3 py-2.5 bg-neutral-50 rounded-sm border border-neutral-200">
                <Mail className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-900 flex-1">{user?.email}</span>
                <span className="chip text-xs">Verified</span>
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Phone Number
              </label>
              {isEditing ? (
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input pl-10"
                    placeholder="Enter 10-digit phone number"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-neutral-50 rounded-sm border border-neutral-200">
                  <Phone className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-900">{user?.phone || 'Not set'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="card animate-fadeIn mb-6" style={{ animationDelay: '100ms' }}>
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-neutral-400" />
              <h3 className="text-base font-semibold text-neutral-900">Security</h3>
            </div>
          </div>
          <div className="card-body">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between px-3 py-3 bg-neutral-50 hover:bg-neutral-100 rounded-sm border border-neutral-200 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-700">Change Password</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Location Card */}
        <div className="card animate-fadeIn mb-6" style={{ animationDelay: '150ms' }}>
          <div className="card-header">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-neutral-400" />
              <h3 className="text-base font-semibold text-neutral-900">Location</h3>
            </div>
            {!isEditingLocation ? (
              <button onClick={() => setIsEditingLocation(true)} className="btn-ghost">
                <Edit2 className="w-4 h-4 mr-1.5" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={cancelLocationEdit} className="btn-ghost">
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </button>
                <button 
                  onClick={handleSaveLocation} 
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-1.5" />
                  )}
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="card-body">
            {!user?.location?.state && !isEditingLocation && (
              <div className="bg-amber-50 border border-amber-200 rounded-sm p-3 mb-5">
                <p className="text-amber-800 text-sm">
                  Set your location to get personalized market prices, weather updates, and government schemes for your area.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* State */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                {isEditingLocation ? (
                  <select
                    name="state"
                    value={locationData.state}
                    onChange={handleLocationChange}
                    className="select"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2.5 bg-neutral-50 rounded-sm border border-neutral-200 text-neutral-900 text-sm">
                    {user?.location?.state || 'Not set'}
                  </div>
                )}
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  District
                </label>
                {isEditingLocation ? (
                  <input
                    type="text"
                    name="district"
                    value={locationData.district}
                    onChange={handleLocationChange}
                    placeholder="Enter district"
                    className="input"
                  />
                ) : (
                  <div className="px-3 py-2.5 bg-neutral-50 rounded-sm border border-neutral-200 text-neutral-900 text-sm">
                    {user?.location?.district || 'Not set'}
                  </div>
                )}
              </div>

              {/* City/Town */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  City / Town
                </label>
                {isEditingLocation ? (
                  <input
                    type="text"
                    name="city"
                    value={locationData.city}
                    onChange={handleLocationChange}
                    placeholder="Enter city or town"
                    className="input"
                  />
                ) : (
                  <div className="px-3 py-2.5 bg-neutral-50 rounded-sm border border-neutral-200 text-neutral-900 text-sm">
                    {user?.location?.city || 'Not set'}
                  </div>
                )}
              </div>

              {/* Village */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Village
                </label>
                {isEditingLocation ? (
                  <input
                    type="text"
                    name="village"
                    value={locationData.village}
                    onChange={handleLocationChange}
                    placeholder="Enter village name"
                    className="input"
                  />
                ) : (
                  <div className="px-3 py-2.5 bg-neutral-50 rounded-sm border border-neutral-200 text-neutral-900 text-sm">
                    {user?.location?.village || 'Not set'}
                  </div>
                )}
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Pincode
                </label>
                {isEditingLocation ? (
                  <input
                    type="text"
                    name="pincode"
                    value={locationData.pincode}
                    onChange={handleLocationChange}
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                    className="input"
                  />
                ) : (
                  <div className="px-3 py-2.5 bg-neutral-50 rounded-sm border border-neutral-200 text-neutral-900 text-sm">
                    {user?.location?.pincode || 'Not set'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Farming Profile Card */}
        <div className="card animate-fadeIn" style={{ animationDelay: '200ms' }}>
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Tractor className="w-4 h-4 text-neutral-400" />
              <h3 className="text-base font-semibold text-neutral-900">Farming Profile</h3>
            </div>
            {!isEditingFarming ? (
              <button onClick={() => setIsEditingFarming(true)} className="btn-ghost">
                <Edit2 className="w-4 h-4 mr-1.5" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={cancelFarmingEdit} className="btn-ghost">
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </button>
                <button 
                  onClick={handleSaveFarming} 
                  disabled={isLoading}
                  className="btn-primary"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-1.5" />
                  )}
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Land Size */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <Leaf className="w-3.5 h-3.5 inline mr-1.5" />
                  Land Size (acres)
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
                    className="input"
                  />
                ) : (
                  <div className="px-3 py-2.5 bg-neutral-50 rounded-sm border border-neutral-200 text-neutral-900 text-sm">
                    {user?.farmingProfile?.landSize ? `${user.farmingProfile.landSize} acres` : 'Not set'}
                  </div>
                )}
              </div>

              {/* Irrigation Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <Droplets className="w-3.5 h-3.5 inline mr-1.5" />
                  Irrigation Type
                </label>
                {isEditingFarming ? (
                  <select
                    name="irrigationType"
                    value={farmingData.irrigationType}
                    onChange={handleFarmingChange}
                    className="select"
                  >
                    {IRRIGATION_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2.5 bg-neutral-50 rounded-sm border border-neutral-200 text-neutral-900 text-sm capitalize">
                    {user?.farmingProfile?.irrigationType || 'Not set'}
                  </div>
                )}
              </div>

              {/* Soil Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Soil Type
                </label>
                {isEditingFarming ? (
                  <select
                    name="soilType"
                    value={farmingData.soilType}
                    onChange={handleFarmingChange}
                    className="select"
                  >
                    {SOIL_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2.5 bg-neutral-50 rounded-sm border border-neutral-200 text-neutral-900 text-sm capitalize">
                    {user?.farmingProfile?.soilType || 'Not set'}
                  </div>
                )}
              </div>

              {/* Primary Crops */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Primary Crops
                </label>
                {isEditingFarming ? (
                  <input
                    type="text"
                    name="primaryCrops"
                    value={farmingData.primaryCrops}
                    onChange={handleFarmingChange}
                    placeholder="e.g., Wheat, Rice, Cotton"
                    className="input"
                  />
                ) : (
                  <div className="px-3 py-2.5 bg-neutral-50 rounded-sm border border-neutral-200 text-neutral-900 text-sm">
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
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div 
            className="modal w-full max-w-md animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-neutral-400" />
                <h3 className="text-base font-semibold text-neutral-900">Change Password</h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="btn-icon"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="input"
                  placeholder="Enter current password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="input"
                  placeholder="Enter new password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="input"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border-t border-neutral-100">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isLoading}
                className="btn-primary flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
