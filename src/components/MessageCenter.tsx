import React, { useEffect, useState, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const MessageCenter = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<(Message & { sender: Profile })[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedReceiver, setSelectedReceiver] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Profile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchContacts();
      const subscription = supabase
        .channel('messages')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, 
          payload => {
            if (payload.new && (
              payload.new.sender_id === user.id || 
              payload.new.receiver_id === user.id
            )) {
              fetchMessages();
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  useEffect(() => {
    if (selectedReceiver) {
      fetchMessages();
    }
  }, [selectedReceiver]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchContacts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id);

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchMessages = async () => {
    if (!user || !selectedReceiver) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedReceiver || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: user.id,
            receiver_id: selectedReceiver,
            content: newMessage.trim()
          }
        ]);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow h-[600px] flex">
      {/* Contacts List */}
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setSelectedReceiver(contact.id)}
              className={`w-full p-4 text-left hover:bg-gray-50 flex items-center gap-3 ${
                selectedReceiver === contact.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="bg-blue-100 p-2 rounded-full">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{contact.full_name}</p>
                <p className="text-sm text-gray-500">{contact.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedReceiver ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 flex ${
                    message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender_id === user?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs mt-1 opacity-75">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a contact to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageCenter;