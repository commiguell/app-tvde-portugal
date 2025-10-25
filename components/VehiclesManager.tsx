import React, { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import { TrashIcon, PencilIcon } from './Icons';

interface VehiclesManagerProps {
  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  deleteVehicle: (id:string) => void;
}

const VehiclesManager: React.FC<VehiclesManagerProps> = ({ vehicles, addVehicle, updateVehicle, deleteVehicle }) => {
  const [name, setName] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (editingId) {
      const vehicleToEdit = vehicles.find(v => v.id === editingId);
      if (vehicleToEdit) {
        setName(vehicleToEdit.name);
        setLicensePlate(vehicleToEdit.licensePlate);
      }
    } else {
      resetForm();
    }
  }, [editingId, vehicles]);

  const resetForm = () => {
    setName('');
    setLicensePlate('');
    setEditingId(null);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !licensePlate) return;

    const vehicleData = { name, licensePlate: licensePlate.toUpperCase() };

    if (editingId) {
      updateVehicle({ ...vehicleData, id: editingId });
    } else {
      addVehicle(vehicleData);
    }
    resetForm();
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="bg-surface p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-text-primary mb-4">{editingId ? 'Editar' : 'Adicionar Nova'} Viatura</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="vehicle-name" className="block text-sm font-medium text-text-secondary">Nome/Descrição da Viatura (ex: "Tesla Model 3")</label>
            <input
              type="text"
              id="vehicle-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
          <div>
            <label htmlFor="vehicle-license" className="block text-sm font-medium text-text-secondary">Matrícula</label>
            <input
              type="text"
              id="vehicle-license"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              required
              className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
              placeholder="AA-00-BB"
            />
          </div>
          <div className="flex justify-end gap-3">
             {editingId && (
              <button type="button" onClick={resetForm} className="py-2 px-4 bg-muted text-text-primary rounded-md hover:bg-opacity-80 transition-colors">
                Cancelar
              </button>
            )}
            <button type="submit" className="py-2 px-4 bg-brand-primary text-white rounded-md hover:bg-brand-dark transition-colors">
              {editingId ? 'Guardar Alterações' : 'Adicionar Viatura'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-surface p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-text-primary mb-4">Viaturas Existentes</h2>
        {vehicles.length > 0 ? (
          <ul className="divide-y divide-background">
            {vehicles.map(v => (
              <li key={v.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-text-primary">{v.name}</p>
                  <p className="text-sm text-text-secondary">Matrícula: {v.licensePlate}</p>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => setEditingId(v.id)}
                    className="text-muted hover:text-brand-secondary transition-colors p-2 rounded-full"
                    aria-label={`Editar ${v.name}`}
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => deleteVehicle(v.id)}
                    className="text-muted hover:text-expense transition-colors p-2 rounded-full"
                    aria-label={`Apagar ${v.name}`}
                    >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-secondary text-center py-4">Nenhuma viatura adicionada.</p>
        )}
      </div>
    </div>
  );
};

export default VehiclesManager;