import React from 'react';
import { ExpenseCategory } from '../types';

interface ChartData {
  label: string;
  amount: number;
  category: ExpenseCategory;
}

interface ExpenseChartProps {
  data: ChartData[];
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  combustivel: 'bg-red-500',
  manutencao: 'bg-orange-500',
  impostos: 'bg-yellow-500',
  seguranca_social: 'bg-blue-500',
  seguro_automovel: 'bg-green-500',
  imposto_circulacao: 'bg-sky-500',
  licencas: 'bg-cyan-500',
  irc: 'bg-indigo-500',
  tsu: 'bg-purple-500',
  outros: 'bg-gray-500',
};

const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(amount);

const ExpenseChart: React.FC<ExpenseChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="bg-surface p-6 rounded-lg text-center text-text-secondary">
        <p>Sem dados de despesas para o período selecionado.</p>
      </div>
    );
  }

  const totalExpenses = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="bg-surface p-6 rounded-lg shadow-lg">
      <ul className="space-y-4">
        {data.map(({ label, amount, category }) => {
          const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
          return (
            <li key={category}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-text-secondary">{label}</span>
                <span className="text-sm font-bold text-text-primary">{formatCurrency(amount)}</span>
              </div>
              <div className="w-full bg-background rounded-full h-2.5" title={`${percentage.toFixed(2)}%`}>
                <div 
                  className={`${CATEGORY_COLORS[category]} h-2.5 rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ExpenseChart;