import React, { useState, useEffect } from 'react';
import { UserPlus, Calendar as CalendarIcon, Droplet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import FarmersList from '../components/FarmersList';
import AddFarmerModal from '../components/AddFarmerModal';
import CollectionScheduler from '../components/CollectionScheduler';
import { Database } from '../lib/database.types';

type Collection = Database['public']['Tables']['collections']['Row'];

interface Profile {
  role: 'farmer' | 'agent';
  full_name: string;
}

const AgentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFarmers: 0,
    todayCollections: 0,
    scheduledCollections: 0,
    completedCollections: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const getProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data.role !== 'agent') {
          navigate('/dashboard');
          return;
        }

        setProfile(data);
        await fetchStats();
      } catch (error) {
        console.error('Error fetching profile:', error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [user, navigate]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get total farmers
      const { count: farmersCount } = await supabase
        .from('farmers')
        .select('*', { count: 'exact', head: true });

      // Get today's collections
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('collections')
        .select('*', { count: 'exact', head: true })
        .eq('scheduled_date', today);

      // Get scheduled collections (future dates)
      const { count: scheduledCount } = await supabase
        .from('collections')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .gt('scheduled_date', today);

      // Get completed collections
      const { count: completedCount } = await supabase
        .from('collections')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      setStats({
        totalFarmers: farmersCount || 0,
        todayCollections: todayCount || 0,
        scheduledCollections: scheduledCount || 0,
        completedCollections: completedCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome, {profile.full_name}. Manage your registered farmers and milk collections.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Add Farmer
            </button>
          </div>

          {/* Stats Overview */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Farmers */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserPlus className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Farmers</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalFarmers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Collections */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CalendarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Today's Collections</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.todayCollections}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Scheduled Collections */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CalendarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Scheduled Collections</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.scheduledCollections}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Completed Collections */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Droplet className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed Collections</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.completedCollections}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Farmers List */}
          <div>
            <FarmersList />
          </div>

          {/* Collection Scheduler */}
          <div>
            <CollectionScheduler />
          </div>
        </div>

        <AddFarmerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchStats();
          }}
        />
      </div>
    </div>
  );
};

export default AgentDashboard;
