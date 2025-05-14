import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Droplet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';

type Collection = Database['public']['Tables']['collections']['Row'];

const FarmerCollections = () => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalLiters: 0,
    averageLiters: 0,
    totalCollections: 0
  });

  useEffect(() => {
    if (!user) return;
    fetchCollections();
    fetchStats();

    // Subscribe to collection changes
    const channel = supabase
      .channel('farmer_collections')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collections',
          filter: `farmer_id=eq.${user.id}`
        },
        () => {
          fetchCollections();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get completed collections for historical data
      const { data: completedData, error: completedError } = await supabase
        .from('collections')
        .select('quantity_liters')
        .eq('farmer_id', user.id)
        .eq('status', 'completed');

      if (completedError) throw completedError;

      // Get scheduled collections for expected data
      const { data: scheduledData, error: scheduledError } = await supabase
        .from('collections')
        .select('quantity_liters')
        .eq('farmer_id', user.id)
        .eq('status', 'scheduled');

      if (scheduledError) throw scheduledError;

      // Calculate stats from completed collections
      const totalCompletedLiters = completedData.reduce((sum, col) => sum + (col.quantity_liters || 0), 0);
      const totalCompletedCollections = completedData.length;
      const averageCompletedLiters = totalCompletedCollections > 0 ? totalCompletedLiters / totalCompletedCollections : 0;
      
      // Calculate expected liters from scheduled collections
      const totalExpectedLiters = scheduledData.reduce((sum, col) => sum + (col.quantity_liters || 0), 0);
      const totalScheduledCollections = scheduledData.length;
      
      // Calculate total collections (completed + scheduled)
      const totalCollections = totalCompletedCollections + totalScheduledCollections;
      
      // Display both completed and expected liters
      const totalLiters = totalCompletedLiters + totalExpectedLiters;
      
      // Average is based on all collections with quantity specified
      const collectionsWithQuantity = [...completedData, ...scheduledData].filter(col => col.quantity_liters);
      const averageLiters = collectionsWithQuantity.length > 0 
        ? collectionsWithQuantity.reduce((sum, col) => sum + (col.quantity_liters || 0), 0) / collectionsWithQuantity.length 
        : 0;

      setStats({
        totalLiters,
        averageLiters,
        totalCollections
      });
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('farmer_id', user?.id)
        .order('scheduled_date', { ascending: false })
        .order('scheduled_time', { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (err: any) {
      console.error('Error fetching collections:', err);
      setError(err.message);
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

  if (loading) {
    return <div className="text-center py-4">Loading your collections...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600 py-4">{error}</div>;
  }

  const upcomingCollections = collections.filter(
    (c) => c.status === 'scheduled' && new Date(`${c.scheduled_date}T${c.scheduled_time}`) > new Date()
  );

  const pastCollections = collections.filter(
    (c) =>
      c.status === 'completed' ||
      new Date(`${c.scheduled_date}T${c.scheduled_time}`) <= new Date()
  );

  return (
    <div className="space-y-8">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Droplet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Milk</h3>
              <p className="text-2xl font-semibold text-blue-600">{stats.totalLiters.toFixed(1)} L</p>
              <p className="text-xs text-gray-500">(includes expected quantities)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Collections</h3>
              <p className="text-2xl font-semibold text-green-600">{stats.totalCollections}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Droplet className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Average</h3>
              <p className="text-2xl font-semibold text-purple-600">
                {stats.averageLiters.toFixed(1)} L
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Collections */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Upcoming Collections</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your scheduled milk collections for the coming days
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {upcomingCollections.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No upcoming collections scheduled.</p>
            ) : (
              upcomingCollections.map((collection) => (
                <div
                  key={collection.id}
                  className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <p className="text-sm font-medium text-blue-900">
                        {formatDateTime(collection.scheduled_date, collection.scheduled_time)}
                      </p>
                    </div>
                    {collection.quantity_liters && (
                      <div className="flex items-center space-x-1 mt-1">
                        <Droplet className="h-4 w-4 text-blue-500" />
                        <p className="text-sm font-medium text-blue-800">
                          Expected: {collection.quantity_liters} liters
                        </p>
                      </div>
                    )}
                    {collection.notes && (
                      <p className="mt-1 text-sm text-blue-700">{collection.notes}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Past Collections */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Collection History</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your past milk collections and their quantities
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {pastCollections.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No collection history available.</p>
            ) : (
              pastCollections.map((collection) => (
                <div
                  key={collection.id}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        collection.status === 'completed'
                          ? 'bg-green-100'
                          : collection.status === 'cancelled'
                          ? 'bg-red-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Droplet
                        className={`h-6 w-6 ${
                          collection.status === 'completed'
                            ? 'text-green-600'
                            : collection.status === 'cancelled'
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-900">
                        {formatDateTime(collection.scheduled_date, collection.scheduled_time)}
                      </p>
                    </div>
                    {collection.quantity_liters && (
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {collection.quantity_liters} liters collected
                      </p>
                    )}
                    {collection.notes && (
                      <p className="mt-1 text-sm text-gray-500">{collection.notes}</p>
                    )}
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        collection.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : collection.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {collection.status.charAt(0).toUpperCase() + collection.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerCollections;
