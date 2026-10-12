import { Injectable, signal, computed } from '@angular/core';
import {
  Worker,
  PayrollNovelty,
  PayrollCalculation,
  PayrollPeriod,
  SocialBenefit,
  CompanyObligation,
  AuditLog,
  Company
} from '../models/payroll.model';

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  // Constantes de Ley Laboral Peruana
  readonly RMV = 1025.00; // Remuneración Mínima Vital
  readonly ASIGNACION_FAMILIAR_VALOR = 102.50; // 10% RMV
  readonly TASA_ESSALUD = 0.09; // 9%
  readonly TASA_SCTR = 0.0125; // 1.25%
  readonly TASA_ONP = 0.13; // 13%
  readonly TASA_AFP_FONDO = 0.10; // 10%
  readonly TASA_AFP_SEGURO = 0.0184; // 1.84%
  readonly TASA_AFP_COMISION_FLUJO = 0.0155; // 1.55%
  readonly UIT = 5150; // Unidad Impositiva Tributaria 2026

  // Empresas registradas (Única empresa: Corporación Aura S.A.C.)
  companies = signal<Company[]>([
    {
      id: 'aur-corp',
      ruc: '20601234567',
      name: 'Corporación Aura S.A.C.',
      tradeName: 'Corporación Aura',
      address: 'Av. Las Begonias 441, San Isidro, Lima',
      sector: 'Operaciones & Servicios Corporativos',
      workerCount: 80
    }
  ]);

  currentCompanyId = signal<string>('aur-corp');

  // Trabajadores (Inicializados con 80 trabajadores para Aura)
  workers = signal<Worker[]>(this.generateInitialWorkers());

  // Novedades del mes actual
  novelties = signal<Record<string, PayrollNovelty>>(this.generateInitialNovelties());

  // Periodos de Planilla
  periods = signal<PayrollPeriod[]>([
    {
      id: 'per-2026-10',
      periodCode: '2026-10',
      periodName: 'Octubre 2026',
      companyId: 'aur-corp',
      companyName: 'Corporación Aura S.A.C.',
      status: 'en_revision',
      totalWorkers: 80,
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      totalEmployerCost: 0,
      discrepancyCount: 3
    },
    {
      id: 'per-2026-09',
      periodCode: '2026-09',
      periodName: 'Setiembre 2026',
      companyId: 'aur-corp',
      companyName: 'Corporación Aura S.A.C.',
      status: 'cerrado',
      totalWorkers: 78,
      totalGross: 245200.50,
      totalDeductions: 38240.20,
      totalNet: 206960.30,
      totalEmployerCost: 270333.55,
      approvedBy: 'Ing. Carlos Mendoza (Gerente de RRHH)',
      approvalDate: '2026-09-28 17:30',
      approvalCode: 'AUTH-202609-8812',
      approvalNotes: 'Planilla aprobada conforme a ley sin incidencias.',
      discrepancyCount: 0
    }
  ]);

  currentPeriodId = signal<string>('per-2026-10');

  // Beneficios Sociales calculados
  socialBenefits = signal<SocialBenefit[]>(this.generateInitialBenefits());

  // Obligaciones Laborales y Fechas Clave
  obligations = signal<CompanyObligation[]>([
    {
      id: 'ob-1',
      code: 'SUNAT-PLAME',
      title: 'Declaración y Pago de Planilla Mensual (PDT PLAME 0601)',
      authority: 'SUNAT PLAME',
      dueDate: '2026-11-18',
      amountEstimated: 26500.00,
      status: 'Al Día',
      daysRemaining: 37,
      description: 'Declaración de tributos y aportes EsSalud, ONP y Renta 5ta para RUC dígito 7.'
    },
    {
      id: 'ob-2',
      code: 'AFPNET-10',
      title: 'Declaración y Pago de Aportes Previsionales (AFPnet)',
      authority: 'AFPnet',
      dueDate: '2026-11-05',
      amountEstimated: 31200.00,
      status: 'Por Vencer',
      daysRemaining: 24,
      description: 'Planilla de aportes previsionales Fondo + Comisión + Seguro a las 4 AFPs.'
    },
    {
      id: 'ob-3',
      code: 'CTS-NOV-2026',
      title: 'Depósito Semestral CTS (Periodo Mayo - Octubre 2026)',
      authority: 'MINTRA / CTS',
      dueDate: '2026-11-15',
      amountEstimated: 122400.00,
      status: 'Por Vencer',
      daysRemaining: 34,
      description: 'Obligación legal de depósito en entidades financieras autorizadas.'
    },
    {
      id: 'ob-4',
      code: 'VENC-CONTRATOS',
      title: 'Vencimiento de 6 Contratos a Plazo Fijo',
      authority: 'RENOVACIÓN CONTRATOS',
      dueDate: '2026-10-31',
      amountEstimated: 0,
      status: 'Por Vencer',
      daysRemaining: 19,
      description: 'Revisión y firma de adendas o notificación de no renovación con 15 días de anticipación.'
    },
    {
      id: 'ob-5',
      code: 'GRATI-DIC-2026',
      title: 'Provisión Gratificación por Navidad + Bonificación 9%',
      authority: 'GRATIFICACIONES',
      dueDate: '2026-12-15',
      amountEstimated: 248000.00,
      status: 'Al Día',
      daysRemaining: 64,
      description: 'Plazo improrrogable para el depósito de gratificación de fin de año.'
    }
  ]);

  // Logs de auditoría
  auditLogs = signal<AuditLog[]>([
    {
      id: 'log-1',
      timestamp: '2026-10-12 09:15',
      user: 'admin_planillas',
      action: 'Apertura de Período',
      category: 'CÁLCULO',
      description: 'Se abrió el período Octubre 2026 con 80 trabajadores de Corporación Aura.'
    },
    {
      id: 'log-2',
      timestamp: '2026-10-12 09:30',
      user: 'supervisor_rrhh',
      action: 'Carga de Novedades',
      category: 'NOVEDAD',
      description: 'Importación de horas extras y tardanzas del sistema biométrico.'
    }
  ]);

  // COMPUTED: Empresa actual
  currentCompany = computed(() => {
    return this.companies().find(c => c.id === this.currentCompanyId()) || this.companies()[0];
  });

  // COMPUTED: Período actual
  currentPeriod = computed(() => {
    return this.periods().find(p => p.id === this.currentPeriodId()) || this.periods()[0];
  });

  // COMPUTED: Trabajadores filtrados por empresa
  companyWorkers = computed(() => {
    return this.workers().filter(w => w.companyId === this.currentCompanyId());
  });

  // COMPUTED: Cálculos de planilla para cada trabajador
  payrollCalculations = computed<PayrollCalculation[]>(() => {
    const workers = this.companyWorkers();
    const noveltiesMap = this.novelties();

    return workers.map(worker => {
      const novelty = noveltiesMap[worker.id] || this.getDefaultNovelty(worker.id);
      return this.calculateWorkerPayroll(worker, novelty);
    });
  });

  // COMPUTED: Resumen acumulado del período
  payrollSummary = computed(() => {
    const calcs = this.payrollCalculations();
    const totalGross = calcs.reduce((acc, c) => acc + c.totalGross, 0);
    const totalDeductions = calcs.reduce((acc, c) => acc + c.totalDeductions, 0);
    const totalNet = calcs.reduce((acc, c) => acc + c.netPay, 0);
    const totalEmployerCost = calcs.reduce((acc, c) => acc + c.totalEmployerCost, 0);
    const totalEsSalud = calcs.reduce((acc, c) => acc + c.essaludContribution, 0);
    const totalPension = calcs.reduce((acc, c) => acc + c.totalPensionDeduction, 0);
    const totalDiscrepancies = calcs.reduce((acc, c) => acc + c.discrepancyWarnings.length, 0);

    return {
      workerCount: calcs.length,
      activeCount: calcs.filter(c => c.worker.status === 'Activo').length,
      totalGross,
      totalDeductions,
      totalNet,
      totalEmployerCost,
      totalEsSalud,
      totalPension,
      totalDiscrepancies
    };
  });

  // Reglas de Cálculo según Ley Peruana
  calculateWorkerPayroll(worker: Worker, novelty: PayrollNovelty): PayrollCalculation {
    const warnings: string[] = [];

    // Si está cesado o suspendido, manejar cálculo proporcional
    const isInactive = worker.status !== 'Activo';
    const effectiveDays = isInactive ? 0 : Math.max(0, novelty.workedDays - novelty.absenceDays);

    // Sueldo por días
    const dailyWage = worker.baseSalary / 30;
    const workedDaysAmount = isInactive ? 0 : Number((dailyWage * effectiveDays).toFixed(2));

    // Asignación Familiar: S/ 102.50 si tiene hijos
    const familyAllowance = (!isInactive && worker.hasFamilyAllowance) ? this.ASIGNACION_FAMILIAR_VALOR : 0;

    // Valor hora para horas extras
    const hourlyRate = (worker.baseSalary + familyAllowance) / 240;

    // Horas Extras (25% para las dos primeras, 35% adicionales)
    const overtime25Amount = isInactive ? 0 : Number((novelty.overtime25Hours * hourlyRate * 1.25).toFixed(2));
    const overtime35Amount = isInactive ? 0 : Number((novelty.overtime35Hours * hourlyRate * 1.35).toFixed(2));

    // Bonos
    const bonusesTotal = Number((novelty.performanceBonus + novelty.productionBonus + novelty.mobilityAllowance).toFixed(2));

    // Total Remuneración Bruta
    const totalGross = Number((workedDaysAmount + familyAllowance + overtime25Amount + overtime35Amount + bonusesTotal).toFixed(2));

    // Descuentos de Asistencia
    const minuteRate = hourlyRate / 60;
    const tardinessDeduction = Number((novelty.tardinessMinutes * minuteRate).toFixed(2));
    const absenceDeduction = Number((novelty.absenceDays * dailyWage).toFixed(2));

    // Base asegurable para pensión (se excluye movilidad supeditada no remunerativa)
    const pensionBase = Math.max(0, totalGross - novelty.mobilityAllowance);

    // Sistema de Pensiones
    let afpFondo = 0;
    let afpSeguro = 0;
    let afpComision = 0;
    let onpAmount = 0;

    if (worker.pensionSystem === 'ONP') {
      onpAmount = Number((pensionBase * this.TASA_ONP).toFixed(2));
    } else {
      afpFondo = Number((pensionBase * this.TASA_AFP_FONDO).toFixed(2));
      afpSeguro = Number((pensionBase * this.TASA_AFP_SEGURO).toFixed(2));
      if (worker.afpCommissionType === 'Flujo') {
        afpComision = Number((pensionBase * this.TASA_AFP_COMISION_FLUJO).toFixed(2));
      }
    }
    const totalPensionDeduction = Number((onpAmount + afpFondo + afpSeguro + afpComision).toFixed(2));

    // Proyección Renta de 5ta Categoría
    let tax5thCategory = 0;
    const annualProjected = (worker.baseSalary + familyAllowance) * 14;
    const deduction7UIT = 7 * this.UIT; // 36,050
    if (annualProjected > deduction7UIT) {
      const taxableAmount = annualProjected - deduction7UIT;
      // Tramo 1: hasta 5 UIT (8%)
      const tramo1 = Math.min(taxableAmount, 5 * this.UIT);
      const annualTax = tramo1 * 0.08;
      tax5thCategory = Number((annualTax / 12).toFixed(2));
    }

    // Descuentos autorizados
    const advanceDeduction = novelty.advancePayment || 0;
    const loanDeduction = novelty.loanDeduction || 0;
    const judicialRetention = novelty.judicialRetention || 0;

    const totalDeductions = Number((
      totalPensionDeduction +
      tax5thCategory +
      tardinessDeduction +
      absenceDeduction +
      advanceDeduction +
      loanDeduction +
      judicialRetention
    ).toFixed(2));

    // Neto a pagar
    const netPay = Math.max(0, Number((totalGross - totalDeductions).toFixed(2)));

    // Aportes Empleador
    const essaludBase = Math.max(this.RMV, totalGross);
    const essaludContribution = isInactive ? 0 : Number((essaludBase * this.TASA_ESSALUD).toFixed(2));
    const sctrContribution = isInactive ? 0 : Number((totalGross * this.TASA_SCTR).toFixed(2));
    const totalEmployerCost = Number((totalGross + essaludContribution + sctrContribution).toFixed(2));

    // Reglas de validación y control de calidad (Human Discrepancy Checks)
    if (worker.baseSalary < this.RMV) {
      warnings.push(`Sueldo base (S/ ${worker.baseSalary}) menor al Sueldo Mínimo Vital (S/ ${this.RMV})`);
    }
    if ((novelty.overtime25Hours + novelty.overtime35Hours) > 30) {
      warnings.push(`Horas extras elevadas (${novelty.overtime25Hours + novelty.overtime35Hours} hrs) requieren sustento de jefatura`);
    }
    if (totalDeductions > totalGross * 0.5 && totalGross > 0) {
      warnings.push(`Descuentos totales superan el 50% de los ingresos brutos.`);
    }
    if (worker.status === 'Activo' && worker.pensionSystem !== 'ONP' && (!worker.cussp || worker.cussp.trim() === '')) {
      warnings.push(`Falta registrar código CUSSP de AFP para el trabajador.`);
    }
    if (novelty.absenceDays >= 3) {
      warnings.push(`Registra ${novelty.absenceDays} días de inasistencia consecutiva (verificar justificación).`);
    }

    return {
      workerId: worker.id,
      worker,
      novelty,
      workedDaysAmount,
      familyAllowance,
      overtime25Amount,
      overtime35Amount,
      bonusesTotal,
      totalGross,
      afpFondo,
      afpSeguro,
      afpComision,
      onpAmount,
      totalPensionDeduction,
      tax5thCategory,
      tardinessDeduction,
      absenceDeduction,
      advanceDeduction,
      loanDeduction,
      judicialRetention,
      totalDeductions,
      netPay,
      essaludContribution,
      sctrContribution,
      totalEmployerCost,
      discrepancyWarnings: warnings
    };
  }

  // Actualizar Novedad
  updateNovelty(workerId: string, partial: Partial<PayrollNovelty>) {
    const current = this.novelties();
    const existing = current[workerId] || this.getDefaultNovelty(workerId);
    this.novelties.set({
      ...current,
      [workerId]: { ...existing, ...partial }
    });

    this.addAuditLog('admin_planillas', 'Modificación de Novedad', 'NOVEDAD', `Actualización de novedades para trabajador ${workerId}.`);
  }

  // Guardar o Actualizar Trabajador
  saveWorker(worker: Worker) {
    const current = this.workers();
    const index = current.findIndex(w => w.id === worker.id);
    if (index >= 0) {
      current[index] = worker;
      this.workers.set([...current]);
      this.addAuditLog('admin_rrhh', 'Edición de Trabajador', 'REGISTRO', `Actualizados datos laborales de ${worker.name}.`);
    } else {
      this.workers.set([worker, ...current]);
      this.addAuditLog('admin_rrhh', 'Alta de Trabajador', 'REGISTRO', `Registrado nuevo colaborador: ${worker.name} (${worker.role}).`);
    }
  }

  // Flujo de Aprobación Humana de Planilla
  approvePeriod(periodId: string, reviewerName: string, notes: string): { success: boolean; message: string; code?: string } {
    const period = this.periods().find(p => p.id === periodId);
    if (!period) return { success: false, message: 'Período no encontrado' };

    const summary = this.payrollSummary();
    const authCode = `AURA-AUTH-${period.periodCode}-${Math.floor(1000 + Math.random() * 9000)}`;

    const updated = this.periods().map(p => {
      if (p.id === periodId) {
        return {
          ...p,
          status: 'aprobado' as const,
          totalGross: summary.totalGross,
          totalDeductions: summary.totalDeductions,
          totalNet: summary.totalNet,
          totalEmployerCost: summary.totalEmployerCost,
          approvedBy: reviewerName,
          approvalDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
          approvalCode: authCode,
          approvalNotes: notes || 'Aprobado sin observaciones.',
          discrepancyCount: summary.totalDiscrepancies
        };
      }
      return p;
    });

    this.periods.set(updated);
    this.addAuditLog(
      reviewerName,
      'Aprobación Humana de Planilla',
      'APROBACIÓN',
      `Planilla ${period.periodName} aprobada formalmente. Código: ${authCode}. Neto total: S/ ${summary.totalNet.toLocaleString()}`
    );

    return { success: true, message: 'Planilla aprobada satisfactoriamente', code: authCode };
  }

  // Reabrir período para correcciones auditadas
  reopenPeriod(periodId: string, user: string, justification: string) {
    const updated = this.periods().map(p => {
      if (p.id === periodId) {
        return {
          ...p,
          status: 'en_revision' as const,
          approvalNotes: `Reabierto por: ${user}. Motivo: ${justification}`
        };
      }
      return p;
    });

    this.periods.set(updated);
    this.addAuditLog(user, 'Reapertura de Planilla', 'APROBACIÓN', `Período reabierto para rectificación: ${justification}`);
  }

  // Cálculo individual de Liquidación de Beneficios Sociales (Cese)
  calculateLiquidation(workerId: string, severanceReason: 'Renuncia' | 'Mutuo Disenso' | 'Despido Arbitrario', workedMonths: number) {
    const worker = this.workers().find(w => w.id === workerId);
    if (!worker) return null;

    const computableSalary = worker.baseSalary + (worker.hasFamilyAllowance ? this.ASIGNACION_FAMILIAR_VALOR : 0);
    // CTS trunca: (Sueldo + 1/6 Grati) / 12 * meses
    const ctsBase = computableSalary + (computableSalary / 6);
    const ctsTrunca = Number(((ctsBase / 12) * workedMonths).toFixed(2));

    // Gratificación trunca: Sueldo / 6 * meses
    const gratiTrunca = Number(((computableSalary / 6) * Math.min(6, workedMonths)).toFixed(2));
    const bonoExtraGrati = Number((gratiTrunca * 0.09).toFixed(2)); // Bonificación extraordinaria 9%

    // Vacaciones truncas: Sueldo / 12 * meses
    const vacTrunca = Number(((computableSalary / 12) * workedMonths).toFixed(2));

    // Indemnización por despido arbitrario (si aplica: 1.5 sueldos por año)
    let indemnizacion = 0;
    if (severanceReason === 'Despido Arbitrario') {
      indemnizacion = Number(((computableSalary * 1.5 / 12) * workedMonths).toFixed(2));
    }

    const totalGross = Number((ctsTrunca + gratiTrunca + bonoExtraGrati + vacTrunca + indemnizacion).toFixed(2));
    // CTS e Indemnización son inafectos. Vacaciones truncas pagan pensión y renta.
    const pensionRate = worker.pensionSystem === 'ONP' ? 0.13 : 0.1184;
    const deductions = Number((vacTrunca * pensionRate).toFixed(2));
    const netToPay = Number((totalGross - deductions).toFixed(2));

    const newBenefit: SocialBenefit = {
      id: `liq-${Date.now()}`,
      workerId: worker.id,
      workerName: worker.name,
      dni: worker.dni,
      role: worker.role,
      type: 'Liquidación BBSS (Cese)',
      periodLabel: `${workedMonths} meses laborados (${severanceReason})`,
      baseSalary: worker.baseSalary,
      computableRemuneration: computableSalary,
      workedMonths,
      grossBenefit: totalGross,
      extraBonusEsSalud: bonoExtraGrati,
      deductions,
      netToPay,
      status: 'Procesado',
      calculationDate: new Date().toISOString().substring(0, 10),
      breakdownNotes: `CTS: S/ ${ctsTrunca} | Grati: S/ ${gratiTrunca} + Bono: S/ ${bonoExtraGrati} | Vacaciones: S/ ${vacTrunca}${indemnizacion > 0 ? ` | Indemnización: S/ ${indemnizacion}` : ''}`
    };

    this.socialBenefits.set([newBenefit, ...this.socialBenefits()]);
    this.addAuditLog('admin_rrhh', 'Generación de Liquidación', 'BENEFICIOS', `Liquidación generada para ${worker.name}. Neto: S/ ${netToPay}`);
    return newBenefit;
  }

  private addAuditLog(user: string, action: string, category: AuditLog['category'], description: string) {
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      user,
      action,
      category,
      description
    };
    this.auditLogs.set([log, ...this.auditLogs()]);
  }

  private getDefaultNovelty(workerId: string): PayrollNovelty {
    return {
      workerId,
      workedDays: 30,
      overtime25Hours: 0,
      overtime35Hours: 0,
      tardinessMinutes: 0,
      absenceDays: 0,
      performanceBonus: 0,
      productionBonus: 0,
      mobilityAllowance: 0,
      advancePayment: 0,
      loanDeduction: 0,
      judicialRetention: 0
    };
  }

  // Generador de 80 trabajadores para Aura
  private generateInitialWorkers(): Worker[] {
    const list: Worker[] = [];
    const depts = [
      { name: 'Operaciones & Producción', roles: ['Operador Técnico', 'Supervisor de Turno', 'Técnico Electromecánico', 'Jefe de Planta', 'Inspector de Calidad'] },
      { name: 'Logística & Distribución', roles: ['Coordinador de Despacho', 'Conductor de Reparto', 'Auxiliar de Almacén', 'Analista de Inventarios', 'Jefe de Logística'] },
      { name: 'Ventas & Comercial', roles: ['Ejecutivo Comercial Senior', 'Asesor de Cuentas Clave', 'Representante de Ventas', 'Supervisor Comercial'] },
      { name: 'Administración & Finanzas', roles: ['Analista Contable', 'Asistente de Tesorería', 'Especialista en Facturación', 'Jefe de Administración', 'Auditor Interno'] },
      { name: 'Tecnología & TI', roles: ['Desarrollador Fullstack', 'Ingeniero DevOps', 'Soporte TI Especializado', 'Arquitecto Cloud'] }
    ];

    const firstNames = ['Carlos', 'María', 'José', 'Ana', 'Luis', 'Rosa', 'Jorge', 'Diana', 'Miguel', 'Lucía', 'David', 'Elena', 'Fernando', 'Patricia', 'César', 'Andrea', 'Manuel', 'Claudia', 'Víctor', 'Silvia', 'Raúl', 'Camila', 'Gonzalo', 'Fiorella', 'Renzo', 'Valeria', 'Hugo', 'Jimena', 'Javier', 'Natalia'];
    const lastNames = ['Mendoza', 'Flores', 'Quispe', 'Rojas', 'García', 'Alvarez', 'Vargas', 'Castillo', 'Romero', 'Huamán', 'Espinoza', 'Torres', 'Medina', 'Ramos', 'Gutiérrez', 'Chávez', 'Silva', 'Campos', 'Salazar', 'Vásquez', 'Paredes', 'Herrera', 'Cárdenas', 'Peña', 'Guerrero'];
    const pensiones: Array<'AFP Integra' | 'AFP Prima' | 'AFP Profuturo' | 'AFP Habitat' | 'ONP'> = ['AFP Integra', 'AFP Prima', 'AFP Profuturo', 'AFP Habitat', 'ONP'];
    const banks = ['BCP', 'BBVA', 'Interbank', 'Scotiabank', 'Banco de la Nación'];

    for (let i = 1; i <= 80; i++) {
      const fn = firstNames[(i * 3) % firstNames.length];
      const ln1 = lastNames[(i * 7) % lastNames.length];
      const ln2 = lastNames[(i * 11) % lastNames.length];
      const deptObj = depts[i % depts.length];
      const role = deptObj.roles[i % deptObj.roles.length];

      const baseSalary = 1025 + Math.round((Math.sin(i) * 0.5 + 0.5) * 4200 / 50) * 50;
      const dni = (70000000 + i * 137).toString().padStart(8, '0');
      const hasFamily = i % 3 !== 0;
      const pens = pensiones[i % pensiones.length];
      const status: Worker['status'] = i === 12 ? 'Cesado' : (i === 45 ? 'Suspensión' : 'Activo');

      const hireYear = 2021 + (i % 5);
      const hireMonth = (1 + (i % 12)).toString().padStart(2, '0');
      const hireDay = (1 + (i % 28)).toString().padStart(2, '0');
      const hireDate = `${hireYear}-${hireMonth}-${hireDay}`;

      list.push({
        id: `tra-${i.toString().padStart(3, '0')}`,
        dni,
        name: `${fn} ${ln1} ${ln2}`,
        email: `${fn.toLowerCase()}.${ln1.toLowerCase()}@aura.pe`,
        phone: `9${(80000000 + i * 1234).toString().substring(0, 8)}`,
        companyId: 'aur-corp',
        companyName: 'Corporación Aura S.A.C.',
        department: deptObj.name,
        costCenter: `CC-${deptObj.name.substring(0, 3).toUpperCase()}-${100 + (i % 4)}`,
        role,
        baseSalary: i === 7 ? 980 : baseSalary, // Caso de prueba controlado para discrepancia si es menor al mínimo
        contractType: i % 4 === 0 ? 'Plazo Fijo' : 'Indeterminado',
        hireDate,
        contractEndDate: i % 4 === 0 ? '2026-10-31' : undefined,
        birthDate: `${1980 + (i % 22)}-06-15`,
        status,
        pensionSystem: pens,
        afpCommissionType: i % 2 === 0 ? 'Flujo' : 'Mixta',
        cussp: pens === 'ONP' ? '' : `CUSSP-${100000 + i}`,
        hasFamilyAllowance: hasFamily,
        childrenCount: hasFamily ? (1 + (i % 3)) : 0,
        bankName: banks[i % banks.length],
        bankAccount: `191-${20000000 + i * 3}-${i % 10}`
      });
    }

    return list;
  }

  // Novedades iniciales realistas para los 80 trabajadores
  private generateInitialNovelties(): Record<string, PayrollNovelty> {
    const map: Record<string, PayrollNovelty> = {};
    for (let i = 1; i <= 80; i++) {
      const id = `tra-${i.toString().padStart(3, '0')}`;
      const hasOvertime = i % 5 === 0;
      const hasTardiness = i % 7 === 0;
      const hasAdvance = i % 4 === 0;
      const hasBonus = i % 6 === 0;
      const hasAbsence = i === 18 || i === 44;

      map[id] = {
        workerId: id,
        workedDays: 30,
        overtime25Hours: hasOvertime ? (i === 15 ? 32 : (4 + (i % 6))) : 0, // Caso de prueba de horas excesivas en i=15
        overtime35Hours: hasOvertime ? (2 + (i % 4)) : 0,
        tardinessMinutes: hasTardiness ? (15 + (i % 45)) : 0,
        absenceDays: hasAbsence ? (i === 18 ? 3 : 1) : 0,
        performanceBonus: hasBonus ? 350.00 : 0,
        productionBonus: (i % 10 === 0) ? 200.00 : 0,
        mobilityAllowance: (i % 8 === 0) ? 150.00 : 0,
        advancePayment: hasAdvance ? 500.00 : 0,
        loanDeduction: (i % 12 === 0) ? 250.00 : 0,
        judicialRetention: (i === 22) ? 400.00 : 0,
        notes: hasOvertime ? 'Horas extras autorizadas por producción de cierre.' : undefined
      };
    }
    return map;
  }

  private generateInitialBenefits(): SocialBenefit[] {
    return [
      {
        id: 'ben-01',
        workerId: 'tra-001',
        workerName: 'Carlos Mendoza Rojas',
        dni: '70000137',
        role: 'Operador Técnico',
        type: 'Gratificación Fiestas Patrias',
        periodLabel: 'Semestre 2026-I (Enero - Junio)',
        baseSalary: 2850.00,
        computableRemuneration: 2952.50,
        workedMonths: 6,
        grossBenefit: 2952.50,
        extraBonusEsSalud: 265.73,
        deductions: 0,
        netToPay: 3218.23,
        status: 'Pagado',
        calculationDate: '2026-07-12',
        breakdownNotes: 'Gratificación semestral completa más 9% Ley 29351.'
      },
      {
        id: 'ben-02',
        workerId: 'tra-012',
        workerName: 'María Flores Quispe',
        dni: '70001644',
        role: 'Supervisora Comercial',
        type: 'Liquidación BBSS (Cese)',
        periodLabel: '18 meses laborados (Renuncia Voluntaria)',
        baseSalary: 3400.00,
        computableRemuneration: 3502.50,
        workedMonths: 18,
        grossBenefit: 5840.20,
        extraBonusEsSalud: 180.50,
        deductions: 240.10,
        netToPay: 5780.60,
        status: 'Procesado',
        calculationDate: '2026-09-30',
        breakdownNotes: 'CTS Trunca S/ 2,450 + Grati Trunca S/ 1,820 + Vacaciones Truncas S/ 1,570.20'
      }
    ];
  }
}
