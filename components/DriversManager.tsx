import React, { useState, useEffect } from 'react';
import { Driver, Region, REGION_LABELS, EntityType, ENTITY_TYPE_LABELS, Vehicle } from '../types';
import { TrashIcon, PencilIcon, InformationCircleIcon } from './Icons';

interface DriversManagerProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  addDriver: (driver: Omit<Driver, 'id'>) => void;
  updateDriver: (driver: Driver) => void;
  deleteDriver: (id:string) => void;
}

const DriversManager: React.FC<DriversManagerProps> = ({ drivers, vehicles, addDriver, updateDriver, deleteDriver }) => {
  const [name, setName] = useState('');
  const [region, setRegion] = useState<Region>('continental');
  const [entityType, setEntityType] = useState<EntityType>('eni');
  const [irsRate, setIrsRate] = useState('20');
  const [ssRate, setSsRate] = useState('21.4');
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (editingId) {
      const driverToEdit = drivers.find(d => d.id === editingId);
      if (driverToEdit) {
        setName(driverToEdit.name);
        setRegion(driverToEdit.region);
        setEntityType(driverToEdit.entityType);
        setIrsRate(String(driverToEdit.irsRate || '20'));
        setSsRate(String(driverToEdit.ssRate || '21.4'));
        setSelectedVehicleIds(driverToEdit.vehicleIds || []);
      }
    } else {
      resetForm();
    }
  }, [editingId, drivers]);

  const resetForm = () => {
    setName('');
    setRegion('continental');
    setEntityType('eni');
    setIrsRate('20');
    setSsRate('21.4');
    setSelectedVehicleIds([]);
    setEditingId(null);
  };

  const handleVehicleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // FIX: Explicitly type `option` as `HTMLOptionElement` to resolve a type inference issue where its properties were not accessible.
    const options = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
    setSelectedVehicleIds(options);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !region || !entityType) return;
    
    const driverData: Omit<Driver, 'id'> = { 
      name, 
      region, 
      entityType,
      vehicleIds: selectedVehicleIds,
      ...(entityType === 'eni' && { 
        irsRate: parseFloat(irsRate), 
        ssRate: parseFloat(ssRate) 
      })
    };

    if (editingId) {
      updateDriver({ ...driverData, id: editingId });
    } else {
      addDriver(driverData);
    }
    resetForm();
  };
  
  const getVehicleNames = (vehicleIds?: string[]) => {
    if (!vehicleIds || vehicleIds.length === 0) return 'Nenhuma viatura associada.';
    return vehicleIds
      .map(id => {
          const vehicle = vehicles.find(v => v.id === id);
          return vehicle ? `${vehicle.name} (${vehicle.licensePlate})` : null;
      })
      .filter(Boolean)
      .join(', ');
  };


  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="bg-surface p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-text-primary mb-4">{editingId ? 'Editar' : 'Adicionar Novo'} Motorista</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="driver-name" className="block text-sm font-medium text-text-secondary">Nome do Motorista</label>
              <input
                type="text"
                id="driver-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
              />
            </div>
            <div>
              <label htmlFor="entity-type" className="block text-sm font-medium text-text-secondary">Tipo de Entidade</label>
              <select
                id="entity-type"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as EntityType)}
                required
                className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
              >
                {Object.entries(ENTITY_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {entityType === 'eni' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-background/50 p-3 rounded-md">
              <div>
                <label htmlFor="irs-rate" className="block text-sm font-medium text-text-secondary">Taxa Estimada de IRS (%)</label>
                <input
                  type="number"
                  id="irs-rate"
                  value={irsRate}
                  onChange={(e) => setIrsRate(e.target.value)}
                  step="0.1"
                  min="0"
                  required
                  className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>
              <div>
                <label htmlFor="ss-rate" className="block text-sm font-medium text-text-secondary">Taxa de Contribuição Seg. Social (%)</label>
                <input
                  type="number"
                  id="ss-rate"
                  value={ssRate}
                  onChange={(e) => setSsRate(e.target.value)}
                  step="0.1"
                  min="0"
                  required
                  className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5 mb-1">
                <label htmlFor="driver-region" className="block text-sm font-medium text-text-secondary">Região de Operação</label>
                <div title="A região de operação (Continental, Açores, Madeira) determina a taxa de IVA (6%, 4% ou 5%, respetivamente) que será automaticamente calculada e registada como despesa sobre os seus rendimentos.">
                    <InformationCircleIcon className="h-4 w-4 text-muted cursor-help" />
                </div>
            </div>
            <select
              id="driver-region"
              value={region}
              onChange={(e) => setRegion(e.target.value as Region)}
              required
              className="block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
            >
              {Object.entries(REGION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
              <label htmlFor="vehicle-association" className="block text-sm font-medium text-text-secondary">Associar Viaturas</label>
              <select
                id="vehicle-association"
                multiple
                value={selectedVehicleIds}
                onChange={handleVehicleSelect}
                className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary h-24"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.licensePlate})</option>
                ))}
              </select>
              <p className="text-xs text-muted mt-1">Selecione uma ou mais viaturas. Use Ctrl/Cmd para selecionar várias.</p>
            </div>

          <div className="flex justify-end gap-3">
             {editingId && (
              <button type="button" onClick={resetForm} className="py-2 px-4 bg-muted text-text-primary rounded-md hover:bg-opacity-80 transition-colors">
                Cancelar
              </button>
            )}
            <button type="submit" className="py-2 px-4 bg-brand-primary text-white rounded-md hover:bg-brand-dark transition-colors">
              {editingId ? 'Guardar Alterações' : 'Adicionar Motorista'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-surface p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-text-primary mb-4">Motoristas Existentes</h2>
        {drivers.length > 0 ? (
          <ul className="divide-y divide-background">
            {drivers.map(d => (
              <li key={d.id} className="py-3 flex justify-between items-start">
                <div>
                  <p className="font-semibold text-text-primary">{d.name}</p>
                  <p className="text-sm text-text-secondary">{ENTITY_TYPE_LABELS[d.entityType]} | Região: {REGION_LABELS[d.region]}</p>
                   {d.entityType === 'eni' && (
                    <p className="text-xs text-muted mt-1">Taxas: IRS {d.irsRate || 0}% | Seg. Social {d.ssRate || 0}%</p>
                  )}
                  <p className="text-xs text-muted mt-1">Viaturas: {getVehicleNames(d.vehicleIds)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button 
                    onClick={() => setEditingId(d.id)}
                    className="text-muted hover:text-brand-secondary transition-colors p-2 rounded-full"
                    aria-label={`Editar ${d.name}`}
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => deleteDriver(d.id)}
                    className="text-muted hover:text-expense transition-colors p-2 rounded-full"
                    aria-label={`Apagar ${d.name}`}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-secondary text-center py-4">Nenhum motorista adicionado.</p>
        )}
      </div>
    </div>
  );
};

export default DriversManager;