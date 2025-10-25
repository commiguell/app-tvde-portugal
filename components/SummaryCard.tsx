
import React from 'react';

interface SummaryCardProps {
  title: string;
  amount: number;
  periodLabel?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, periodLabel }) => {
  const formattedAmount = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);

  const amountColor = amount >= 0 ? 'text-income' : 'text-expense';

  return (
    <div className="bg-surface p-6 rounded-lg shadow-lg">
      <h3 className="text-md font-medium text-brand-secondary">{title}</h3>
      <p className={`text-3xl font-bold mt-1 ${amountColor}`}>{formattedAmount}</p>
      {periodLabel && (
        <p className="text-xs text-brand-secondary/80 mt-1">{periodLabel}</p>
      )}
    </div>
  );
};

export default SummaryCard;