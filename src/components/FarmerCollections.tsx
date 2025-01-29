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

  useEffect(() => {
    if (!user) return;
    fetchCollections();

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
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('farmer_id', user?.id)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

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
                    <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Droplet
                        className={`h-6 w-6 ${
                          collection.status === 'completed'
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-900">
                          {formatDateTime(collection.scheduled_date, collection.scheduled_time)}
                        </p>
                      </div>
                      {collection.status === 'completed' && collection.quantity_liters && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {collection.quantity_liters} Liters
                        </span>
                      )}
                    </div>
                    {collection.notes && (
                      <p className="mt-1 text-sm text-gray-500">{collection.notes}</p>
                    )}
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          collection.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : collection.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {collection.status.charAt(0).toUpperCase() + collection.status.slice(1)}
                      </span>
                    </div>
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
