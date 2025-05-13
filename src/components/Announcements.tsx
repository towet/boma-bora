import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Megaphone, Plus, X } from 'lucide-react';
import { Database } from '../lib/database.types';

type Announcement = Database['public']['Tables']['announcements']['Row'];

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnnouncementCreated: () => void;
}

function CreateAnnouncementModal({
  isOpen,
  onClose,
  onAnnouncementCreated,
}: CreateAnnouncementModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('announcements').insert({
        agent_id: user.id,
        title,
        content,
        expires_at: expiresAt || null,
      });

      if (error) throw error;

      onAnnouncementCreated();
      onClose();
    } catch (error) {
      console.error('Error creating announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create Announcement</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700">
              Expires At (Optional)
            </label>
            <input
              type="datetime-local"
              id="expires_at"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Announcement'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAgent, setIsAgent] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    checkUserRole();

    // Subscribe to changes
    const channel = supabase
      .channel('announcements_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
        },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  const checkUserRole = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setIsAgent(data.role === 'agent');
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchAnnouncements = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (announcementId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('announcement_recipients').upsert({
        announcement_id: announcementId,
        user_id: user.id,
        read_at: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading announcements...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600 py-4">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold flex items-center">
          <Megaphone className="w-5 h-5 mr-2" />
          Announcements
        </h2>
        {isAgent && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Announcement
          </button>
        )}
      </div>

      <div className="divide-y">
        {announcements.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No announcements yet.</p>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="p-4 hover:bg-gray-50"
              onClick={() => markAsRead(announcement.id)}
            >
              <h3 className="text-lg font-medium text-gray-900">{announcement.title}</h3>
              <p className="mt-1 text-gray-600">{announcement.content}</p>
              <div className="mt-2 text-sm text-gray-500 flex justify-between items-center">
                <span>
                  Posted on {new Date(announcement.created_at).toLocaleDateString()}
                </span>
                {announcement.expires_at && (
                  <span>
                    Expires on {new Date(announcement.expires_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <CreateAnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAnnouncementCreated={fetchAnnouncements}
      />
    </div>
  );
}
