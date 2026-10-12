import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import confetti from 'canvas-confetti';
import { PayrollService } from './services/payroll.service';
import { ExportService } from './services/export.service';
import {
  Worker,
  PayrollCalculation,
  PayrollNovelty,
  SocialBenefit,
  CompanyObligation
} from './models/payroll.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  payrollService = inject(PayrollService);
  exportService = inject(ExportService);

  // Tab activo
  activeTab = signal<'dashboard' | 'workers' | 'payroll' | 'approval' | 'benefits' | 'reports'>('dashboard');

  // Filtros
  searchTerm = signal<string>('');
  selectedDepartment = signal<string>('TODOS');
  selectedStatus = signal<string>('TODOS');

  // Notificaciones Toast
  toastMessage = signal<{ text: string; type: 'success' | 'warning' | 'danger' | 'info' } | null>(null);

  // Modal: Trabajador (Alta / Edición)
  showWorkerModal = signal<boolean>(false);
  editingWorker = signal<Partial<Worker>>({});

  // Modal: Novedad individual
  showNoveltyModal = signal<boolean>(false);
  editingNovelty = signal<PayrollNovelty | null>(null);
  selectedWorkerForNovelty = signal<Worker | null>(null);

  // Menú desplegable de acciones en tabla de cálculo
  activeActionMenuWorkerId = signal<string | null>(null);

  // Modal: Aprobación Humana Formal
  showApprovalModal = signal<boolean>(false);
  reviewerName = signal<string>('Ing. Carlos Mendoza');
  reviewerRole = signal<string>('Gerente de Recursos Humanos & Nóminas');
  approvalNotes = signal<string>('Validado según biométrico y límites legales de descuento.');
  approvalCheck1 = signal<boolean>(false);
  approvalCheck2 = signal<boolean>(false);
  approvalCheck3 = signal<boolean>(false);
  approvalCheck4 = signal<boolean>(false);

  // Modal: Reapertura de período
  showReopenModal = signal<boolean>(false);
  reopenJustification = signal<string>('');

  // Modal: Previsualización de Boleta
  showPayslipModal = signal<boolean>(false);
  selectedCalcForPayslip = signal<PayrollCalculation | null>(null);

  // Modal: Liquidación de Beneficios Sociales (Cese)
  showLiquidationModal = signal<boolean>(false);
  selectedWorkerForLiquidation = signal<string>('');
  liquidationReason = signal<'Renuncia' | 'Mutuo Disenso' | 'Despido Arbitrario'>('Renuncia');
  liquidationMonths = signal<number>(12);
  calculatedLiquidationResult = signal<SocialBenefit | null>(null);

  // Lista de departamentos para filtros
  departments = computed(() => {
    const list = this.payrollService.companyWorkers().map(w => w.department);
    return ['TODOS', ...Array.from(new Set(list))];
  });

  // Lista de trabajadores filtrados
  filteredWorkers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const dept = this.selectedDepartment();
    const status = this.selectedStatus();

    return this.payrollService.companyWorkers().filter(w => {
      const matchTerm = !term ||
        w.name.toLowerCase().includes(term) ||
        w.dni.includes(term) ||
        w.role.toLowerCase().includes(term);
      const matchDept = dept === 'TODOS' || w.department === dept;
      const matchStatus = status === 'TODOS' || w.status === status;
      return matchTerm && matchDept && matchStatus;
    });
  });

  // Lista de cálculos de planilla filtrados
  filteredCalculations = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const dept = this.selectedDepartment();

    return this.payrollService.payrollCalculations().filter(c => {
      const matchTerm = !term ||
        c.worker.name.toLowerCase().includes(term) ||
        c.worker.dni.includes(term) ||
        c.worker.role.toLowerCase().includes(term);
      const matchDept = dept === 'TODOS' || c.worker.department === dept;
      return matchTerm && matchDept;
    });
  });

  // Discrepancias acumuladas para el panel de revisión
  allDiscrepancies = computed(() => {
    const list: { worker: Worker; warning: string; calc: PayrollCalculation }[] = [];
    for (const c of this.payrollService.payrollCalculations()) {
      for (const warn of c.discrepancyWarnings) {
        list.push({ worker: c.worker, warning: warn, calc: c });
      }
    }
    return list;
  });

  // Mostrar Toast
  showToast(text: string, type: 'success' | 'warning' | 'danger' | 'info' = 'success') {
    this.toastMessage.set({ text, type });
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4500);
  }

  // Cambiar pestaña
  setTab(tab: 'dashboard' | 'workers' | 'payroll' | 'approval' | 'benefits' | 'reports') {
    this.activeTab.set(tab);
  }

  // Cambiar empresa
  changeCompany(companyId: string) {
    this.payrollService.currentCompanyId.set(companyId);
    this.showToast(`Empresa cambiada a: ${this.payrollService.currentCompany().name}`, 'info');
  }

  // --- REGISTRO LABORAL ---
  openNewWorkerModal() {
    this.editingWorker.set({
      id: `tra-${(this.payrollService.workers().length + 1).toString().padStart(3, '0')}`,
      dni: '',
      name: '',
      email: '',
      phone: '',
      companyId: this.payrollService.currentCompanyId(),
      companyName: this.payrollService.currentCompany().name,
      department: 'Operaciones & Producción',
      costCenter: 'CC-OPE-101',
      role: '',
      baseSalary: 1025,
      contractType: 'Indeterminado',
      hireDate: new Date().toISOString().substring(0, 10),
      birthDate: '1995-05-15',
      status: 'Activo',
      pensionSystem: 'AFP Integra',
      afpCommissionType: 'Flujo',
      cussp: '',
      hasFamilyAllowance: false,
      childrenCount: 0,
      bankName: 'BCP',
      bankAccount: ''
    });
    this.showWorkerModal.set(true);
  }

  openEditWorkerModal(worker: Worker) {
    this.editingWorker.set({ ...worker });
    this.showWorkerModal.set(true);
  }

  saveWorkerForm() {
    const w = this.editingWorker();
    if (!w.name || !w.dni || !w.baseSalary) {
      this.showToast('Por favor completa DNI, Nombre completo y Sueldo Base.', 'warning');
      return;
    }

    if (w.dni.length !== 8) {
      this.showToast('El DNI debe tener 8 dígitos numéricos.', 'warning');
      return;
    }

    this.payrollService.saveWorker(w as Worker);
    this.showWorkerModal.set(false);
    this.showToast(`Trabajador ${w.name} guardado exitosamente.`);
  }

  toggleWorkerStatus(worker: Worker) {
    const newStatus = worker.status === 'Activo' ? 'Cesado' : 'Activo';
    const updated: Worker = {
      ...worker,
      status: newStatus,
      contractEndDate: newStatus === 'Cesado' ? new Date().toISOString().substring(0, 10) : undefined
    };
    this.payrollService.saveWorker(updated);
    this.showToast(`Estado laboral de ${worker.name} actualizado a: ${newStatus}`, newStatus === 'Activo' ? 'success' : 'warning');
  }

  // --- NOVEDADES ---
  openNoveltyModal(calc: PayrollCalculation) {
    if (this.payrollService.currentPeriod().status === 'aprobado' || this.payrollService.currentPeriod().status === 'cerrado') {
      this.showToast('El período está Aprobado / Cerrado. Para modificar novedades debes solicitar Reapertura formal.', 'warning');
      return;
    }
    this.selectedWorkerForNovelty.set(calc.worker);
    this.editingNovelty.set({ ...calc.novelty });
    this.showNoveltyModal.set(true);
  }

  saveNoveltyForm() {
    const nov = this.editingNovelty();
    if (!nov) return;

    this.payrollService.updateNovelty(nov.workerId, nov);
    this.showNoveltyModal.set(false);
    this.showToast('Novedades del colaborador recalculadas y actualizadas.');
  }

  // --- ACCIONES DESPLEGABLES DE PLANILLA ---
  toggleActionMenu(workerId: string, event: Event) {
    event.stopPropagation();
    if (this.activeActionMenuWorkerId() === workerId) {
      this.activeActionMenuWorkerId.set(null);
    } else {
      this.activeActionMenuWorkerId.set(workerId);
    }
  }

  closeActionMenu() {
    this.activeActionMenuWorkerId.set(null);
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.closeActionMenu();
  }

  downloadWorkerPayslipPDF(calc: PayrollCalculation, event?: Event) {
    if (event) event.stopPropagation();
    this.exportService.exportWorkerPayslipPDF(
      calc,
      this.payrollService.currentPeriod(),
      this.payrollService.currentCompany()
    );
    this.closeActionMenu();
    this.showToast(`Boleta de ${calc.worker.name} generada en PDF.`, 'success');
  }

  // --- APROBACIÓN HUMANA ---
  openApprovalModal() {
    this.approvalCheck1.set(false);
    this.approvalCheck2.set(false);
    this.approvalCheck3.set(false);
    this.approvalCheck4.set(false);
    this.showApprovalModal.set(true);
  }

  confirmHumanApproval() {
    if (!this.approvalCheck1() || !this.approvalCheck2() || !this.approvalCheck3() || !this.approvalCheck4()) {
      this.showToast('Debes verificar y marcar todos los puntos del Checklist de Control Humano antes de aprobar.', 'warning');
      return;
    }

    if (!this.reviewerName().trim()) {
      this.showToast('Indica el nombre y firma del responsable que autoriza.', 'warning');
      return;
    }

    const res = this.payrollService.approvePeriod(
      this.payrollService.currentPeriodId(),
      `${this.reviewerName()} (${this.reviewerRole()})`,
      this.approvalNotes()
    );

    if (res.success) {
      this.showApprovalModal.set(false);
      this.showToast(`¡Planilla aprobada legalmente! Código: ${res.code}`, 'success');

      // Animación de celebración
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }

  openReopenModal() {
    this.reopenJustification.set('');
    this.showReopenModal.set(true);
  }

  confirmReopenPeriod() {
    if (!this.reopenJustification().trim()) {
      this.showToast('Debes ingresar la justificación auditable para reabrir el período.', 'warning');
      return;
    }
    this.payrollService.reopenPeriod(
      this.payrollService.currentPeriodId(),
      this.reviewerName(),
      this.reopenJustification()
    );
    this.showReopenModal.set(false);
    this.showToast('Período reabierto a estado "En Revisión". Se han desbloqueado las ediciones.', 'info');
  }

  // --- LIQUIDACIÓN DE BENEFICIOS SOCIALES ---
  openLiquidationModal(workerId?: string) {
    if (workerId) {
      this.selectedWorkerForLiquidation.set(workerId);
    } else if (this.payrollService.companyWorkers().length > 0) {
      this.selectedWorkerForLiquidation.set(this.payrollService.companyWorkers()[0].id);
    }
    this.calculatedLiquidationResult.set(null);
    this.showLiquidationModal.set(true);
  }

  executeLiquidationCalculation() {
    const workerId = this.selectedWorkerForLiquidation();
    if (!workerId) return;

    const res = this.payrollService.calculateLiquidation(
      workerId,
      this.liquidationReason(),
      this.liquidationMonths()
    );

    if (res) {
      this.calculatedLiquidationResult.set(res);
      this.showToast(`Liquidación calculada para ${res.workerName}. Neto: S/ ${res.netToPay.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, 'success');
    }
  }

  // --- PREVISUALIZACIÓN DE BOLETA ---
  openPayslipPreview(calc: PayrollCalculation) {
    this.selectedCalcForPayslip.set(calc);
    this.showPayslipModal.set(true);
  }

  downloadCurrentPayslipPDF() {
    const calc = this.selectedCalcForPayslip();
    if (!calc) return;
    this.exportService.exportWorkerPayslipPDF(
      calc,
      this.payrollService.currentPeriod(),
      this.payrollService.currentCompany()
    );
    this.showToast(`Boleta de ${calc.worker.name} generada en PDF.`, 'success');
  }

  // --- REPORTES Y EXPORTACIONES ---
  exportToExcel() {
    this.exportService.exportPayrollToExcel(
      this.payrollService.payrollCalculations(),
      this.payrollService.currentPeriod(),
      this.payrollService.currentCompany()
    );
    this.showToast('Planilla exportada a archivo Excel (.xlsx) con fórmulas completas.', 'success');
  }

  exportToPDFSummary() {
    this.exportService.exportPayrollSummaryPDF(
      this.payrollService.payrollCalculations(),
      this.payrollService.currentPeriod(),
      this.payrollService.currentCompany()
    );
    this.showToast('Reporte General de Planilla generado en formato PDF.', 'success');
  }
}
