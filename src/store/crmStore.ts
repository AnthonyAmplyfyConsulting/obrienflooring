import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PipelineStage = 'Estimate Done' | 'Job Started' | 'Payment Received' | 'Job Completed';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  jobCompletedDate?: string;
  invoicePdf?: string;
  additionalNotes?: string;
  stage?: PipelineStage | null;
  createdAt: number;
}

interface CrmState {
  leads: Lead[];
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  moveLeadStage: (id: string, stage: PipelineStage | null) => void;
}

export const useCrmStore = create<CrmState>()(
  persist(
    (set, get) => ({
      leads: [
        {
          id: '1',
          name: 'John Doe',
          phone: '(555) 123-4567',
          email: 'john@example.com',
          address: '123 Main St, Boston, MA',
          additionalNotes: 'Needs hardwood in living room',
          stage: 'Estimate Done',
          createdAt: Date.now() - 100000,
        },
        {
          id: '2',
          name: 'Sarah Smith',
          phone: '(555) 987-6543',
          email: 'sarah.smith@example.com',
          address: '456 Oak View, Cambridge, MA',
          additionalNotes: 'Laminate in basement',
          stage: 'Job Started',
          createdAt: Date.now() - 200000,
        }
      ],
      addLead: (lead) =>
        set((state) => ({
          leads: [
            ...state.leads,
            { ...lead, id: Math.random().toString(36).substring(2, 9), createdAt: Date.now() },
          ],
        })),
      updateLead: (id, updates) =>
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === id ? { ...lead, ...updates } : lead
          ),
        })),
      deleteLead: (id) =>
        set((state) => ({
          leads: state.leads.filter((lead) => lead.id !== id),
        })),
      moveLeadStage: async (id, stage) => {
        const { leads } = get();
        const lead = leads.find((l: Lead) => l.id === id);

        if (stage === 'Job Completed' && lead && lead.stage !== 'Job Completed') {
          // Trigger local API route to bypass CORS
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

        set((state) => ({
          leads: state.leads.map((l: Lead) =>
            l.id === id ? { ...l, stage, jobCompletedDate: stage === 'Job Completed' ? new Date().toLocaleDateString() : l.jobCompletedDate } : l
          ),
        }));
      },
    }),
    {
      name: 'obriens-crm-storage',
    }
  )
);
