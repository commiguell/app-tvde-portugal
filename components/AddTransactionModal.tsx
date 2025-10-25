import React, { useState, useEffect, useMemo } from 'react';
import { Platform, Transaction, TransactionType, ExpenseCategory, EXPENSE_CATEGORY_LABELS, Driver, Vehicle } from '../types';
import { XMarkIcon } from './Icons';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransaction: (transaction: Omit<Transaction, 'id' | 'parentId'>, id?: string) => void;
  platforms: Platform[];
  drivers: Driver[];
  vehicles: Vehicle[];
  transactionToEdit?: Transaction | null;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onSaveTransaction, platforms, drivers, vehicles, transactionToEdit }) => {
  const [type, setType] = useState<TransactionType>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [platformId, setPlatformId] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('combustivel');
  const [driverId, setDriverId] = useState<string>('');
  const [vehicleId, setVehicleId] = useState<string>('');
  
  const isEditing = !!transactionToEdit;

  useEffect(() => {
    if (isOpen) {
        if (transactionToEdit) {
            setType(transactionToEdit.type);
            setAmount(String(transactionToEdit.amount));
            setDescription(transactionToEdit.description);
            setDate(new Date(transactionToEdit.date).toISOString().split('T')[0]);
            setPlatformId(transactionToEdit.platformId || '');
            setCategory(transactionToEdit.category || 'combustivel');
            setDriverId(transactionToEdit.driverId);
            setVehicleId(transactionToEdit.vehicleId);
        } else {
            resetForm();
        }
    }
  }, [isOpen, transactionToEdit]);

  const availableCategories = useMemo(() => {
    const selectedDriver = drivers.find(d => d.id === driverId);
    const baseCategories = { ...EXPENSE_CATEGORY_LABELS };

    if (selectedDriver?.entityType !== 'empresa') {
        // FIX: Type assertion to allow deletion of keys from the record
        delete (baseCategories as Partial<typeof baseCategories>).irc;
        delete (baseCategories as Partial<typeof baseCategories>).tsu;
    }
    
    return Object.entries(baseCategories);
  }, [driverId, drivers]);

  useEffect(() => {
    // Reset category if it's not available for the selected driver
    if (type === 'expense') {
        const currentCategoryIsValid = availableCategories.some(([key]) => key === category);
        if (!currentCategoryIsValid) {
            setCategory('combustivel');
        }
    }
  }, [driverId, availableCategories, type, category]);


  if (!isOpen) return null;

  const canSubmit = amount && description && date && driverId && vehicleId && (type === 'expense' || (type === 'income' && platformId));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const newTransactionData: Omit<Transaction, 'id' | 'parentId'> = {
      type,
      amount: parseFloat(amount),
      description,
      date,
      driverId,
      vehicleId,
      ...(type === 'income' && { platformId }),
      ...(type === 'expense' && { category }),
    };

    onSaveTransaction(newTransactionData, transactionToEdit?.id);
  };

  const resetForm = () => {
    setType('income');
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setPlatformId(platforms[0]?.id || '');
    setDriverId(drivers[0]?.id || '');
    setVehicleId(vehicles[0]?.id || '');
    setCategory('combustivel');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-primary">{isEditing ? 'Editar' : 'Adicionar'} Transação</h2>
          <button onClick={onClose} className="text-muted hover:text-text-primary p-1 rounded-full"><XMarkIcon className="h-6 w-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex bg-background rounded-lg p-1">
            <button type="button" onClick={() => setType('income')} className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${type === 'income' ? 'bg-income text-white' : 'text-text-secondary hover:bg-muted'}`} disabled={isEditing}>Rendimento</button>
            <button type="button" onClick={() => setType('expense')} className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${type === 'expense' ? 'bg-expense text-white' : 'text-text-secondary hover:bg-muted'}`} disabled={isEditing}>Despesa</button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="driver" className="block text-sm font-medium text-text-secondary">Motorista</label>
              <select id="driver" value={driverId} onChange={e => setDriverId(e.target.value)} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
                <option value="" disabled>Selecione...</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="vehicle" className="block text-sm font-medium text-text-secondary">Viatura</label>
              <select id="vehicle" value={vehicleId} onChange={e => setVehicleId(e.target.value)} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
                <option value="" disabled>Selecione...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.licensePlate})</option>)}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-text-secondary">Valor (€)</label>
            <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} step="0.01" min="0" required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary" />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-text-secondary">Descrição</label>
            <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary" />
          </div>

          {type === 'income' ? (
            <div>
              <label htmlFor="platform" className="block text-sm font-medium text-text-secondary">Plataforma</label>
              <select id="platform" value={platformId} onChange={e => setPlatformId(e.target.value)} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
                <option value="" disabled>Selecione...</option>
                {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-text-secondary">Categoria</label>
              <select id="category" value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
                {availableCategories.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-text-secondary">Data</label>
            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary" />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-muted text-text-primary rounded-md hover:bg-opacity-80 transition-colors">Cancelar</button>
            <button type="submit" disabled={!canSubmit} className="py-2 px-4 bg-brand-primary text-white rounded-md hover:bg-brand-dark transition-colors disabled:bg-muted disabled:cursor-not-allowed">{isEditing ? 'Guardar' : 'Adicionar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;