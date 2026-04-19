'use client';

import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useCrmStore, PipelineStage, Lead } from '@/store/crmStore';
import { MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STAGES: PipelineStage[] = ['Estimate Done', 'Job Started', 'Payment Received', 'Job Completed'];

export default function PipelinePage() {
  const { leads, moveLeadStage, fetchLeads, triggerReviewWebhook } = useCrmStore();
  const [mounted, setMounted] = useState(false);
  const [reviewPromptLead, setReviewPromptLead] = useState<Lead | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchLeads();
  }, [fetchLeads]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const targetStage = destination.droppableId as PipelineStage;
    const lead = leads.find((l) => l.id === draggableId);

    // If dropping into Job Completed from a different stage, show the review prompt
    if (targetStage === 'Job Completed' && lead && lead.stage !== 'Job Completed') {
      // Move to Job Completed immediately
      moveLeadStage(draggableId, 'Job Completed');
      // Show the review automation prompt
      const updatedLead = { ...lead, stage: 'Job Completed' as PipelineStage };
      setReviewPromptLead(updatedLead);
    } else {
      moveLeadStage(draggableId, targetStage);
    }
  };

  const handleReviewYes = async () => {
    if (!reviewPromptLead) return;
    setIsSending(true);
    await triggerReviewWebhook(reviewPromptLead);
    setIsSending(false);
    setReviewPromptLead(null);
  };

  const handleReviewNo = () => {
    setReviewPromptLead(null);
  };

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Job Pipeline</h1>
        <p className="text-sm text-zinc-500 mt-1">Track the progress of all current jobs.</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((lead) => lead.stage === stage);

            return (
              <div key={stage} className="flex-shrink-0 w-80 flex flex-col bg-zinc-100 rounded-2xl">
                <div className="p-4 flex items-center justify-between border-b border-zinc-200">
                  <h3 className="font-semibold text-zinc-900">{stage}</h3>
                  <span className="inline-flex items-center justify-center rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                    {stageLeads.length}
                  </span>
                </div>

                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-zinc-200/50' : ''
                      }`}
                    >
                      {stageLeads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-xl shadow-sm border p-4 space-y-3 transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg border-emerald-500/50' : 'border-zinc-200 hover:border-zinc-300'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="font-medium text-zinc-900 leading-tight">
                                  {lead.name}
                                </h4>
                                <button className="text-zinc-400 hover:text-zinc-600 transition-colors">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="text-sm text-zinc-500">
                                <div className="truncate mb-1" title={lead.address}>
                                  {lead.address}
                                </div>
                                {lead.additional_notes && (
                                  <div className="text-xs mt-2 p-2 bg-emerald-50 text-emerald-800 rounded-lg line-clamp-2">
                                     {lead.additional_notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Google Review Automation Prompt */}
      <AnimatePresence>
        {reviewPromptLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
              className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
            >
              {/* Header accent bar */}
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500" />

              <div className="p-8 text-center">
                {/* Icon */}
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                  <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                  </svg>
                </div>

                <h2 className="text-xl font-bold text-zinc-900 mb-2">
                  Google Review Automation
                </h2>
                <p className="text-sm text-zinc-500 mb-2">
                  Job marked as completed for:
                </p>
                <p className="text-base font-semibold text-zinc-800 mb-1">
                  {reviewPromptLead.name}
                </p>
                <p className="text-sm text-zinc-400 mb-6">
                  {reviewPromptLead.email} · {reviewPromptLead.phone}
                </p>
                <p className="text-sm text-zinc-600 mb-8">
                  Start the post-job Google review automation for this customer?
                </p>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleReviewNo}
                    disabled={isSending}
                    className="flex-1 rounded-xl px-5 py-3 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                  >
                    No
                  </button>
                  <button
                    onClick={handleReviewYes}
                    disabled={isSending}
                    className="flex-1 rounded-xl px-5 py-3 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSending ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending…
                      </span>
                    ) : (
                      'Yes'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
