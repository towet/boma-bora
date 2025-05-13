import { supabase } from './supabase';

export interface Farmer {
  id: string;
  full_name: string;
  phone_number: string;
  location: string;
  created_at: string;
  updated_at: string;
}

export const farmersApi = {
  async createFarmer(data: Omit<Farmer, 'id' | 'created_at' | 'updated_at'>) {
    const { data: farmer, error } = await supabase
      .from('farmers')
      .insert([{ ...data, created_by: supabase.auth.getUser().then(({ data }) => data.user?.id) }])
      .select()
      .single();

    if (error) throw error;
    return farmer;
  },

  async getFarmers() {
    const { data: farmers, error } = await supabase
      .from('farmers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return farmers;
  },

  async updateFarmer(id: string, data: Partial<Omit<Farmer, 'id' | 'created_at' | 'updated_at'>>) {
    const { data: farmer, error } = await supabase
      .from('farmers')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return farmer;
  },
};
