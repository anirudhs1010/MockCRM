import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI, dealsAPI } from '../services/api';

const DealsPage = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  
  // State for UI
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch data
  const { data: deals, isLoading, error } = useQuery({
    queryKey: ['deals'],
    queryFn: dealsAPI.getAll,
  });

  const { data: stages } = useQuery({
    queryKey: ['stages'],
    queryFn: adminAPI.getStages,
    enabled: isAdmin(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: dealsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
      setShowCreateModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => dealsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
      setShowEditModal(false);
      setEditingDeal(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: dealsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
    },
  });

  // Filter deals
  const filteredDeals = deals?.filter(deal => {
    const matchesSearch = 
      deal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = !stageFilter || deal.stage === stageFilter;
    const matchesOutcome = !outcomeFilter || deal.outcome === outcomeFilter;
    
    return matchesSearch && matchesStage && matchesOutcome;
  }) || [];

  // Handle form submissions
  const handleCreate = (formData) => {
    createMutation.mutate(formData);
  };

  const handleUpdate = (id, formData) => {
    updateMutation.mutate({ id, data: formData });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (deal) => {
    setEditingDeal(deal);
    setShowEditModal(true);
  };

  // Get unique stages and outcomes for filters
  const uniqueStages = [...new Set(deals?.map(deal => deal.stage).filter(Boolean))];
  const uniqueOutcomes = [...new Set(deals?.map(deal => deal.outcome).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading deals: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deals</h1>
          <p className="text-gray-600">Manage your sales pipeline</p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Deal
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search deals by name or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Stages</option>
              {uniqueStages.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Outcomes</option>
              {uniqueOutcomes.map(outcome => (
                <option key={outcome} value={outcome}>{outcome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outcome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeals.length > 0 ? (
                filteredDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {deal.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {deal.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{deal.customer_name}</div>
                      <div className="text-sm text-gray-500">{deal.customer_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${deal.amount?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {deal.stage || 'No Stage'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        deal.outcome === 'won' ? 'bg-green-100 text-green-800' :
                        deal.outcome === 'lost' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {deal.outcome || 'Open'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(deal)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        {isAdmin() && (
                          <button
                            onClick={() => handleDelete(deal.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm || stageFilter || outcomeFilter ? 'No deals found matching your filters.' : 'No deals found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Deal Modal */}
      {showCreateModal && (
        <DealModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          isLoading={createMutation.isLoading}
          title="Add New Deal"
          stages={stages}
        />
      )}

      {/* Edit Deal Modal */}
      {showEditModal && editingDeal && (
        <DealModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingDeal(null);
          }}
          onSubmit={(data) => handleUpdate(editingDeal.id, data)}
          isLoading={updateMutation.isLoading}
          title="Edit Deal"
          deal={editingDeal}
          stages={stages}
        />
      )}
    </div>
  );
};

// Deal Modal Component
const DealModal = ({ isOpen, onClose, onSubmit, isLoading, title, deal, stages }) => {
  const [formData, setFormData] = useState({
    name: deal?.name || '',
    customer_id: deal?.customer_id || '',
    amount: deal?.amount || '',
    stage: deal?.stage || '',
    outcome: deal?.outcome || '',
    description: deal?.description || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      amount: Number(formData.amount), // ensure it's a number
    };
    onSubmit(payload);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deal Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer ID *
            </label>
            <input
              type="number"
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount ($)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stage
            </label>
            <select
              name="stage"
              value={formData.stage}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Stage</option>
              {stages?.map(stage => (
                <option key={stage.id} value={stage.name}>{stage.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Outcome
            </label>
            <select
              name="outcome"
              value={formData.outcome}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Open</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DealsPage; 