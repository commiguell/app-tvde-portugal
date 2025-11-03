export type Region = 'continental' | 'acores' | 'madeira';
export type EntityType = 'eni' | 'empresa';

export const REGION_LABELS: Record<Region, string> = {
  continental: 'Portugal Continental',
  acores: 'Açores',
  madeira: 'Madeira',
};

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  eni: 'Empresário em Nome Individual',
  empresa: 'Empresa (Soc. Unip. ou Lda)',
};

export interface Driver {
  id: string;
  name: string;
  region: Region;
  entityType: EntityType;
  irsRate?: number; // Custom IRS rate for ENI
  ssRate?: number; // Custom Social Security rate for ENI
  vehicleIds?: string[];
}

export interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
}

export interface Platform {
  id: string;
  name: string;
  commissionRate: number; // as a percentage, e.g., 25 for 25%
}

export type TransactionType = 'income' | 'expense';

export type ExpenseCategory = 
  | 'combustivel' 
  | 'manutencao'
  | 'seguro_automovel'
  | 'imposto_circulacao'
  | 'licencas'
  | 'impostos' 
  | 'seguranca_social' 
  | 'outros'
  | 'irc'
  | 'tsu';

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  combustivel: 'Combustível',
  manutencao: 'Manutenção/Oficina',
  seguro_automovel: 'Seguro Automóvel',
  imposto_circulacao: 'Imposto de Circulação (IUC)',
  licencas: 'Licenças (e.g., TVDE)',
  impostos: 'Impostos (IVA, IRS)',
  seguranca_social: 'Segurança Social',
  irc: 'IRC',
  tsu: 'TSU',
  outros: 'Outros',
};

export interface Transaction {
  id: string;
  parentId?: string; // ID of the parent income transaction for auto-generated tax entries
  date: string; // ISO string
  type: TransactionType;
  amount: number;
  description: string;
  platformId?: string; // for income
  category?: ExpenseCategory; // for expense
  driverId: string;
  vehicleId: string;
}

export interface AppData {
  platforms: Platform[];
  drivers: Driver[];
  vehicles: Vehicle[];
  transactions: Transaction[];
}

export interface Backup {
  id: string;
  date: string; // ISO string
  type: 'manual' | 'auto';
  data: AppData;
}