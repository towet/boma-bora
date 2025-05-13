import React, { useState, useEffect } from 'react';
import { Check, Droplet, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Collection = Database['public']['Tables']['collections']['Row'];

interface CollectionRecorderProps {
  collection: Collection & { farmers: { full_name: string } };
  onSuccess: () => void;
}

const CollectionRecorder: React.FC<CollectionRecorderProps> = ({ collection, onSuccess }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('collections')
        .update({
          quantity_liters: parseFloat(quantity),
          status: 'completed'
        })
        .eq('id', collection.id);

      if (error) throw error;

      setQuantity('');
      setIsModalOpen(false);
      onSuccess();
    } catch (err: any) {
      console.error('Error recording collection:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isModalOpen) {
    return (
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Record Collection
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Record Collection</h2>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Recording collection from farmer: <span className="font-medium">{collection.farmers.full_name}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
              Quantity (Liters)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Droplet className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                id="quantity"
                min="0"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="0.0"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">L</span>
              </div>
            </div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                'Recording...'
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Record Collection
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollectionRecorder;
