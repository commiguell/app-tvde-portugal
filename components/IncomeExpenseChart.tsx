import React from 'react';

interface IncomeExpenseChartProps {
  income: number;
  expense: number;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(amount);

const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ income, expense }) => {
  const maxValue = Math.max(income, expense, 1); // Use 1 to avoid division by zero
  const incomeHeight = (income / maxValue) * 100;
  const expenseHeight = (expense / maxValue) * 100;

  if (income === 0 && expense === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-background rounded-lg">
        <p className="text-text-secondary">Sem dados para apresentar no gráfico.</p>
      </div>
    );
  }

  return (
    <div className="bg-background p-4 rounded-lg h-80 flex items-end justify-around gap-8 print-bg-transparent">
      {/* Income Bar */}
      <div className="flex flex-col items-center h-full w-1/3">
        <div className="text-sm font-bold text-income mb-2 print-text-black">{formatCurrency(income)}</div>
        <div 
          className="w-full bg-income rounded-t-md transition-all duration-500 ease-out" 
          style={{ height: `${incomeHeight}%` }}
          title={`Rendimento: ${formatCurrency(income)}`}
        ></div>
        <div className="mt-2 text-sm font-medium text-text-secondary print-text-black">Rendimento</div>
      </div>

      {/* Expense Bar */}
      <div className="flex flex-col items-center h-full w-1/3">
        <div className="text-sm font-bold text-expense mb-2 print-text-black">{formatCurrency(expense)}</div>
        <div 
          className="w-full bg-expense rounded-t-md transition-all duration-500 ease-out" 
          style={{ height: `${expenseHeight}%` }}
          title={`Despesa: ${formatCurrency(expense)}`}
        ></div>
        <div className="mt-2 text-sm font-medium text-text-secondary print-text-black">Despesa</div>
      </div>
    </div>
  );
};

export default IncomeExpenseChart;
