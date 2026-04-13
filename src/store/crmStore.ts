import { create } from 'zustand';
import { createClient } from '../utils/supabase/client';

export type PipelineStage = 'Estimate Done' | 'Job Started' | 'Payment Received' | 'Job Completed';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  job_completed_date?: string | null;
  next_mail_date?: string | null;
  mail_sent?: boolean | null;
  invoice_pdf?: string | null;
  additional_notes?: string | null;
  stage?: PipelineStage | null;
  created_at: string;
}

interface CrmState {
  leads: Lead[];
  isLoading: boolean;
  fetchLeads: () => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'created_at'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  moveLeadStage: (id: string, stage: PipelineStage | null) => Promise<void>;
}

export const useCrmStore = create<CrmState>((set, get) => ({
  leads: [],
  isLoading: false,
  fetchLeads: async () => {
    set({ isLoading: true });
    const supabase = createClient();
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching leads:', error);
    } else if (data) {
      set({ leads: data as Lead[] });
    }
    set({ isLoading: false });
  },
  addLead: async (lead) => {
    const supabase = createClient();
    const { data, error } = await supabase.from('leads').insert([lead]).select().single();
    
    if (error) {
      console.error('Error adding lead:', error);
    } else if (data) {
      set((state) => ({ leads: [data as Lead, ...state.leads] }));
    }
  },
  updateLead: async (id, updates) => {
    // Optimistic update
    const previousLeads = get().leads;
    set((state) => ({
      leads: state.leads.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead)),
    }));

    const supabase = createClient();
    const { error } = await supabase.from('leads').update(updates).eq('id', id);

    if (error) {
      console.error('Error updating lead:', error);
      // Revert on failure
      set({ leads: previousLeads });
    }
  },
  deleteLead: async (id) => {
    // Optimistic update
    const previousLeads = get().leads;
    set((state) => ({ leads: state.leads.filter((lead) => lead.id !== id) }));

    const supabase = createClient();
    const { error } = await supabase.from('leads').delete().eq('id', id);

    if (error) {
      console.error('Error deleting lead:', error);
      // Revert on failure
      set({ leads: previousLeads });
    }
  },
  moveLeadStage: async (id, stage) => {
    const { leads } = get();
    const lead = leads.find((l: Lead) => l.id === id);

    if (stage === 'Job Completed' && lead && lead.stage !== 'Job Completed') {
      try {
        await fetch('/api/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...lead, stage: 'Job Completed' }),
        });
      } catch (error) {
        console.error('Failed to trigger webhook:', error);
      }
    }

    const updates: Partial<Lead> = {
      stage,
      job_completed_date: stage === 'Job Completed' ? new Date().toISOString() : lead?.job_completed_date || null,
      next_mail_date: stage === 'Job Completed' ? new Date(Date.now() + 60000).toISOString() : lead?.next_mail_date || null,
      mail_sent: stage === 'Job Completed' ? false : lead?.mail_sent || null
    };

    // Optimistic update
    const previousLeads = leads;
    set((state) => ({
      leads: state.leads.map((l: Lead) => (l.id === id ? { ...l, ...updates } : l)),
    }));

    const supabase = createClient();
    const { error } = await supabase.from('leads').update(updates).eq('id', id);

    if (error) {
      console.error('Error updating lead stage:', error);
      // Revert on failure
      set({ leads: previousLeads });
    }
  },
}));
