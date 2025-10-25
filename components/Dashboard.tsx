import React, { useMemo, useState } from 'react';
import { Platform, Transaction, Driver, Vehicle } from '../types';
import SummaryCard from './SummaryCard';
import TransactionsList from './TransactionsList';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, format } from 'date-fns';

interface PainelGeralProps {
  transactions: Transaction[];
  platforms: Platform[];
  drivers: Driver[];
  vehicles: Vehicle[];
  deleteTransaction: (id: string) => void;
  editTransaction: (id: string) => void;
}

const PainelGeral: React.FC<PainelGeralProps> = ({ transactions, platforms, drivers, vehicles, deleteTransaction, editTransaction }) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const transactionsForSummary = useMemo(() => {
    return transactions.filter(t => {
      const driverMatch = selectedDriverId === 'all' || t.driverId === selectedDriverId;
      const vehicleMatch = selectedVehicleId === 'all' || t.vehicleId === selectedVehicleId;
      return driverMatch && vehicleMatch;
    });
  }, [transactions, selectedDriverId, selectedVehicleId]);
  
  const transactionsForList = useMemo(() => {
    return transactionsForSummary.filter(t => {
      const txDate = t.date;
      const startDateMatch = !startDate || txDate >= startDate;
      const endDateMatch = !endDate || txDate <= endDate;
      return startDateMatch && endDateMatch;
    });
  }, [transactionsForSummary, startDate, endDate]);

  const { totalIncome, totalExpenses } = useMemo(() => {
    return transactionsForSummary.reduce((acc, t) => {
      if (t.type === 'income') {
        acc.totalIncome += t.amount;
      } else {
        acc.totalExpenses += t.amount;
      }
      return acc;
    }, { totalIncome: 0, totalExpenses: 0 });
  }, [transactionsForSummary]);

  const calculateProfit = (txs: Transaction[]) => {
    return txs.reduce((acc, t) => {
      if (t.type === 'income') return acc + t.amount;
      return acc - t.amount;
    }, 0);
  };

  const now = new Date();

  const { weeklyProfit, weeklyPeriodLabel } = useMemo(() => {
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    const weeklyTransactions = transactionsForSummary.filter(t => {
      const txDate = parseISO(t.date);
      return txDate >= start && txDate <= end;
    });
    return {
      weeklyProfit: calculateProfit(weeklyTransactions),
      weeklyPeriodLabel: `${format(start, 'dd/MM')} - ${format(end, 'dd/MM/yy')}`
    };
  }, [transactionsForSummary]);

  const { monthlyProfit, monthlyPeriodLabel } = useMemo(() => {
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const monthlyTransactions = transactionsForSummary.filter(t => {
        const txDate = parseISO(t.date);
        return txDate >= start && txDate <= end;
    });
    const monthName = now.toLocaleString('pt-PT', { month: 'long' });
    return {
      monthlyProfit: calculateProfit(monthlyTransactions),
      monthlyPeriodLabel: monthName.charAt(0).toUpperCase() + monthName.slice(1)
    };
  }, [transactionsForSummary]);

  const { yearlyProfit, yearlyPeriodLabel } = useMemo(() => {
    const start = startOfYear(now);
    const end = endOfYear(now);
    const yearlyTransactions = transactionsForSummary.filter(t => {
        const txDate = parseISO(t.date);
        return txDate >= start && txDate <= end;
    });
    return {
      yearlyProfit: calculateProfit(yearlyTransactions),
      yearlyPeriodLabel: now.getFullYear().toString()
    };
  }, [transactionsForSummary]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(amount);

  return (
    <div className="space-y-8">
      <div className="bg-surface p-4 rounded-lg shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="driver-filter" className="block text-sm font-medium text-text-secondary">Filtrar por Motorista</label>
            <select
              id="driver-filter"
              value={selectedDriverId}
              onChange={e => setSelectedDriverId(e.target.value)}
              className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
            >
              <option value="all">Todos os Motoristas</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="vehicle-filter" className="block text-sm font-medium text-text-secondary">Filtrar por Viatura</label>
            <select
              id="vehicle-filter"
              value={selectedVehicleId}
              onChange={e => setSelectedVehicleId(e.target.value)}
              className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
            >
              <option value="all">Todas as Viaturas</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.licensePlate})</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="start-date-filter" className="block text-sm font-medium text-text-secondary">Data Início</label>
            <input
              type="date"
              id="start-date-filter"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
          <div>
            <label htmlFor="end-date-filter" className="block text-sm font-medium text-text-secondary">Data Fim</label>
            <input
              type="date"
              id="end-date-filter"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-lg shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <div>
                <h3 className="text-md font-medium text-text-secondary">Total de Entradas</h3>
                <p className="text-3xl font-bold mt-1 text-income">{formatCurrency(totalIncome)}</p>
            </div>
            <div>
                <h3 className="text-md font-medium text-text-secondary">Total de Saídas</h3>
                <p className="text-3xl font-bold mt-1 text-expense">{formatCurrency(totalExpenses)}</p>
            </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-4">Resumo Financeiro</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard title="Lucro Esta Semana" amount={weeklyProfit} periodLabel={weeklyPeriodLabel}/>
          <SummaryCard title="Lucro Este Mês" amount={monthlyProfit} periodLabel={monthlyPeriodLabel} />
          <SummaryCard title="Lucro Este Ano" amount={yearlyProfit} periodLabel={yearlyPeriodLabel} />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-4">Transações</h2>
        <TransactionsList 
          transactions={transactionsForList} 
          platforms={platforms}
          drivers={drivers}
          vehicles={vehicles}
          deleteTransaction={deleteTransaction} 
          editTransaction={editTransaction}
        />
      </div>
    </div>
  );
};

export default PainelGeral;