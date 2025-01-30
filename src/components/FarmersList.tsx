import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, MapPin, Phone, MessageCircle } from 'lucide-react';
import { Database } from '../lib/database.types';

type Farmer = Database['public']['Tables']['farmers']['Row'] & {
  unread_count?: number;
};

interface FarmersListProps {
  refreshTrigger?: number;
  onFarmerSelect?: (farmer: { id: string; full_name: string }) => void;
}

const FarmersList: React.FC<FarmersListProps> = ({ refreshTrigger = 0, onFarmerSelect }) => {
  const { user } = useAuth();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchFarmers();

    // Subscribe to changes in both farmers and messages
    const farmersChannel = supabase
      .channel('farmers_messages_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'farmers'
        },
        () => {
          fetchFarmers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchFarmers();
        }
      )
      .subscribe();

    return () => {
      farmersChannel.unsubscribe();
    };
  }, [user?.id, refreshTrigger]);

  const fetchUnreadMessageCounts = async (farmersData: Farmer[]) => {
    if (!user) return farmersData;

    try {
      // Get all unread messages
      const { data: messages, error: messageError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', user.id)
        .is('read_at', null);

      if (messageError) throw messageError;

      // Count messages per sender
      const unreadCounts = messages?.reduce((counts: Map<string, number>, message) => {
        const currentCount = counts.get(message.sender_id) || 0;
        counts.set(message.sender_id, currentCount + 1);
        return counts;
      }, new Map<string, number>()) || new Map<string, number>();

      // Update farmers with their unread message counts
      return farmersData.map(farmer => ({
        ...farmer,
        unread_count: unreadCounts.get(farmer.id) || 0
      }));
    } catch (error) {
      console.error('Error fetching message counts:', error);
      return farmersData.map(farmer => ({ ...farmer, unread_count: 0 }));
    }
  };

  const fetchFarmers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      // First get all farmers
      const { data: farmersData, error: farmersError } = await supabase
        .from('farmers')
        .select('*')
        .order('full_name');

      if (farmersError) throw farmersError;
      if (!farmersData) {
        setFarmers([]);
        return;
      }

      // Then get unread message counts
      const farmersWithUnread = await fetchUnreadMessageCounts(farmersData);
      setFarmers(farmersWithUnread);
    } catch (err) {
      console.error('Error fetching farmers:', err);
      setError('Failed to load farmers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-600">
        <p>{error}</p>
        <button
          onClick={fetchFarmers}
          className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (farmers.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        <p>No farmers found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {farmers.map((farmer) => (
        <div
          key={farmer.id}
          className={`bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer relative ${
            farmer.unread_count > 0 ? 'border-l-4 border-red-500' : ''
          }`}
          onClick={() => onFarmerSelect?.(farmer)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${farmer.unread_count > 0 ? 'bg-red-100' : 'bg-primary/10'}`}>
                <User className={`h-6 w-6 ${farmer.unread_count > 0 ? 'text-red-500' : 'text-gray-600'}`} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-gray-900">{farmer.full_name}</h3>
                  {farmer.unread_count > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white animate-pulse">
                      {farmer.unread_count === 1 
                        ? '1 new message'
                        : `${farmer.unread_count} new messages`}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                  {farmer.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{farmer.location}</span>
                    </div>
                  )}
                  {farmer.phone_number && (
                    <div className="flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <span>{farmer.phone_number}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {farmer.unread_count > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-red-500 animate-pulse">New message{farmer.unread_count > 1 ? 's' : ''}</span>
                <MessageCircle className="h-5 w-5 text-green-500 animate-pulse" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FarmersList;