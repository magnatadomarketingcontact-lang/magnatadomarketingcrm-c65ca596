import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient, STATUS_LABELS, MEDIA_LABELS, PROCEDURE_LABELS, PatientStatus, MediaOrigin, ProcedureType } from '@/types/patient';
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

const CHART_COLORS: [number, number, number][] = [
  [234, 88, 12],   // orange-600
  [59, 130, 246],   // blue-500
  [16, 185, 129],   // emerald-500
  [168, 85, 247],   // purple-500
  [239, 68, 68],    // red-500
  [245, 158, 11],   // amber-500
  [20, 184, 166],   // teal-500
  [236, 72, 153],   // pink-500
];

function drawBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  data: { label: string; value: number; color: [number, number, number] }[],
  title: string,
  valueFormatter?: (v: number) => string
) {
  const fmt = valueFormatter || ((v: number) => String(v));

  // Title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(title, x + width / 2, y, { align: 'center' });

  const chartY = y + 8;
  const chartHeight = height - 20;
  const chartWidth = width - 10;
  const chartX = x + 5;

  if (data.length === 0 || data.every(d => d.value === 0)) {
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text('Sem dados', x + width / 2, chartY + chartHeight / 2, { align: 'center' });
    return;
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const barWidth = Math.min(28, (chartWidth - 10) / data.length - 4);
  const totalBarsWidth = data.length * (barWidth + 4) - 4;
  const startX = chartX + (chartWidth - totalBarsWidth) / 2;

  // Draw axis line
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);

  data.forEach((item, i) => {
    const barHeight = (item.value / maxValue) * (chartHeight - 8);
    const bx = startX + i * (barWidth + 4);
    const by = chartY + chartHeight - barHeight;

    // Bar
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.roundedRect(bx, by, barWidth, barHeight, 1, 1, 'F');

    // Value on top
    doc.setFontSize(7);
    doc.setTextColor(50);
    doc.setFont('helvetica', 'bold');
    doc.text(fmt(item.value), bx + barWidth / 2, by - 2, { align: 'center' });

    // Label below
    doc.setFontSize(6);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    const label = item.label.length > 12 ? item.label.substring(0, 11) + '…' : item.label;
    doc.text(label, bx + barWidth / 2, chartY + chartHeight + 5, { align: 'center' });
  });
}

function drawPieChart(
  doc: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  data: { label: string; value: number; color: [number, number, number] }[],
  title: string
) {
  // Title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(title, cx, cy - radius - 8, { align: 'center' });

  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text('Sem dados', cx, cy, { align: 'center' });
    return;
  }

  // Draw pie slices using filled triangles approximation
  let currentAngle = -Math.PI / 2;

  data.forEach((item) => {
    if (item.value === 0) return;
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const steps = Math.max(20, Math.floor(sliceAngle * 30));
    const angleStep = sliceAngle / steps;

    doc.setFillColor(item.color[0], item.color[1], item.color[2]);

    // Build polygon points
    const points: [number, number][] = [[cx, cy]];
    for (let s = 0; s <= steps; s++) {
      const a = currentAngle + s * angleStep;
      points.push([cx + radius * Math.cos(a), cy + radius * Math.sin(a)]);
    }

    // Draw as filled polygon using triangles from center
    for (let s = 1; s < points.length - 1; s++) {
      const triangle = [points[0], points[s], points[s + 1]];
      doc.triangle(
        triangle[0][0], triangle[0][1],
        triangle[1][0], triangle[1][1],
        triangle[2][0], triangle[2][1],
        'F'
      );
    }

    // Label line
    const midAngle = currentAngle + sliceAngle / 2;
    const labelR = radius + 6;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);
    const pct = ((item.value / total) * 100).toFixed(0);

    doc.setFontSize(7);
    doc.setTextColor(50);
    doc.setFont('helvetica', 'bold');
    const align = lx > cx ? 'left' : 'right';
    doc.text(`${pct}%`, lx + (lx > cx ? 2 : -2), ly + 1, { align });

    currentAngle += sliceAngle;
  });

  // Legend
  const legendX = cx + radius + 18;
  let legendY = cy - (data.filter(d => d.value > 0).length * 5);

  data.forEach((item) => {
    if (item.value === 0) return;
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.rect(legendX, legendY - 3, 4, 4, 'F');
    doc.setFontSize(7);
    doc.setTextColor(60);
    doc.setFont('helvetica', 'normal');
    doc.text(`${item.label} (${item.value})`, legendX + 6, legendY);
    legendY += 8;
  });
}

export function generatePdfReport({ patients, periodLabel, includePatientList, includeObservations }: ReportOptions) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Header ──
  doc.setFillColor(234, 88, 12);
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

  // ── Status Breakdown Table ──
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

  y = (doc as any).lastAutoTable.finalY + 14;

  // ══════════════════════════════════════════════
  // ── CHARTS PAGE ──
  // ══════════════════════════════════════════════
  doc.addPage();

  // ── Bar Chart: Revenue by Procedure ──
  const procData = Object.entries(PROCEDURE_LABELS).map(([key, label], i) => {
    const matching = closedPatients.filter(p => p.procedures.includes(key as ProcedureType));
    const revenue = matching.reduce((s, p) => s + (p.closedValue || 0), 0);
    return { label, value: revenue, color: CHART_COLORS[i % CHART_COLORS.length] };
  });

  drawBarChart(doc, 10, 20, pageWidth - 20, 90, procData, 'Faturamento por Procedimento', (v) => {
    if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
    return `R$${v}`;
  });

  // ── Pie Chart: Conversions by Media Origin ──
  const mediaData = Object.entries(MEDIA_LABELS).map(([key, label], i) => {
    const count = closedPatients.filter(p => p.mediaOrigin === key as MediaOrigin).length;
    return { label, value: count, color: CHART_COLORS[i % CHART_COLORS.length] };
  });

  drawPieChart(doc, 65, 160, 35, mediaData, 'Origem das Conversões (Fechados)');

  // ── Bar Chart: Patients by Status ──
  const statusData = Object.entries(STATUS_LABELS).map(([key, label], i) => {
    const count = patients.filter(p => p.status === key as PatientStatus).length;
    return { label, value: count, color: CHART_COLORS[i % CHART_COLORS.length] };
  });

  drawBarChart(doc, 10, 210, pageWidth - 20, 70, statusData, 'Pacientes por Status');

  // ══════════════════════════════════════════════
  // ── DETAIL TABLES PAGE ──
  // ══════════════════════════════════════════════
  doc.addPage();
  y = 20;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
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

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Faturamento por Procedimento (Fechados)', 14, y);
  y += 8;

  const procBreakdown = Object.entries(PROCEDURE_LABELS).map(([key, label]) => {
    const matching = closedPatients.filter(p => p.procedures.includes(key as ProcedureType));
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
