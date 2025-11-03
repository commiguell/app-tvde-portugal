
import React from 'react';

interface SummaryCardProps {
  title: string;
  income: number;
  expense: number;
  periodLabel?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, income, expense, periodLabel }) => {
  const profit = income - expense;
  const totalTransactions = income + expense;

  const formattedProfit = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(profit);

  const profitColor = profit >= 0 ? 'text-income' : 'text-expense';
  
  const incomePercentage = totalTransactions > 0 ? (income / totalTransactions) * 100 : 0;
  const expensePercentage = totalTransactions > 0 ? (expense / totalTransactions) * 100 : 0;

  return (
    <div className="bg-surface p-6 rounded-lg shadow-lg flex flex-col justify-between">
      <div>
        <h3 className="text-md font-medium text-brand-secondary">{title}</h3>
        <p className={`text-3xl font-bold mt-1 ${profitColor}`}>{formattedProfit}</p>
        {periodLabel && (
          <p className="text-xs text-brand-secondary/80 mt-1">{periodLabel}</p>
        )}
      </div>
      <div className="mt-4">
        {totalTransactions > 0 ? (
          <div className="w-full bg-background rounded-full h-2.5 flex overflow-hidden" title={`Rendimento: ${income.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })} | Despesa: ${expense.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}`}>
            <div className="bg-income h-2.5" style={{ width: `${incomePercentage}%` }}></div>
            <div className="bg-expense h-2.5" style={{ width: `${expensePercentage}%` }}></div>
          </div>
        ) : (
            <div className="w-full bg-background rounded-full h-2.5"></div>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;