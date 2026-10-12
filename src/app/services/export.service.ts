import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { PayrollCalculation, PayrollPeriod, Company } from '../models/payroll.model';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  // 1. Exportar Planilla a Excel
  exportPayrollToExcel(calculations: PayrollCalculation[], period: PayrollPeriod, company: Company) {
    const dataRows = calculations.map((c, index) => ({
      'N°': index + 1,
      'DNI': c.worker.dni,
      'Apellidos y Nombres': c.worker.name,
      'Área / Departamento': c.worker.department,
      'Centro de Costo': c.worker.costCenter,
      'Cargo': c.worker.role,
      'Tipo Contrato': c.worker.contractType,
      'Sueldo Base (S/)': c.worker.baseSalary,
      'Asig. Familiar (S/)': c.familyAllowance,
      'Días Lab.': c.novelty.workedDays - c.novelty.absenceDays,
      'H.E. 25% (S/)': c.overtime25Amount,
      'H.E. 35% (S/)': c.overtime35Amount,
      'Bonificaciones (S/)': c.bonusesTotal,
      'TOTAL BRUTO (S/)': c.totalGross,
      'Régimen Pensión': c.worker.pensionSystem,
      'Fondo AFP (S/)': c.afpFondo,
      'Seguro AFP (S/)': c.afpSeguro,
      'Comisión AFP (S/)': c.afpComision,
      'ONP 13% (S/)': c.onpAmount,
      'Renta 5ta (S/)': c.tax5thCategory,
      'Tardanzas/Faltas (S/)': c.tardinessDeduction + c.absenceDeduction,
      'Adelantos/Préstamos (S/)': c.advanceDeduction + c.loanDeduction,
      'TOTAL DESCUENTOS (S/)': c.totalDeductions,
      'NETO A PAGAR (S/)': c.netPay,
      'Banco': c.worker.bankName,
      'N° Cuenta': c.worker.bankAccount,
      'EsSalud 9% (S/)': c.essaludContribution,
      'SCTR (S/)': c.sctrContribution,
      'COSTO TOTAL EMPLEADOR (S/)': c.totalEmployerCost
    }));

    // Resumen de totales
    const totalGross = calculations.reduce((a, b) => a + b.totalGross, 0);
    const totalDeductions = calculations.reduce((a, b) => a + b.totalDeductions, 0);
    const totalNet = calculations.reduce((a, b) => a + b.netPay, 0);
    const totalEmployerCost = calculations.reduce((a, b) => a + b.totalEmployerCost, 0);

    const totalsRow = {
      'N°': 'TOTALES',
      'DNI': '',
      'Apellidos y Nombres': `${calculations.length} Trabajadores`,
      'Área / Departamento': '',
      'Centro de Costo': '',
      'Cargo': '',
      'Tipo Contrato': '',
      'Sueldo Base (S/)': '',
      'Asig. Familiar (S/)': '',
      'Días Lab.': '',
      'H.E. 25% (S/)': '',
      'H.E. 35% (S/)': '',
      'Bonificaciones (S/)': '',
      'TOTAL BRUTO (S/)': totalGross,
      'Régimen Pensión': '',
      'Fondo AFP (S/)': '',
      'Seguro AFP (S/)': '',
      'Comisión AFP (S/)': '',
      'ONP 13% (S/)': '',
      'Renta 5ta (S/)': '',
      'Tardanzas/Faltas (S/)': '',
      'Adelantos/Préstamos (S/)': '',
      'TOTAL DESCUENTOS (S/)': totalDeductions,
      'NETO A PAGAR (S/)': totalNet,
      'Banco': '',
      'N° Cuenta': '',
      'EsSalud 9% (S/)': '',
      'SCTR (S/)': '',
      'COSTO TOTAL EMPLEADOR (S/)': totalEmployerCost
    };

    const worksheet = XLSX.utils.json_to_sheet([...dataRows, totalsRow]);

    // Establecer anchos de columna
    worksheet['!cols'] = [
      { wch: 5 },  // N°
      { wch: 10 }, // DNI
      { wch: 28 }, // Nombres
      { wch: 24 }, // Dept
      { wch: 14 }, // Centro Costo
      { wch: 22 }, // Cargo
      { wch: 15 }, // Contrato
      { wch: 14 }, // Sueldo Base
      { wch: 14 }, // Asig Fam
      { wch: 10 }, // Días
      { wch: 12 }, // HE 25%
      { wch: 12 }, // HE 35%
      { wch: 14 }, // Bonos
      { wch: 16 }, // Bruto
      { wch: 14 }, // Pension
      { wch: 12 }, // Fondo
      { wch: 12 }, // Seguro
      { wch: 12 }, // Comision
      { wch: 12 }, // ONP
      { wch: 12 }, // Renta 5ta
      { wch: 15 }, // Tardanzas
      { wch: 16 }, // Adelantos
      { wch: 18 }, // Total Descuentos
      { wch: 18 }, // Neto
      { wch: 12 }, // Banco
      { wch: 20 }, // Cuenta
      { wch: 14 }, // EsSalud
      { wch: 12 }, // SCTR
      { wch: 20 }  // Costo Total
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Planilla_${period.periodCode}`);

    const fileName = `Planilla_${company.name.replace(/\s+/g, '_')}_${period.periodCode}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  // 2. Exportar Resumen General de Planilla a PDF
  exportPayrollSummaryPDF(calculations: PayrollCalculation[], period: PayrollPeriod, company: Company) {
    const doc = new jsPDF('landscape', 'pt', 'a4');

    // Membrete Superior
    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, 842, 55, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('AURA | SISTEMA INTEGRAL DE PLANILLAS Y REMUNERACIONES', 30, 28);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(165, 180, 252);
    doc.text(`EMPRESA: ${company.name} | RUC: ${company.ruc} | PERIODO: ${period.periodName.toUpperCase()}`, 30, 44);

    // Métricas en cabecera
    const totalGross = calculations.reduce((a, b) => a + b.totalGross, 0);
    const totalDeductions = calculations.reduce((a, b) => a + b.totalDeductions, 0);
    const totalNet = calculations.reduce((a, b) => a + b.netPay, 0);
    const totalEmployerCost = calculations.reduce((a, b) => a + b.totalEmployerCost, 0);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Colaboradores: ${calculations.length}`, 30, 75);
    doc.text(`Total Bruto: S/ ${totalGross.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, 160, 75);
    doc.text(`Total Deducciones: S/ ${totalDeductions.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, 320, 75);
    doc.text(`Neto Total a Pagar: S/ ${totalNet.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, 490, 75);
    doc.text(`Costo Empleador: S/ ${totalEmployerCost.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, 660, 75);

    // Estado de Aprobación Humana
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(71, 85, 105);
    const approvalText = period.status === 'aprobado'
      ? `ESTADO: APROBADO | Responsable: ${period.approvedBy} | Código: ${period.approvalCode} | Fecha: ${period.approvalDate}`
      : `ESTADO: ${period.status.toUpperCase()} | Pendiente de Aprobación Humana Formal`;
    doc.text(approvalText, 30, 90);

    // Tabla de colaboradores
    const tableData = calculations.map((c, i) => [
      (i + 1).toString(),
      c.worker.dni,
      c.worker.name,
      c.worker.department,
      `S/ ${c.worker.baseSalary.toFixed(2)}`,
      `S/ ${c.totalGross.toFixed(2)}`,
      c.worker.pensionSystem,
      `S/ ${c.totalPensionDeduction.toFixed(2)}`,
      `S/ ${c.tax5thCategory.toFixed(2)}`,
      `S/ ${c.totalDeductions.toFixed(2)}`,
      `S/ ${c.netPay.toFixed(2)}`,
      `S/ ${c.essaludContribution.toFixed(2)}`,
      `S/ ${c.totalEmployerCost.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 100,
      head: [['N°', 'DNI', 'Colaborador', 'Área', 'Sueldo', 'Bruto', 'Pensión', 'Dcto. Pen.', '5ta Cat.', 'Tot. Dcto', 'NETO', 'EsSalud', 'Costo Emp.']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 3,
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 30, right: 30 }
    });

    const fileName = `Resumen_Planilla_${company.ruc}_${period.periodCode}.pdf`;
    doc.save(fileName);
  }

  // 3. Exportar Boleta de Pago Individual Oficial (Formato Perú D.S. 001-98-TR)
  exportWorkerPayslipPDF(calc: PayrollCalculation, period: PayrollPeriod, company: Company) {
    const doc = new jsPDF('portrait', 'pt', 'a4');
    const w = calc.worker;

    // Encabezado
    doc.setFillColor(17, 24, 39);
    doc.rect(30, 30, 535, 65, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(company.name.toUpperCase(), 45, 52);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(199, 210, 254);
    doc.text(`RUC: ${company.ruc} | Dirección: ${company.address}`, 45, 68);
    doc.text(`BOLETA DE PAGO DE REMUNERACIONES - D.S. 001-98-TR | PERIODO: ${period.periodName.toUpperCase()}`, 45, 82);

    // Datos del Trabajador
    doc.setFillColor(241, 245, 249);
    doc.rect(30, 105, 535, 85, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(30, 105, 535, 85, 'S');

    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    // Columna 1
    doc.setFont('helvetica', 'bold');
    doc.text('DNI / Doc.:', 40, 122);
    doc.setFont('helvetica', 'normal');
    doc.text(w.dni, 110, 122);

    doc.setFont('helvetica', 'bold');
    doc.text('Trabajador:', 40, 137);
    doc.setFont('helvetica', 'normal');
    doc.text(w.name, 110, 137);

    doc.setFont('helvetica', 'bold');
    doc.text('Cargo / Puesto:', 40, 152);
    doc.setFont('helvetica', 'normal');
    doc.text(w.role, 110, 152);

    doc.setFont('helvetica', 'bold');
    doc.text('Área / C. Costo:', 40, 167);
    doc.setFont('helvetica', 'normal');
    doc.text(`${w.department} (${w.costCenter})`, 110, 167);

    // Columna 2
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha Ingreso:', 310, 122);
    doc.setFont('helvetica', 'normal');
    doc.text(w.hireDate, 395, 122);

    doc.setFont('helvetica', 'bold');
    doc.text('Tipo Contrato:', 310, 137);
    doc.setFont('helvetica', 'normal');
    doc.text(w.contractType, 395, 137);

    doc.setFont('helvetica', 'bold');
    doc.text('Régimen Pensión:', 310, 152);
    doc.setFont('helvetica', 'normal');
    doc.text(`${w.pensionSystem} ${w.cussp ? `(${w.cussp})` : ''}`, 395, 152);

    doc.setFont('helvetica', 'bold');
    doc.text('Días / H.E. Totales:', 310, 167);
    doc.setFont('helvetica', 'normal');
    const heTotal = calc.novelty.overtime25Hours + calc.novelty.overtime35Hours;
    doc.text(`${calc.novelty.workedDays - calc.novelty.absenceDays} días lab. | ${heTotal} hrs extras`, 395, 167);

    // Cuerpo de la Boleta (Ingresos vs Descuentos vs Aportes)
    const breakdownData = [
      ['0121 Sueldo Básico', `S/ ${calc.workedDaysAmount.toFixed(2)}`, '0601 Aporte AFP Fondo', `S/ ${calc.afpFondo.toFixed(2)}`],
      ['0201 Asignación Familiar', `S/ ${calc.familyAllowance.toFixed(2)}`, '0605 Prima Seguro AFP', `S/ ${calc.afpSeguro.toFixed(2)}`],
      ['0105 Horas Extras 25%', `S/ ${calc.overtime25Amount.toFixed(2)}`, '0606 Comisión Flujo AFP', `S/ ${calc.afpComision.toFixed(2)}`],
      ['0106 Horas Extras 35%', `S/ ${calc.overtime35Amount.toFixed(2)}`, '0607 SNP / ONP 13%', `S/ ${calc.onpAmount.toFixed(2)}`],
      ['0301 Bonos y Movilidad', `S/ ${calc.bonusesTotal.toFixed(2)}`, '0605 Impuesto Renta 5ta', `S/ ${calc.tax5thCategory.toFixed(2)}`],
      ['', '', '0701 Tardanzas y Faltas', `S/ ${(calc.tardinessDeduction + calc.absenceDeduction).toFixed(2)}`],
      ['', '', '0703 Adelantos y Préstamos', `S/ ${(calc.advanceDeduction + calc.loanDeduction).toFixed(2)}`],
      ['', '', '0706 Retención Judicial', `S/ ${calc.judicialRetention.toFixed(2)}`]
    ];

    autoTable(doc, {
      startY: 200,
      head: [['CONCEPTOS DE INGRESO', 'MONTO (S/)', 'DEDUCCIONES Y RETENCIONES', 'MONTO (S/)']],
      body: breakdownData,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 4, textColor: [30, 41, 59] },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      margin: { left: 30, right: 30 }
    });

    // Totales y Neto
    const currentY = (doc as any).lastAutoTable.finalY + 15;

    doc.setFillColor(248, 250, 252);
    doc.rect(30, currentY, 535, 60, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(30, currentY, 535, 60, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`TOTAL REMUNERACIÓN BRUTA: S/ ${calc.totalGross.toFixed(2)}`, 45, currentY + 22);
    doc.text(`TOTAL DESCUENTOS: S/ ${calc.totalDeductions.toFixed(2)}`, 45, currentY + 44);

    // Caja de Neto
    doc.setFillColor(99, 102, 241);
    doc.roundedRect(330, currentY + 10, 220, 40, 4, 4, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('NETO A PAGAR:', 345, currentY + 26);
    doc.setFontSize(14);
    doc.text(`S/ ${calc.netPay.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`, 345, currentY + 43);

    // Aportes Empleador (Informativo)
    const aportesY = currentY + 75;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`APORTES DEL EMPLEADOR (NO DEDUCIBLE AL TRABAJADOR):`, 30, aportesY);
    doc.setFont('helvetica', 'normal');
    doc.text(`EsSalud (9%): S/ ${calc.essaludContribution.toFixed(2)}   |   SCTR (1.25%): S/ ${calc.sctrContribution.toFixed(2)}   |   Costo Total Empresa: S/ ${calc.totalEmployerCost.toFixed(2)}`, 30, aportesY + 15);

    // Firmas
    const signY = aportesY + 80;
    doc.setDrawColor(148, 163, 184);
    doc.line(70, signY, 230, signY);
    doc.line(340, signY, 500, signY);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('EMPLEADOR / RESPONSABLE RRHH', 80, signY + 14);
    doc.text('FIRMA DEL TRABAJADOR', 370, signY + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Autorización: ${period.approvalCode || 'PENDIENTE DE FIRMA DIGITAL'}`, 70, signY + 28);
    doc.text(`DNI: ${w.dni}`, 415, signY + 28);

    const fileName = `Boleta_${w.dni}_${period.periodCode}.pdf`;
    doc.save(fileName);
  }
}
