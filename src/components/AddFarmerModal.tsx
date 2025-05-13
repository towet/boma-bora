import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AddFarmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFarmerAdded: () => void;
}

interface FarmerProfile {
  id: string;
  full_name: string;
  phone_number: string;
  location: string;
}

export default function AddFarmerModal({ isOpen, onClose, onFarmerAdded }: AddFarmerModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [farmerProfiles, setFarmerProfiles] = useState<FarmerProfile[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerProfile | null>(null);
  const [addingNewFarmer, setAddingNewFarmer] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    location: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchFarmerProfiles();
    }
  }, [isOpen]);

  const fetchFarmerProfiles = async () => {
    try {
      // Simply fetch all profiles with role='farmer'
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number, location')
        .eq('role', 'farmer');

      if (error) throw error;
      
      // Also fetch existing farmers to filter them out in the UI
      const { data: existingFarmers } = await supabase
        .from('farmers')
        .select('id');
      
      const existingFarmerIds = new Set((existingFarmers || []).map(f => f.id));
      
      // Filter out farmers that are already added
      const availableFarmers = (profiles || []).filter(
        profile => !existingFarmerIds.has(profile.id)
      );
      
      setFarmerProfiles(availableFarmers);
    } catch (error) {
      console.error('Error fetching farmer profiles:', error);
      setError('Failed to fetch farmer profiles');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!user) throw new Error('No user found');

      if (selectedFarmer) {
        // Add existing farmer
        const { error } = await supabase
          .from('farmers')
          .insert({
            id: selectedFarmer.id,
            full_name: selectedFarmer.full_name,
            phone_number: selectedFarmer.phone_number,
            location: selectedFarmer.location,
            created_by: user.id
          });

        if (error) throw error;
      } else {
        // Add new farmer
        const { error } = await supabase
          .from('farmers')
          .insert({
            full_name: formData.full_name,
            phone_number: formData.phone_number,
            location: formData.location,
            created_by: user.id
          });

        if (error) throw error;
      }

      setSuccess(true);
      onFarmerAdded();
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setSelectedFarmer(null);
        setFormData({
          full_name: '',
          phone_number: '',
          location: ''
        });
        setAddingNewFarmer(false);
      }, 1500);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add Farmer</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {!addingNewFarmer && (
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Select a farmer to add:
              </h3>
              <div className="max-h-60 overflow-y-auto border rounded-md">
                {farmerProfiles.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No new farmers available to add
                  </div>
                ) : (
                  farmerProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedFarmer?.id === profile.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedFarmer(profile)}
                    >
                      <div className="font-medium">{profile.full_name}</div>
                      <div className="text-sm text-gray-500">
                        {profile.phone_number} • {profile.location}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <button
                className="text-blue-600 hover:text-blue-800 text-sm"
                onClick={() => setAddingNewFarmer(true)}
              >
                + Add New Farmer Instead
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedFarmer || loading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  !selectedFarmer || loading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Adding...' : 'Add Selected Farmer'}
              </button>
            </div>
          </div>
        )}

        {addingNewFarmer && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800"
                onClick={() => setAddingNewFarmer(false)}
              >
                ← Back to Farmer List
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  loading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Adding...' : 'Add New Farmer'}
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="mt-4 text-red-600 text-sm">{error}</div>
        )}

        {success && (
          <div className="mt-4 text-green-600 text-sm">
            Farmer added successfully!
          </div>
        )}
      </div>
    </div>
  );
}