'use client';

import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useCrmStore, PipelineStage, Lead } from '@/store/crmStore';
import { MoreVertical, Calendar, Phone, Mail } from 'lucide-react';

const STAGES: PipelineStage[] = ['Estimate Done', 'Job Started', 'Payment Received', 'Job Completed'];

export default function PipelinePage() {
  const { leads, moveLeadStage } = useCrmStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    moveLeadStage(draggableId, destination.droppableId as PipelineStage);
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
                                {lead.additionalNotes && (
                                  <div className="text-xs mt-2 p-2 bg-emerald-50 text-emerald-800 rounded-lg line-clamp-2">
                                     {lead.additionalNotes}
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
    </div>
  );
}
