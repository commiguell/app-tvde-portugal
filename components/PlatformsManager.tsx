import React, { useState, useEffect } from 'react';
import { Platform } from '../types';
import { TrashIcon, PencilIcon } from './Icons';

interface PlatformsManagerProps {
  platforms: Platform[];
  addPlatform: (platform: Omit<Platform, 'id'>) => void;
  updatePlatform: (platform: Platform) => void;
  deletePlatform: (id:string) => void;
}

const PlatformsManager: React.FC<PlatformsManagerProps> = ({ platforms, addPlatform, updatePlatform, deletePlatform }) => {
  const [name, setName] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (editingId) {
      const platformToEdit = platforms.find(p => p.id === editingId);
      if (platformToEdit) {
        setName(platformToEdit.name);
        setCommissionRate(String(platformToEdit.commissionRate));
      }
    } else {
      resetForm();
    }
  }, [editingId, platforms]);
  
  const resetForm = () => {
    setName('');
    setCommissionRate('');
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !commissionRate) return;

    const platformData = { name, commissionRate: parseFloat(commissionRate) };

    if (editingId) {
      updatePlatform({ ...platformData, id: editingId });
    } else {
      addPlatform(platformData);
    }
    resetForm();
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="bg-surface p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-text-primary mb-4">{editingId ? 'Editar' : 'Adicionar Nova'} Plataforma</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="platform-name" className="block text-sm font-medium text-text-secondary">Nome da Plataforma</label>
            <input
              type="text"
              id="platform-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
          <div>
            <label htmlFor="commission-rate" className="block text-sm font-medium text-text-secondary">Taxa de Comissão (%)</label>
            <input
              type="number"
              id="commission-rate"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              step="0.1"
              min="0"
              max="100"
              required
              className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
          <div className="flex justify-end gap-3">
            {editingId && (
              <button type="button" onClick={resetForm} className="py-2 px-4 bg-muted text-text-primary rounded-md hover:bg-opacity-80 transition-colors">
                Cancelar
              </button>
            )}
            <button type="submit" className="py-2 px-4 bg-brand-primary text-white rounded-md hover:bg-brand-dark transition-colors">
              {editingId ? 'Guardar Alterações' : 'Adicionar Plataforma'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-surface p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-text-primary mb-4">Plataformas Existentes</h2>
        {platforms.length > 0 ? (
          <ul className="divide-y divide-background">
            {platforms.map(p => (
              <li key={p.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-text-primary">{p.name}</p>
                  <p className="text-sm text-text-secondary">Comissão: {p.commissionRate}%</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setEditingId(p.id)}
                    className="text-muted hover:text-brand-secondary transition-colors p-2 rounded-full"
                    aria-label={`Editar ${p.name}`}
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                   <button 
                    onClick={() => deletePlatform(p.id)}
                    className="text-muted hover:text-expense transition-colors p-2 rounded-full"
                    aria-label={`Apagar ${p.name}`}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-secondary text-center py-4">Nenhuma plataforma adicionada.</p>
        )}
      </div>
    </div>
  );
};

export default PlatformsManager;