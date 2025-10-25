import React from 'react';
import { Backup } from '../types';
import { TrashIcon, ArrowPathIcon } from './Icons';

interface BackupManagerProps {
  backups: Backup[];
  createManualBackup: () => void;
  restoreFromBackup: (id: string) => void;
  deleteBackup: (id: string) => void;
}

const BackupManager: React.FC<BackupManagerProps> = ({ backups, createManualBackup, restoreFromBackup, deleteBackup }) => {
  const sortedBackups = [...backups].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatDate = (dateString: string) => new Intl.DateTimeFormat('pt-PT', { 
    dateStyle: 'long', 
    timeStyle: 'medium' 
  }).format(new Date(dateString));
  
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="bg-surface p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-text-primary mb-4">Gestão de Backups</h2>
        <p className="text-text-secondary mb-4">
            Crie backups manuais ou restaure a partir de um ponto anterior. Backups automáticos são criados semanalmente (mantendo os últimos 4).
            <span className="font-bold block mt-2">Atenção:</span> Restaurar um backup substituirá todos os dados atuais da aplicação.
        </p>
        <div className="flex justify-end">
          <button 
            onClick={createManualBackup}
            className="py-2 px-4 bg-brand-primary text-white rounded-md hover:bg-brand-dark transition-colors"
          >
            Criar Backup Manual
          </button>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-text-primary mb-4">Backups Disponíveis</h2>
        {sortedBackups.length > 0 ? (
          <ul className="divide-y divide-background">
            {sortedBackups.map(backup => (
              <li key={backup.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="font-semibold text-text-primary">{formatDate(backup.date)}</p>
                  <p className={`text-sm font-medium ${backup.type === 'auto' ? 'text-brand-secondary' : 'text-text-secondary'}`}>
                    {backup.type === 'auto' ? 'Automático' : 'Manual'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  <button 
                    onClick={() => restoreFromBackup(backup.id)}
                    className="flex items-center gap-1.5 py-1 px-3 text-sm bg-background text-text-secondary hover:text-brand-primary hover:bg-muted transition-colors rounded-md"
                    aria-label={`Restaurar backup de ${formatDate(backup.date)}`}
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    Restaurar
                  </button>
                  <button 
                    onClick={() => deleteBackup(backup.id)}
                    className="text-muted hover:text-expense transition-colors p-2 rounded-full"
                    aria-label={`Apagar backup de ${formatDate(backup.date)}`}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-secondary text-center py-4">Nenhum backup encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default BackupManager;
