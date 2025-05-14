import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, X, Droplet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';
import CollectionRecorder from './CollectionRecorder';

type Collection = Database['public']['Tables']['collections']['Row'] & {
  farmers: { full_name: string };
};
type Farmer = Database['public']['Tables']['farmers']['Row'];

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  farmer: Farmer;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, onSuccess, farmer }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    notes: '',
    quantity_liters: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.from('collections').insert({
        farmer_id: farmer.id,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        notes: formData.notes || null,
        quantity_liters: formData.quantity_liters ? parseFloat(formData.quantity_liters) : null,
        created_by: user.id,
        status: 'scheduled'
      });

      if (error) throw error;

      setFormData({
        scheduled_date: '',
        scheduled_time: '',
        notes: '',
        quantity_liters: ''
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error scheduling collection:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Schedule Collection</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Scheduling collection for farmer: <span className="font-medium">{farmer.full_name}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700">
              Collection Date
            </label>
            <div className="mt-1 relative">
              <input
                type="date"
                id="scheduled_date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.scheduled_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, scheduled_date: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
              <Calendar className="absolute right-3 top-2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div>
            <label htmlFor="scheduled_time" className="block text-sm font-medium text-gray-700">
              Collection Time
            </label>
            <div className="mt-1 relative">
              <input
                type="time"
                id="scheduled_time"
                value={formData.scheduled_time}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, scheduled_time: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
              <Clock className="absolute right-3 top-2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div>
            <label htmlFor="quantity_liters" className="block text-sm font-medium text-gray-700">
              Expected Quantity (Liters)
            </label>
            <div className="mt-1 relative">
              <input
                type="number"
                id="quantity_liters"
                min="0"
                step="0.1"
                value={formData.quantity_liters}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quantity_liters: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter expected quantity in liters"
              />
              <Droplet className="absolute right-3 top-2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Any special instructions or notes..."
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Schedule Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CollectionScheduler = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

  useEffect(() => {
    fetchFarmers();
    fetchCollections();

    // Subscribe to collection changes
    const channel = supabase
      .channel('collections_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collections'
        },
        () => {
          fetchCollections();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchFarmers = async () => {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setFarmers(data || []);
    } catch (error) {
      console.error('Error fetching farmers:', error);
    }
  };

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*, farmers(full_name)')
        .order('scheduled_date')
        .order('scheduled_time');

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const upcomingCollections = collections.filter(
    (c) => c.status === 'scheduled' && new Date(`${c.scheduled_date}T${c.scheduled_time}`) > new Date()
  );

  const completedCollections = collections.filter((c) => c.status === 'completed');

  if (loading) {
    return <div className="text-center py-4">Loading schedules...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Collection Schedule</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            Schedule Collection
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`${
              activeTab === 'upcoming'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-center`}
          >
            Upcoming Collections
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`${
              activeTab === 'completed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-center`}
          >
            Completed Collections
          </button>
        </nav>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {activeTab === 'upcoming' ? (
            upcomingCollections.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No collections scheduled.</p>
            ) : (
              upcomingCollections.map((collection) => (
                <div
                  key={collection.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {collection.farmers.full_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(collection.scheduled_date, collection.scheduled_time)}
                      </p>
                      {collection.notes && (
                        <p className="text-sm text-gray-500 mt-1">{collection.notes}</p>
                      )}
                    </div>
                  </div>
                  <CollectionRecorder collection={collection} onSuccess={fetchCollections} />
                </div>
              ))
            )
          ) : completedCollections.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No completed collections.</p>
          ) : (
            completedCollections.map((collection) => (
              <div
                key={collection.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Droplet className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {collection.farmers.full_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(collection.scheduled_date, collection.scheduled_time)}
                    </p>
                    <p className="text-sm font-medium text-green-600 mt-1">
                      {collection.quantity_liters} liters collected
                    </p>
                    {collection.notes && (
                      <p className="text-sm text-gray-500 mt-1">{collection.notes}</p>
                    )}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Completed
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Select Farmer</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {farmers.map((farmer) => (
                <button
                  key={farmer.id}
                  onClick={() => {
                    setSelectedFarmer(farmer);
                    setIsModalOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                >
                  {farmer.full_name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedFarmer && (
        <ScheduleModal
          isOpen={!!selectedFarmer}
          onClose={() => setSelectedFarmer(null)}
          onSuccess={() => {
            setSelectedFarmer(null);
            fetchCollections();
          }}
          farmer={selectedFarmer}
        />
      )}
    </div>
  );
};

export default CollectionScheduler;