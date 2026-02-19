import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient, STATUS_LABELS, MEDIA_LABELS, PROCEDURE_LABELS } from '@/types/patient';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportOptions {
  patients: Patient[];
  periodLabel: string;
  includePatientList: boolean;
  includeObservations: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function generatePdfReport({ patients, periodLabel, includePatientList, includeObservations }: ReportOptions) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Header ──
  doc.setFillColor(234, 88, 12); // orange-600
  doc.rect(0, 0, pageWidth, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Magnata do CRM', 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Relatório gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 26);
  doc.text(`Período: ${periodLabel}`, pageWidth - 14, 26, { align: 'right' });

  // ── Stats ──
  const closedPatients = patients.filter(p => p.status === 'fechado');
  const totalRevenue = closedPatients.reduce((sum, p) => sum + (p.closedValue || 0), 0);
  const closedCount = closedPatients.length;
  const averageTicket = closedCount > 0 ? totalRevenue / closedCount : 0;
  const scheduledCount = patients.filter(p => p.status === 'agendado').length;
  const conversionRate = patients.length > 0 ? ((closedCount / patients.length) * 100).toFixed(1) : '0';

  let y = 44;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo', 14, y);
  y += 8;

  const statsData = [
    ['Total Faturado', formatCurrency(totalRevenue)],
    ['Fechamentos', String(closedCount)],
    ['Ticket Médio', formatCurrency(averageTicket)],
    ['Agendamentos', String(scheduledCount)],
    ['Total de Pacientes', String(patients.length)],
    ['Taxa de Conversão', `${conversionRate}%`],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Indicador', 'Valor']],
    body: statsData,
    theme: 'grid',
    headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [255, 247, 237] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 10 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // ── Breakdown by Status ──
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Pacientes por Status', 14, y);
  y += 8;

  const statusBreakdown = Object.entries(STATUS_LABELS).map(([key, label]) => {
    const count = patients.filter(p => p.status === key).length;
    const pct = patients.length > 0 ? ((count / patients.length) * 100).toFixed(1) : '0';
    return [label, String(count), `${pct}%`];
  });

  autoTable(doc, {
    startY: y,
    head: [['Status', 'Quantidade', '% do Total']],
    body: statusBreakdown,
    theme: 'grid',
    headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [255, 247, 237] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 10 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // ── Breakdown by Media Origin ──
  if (y > 240) { doc.addPage(); y = 20; }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Origem das Conversões (Fechados)', 14, y);
  y += 8;

  const mediaBreakdown = Object.entries(MEDIA_LABELS).map(([key, label]) => {
    const count = closedPatients.filter(p => p.mediaOrigin === key).length;
    const revenue = closedPatients.filter(p => p.mediaOrigin === key).reduce((s, p) => s + (p.closedValue || 0), 0);
    return [label, String(count), formatCurrency(revenue)];
  });

  autoTable(doc, {
    startY: y,
    head: [['Origem', 'Fechamentos', 'Faturamento']],
    body: mediaBreakdown,
    theme: 'grid',
    headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [255, 247, 237] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 10 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // ── Breakdown by Procedure ──
  if (y > 240) { doc.addPage(); y = 20; }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Faturamento por Procedimento (Fechados)', 14, y);
  y += 8;

  const procBreakdown = Object.entries(PROCEDURE_LABELS).map(([key, label]) => {
    const matching = closedPatients.filter(p => p.procedures.includes(key as any));
    const count = matching.length;
    const revenue = matching.reduce((s, p) => s + (p.closedValue || 0), 0);
    return [label, String(count), formatCurrency(revenue)];
  });

  autoTable(doc, {
    startY: y,
    head: [['Procedimento', 'Quantidade', 'Faturamento']],
    body: procBreakdown,
    theme: 'grid',
    headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [255, 247, 237] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 10 },
  });

  // ── Patient List ──
  if (includePatientList) {
    doc.addPage();
    let py = 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Lista de Pacientes', 14, py);
    py += 8;

    const headers = ['Nome', 'Telefone', 'Agendamento', 'Status', 'Procedimentos', 'Valor'];
    if (includeObservations) headers.push('Obs.');

    const rows = patients.map(p => {
      const row = [
        p.name,
        p.phone,
        format(parseISO(p.appointmentDate), 'dd/MM/yyyy', { locale: ptBR }),
        STATUS_LABELS[p.status],
        p.procedures.map(proc => PROCEDURE_LABELS[proc]).join(', '),
        p.closedValue ? formatCurrency(p.closedValue) : '-',
      ];
      if (includeObservations) row.push(p.observations || '-');
      return row;
    });

    autoTable(doc, {
      startY: py,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 247, 237] },
      margin: { left: 10, right: 10 },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: includeObservations ? { 6: { cellWidth: 30 } } : {},
    });
  }

  // ── Footer on all pages ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Magnata do CRM — Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  doc.save(`magnata_crm_relatorio_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
