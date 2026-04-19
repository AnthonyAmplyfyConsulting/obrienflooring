'use client';

import { useState, useEffect } from 'react';
import { useCrmStore } from '@/store/crmStore';
import { Plus, X, Search, FileText, CheckCircle, Upload, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CompletedJobsPage() {
  const { leads, addLead, fetchLeads, deleteLead } = useCrmStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceFileName, setInvoiceFileName] = useState('');
  const [deleteConfirmLead, setDeleteConfirmLead] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteYes = async () => {
    if (!deleteConfirmLead) return;
    setIsDeleting(true);
    await deleteLead(deleteConfirmLead.id);
    setIsDeleting(false);
    setDeleteConfirmLead(null);
  };

  const handleDeleteNo = () => {
    setDeleteConfirmLead(null);
  };

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Only show completed jobs
  const completedLeads = leads.filter(
    (lead) =>
      lead.stage === 'Job Completed' &&
      (lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addLead({
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
      additional_notes: formData.get('notes') as string,
      stage: 'Job Completed', 
      job_completed_date: new Date().toLocaleDateString(),
      invoice_pdf: invoiceFileName || undefined,
    });
    setInvoiceFileName('');
    setIsModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setInvoiceFileName(e.target.files[0].name);
    } else {
      setInvoiceFileName('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Completed Jobs</h1>
          <p className="text-sm text-zinc-500 mt-1">Review your finished projects and invoices.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Completed Job
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="text"
              placeholder="Search completed jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-xl border-0 py-2 pl-10 pr-3 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-zinc-900 sm:pl-6">Customer Name</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900">Contact</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900">Address</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900">Completion Date</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-900">Invoice</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {completedLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-zinc-900">{lead.name}</div>
                        <div className="text-zinc-500 text-sm max-w-xs truncate" title={lead.additional_notes || undefined}>{lead.additional_notes || 'No notes'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500">
                    <div>{lead.phone}</div>
                    <div>{lead.email}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500">
                    <div className="max-w-[200px] truncate" title={lead.address}>{lead.address}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      {lead.job_completed_date || 'N/A'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500">
                      {lead.invoice_pdf ? (
                        <button className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 mt-1">
                          <FileText className="h-4 w-4" /> {lead.invoice_pdf}
                        </button>
                      ) : (
                        <span className="text-zinc-400">No Invoice</span>
                      )}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button
                        onClick={() => setDeleteConfirmLead(lead)}
                        className="text-zinc-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50 inline-flex"
                        title="Delete Job"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                  </td>
                </tr>
              ))}
               {completedLeads.length === 0 && (
                <tr>
                   <td colSpan={6} className="py-12 text-center text-zinc-500">
                     No completed jobs found.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
                <h2 className="text-lg font-semibold text-zinc-900">Add Completed Job</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-zinc-700">Client Name</label>
                    <input type="text" name="name" id="name" required className="mt-1 block w-full rounded-xl border-0 py-2 px-3 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-zinc-700">Phone</label>
                        <input type="tel" name="phone" id="phone" required className="mt-1 block w-full rounded-xl border-0 py-2 px-3 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-zinc-700">Email</label>
                        <input type="email" name="email" id="email" required className="mt-1 block w-full rounded-xl border-0 py-2 px-3 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-zinc-700">Job Address</label>
                    <input type="text" name="address" id="address" required className="mt-1 block w-full rounded-xl border-0 py-2 px-3 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="invoice" className="block text-sm font-medium text-zinc-700">Invoice File (PDF/Image)</label>
                    <div className="mt-1 flex items-center justify-center w-full">
                        <label htmlFor="invoice-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-300 border-dashed rounded-xl cursor-pointer bg-zinc-50 hover:bg-zinc-100 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-3 text-zinc-400" />
                                <p className="mb-2 text-sm text-zinc-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-zinc-500">{invoiceFileName || 'SVG, PNG, JPG or PDF'}</p>
                            </div>
                            <input id="invoice-upload" type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
                        </label>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-zinc-700">Additional Notes</label>
                    <textarea name="notes" id="notes" rows={2} className="mt-1 block w-full rounded-xl border-0 py-2 px-3 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm resize-none"></textarea>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
                  >
                    Save Job
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Prompt */}
      <AnimatePresence>
        {deleteConfirmLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm"
              onClick={handleDeleteNo}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
              className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden"
            >
              <div className="h-1.5 bg-red-500" />
              <div className="p-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 mb-2">Delete Job?</h2>
                <p className="text-sm text-zinc-500 mb-6">
                  Are you sure you want to delete <span className="font-semibold text-zinc-800">{deleteConfirmLead.name}</span>? This action cannot be undone and will permanently remove it from the database.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={handleDeleteNo}
                    disabled={isDeleting}
                    className="flex-1 rounded-xl px-5 py-3 text-sm font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 shadow-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteYes}
                    disabled={isDeleting}
                    className="flex-1 rounded-xl px-5 py-3 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 shadow-sm transition-all disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence
    </div>
  );
}
