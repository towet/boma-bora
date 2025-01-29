import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Droplet, MessageSquare, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import FarmerCollections from '../components/FarmerCollections';
import { Database } from '../lib/database.types';

type Collection = Database['public']['Tables']['collections']['Row'];

interface Profile {
  role: 'farmer' | 'agent';
  full_name: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCollections: 0,
    upcomingCollections: 0,
    totalLiters: 0,
    averageLiters: 0
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
        
        // Redirect agents to the agent dashboard
        if (data.role === 'agent') {
          navigate('/agent');
          return;
        }
        
        setProfile(data);
        await fetchStats();
      } catch (error) {
        console.error('Error fetching profile:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [user, navigate]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get total collections
      const { count: totalCount } = await supabase
        .from('collections')
        .select('*', { count: 'exact', head: true })
        .eq('farmer_id', user.id)
        .eq('status', 'completed');

      // Get upcoming collections
      const today = new Date().toISOString().split('T')[0];
      const { count: upcomingCount } = await supabase
        .from('collections')
        .select('*', { count: 'exact', head: true })
        .eq('farmer_id', user.id)
        .eq('status', 'scheduled')
        .gte('scheduled_date', today);

      // Get total and average liters
      const { data: collections } = await supabase
        .from('collections')
        .select('quantity_liters')
        .eq('farmer_id', user.id)
        .eq('status', 'completed');

      const totalLiters = collections?.reduce((sum, col) => sum + (col.quantity_liters || 0), 0) || 0;
      const averageLiters = collections?.length 
        ? totalLiters / collections.length 
        : 0;

      setStats({
        totalCollections: totalCount || 0,
        upcomingCollections: upcomingCount || 0,
        totalLiters,
        averageLiters
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
          <h1 className="text-3xl font-bold text-gray-900">Farmer Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome, {profile.full_name}. View your milk collection schedule and history.
          </p>

          {/* Stats Overview */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Collections */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Collections</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalCollections}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Collections */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Collections</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.upcomingCollections}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Liters */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Droplet className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Liters</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalLiters.toFixed(1)} L
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Average per Collection */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Average per Collection</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.averageLiters.toFixed(1)} L
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Collections List */}
        <FarmerCollections />
      </div>
    </div>
  );
};

export default Dashboard;