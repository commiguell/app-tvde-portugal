import React, { useState, useEffect, useMemo } from 'react';
import { Platform, Transaction, TransactionType, ExpenseCategory, EXPENSE_CATEGORY_LABELS, Driver, Vehicle } from '../types';
import { XMarkIcon, CheckCircleIcon, CalculatorIcon } from './Icons';

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
  const [vatAmount, setVatAmount] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  
  const isEditing = !!transactionToEdit;

  const availableVehicles = useMemo(() => {
    if (!driverId) {
      return vehicles;
    }
    const selectedDriver = drivers.find(d => d.id === driverId);
    if (!selectedDriver || !selectedDriver.vehicleIds || selectedDriver.vehicleIds.length === 0) {
      return vehicles; // Fallback to all vehicles if driver has no specific associations
    }
    return vehicles.filter(v => selectedDriver.vehicleIds?.includes(v.id));
  }, [driverId, drivers, vehicles]);

  useEffect(() => {
    if (isOpen) {
        setIsSaved(false); // Reset confirmation on open
        if (transactionToEdit) {
            setType(transactionToEdit.type);
            setAmount(String(transactionToEdit.amount));
            setDescription(transactionToEdit.description);
            setDate(new Date(transactionToEdit.date).toISOString().split('T')[0]);
            setPlatformId(transactionToEdit.platformId || '');
            setCategory(transactionToEdit.category || 'combustivel');
            setDriverId(transactionToEdit.driverId);
            setVehicleId(transactionToEdit.vehicleId);
            setVatAmount(transactionToEdit.vatAmount ? String(transactionToEdit.vatAmount) : '');
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
  
  const selectedDriver = useMemo(() => drivers.find(d => d.id === driverId), [driverId, drivers]);
  const showTaxInfo = type === 'income' && selectedDriver?.entityType === 'eni';

  useEffect(() => {
    // When driver changes, check if the selected vehicle is still valid
    if (driverId) {
      const isVehicleStillValid = availableVehicles.some(v => v.id === vehicleId);
      if (!isVehicleStillValid) {
        // Reset vehicle selection if it's no longer associated with the new driver
        // or if no vehicle was selected yet
        setVehicleId(availableVehicles[0]?.id || '');
      }
    }
  }, [driverId, vehicleId, availableVehicles]);

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

  const handleClose = () => {
    setIsSaved(false);
    onClose();
  };

  const handleAddAnother = () => {
    resetForm();
    setIsSaved(false);
  };

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
      ...(type === 'expense' && vatAmount && { vatAmount: parseFloat(vatAmount) }),
    };

    onSaveTransaction(newTransactionData, transactionToEdit?.id);
    setIsSaved(true);
  };

  const resetForm = () => {
    setType('income');
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setPlatformId(platforms[0]?.id || '');
    setDriverId(drivers[0]?.id || '');
    // Let the useEffect handle setting the vehicleId based on the first driver
    setVehicleId(''); 
    setCategory('combustivel');
    setVatAmount('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-md overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {isSaved ? (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <CheckCircleIcon className="h-16 w-16 text-income mx-auto mb-4" />
            <h2 className="text-xl font-bold text-text-primary mb-2">Transação Guardada!</h2>
            <p className="text-text-secondary mb-6">A sua transação foi registada com sucesso.</p>
            <div className="flex justify-center gap-3">
              <button type="button" onClick={handleClose} className="py-2 px-4 bg-muted text-text-primary rounded-md hover:bg-opacity-80 transition-colors">Fechar</button>
              {!isEditing && (
                <button type="button" onClick={handleAddAnother} className="py-2 px-4 bg-brand-primary text-white rounded-md hover:bg-brand-dark transition-colors">Adicionar Outra</button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-text-primary">{isEditing ? 'Editar' : 'Adicionar Nova'} Transação</h2>
              <button onClick={handleClose} className="text-muted hover:text-text-primary transition-colors">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 bg-background p-1 rounded-md">
                <button type="button" onClick={() => setType('income')} className={`py-2 px-4 rounded ${type === 'income' ? 'bg-brand-primary text-white' : 'text-text-secondary hover:bg-muted'}`}>Rendimento</button>
                <button type="button" onClick={() => setType('expense')} className={`py-2 px-4 rounded ${type === 'expense' ? 'bg-brand-primary text-white' : 'text-text-secondary hover:bg-muted'}`}>Despesa</button>
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-text-secondary">Valor Total {type === 'expense' ? '(c/ IVA)' : ''}</label>
                <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required step="0.01" className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary" />
              </div>

               {type === 'expense' && (
                <div>
                  <label htmlFor="vatAmount" className="block text-sm font-medium text-text-secondary">Valor do IVA (Opcional)</label>
                  <input type="number" id="vatAmount" value={vatAmount} onChange={e => setVatAmount(e.target.value)} step="0.01" min="0" className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary" />
                   <p className="text-xs text-muted mt-1">Se deixado em branco, o IVA será estimado com base na região do motorista.</p>
                </div>
              )}

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-text-secondary">Descrição</label>
                <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary" />
              </div>
              
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-text-secondary">Data</label>
                <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="driverId" className="block text-sm font-medium text-text-secondary">Motorista</label>
                    <select id="driverId" value={driverId} onChange={e => setDriverId(e.target.value)} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
                      <option value="" disabled>Selecione um motorista</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="vehicleId" className="block text-sm font-medium text-text-secondary">Viatura</label>
                    <select id="vehicleId" value={vehicleId} onChange={e => setVehicleId(e.target.value)} required disabled={!driverId} className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary disabled:opacity-50">
                      <option value="" disabled>Selecione uma viatura</option>
                      {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.licensePlate})</option>)}
                    </select>
                  </div>
              </div>


              {type === 'income' ? (
                <div>
                  <label htmlFor="platformId" className="block text-sm font-medium text-text-secondary">Plataforma</label>
                  <select id="platformId" value={platformId} onChange={e => setPlatformId(e.target.value)} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
                    <option value="" disabled>Selecione uma plataforma</option>
                    {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-text-secondary">Categoria</label>
                  <select id="category" value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
                     {availableCategories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </div>
              )}
              
              {showTaxInfo && (
                <div className="pt-4 mt-4 border-t border-background/80">
                  <div className="flex items-start gap-3 bg-background/50 p-3 rounded-md">
                      <CalculatorIcon className="h-6 w-6 text-brand-secondary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-text-primary">Estimativas Automáticas (ENI)</h4>
                        <p className="text-xs text-text-secondary">Ao guardar, serão criadas despesas estimadas para IVA, IRS e Segurança Social com base neste rendimento.</p>
                      </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={handleClose} className="py-2 px-4 bg-muted text-text-primary rounded-md hover:bg-opacity-80 transition-colors">Cancelar</button>
                <button type="submit" disabled={!canSubmit} className="py-2 px-4 bg-brand-primary text-white rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isEditing ? 'Guardar Alterações' : 'Guardar Transação'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AddTransactionModal;