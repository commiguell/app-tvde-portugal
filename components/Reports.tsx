import React, { useState, useMemo } from 'react';
import { Platform, Transaction, Driver, Vehicle, EXPENSE_CATEGORY_LABELS, ExpenseCategory } from '../types';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, parseISO } from 'date-fns';
import { PrinterIcon } from './Icons';

interface ReportsProps {
  transactions: Transaction[];
  platforms: Platform[];
  drivers: Driver[];
  vehicles: Vehicle[];
}

type Period = 'week' | 'month' | 'quarter' | 'semester' | 'year';

const Reports: React.FC<ReportsProps> = ({ transactions, platforms, drivers, vehicles }) => {
  const [period, setPeriod] = useState<Period>('month');

  const { filteredTransactions, title } = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();
    let reportTitle = '';

    switch (period) {
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        reportTitle = 'Relatório Semanal';
        break;
      case 'quarter':
        startDate = startOfQuarter(now);
        endDate = endOfQuarter(now);
        reportTitle = 'Relatório Trimestral';
        break;
      case 'semester':
        startDate = subMonths(now, 6);
        reportTitle = 'Relatório Semestral';
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        reportTitle = 'Relatório Anual';
        break;
      case 'month':
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        reportTitle = 'Relatório Mensal';
        break;
    }
    
    const txs = transactions.filter(t => {
      const txDate = parseISO(t.date);
      return txDate >= startDate && txDate <= endDate;
    });

    return { filteredTransactions: txs, title: `${reportTitle} (${startDate.toLocaleDateString('pt-PT')} - ${endDate.toLocaleDateString('pt-PT')})` };
  }, [period, transactions]);

  const summary = useMemo(() => {
    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const profit = totalIncome - totalExpense;
    
    const expensesByCategory = filteredTransactions
      .filter(t => t.type === 'expense' && t.category)
      .reduce((acc, t) => {
        const category = t.category as ExpenseCategory;
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += t.amount;
        return acc;
      }, {} as Record<ExpenseCategory, number>);

    return { totalIncome, totalExpense, profit, expensesByCategory };
  }, [filteredTransactions]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(amount);

  const handlePrint = () => window.print();
  
  const PeriodButton: React.FC<{ value: Period; label: string; }> = ({ value, label }) => (
    <button 
      onClick={() => setPeriod(value)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${period === value ? 'bg-brand-primary text-white' : 'bg-background hover:bg-muted'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="bg-surface p-4 rounded-lg shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
        <div className="flex flex-wrap gap-2">
            <PeriodButton value="week" label="Semana" />
            <PeriodButton value="month" label="Mês" />
            <PeriodButton value="quarter" label="Trimestre" />
            <PeriodButton value="semester" label="Semestre" />
            <PeriodButton value="year" label="Ano" />
        </div>
        <div className="flex gap-2">
            <button onClick={handlePrint} className="p-2 bg-background rounded-md hover:bg-muted"><PrinterIcon className="h-5 w-5"/></button>
        </div>
      </div>
      
      <div id="report-content" className="bg-surface p-6 rounded-lg shadow-lg print-bg-transparent">
        <h2 className="text-2xl font-bold text-text-primary mb-4 print-text-black">{title}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-background p-4 rounded-lg print-bg-transparent"><h3 className="text-text-secondary print-text-black">Rendimento Total</h3><p className="text-2xl font-bold text-income">{formatCurrency(summary.totalIncome)}</p></div>
            <div className="bg-background p-4 rounded-lg print-bg-transparent"><h3 className="text-text-secondary print-text-black">Despesa Total</h3><p className="text-2xl font-bold text-expense">{formatCurrency(summary.totalExpense)}</p></div>
            <div className="bg-background p-4 rounded-lg print-bg-transparent"><h3 className="text-text-secondary print-text-black">Lucro Líquido</h3><p className={`text-2xl font-bold ${summary.profit >= 0 ? 'text-income' : 'text-expense'}`}>{formatCurrency(summary.profit)}</p></div>
        </div>

        <h3 className="text-xl font-bold text-text-primary mb-3 print-text-black">Despesas por Categoria</h3>
        <div className="bg-background p-4 rounded-lg mb-6 print-bg-transparent">
            {Object.keys(summary.expensesByCategory).length > 0 ? (
                 <ul className="space-y-2">
                    {Object.entries(summary.expensesByCategory).map(([key, value]) => (
                        <li key={key} className="flex justify-between items-center text-text-secondary print-text-black">
                            <span>{EXPENSE_CATEGORY_LABELS[key as ExpenseCategory]}</span>
                            {/* FIX: Cast value to number as Object.entries returns [string, unknown] */}
                            <span className="font-medium">{formatCurrency(value as number)}</span>
                        </li>
                    ))}
                 </ul>
            ) : <p className="text-text-secondary text-center">Sem despesas no período.</p>}
        </div>

        <h3 className="text-xl font-bold text-text-primary mb-3 print-text-black">Todas as Transações</h3>
        <div className="bg-background rounded-lg overflow-hidden print-bg-transparent">
             {filteredTransactions.length > 0 ? (
                <ul className="divide-y divide-surface print-text-black">
                    {filteredTransactions.map(t => (
                        <li key={t.id} className={`p-3 flex justify-between items-center ${t.parentId ? 'opacity-70' : ''}`}>
                            <div>
                                <p className="font-semibold">{t.description}</p>
                                <p className="text-sm text-muted">{new Date(t.date).toLocaleDateString('pt-PT')}</p>
                            </div>
                            <span className={`font-bold ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                                {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                            </span>
                        </li>
                    ))}
                </ul>
             ) : <p className="text-text-secondary text-center p-4">Nenhuma transação no período.</p>}
        </div>
      </div>
    </div>
  );
};

export default Reports;
