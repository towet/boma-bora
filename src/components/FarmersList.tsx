import React, { useEffect, useState } from 'react';
import { User, Phone, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';

type Farmer = Database['public']['Tables']['farmers']['Row'];

const FarmersList = () => {
  const { user } = useAuth();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFarmers();

    // Subscribe to changes
    const channel = supabase
      .channel('farmers_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'farmers'
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          fetchFarmers();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchFarmers = async () => {
    try {
      console.log('Fetching farmers...');
      const { data, error } = await supabase
        .from('farmers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching farmers:', error);
        throw error;
      }

      console.log('Fetched farmers:', data);
      setFarmers(data || []);
    } catch (err: any) {
      console.error('Error in fetchFarmers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading farmers...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600 py-4">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Registered Farmers</h2>
      <div className="space-y-4">
        {farmers.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No farmers registered yet.</p>
        ) : (
          farmers.map((farmer) => (
            <div
              key={farmer.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{farmer.full_name}</h3>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="h-4 w-4 mr-1" />
                      {farmer.phone_number}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-1" />
                      {farmer.location}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FarmersList;