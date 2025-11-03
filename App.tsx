import React, { useState, useMemo, useEffect } from 'react';
import { Platform, Transaction, Driver, Vehicle, Region, Backup, AppData } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import Header from './components/Header';
import PainelGeral from './components/Dashboard';
import AddTransactionModal from './components/AddTransactionModal';
import PlatformsManager from './components/PlatformsManager';
import DriversManager from './components/DriversManager';
import VehiclesManager from './components/VehiclesManager';
import Reports from './components/Reports';
import BackupManager from './components/BackupManager';
import Taxes from './components/Taxes';
import { PlusIcon, Cog6ToothIcon, UsersIcon, TruckIcon, ArchiveBoxIcon } from './components/Icons';

type View = 'dashboard' | 'settings' | 'reports' | 'taxes';
type SettingsView = 'platforms' | 'drivers' | 'vehicles' | 'backups';

const App: React.FC = () => {
  const [platforms, setPlatforms] = useLocalStorage<Platform[]>('tvde-platforms', [
    { id: 'uber-1', name: 'Uber', commissionRate: 25 },
    { id: 'bolt-1', name: 'Bolt', commissionRate: 20 },
  ]);
  const [drivers, setDrivers] = useLocalStorage<Driver[]>('tvde-drivers', []);
  const [vehicles, setVehicles] = useLocalStorage<Vehicle[]>('tvde-vehicles', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('tvde-transactions', []);
  const [backups, setBackups] = useLocalStorage<Backup[]>('tvde-backups', []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [activeSettingsView, setActiveSettingsView] = useState<SettingsView>('drivers');

  useEffect(() => {
    const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
    const autoBackups = backups.filter(b => b.type === 'auto').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastAutoBackup = autoBackups[0];

    const shouldCreateBackup = !lastAutoBackup || (new Date().getTime() - new Date(lastAutoBackup.date).getTime() > ONE_WEEK_IN_MS);

    if (shouldCreateBackup) {
      const appData: AppData = { platforms, drivers, vehicles, transactions };
      // Don't create backup if there's no data
      if (appData.platforms.length === 0 && appData.drivers.length === 0 && appData.vehicles.length === 0 && appData.transactions.length === 0) {
        return;
      }

      const newBackup: Backup = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: 'auto',
        data: appData,
      };

      const updatedAutoBackups = [newBackup, ...autoBackups].slice(0, 4);
      const manualBackups = backups.filter(b => b.type === 'manual');
      setBackups([...manualBackups, ...updatedAutoBackups]);
    }
  }, [platforms, drivers, vehicles, transactions]);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const saveTransaction = (transactionData: Omit<Transaction, 'id'>, idToUpdate?: string) => {
    let transactionsToAdd: Transaction[] = [];
    let transactionsToKeep = [...transactions];

    if (idToUpdate) {
      transactionsToKeep = transactions.filter(t => t.id !== idToUpdate && t.parentId !== idToUpdate);
    }

    const mainTransactionId = idToUpdate || crypto.randomUUID();
    const mainTransaction: Transaction = { ...transactionData, id: mainTransactionId };
    transactionsToAdd.push(mainTransaction);

    if (transactionData.type === 'income' && transactionData.driverId) {
      const driver = drivers.find(d => d.id === transactionData.driverId);
      if (!driver) return;

      const IVA_RATES: Record<Region, number> = {
        continental: 0.06,
        acores: 0.04,
        madeira: 0.05,
      };
      const ivaRate = IVA_RATES[driver.region];
      const grossAmount = transactionData.amount;
      const netAmount = grossAmount / (1 + ivaRate);
      const ivaAmount = grossAmount - netAmount;

      if (ivaAmount > 0) {
        transactionsToAdd.push({
          id: crypto.randomUUID(),
          parentId: mainTransactionId,
          type: 'expense',
          amount: ivaAmount,
          description: `IVA (${(ivaRate * 100).toFixed(0)}%) sobre ${transactionData.description}`,
          date: transactionData.date,
          category: 'impostos',
          driverId: transactionData.driverId,
          vehicleId: transactionData.vehicleId,
        });
      }

      if (driver.entityType === 'eni') {
        const IRS_COEFFICIENT = 0.75;
        const irsEstimatedRate = (driver.irsRate || 0) / 100;
        const irsAmount = netAmount * IRS_COEFFICIENT * irsEstimatedRate;

        if (irsAmount > 0) {
          transactionsToAdd.push({
            id: crypto.randomUUID(),
            parentId: mainTransactionId,
            type: 'expense',
            amount: irsAmount,
            description: `Estimativa IRS (${driver.irsRate || 0}% sobre base 75%) sobre ${transactionData.description}`,
            date: transactionData.date,
            category: 'impostos',
            driverId: transactionData.driverId,
            vehicleId: transactionData.vehicleId,
          });
        }

        const SS_RELEVANT_INCOME_COEFFICIENT = 0.70;
        const ssContributionRate = (driver.ssRate || 0) / 100;
        const ssAmount = netAmount * SS_RELEVANT_INCOME_COEFFICIENT * ssContributionRate;

        if (ssAmount > 0) {
          transactionsToAdd.push({
            id: crypto.randomUUID(),
            parentId: mainTransactionId,
            type: 'expense',
            amount: ssAmount,
            description: `Estimativa Seg. Social (${driver.ssRate || 0}% sobre base 70%) sobre ${transactionData.description}`,
            date: transactionData.date,
            category: 'seguranca_social',
            driverId: transactionData.driverId,
            vehicleId: transactionData.vehicleId,
          });
        }
      }
    }

    setTransactions([...transactionsToKeep, ...transactionsToAdd]);
    setTransactionToEdit(null);
  };

  const deleteTransaction = (id: string) => {
    if (window.confirm('Tem a certeza que deseja apagar este item? Esta ação não pode ser revertida.')) {
      setTransactions(prev => prev.filter(t => t.id !== id && t.parentId !== id));
    }
  };

  const handleEditTransaction = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      setTransactionToEdit(transaction);
      setIsModalOpen(true);
    }
  };

  const addPlatform = (platform: Omit<Platform, 'id'>) => setPlatforms(prev => [...prev, { ...platform, id: crypto.randomUUID() }]);
  const updatePlatform = (updatedPlatform: Platform) => setPlatforms(prev => prev.map(p => p.id === updatedPlatform.id ? updatedPlatform : p));
  const deletePlatform = (id: string) => {
    if (window.confirm('Tem a certeza que deseja apagar este item? Esta ação não pode ser revertida.')) {
      setPlatforms(prev => prev.filter(p => p.id !== id));
    }
  };

  const addDriver = (driver: Omit<Driver, 'id'>) => setDrivers(prev => [...prev, { ...driver, id: crypto.randomUUID() }]);
  const updateDriver = (updatedDriver: Driver) => setDrivers(prev => prev.map(d => d.id === updatedDriver.id ? updatedDriver : d));
  const deleteDriver = (id: string) => {
    if (window.confirm('Tem a certeza que deseja apagar este item? Esta ação não pode ser revertida.')) {
      setDrivers(prev => prev.filter(d => d.id !== id));
    }
  };

  const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => setVehicles(prev => [...prev, { ...vehicle, id: crypto.randomUUID() }]);
  const updateVehicle = (updatedVehicle: Vehicle) => setVehicles(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
  const deleteVehicle = (id: string) => {
    if (window.confirm('Tem a certeza que deseja apagar este item? Esta ação não pode ser revertida.')) {
      setVehicles(prev => prev.filter(v => v.id !== id));
    }
  };

  const createManualBackup = () => {
    const appData: AppData = { platforms, drivers, vehicles, transactions };
    const newBackup: Backup = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: 'manual',
      data: appData,
    };
    setBackups(prev => [...prev, newBackup]);
    alert('Backup manual criado com sucesso!');
  };

  const restoreFromBackup = (id: string) => {
    const backupToRestore = backups.find(b => b.id === id);
    if (backupToRestore && window.confirm('Tem a certeza que deseja restaurar este backup? Todos os dados atuais serão substituídos e esta ação não pode ser revertida.')) {
      const { platforms, drivers, vehicles, transactions } = backupToRestore.data;
      setPlatforms(platforms);
      setDrivers(drivers);
      setVehicles(vehicles);
      setTransactions(transactions);
      alert('Dados restaurados com sucesso!');
      setActiveView('dashboard');
    }
  };

  const deleteBackup = (id: string) => {
    if (window.confirm('Tem a certeza que deseja apagar este backup?')) {
      setBackups(prev => prev.filter(b => b.id !== id));
    }
  };


  const SettingsNavButton: React.FC<{ view: SettingsView; children: React.ReactNode; }> = ({ view, children }) => (
    <button
      onClick={() => setActiveSettingsView(view)}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeSettingsView === view
          ? 'bg-brand-primary text-white'
          : 'text-text-secondary hover:bg-background hover:text-text-primary'
        }`}
    >
      {children}
    </button>
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setTransactionToEdit(null);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header activeView={activeView} setActiveView={setActiveView} />

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {activeView === 'dashboard' && (
          <PainelGeral
            transactions={sortedTransactions}
            platforms={platforms}
            drivers={drivers}
            vehicles={vehicles}
            deleteTransaction={deleteTransaction}
            editTransaction={handleEditTransaction}
          />
        )}
        {activeView === 'taxes' && (
          <Taxes
            transactions={sortedTransactions}
            drivers={drivers}
            vehicles={vehicles}
          />
        )}
        {activeView === 'reports' && (
          <Reports
            transactions={sortedTransactions}
            platforms={platforms}
            drivers={drivers}
            vehicles={vehicles}
          />
        )}
        {activeView === 'settings' && (
          <div className="space-y-6">
            <div className="bg-surface p-2 rounded-lg shadow-md max-w-lg mx-auto">
              <nav className="flex flex-wrap items-center justify-center gap-2">
                <SettingsNavButton view="drivers"><UsersIcon className="h-5 w-5" />Motoristas</SettingsNavButton>
                <SettingsNavButton view="vehicles"><TruckIcon className="h-5 w-5" />Viaturas</SettingsNavButton>
                <SettingsNavButton view="platforms"><Cog6ToothIcon className="h-5 w-5" />Plataformas</SettingsNavButton>
                <SettingsNavButton view="backups"><ArchiveBoxIcon className="h-5 w-5" />Backups</SettingsNavButton>
              </nav>
            </div>

            {activeSettingsView === 'platforms' && <PlatformsManager platforms={platforms} addPlatform={addPlatform} updatePlatform={updatePlatform} deletePlatform={deletePlatform} />}
            {activeSettingsView === 'drivers' && <DriversManager drivers={drivers} vehicles={vehicles} addDriver={addDriver} updateDriver={updateDriver} deleteDriver={deleteDriver} />}
            {activeSettingsView === 'vehicles' && <VehiclesManager vehicles={vehicles} addVehicle={addVehicle} updateVehicle={updateVehicle} deleteVehicle={deleteVehicle} />}
            {activeSettingsView === 'backups' && (
              <BackupManager
                backups={backups}
                createManualBackup={createManualBackup}
                restoreFromBackup={restoreFromBackup}
                deleteBackup={deleteBackup}
              />
            )}
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 no-print">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-primary hover:bg-brand-dark text-white rounded-full p-4 shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2 focus:ring-offset-background transition-transform transform hover:scale-110"
          aria-label="Adicionar transação"
        >
          <PlusIcon className="h-8 w-8" />
        </button>
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSaveTransaction={saveTransaction}
        platforms={platforms}
        drivers={drivers}
        vehicles={vehicles}
        transactionToEdit={transactionToEdit}
      />
    </div>
  );
};

export default App;