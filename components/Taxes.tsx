import React, { useMemo, useState } from 'react';
import { Transaction, Driver, Vehicle, ExpenseCategory, EXPENSE_CATEGORY_LABELS, Region } from '../types';
import { InformationCircleIcon } from './Icons';

// Props definition
interface TaxesProps {
  transactions: Transaction[];
  drivers: Driver[];
  vehicles: Vehicle[];
}

// Standard VAT rates for expenses per region
const EXPENSE_VAT_RATES: Record<Region, number> = {
  continental: 0.23, // 23%
  acores: 0.18,       // 18%
  madeira: 0.22,      // 22%
};

const Taxes: React.FC<TaxesProps> = ({ transactions, drivers, vehicles }) => {
  // State for filters
  const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Memoized filtering of transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const driverMatch = selectedDriverId === 'all' || t.driverId === selectedDriverId;
      const vehicleMatch = selectedVehicleId === 'all' || t.vehicleId === selectedVehicleId;
      const txDate = t.date;
      const startDateMatch = !startDate || txDate >= startDate;
      const endDateMatch = !endDate || txDate <= endDate;
      return driverMatch && vehicleMatch && startDateMatch && endDateMatch;
    });
  }, [transactions, selectedDriverId, selectedVehicleId, startDate, endDate]);

  // Memoized tax summary calculation
  const taxSummary = useMemo(() => {
    const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
    
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const vatByCategory = expenseTransactions.reduce((acc, t) => {
      const driver = drivers.find(d => d.id === t.driverId);
      // Default to continental rate if driver or region is not found
      const vatRate = driver ? EXPENSE_VAT_RATES[driver.region] : EXPENSE_VAT_RATES.continental;

      const category = t.category as ExpenseCategory;
      // The transaction amount is gross (includes VAT)
      // VAT part = Gross Amount - (Gross Amount / (1 + VAT Rate))
      const vatAmount = t.amount - (t.amount / (1 + vatRate));
      
      if (!acc[category]) {
        acc[category] = { total: 0, vat: 0 };
      }
      
      acc[category].total += t.amount;
      acc[category].vat += vatAmount;
      
      return acc;
    }, {} as Record<ExpenseCategory, { total: number; vat: number }>);

    // FIX: The type of `cat` was inferred as `unknown`. Explicitly typing it allows accessing the `vat` property.
    // Fix for: Operator '+' cannot be applied to types 'unknown' and 'number'.
    const totalVat = Object.values(vatByCategory).reduce((sum, cat: { total: number; vat: number }) => sum + cat.vat, 0);

    const vatPercentage = totalExpenses > 0 ? (totalVat / totalExpenses) * 100 : 0;

    return {
      totalExpenses,
      totalVat,
      vatPercentage,
      vatByCategory
    };
  }, [filteredTransactions, drivers]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(amount);
  const tooltipText = `Estimativa calculada com base na taxa de IVA da região do motorista (Cont: 23%, Madeira: 22%, Açores: 18%). Para valores exatos, consulte um contabilista.`;

  return (
    <div className="space-y-6">
      {/* Filters Section */}
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

      {/* Info Box */}
      <div className="flex items-start gap-3 bg-surface p-4 rounded-md">
          <InformationCircleIcon className="h-6 w-6 text-brand-secondary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-text-primary">Cálculo do IVA</h4>
            <p className="text-sm text-text-secondary">O valor do IVA (Imposto sobre o Valor Acrescentado) é uma <span className="font-bold">estimativa</span> calculada aplicando a taxa normal correspondente à região de operação do motorista (Continental: 23%, Madeira: 22%, Açores: 18%) sobre o valor total de cada despesa. Esta ferramenta assume que as despesas incluem IVA a esta taxa, o que pode não se aplicar a todos os casos (ex: seguros). Consulte sempre um contabilista para obter valores exatos.</p>
          </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-6 rounded-lg shadow-lg">
            <h3 className="text-md font-medium text-text-secondary">Total de Despesas</h3>
            <p className="text-3xl font-bold mt-1 text-expense">{formatCurrency(taxSummary.totalExpenses)}</p>
        </div>
        <div className="bg-surface p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-1.5" title={tooltipText}>
              <h3 className="text-md font-medium text-text-secondary">Total de IVA Estimado</h3>
              <InformationCircleIcon className="h-4 w-4 text-muted cursor-help" />
            </div>
            <p className="text-3xl font-bold mt-1 text-brand-secondary">{formatCurrency(taxSummary.totalVat)}</p>
        </div>
        <div className="bg-surface p-6 rounded-lg shadow-lg">
            <h3 className="text-md font-medium text-text-secondary">\% do IVA sobre Despesas</h3>
            <p className="text-3xl font-bold mt-1 text-brand-secondary">{taxSummary.vatPercentage.toFixed(2)}%</p>
        </div>
      </div>
      
      {/* VAT by Category breakdown */}
      <div className="bg-surface p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-text-primary mb-4">Detalhe do IVA por Categoria</h2>
        {Object.keys(taxSummary.vatByCategory).length > 0 ? (
          <ul className="divide-y divide-background">
            {Object.entries(taxSummary.vatByCategory)
              // FIX: The types for `a` and `b` were inferred as `unknown`. Explicitly typing them allows accessing the `vat` property for sorting.
              .sort(([, a]: [string, { total: number; vat: number }], [, b]: [string, { total: number; vat: number }]) => b.vat - a.vat) // Sort by highest VAT amount
              // FIX: The type for `data` was inferred as `unknown`. Explicitly typing it allows accessing its properties.
              .map(([category, data]: [string, { total: number; vat: number }]) => (
              <li key={category} className="py-3 grid grid-cols-3 gap-4 items-center">
                <span className="font-semibold text-text-primary col-span-1">{EXPENSE_CATEGORY_LABELS[category as ExpenseCategory]}</span>
                <span className="text-text-secondary text-right col-span-1">Despesa: {formatCurrency(data.total)}</span>
                <span className="font-semibold text-brand-secondary text-right col-span-1">IVA: {formatCurrency(data.vat)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-secondary text-center py-4">Nenhuma despesa encontrada para os filtros selecionados.</p>
        )}
      </div>

    </div>
  );
};

export default Taxes;
