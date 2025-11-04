import React, { useState, useMemo } from 'react';
import { Platform, Transaction, Driver, Vehicle, EXPENSE_CATEGORY_LABELS, ExpenseCategory, Region } from '../types';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, parseISO } from 'date-fns';
import { PrinterIcon, InformationCircleIcon } from './Icons';
import IncomeExpenseChart from './IncomeExpenseChart';

interface ReportsProps {
  transactions: Transaction[];
  platforms: Platform[];
  drivers: Driver[];
  vehicles: Vehicle[];
}

type Period = 'week' | 'month' | 'quarter' | 'semester' | 'year';

const EXPENSE_VAT_RATES: Record<Region, number> = {
  continental: 0.23,
  acores: 0.18,
  madeira: 0.22,
};

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
  
  const summaryByDriver = useMemo(() => {
    const driverData: Record<string, { income: number; expense: number }> = {};

    for (const t of filteredTransactions) {
        if (!driverData[t.driverId]) {
            driverData[t.driverId] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            driverData[t.driverId].income += t.amount;
        } else {
            driverData[t.driverId].expense += t.amount;
        }
    }

    return Object.entries(driverData)
        .map(([driverId, data]) => {
            const driver = drivers.find(d => d.id === driverId);
            return {
                driverId,
                driverName: driver ? driver.name : 'Motorista Desconhecido',
                ...data,
                profit: data.income - data.expense,
            };
        })
        .sort((a, b) => b.profit - a.profit);
  }, [filteredTransactions, drivers]);

  const taxSummary = useMemo(() => {
    let ivaLiquidado = 0;
    let irsEstimado = 0;
    let ssEstimada = 0;
    let ivaDedutivel = 0;

    for (const t of filteredTransactions) {
        if (t.type === 'expense') {
            // Auto-generated taxes on income
            if (t.parentId) {
                if (t.category === 'impostos') {
                    if (t.description.includes('IVA')) {
                        ivaLiquidado += t.amount;
                    } else if (t.description.includes('IRS')) {
                        irsEstimado += t.amount;
                    }
                } else if (t.category === 'seguranca_social') {
                    ssEstimada += t.amount;
                }
            } else { // Manual expenses for deductible VAT
                const driver = drivers.find(d => d.id === t.driverId);
                if (driver) {
                    if (t.vatAmount !== undefined) {
                        // Use manually entered VAT amount if available
                        ivaDedutivel += t.vatAmount;
                    } else {
                        // Otherwise, estimate it based on region
                        const vatRate = EXPENSE_VAT_RATES[driver.region];
                        const deductibleVatOnExpense = t.amount - (t.amount / (1 + vatRate));
                        ivaDedutivel += deductibleVatOnExpense;
                    }
                }
            }
        }
    }
    
    const ivaAPagar = ivaLiquidado - ivaDedutivel;

    return { ivaLiquidado, ivaDedutivel, ivaAPagar, irsEstimado, ssEstimada };
  }, [filteredTransactions, drivers]);


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

        <h3 className="text-xl font-bold text-text-primary mt-6 mb-3 print-text-black">Comparativo de Rendimento vs. Despesa</h3>
        <IncomeExpenseChart income={summary.totalIncome} expense={summary.totalExpense} />

        <h3 className="text-xl font-bold text-text-primary mt-6 mb-3 print-text-black">Despesas por Categoria</h3>
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

        <h3 className="text-xl font-bold text-text-primary mb-3 print-text-black">Resumo por Motorista</h3>
        <div className="bg-background p-4 rounded-lg mb-6 print-bg-transparent">
            {summaryByDriver.length > 0 ? (
                <ul className="space-y-4">
                    {summaryByDriver.map(driverSummary => (
                        <li key={driverSummary.driverId} className="p-3 bg-surface rounded-md print-bg-transparent">
                            <h4 className="font-bold text-text-primary print-text-black">{driverSummary.driverName}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-sm">
                                <div>
                                    <span className="text-text-secondary print-text-black">Rendimento: </span>
                                    <span className="font-medium text-income">{formatCurrency(driverSummary.income)}</span>
                                </div>
                                <div>
                                    <span className="text-text-secondary print-text-black">Despesa: </span>
                                    <span className="font-medium text-expense">{formatCurrency(driverSummary.expense)}</span>
                                </div>
                                <div>
                                    <span className="text-text-secondary print-text-black">Lucro: </span>
                                    <span className={`font-medium ${driverSummary.profit >= 0 ? 'text-income' : 'text-expense'}`}>
                                        {formatCurrency(driverSummary.profit)}
                                    </span>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-text-secondary text-center">Sem dados para apresentar.</p>
            )}
        </div>

        <h3 className="text-xl font-bold text-text-primary mb-3 print-text-black">Resumo de Impostos Estimados</h3>
        <div className="bg-background p-4 rounded-lg mb-6 print-bg-transparent">
            <div className="flex items-start gap-3 bg-surface/50 p-3 rounded-md mb-4 print-bg-transparent">
                <InformationCircleIcon className="h-5 w-5 text-brand-secondary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary print-text-black">
                    Estes valores são estimativas baseadas nos seus lançamentos e configurações de motorista. Para maior precisão, pode introduzir o valor de IVA exato em cada despesa. Para valores finais, consulte um contabilista.
                </p>
            </div>
            <ul className="space-y-3">
                <li className="flex justify-between items-center text-text-secondary print-text-black">
                    <span>(+) IVA Liquidado (s/ Rendimentos)</span>
                    <span className="font-medium text-income">{formatCurrency(taxSummary.ivaLiquidado)}</span>
                </li>
                 <li className="flex justify-between items-center text-text-secondary print-text-black">
                    <span>(-) IVA Dedutível (s/ Despesas)</span>
                    <span className="font-medium text-expense">{formatCurrency(taxSummary.ivaDedutivel)}</span>
                </li>
                 <li className="flex justify-between items-center text-text-primary print-text-black border-t border-muted pt-3 mt-2">
                    <span className="font-bold">(=) Total de IVA a Pagar</span>
                    <span className={`font-bold text-lg ${taxSummary.ivaAPagar >= 0 ? 'text-brand-secondary' : 'text-green-400'}`}>
                        {formatCurrency(taxSummary.ivaAPagar)}
                    </span>
                </li>
            </ul>
            <ul className="space-y-2 mt-4 border-t border-muted pt-4">
                <li className="flex justify-between items-center text-text-secondary print-text-black">
                    <span>IRS Estimado (ENI)</span>
                    <span className="font-medium">{formatCurrency(taxSummary.irsEstimado)}</span>
                </li>
                 <li className="flex justify-between items-center text-text-secondary print-text-black">
                    <span>Segurança Social Estimada (ENI)</span>
                    <span className="font-medium">{formatCurrency(taxSummary.ssEstimada)}</span>
                </li>
            </ul>
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