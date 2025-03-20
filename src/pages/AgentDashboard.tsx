import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, Calendar, MessageSquare, Megaphone } from 'lucide-react';
import FarmersList from '../components/FarmersList';
import AddFarmerModal from '../components/AddFarmerModal';
import Messages from '../components/Messages';
import Announcements from '../components/Announcements';
import CollectionScheduler from '../components/CollectionScheduler';

interface Profile {
  role: 'farmer' | 'agent';
  full_name: string;
}

interface FarmerInfo {
  id: string;
  full_name: string;
}

const AgentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddFarmerModalOpen, setIsAddFarmerModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'messages' | 'collections'>('messages');
  const [stats, setStats] = useState({
    totalFarmers: 0,
    totalCollections: 0,
    upcomingCollections: 0,
    totalMessages: 0
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
        
        // Redirect farmers to the farmer dashboard
        if (data.role === 'farmer') {
          navigate('/dashboard');
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
      // Get total farmers
      const { count: farmersCount } = await supabase
        .from('farmers')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      // Get total and upcoming collections
      const { count: totalCollectionsCount } = await supabase
        .from('collections')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      const today = new Date().toISOString().split('T')[0];
      const { count: upcomingCollectionsCount } = await supabase
        .from('collections')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .eq('status', 'scheduled')
        .gte('scheduled_date', today);

      // Get total messages
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      setStats({
        totalFarmers: farmersCount || 0,
        totalCollections: totalCollectionsCount || 0,
        upcomingCollections: upcomingCollectionsCount || 0,
        totalMessages: messagesCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFarmerAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchStats();
  };

  const handleFarmerSelect = (farmer: FarmerInfo) => {
    setSelectedFarmer(farmer);
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
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Farmers</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalFarmers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Collections</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCollections}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming Collections</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.upcomingCollections}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalMessages}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Farmers Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">My Farmers</h2>
              <button
                onClick={() => setIsAddFarmerModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Farmer
              </button>
            </div>
            <FarmersList
              refreshTrigger={refreshTrigger}
              onFarmerSelect={handleFarmerSelect}
            />
          </div>

          {/* Communication and Collections Section */}
          <div className="space-y-8">
            {/* Announcements */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Announcements</h2>
              <Announcements />
            </div>

            {/* Tabs for Messages and Collections */}
            {selectedFarmer && (
              <div>
                <div className="border-b border-gray-200 mb-4">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('messages')}
                      className={`${
                        activeTab === 'messages'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Messages
                    </button>
                    <button
                      onClick={() => setActiveTab('collections')}
                      className={`${
                        activeTab === 'collections'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Collections
                    </button>
                  </nav>
                </div>

                {activeTab === 'messages' ? (
                  <Messages
                    receiverId={selectedFarmer.id}
                    receiverName={selectedFarmer.full_name}
                  />
                ) : (
                  <CollectionScheduler />
                )}
              </div>
            )}
            {!selectedFarmer && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
                Select a farmer to view messages and schedule collections
              </div>
            )}
          </div>
        </div>
      </div>

      <AddFarmerModal
        isOpen={isAddFarmerModalOpen}
        onClose={() => setIsAddFarmerModalOpen(false)}
        onFarmerAdded={handleFarmerAdded}
      />
    </div>
  );
};

export default AgentDashboard;
