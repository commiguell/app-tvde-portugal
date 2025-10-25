import React from 'react';
import { Platform, Transaction, EXPENSE_CATEGORY_LABELS, Driver, Vehicle } from '../types';
import { ArrowDownCircleIcon, ArrowUpCircleIcon, TrashIcon, UsersIcon, TruckIcon, PencilIcon } from './Icons';

interface TransactionsListProps {
  transactions: Transaction[];
  platforms: Platform[];
  drivers: Driver[];
  vehicles: Vehicle[];
  deleteTransaction: (id: string) => void;
  editTransaction: (id: string) => void;
}

const TransactionsList: React.FC<TransactionsListProps> = ({ transactions, platforms, drivers, vehicles, deleteTransaction, editTransaction }) => {

  const getPlatformName = (platformId?: string) => platforms.find(p => p.id === platformId)?.name || 'N/A';
  const getDriverName = (driverId: string) => drivers.find(d => d.id === driverId)?.name || 'N/A';
  const getVehicleIdentifier = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.name} (${vehicle.licensePlate})` : 'N/A';
  }

  const formatDate = (dateString: string) => new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString));
  
  const renderDescription = (description: string) => {
    const match = description.match(/(\(.*\))/);
    if (match) {
      const parts = description.split(match[0]);
      return (
        <span className="font-semibold text-text-primary">
          {parts[0]}
          <span className="text-brand-secondary font-semibold text-sm align-middle"> {match[0]} </span>
          {parts[1]}
        </span>
      );
    }
    return <span className="font-semibold text-text-primary">{description}</span>;
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-surface p-8 rounded-lg text-center text-text-secondary">
        <p>Ainda não há transações para os filtros selecionados.</p>
        <p className="text-sm mt-1">Adicione uma nova transação para começar.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow-lg overflow-hidden">
      <ul className="divide-y divide-background">
        {transactions.map(t => (
          <li key={t.id} className={`p-4 flex items-center justify-between hover:bg-background/50 transition-colors ${t.parentId ? 'opacity-70' : ''}`}>
            <div className="flex items-center gap-4">
              {t.type === 'income' ? <ArrowUpCircleIcon className="h-8 w-8 text-income flex-shrink-0" /> : <ArrowDownCircleIcon className="h-8 w-8 text-expense flex-shrink-0" />}
              <div className="flex flex-col">
                {renderDescription(t.description)}
                <span className="text-sm text-text-secondary">
                  {t.type === 'income' ? `Plataforma: ${getPlatformName(t.platformId)}` : `Categoria: ${t.category ? EXPENSE_CATEGORY_LABELS[t.category] : 'Despesa'}`}
                </span>
                <div className="flex items-center gap-3 text-xs text-muted mt-1">
                  <span className="flex items-center gap-1"><UsersIcon className="h-4 w-4" />{getDriverName(t.driverId)}</span>
                  <span className="flex items-center gap-1"><TruckIcon className="h-4 w-4" />{getVehicleIdentifier(t.vehicleId)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-4">
               <div className="text-right">
                <span className={`font-bold ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                  {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </span>
                <p className="text-sm text-text-secondary">{formatDate(t.date)}</p>
              </div>
              <div className="flex flex-col md:flex-row gap-1">
                {!t.parentId && (
                  <button 
                    onClick={() => editTransaction(t.id)} 
                    className="text-muted hover:text-brand-secondary transition-colors p-2 rounded-full"
                    aria-label="Editar transação"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                )}
                <button 
                  onClick={() => deleteTransaction(t.id)} 
                  className="text-muted hover:text-expense transition-colors p-2 rounded-full"
                  aria-label="Apagar transação"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionsList;