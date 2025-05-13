import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Droplet, MessageSquare, TrendingUp, Megaphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import FarmerCollections from '../components/FarmerCollections';
import Messages from '../components/Messages';
import Announcements from '../components/Announcements';
import { Database } from '../lib/database.types';

type Collection = Database['public']['Tables']['collections']['Row'];

interface Profile {
  role: 'farmer' | 'agent';
  full_name: string;
}

interface AgentInfo {
  id: string;
  full_name: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
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
        await fetchAgentInfo();
      } catch (error) {
        console.error('Error fetching profile:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [user, navigate]);

  const fetchAgentInfo = async () => {
    if (!user) return;

    try {
      console.log('Current user ID:', user.id);
      
      // Try to find the farmer record
      const { data: farmerData, error: farmerError } = await supabase
        .from('farmers')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      console.log('Farmer data:', farmerData);
      console.log('Farmer error:', farmerError);

      if (farmerError) {
        console.error('Error fetching farmer data:', farmerError);
        return;
      }

      if (!farmerData) {
        // If no farmer found, check if user is in profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', user.id)
          .maybeSingle();

        console.log('Profile data:', profileData);
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return;
        }

        if (profileData?.role === 'farmer') {
          // If user is a farmer in profiles but not in farmers table,
          // we need to add them to farmers table
          const { data: newFarmer, error: createError } = await supabase
            .from('farmers')
            .insert([{ id: user.id }])
            .select()
            .single();

          if (createError) {
            console.error('Error creating farmer record:', createError);
            return;
          }

          // No need to continue if we just created the farmer record
          return;
        }
      }

      if (farmerData?.created_by) {
        // Get the agent's profile information
        const { data: agentData, error: agentError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', farmerData.created_by)
          .single();

        if (agentError) {
          console.error('Error fetching agent data:', agentError);
          return;
        }

        setAgentInfo(agentData);
      }
    } catch (error) {
      console.error('Error fetching agent info:', error);
    }
  };

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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Welcome, {profile?.full_name}
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Collections</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCollections}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming Collections</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.upcomingCollections}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Droplet className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Liters</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalLiters.toFixed(1)}L
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Liters</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.averageLiters.toFixed(1)}L
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Collections Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Collection Schedule</h2>
            <FarmerCollections />
          </div>

          {/* Communication Section */}
          <div className="space-y-8">
            {/* Announcements */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Announcements</h2>
              <Announcements />
            </div>

            {/* Messages */}
            {agentInfo && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>
                <Messages receiverId={agentInfo.id} receiverName={agentInfo.full_name} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;