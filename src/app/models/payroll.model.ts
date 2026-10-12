export interface Worker {
  id: string;
  dni: string;
  name: string;
  email: string;
  phone: string;
  companyId: string;
  companyName: string;
  department: string;
  costCenter: string;
  role: string;
  baseSalary: number;
  contractType: 'Indeterminado' | 'Plazo Fijo' | 'Tiempo Parcial' | 'Prácticas';
  hireDate: string;
  contractEndDate?: string;
  birthDate: string;
  status: 'Activo' | 'Cesado' | 'Suspensión';
  pensionSystem: 'AFP Integra' | 'AFP Prima' | 'AFP Profuturo' | 'AFP Habitat' | 'ONP';
  afpCommissionType: 'Flujo' | 'Mixta';
  cussp: string;
  hasFamilyAllowance: boolean;
  childrenCount: number;
  bankName: string;
  bankAccount: string;
}

export interface PayrollNovelty {
  workerId: string;
  workedDays: number;
  overtime25Hours: number;
  overtime35Hours: number;
  tardinessMinutes: number;
  absenceDays: number;
  performanceBonus: number;
  productionBonus: number;
  mobilityAllowance: number;
  advancePayment: number;
  loanDeduction: number;
  judicialRetention: number;
  notes?: string;
}

export interface PayrollCalculation {
  workerId: string;
  worker: Worker;
  novelty: PayrollNovelty;
  // Ingresos
  workedDaysAmount: number;
  familyAllowance: number;
  overtime25Amount: number;
  overtime35Amount: number;
  bonusesTotal: number;
  totalGross: number;
  // Descuentos Trabajador
  afpFondo: number;
  afpSeguro: number;
  afpComision: number;
  onpAmount: number;
  totalPensionDeduction: number;
  tax5thCategory: number;
  tardinessDeduction: number;
  absenceDeduction: number;
  advanceDeduction: number;
  loanDeduction: number;
  judicialRetention: number;
  totalDeductions: number;
  // Neto
  netPay: number;
  // Aportes Empleador
  essaludContribution: number;
  sctrContribution: number;
  totalEmployerCost: number;
  // Discrepancias / Reglas
  discrepancyWarnings: string[];
}

export type PeriodStatus = 'borrador' | 'en_revision' | 'aprobado' | 'cerrado';

export interface PayrollPeriod {
  id: string;
  periodCode: string;
  periodName: string;
  companyId: string;
  companyName: string;
  status: PeriodStatus;
  totalWorkers: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalEmployerCost: number;
  approvedBy?: string;
  approvalDate?: string;
  approvalCode?: string;
  approvalNotes?: string;
  discrepancyCount: number;
}

export interface SocialBenefit {
  id: string;
  workerId: string;
  workerName: string;
  dni: string;
  role: string;
  type: 'Gratificación Fiestas Patrias' | 'Gratificación Navidad' | 'CTS Semestral' | 'Vacaciones Anuales' | 'Liquidación BBSS (Cese)';
  periodLabel: string;
  baseSalary: number;
  computableRemuneration: number;
  workedMonths: number;
  grossBenefit: number;
  extraBonusEsSalud: number;
  deductions: number;
  netToPay: number;
  status: 'Pendiente' | 'Procesado' | 'Pagado';
  calculationDate: string;
  breakdownNotes: string;
}

export interface CompanyObligation {
  id: string;
  code: string;
  title: string;
  authority: 'SUNAT PLAME' | 'AFPnet' | 'MINTRA / CTS' | 'GRATIFICACIONES' | 'RENOVACIÓN CONTRATOS';
  dueDate: string;
  amountEstimated: number;
  status: 'Vencido' | 'Por Vencer' | 'Al Día' | 'Cumplido';
  daysRemaining: number;
  description: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  category: 'REGISTRO' | 'NOVEDAD' | 'CÁLCULO' | 'APROBACIÓN' | 'BENEFICIOS';
  description: string;
}

export interface Company {
  id: string;
  ruc: string;
  name: string;
  tradeName: string;
  address: string;
  sector: string;
  workerCount: number;
}
