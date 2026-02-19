import jsPDF from 'jspdf';
import slideDashboard from '@/assets/slide-dashboard.jpg';
import slidePatients from '@/assets/slide-patients.jpg';
import slideForm from '@/assets/slide-form.jpg';

const COLORS = {
  primary: [139, 92, 246] as [number, number, number],
  dark: [30, 30, 46] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightBg: [245, 243, 255] as [number, number, number],
  accent: [236, 72, 153] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
  gray: [148, 163, 184] as [number, number, number],
  text: [51, 51, 51] as [number, number, number],
};

const W = 297;
const H = 210;

function drawGradientBg(doc: jsPDF) {
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, W, H, 'F');
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, W, 4, 'F');
}

function drawLightBg(doc: jsPDF) {
  doc.setFillColor(...COLORS.lightBg);
  doc.rect(0, 0, W, H, 'F');
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, W, 4, 'F');
}

function drawFooter(doc: jsPDF, slideNum: number, total: number) {
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text('MAGNATA DO CRM  •  Apresentação Comercial', 15, H - 8);
  doc.text(`${slideNum}/${total}`, W - 15, H - 8, { align: 'right' });
}

function drawIcon(doc: jsPDF, x: number, y: number, size: number, color: [number, number, number]) {
  doc.setFillColor(...color);
  doc.roundedRect(x, y, size, size, 3, 3, 'F');
}

async function loadImageAsBase64(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject('no ctx'); return; }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = src;
  });
}

function addScreenshotSlide(
  doc: jsPDF,
  imgData: string,
  title: string,
  subtitle: string,
  slideNum: number,
  total: number,
  darkBg: boolean = true,
) {
  if (darkBg) {
    drawGradientBg(doc);
  } else {
    drawLightBg(doc);
  }

  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkBg ? 255 : 30, darkBg ? 255 : 30, darkBg ? 255 : 46);
  doc.text(title, W / 2, 22, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text(subtitle, W / 2, 32, { align: 'center' });

  // Screenshot with border/shadow
  const imgW = W - 40;
  const imgH = (imgW * 9) / 16;
  const imgX = 20;
  const imgY = 40;

  // Shadow
  doc.setFillColor(200, 200, 210);
  doc.roundedRect(imgX + 2, imgY + 2, imgW, imgH, 4, 4, 'F');

  // Image
  doc.addImage(imgData, 'JPEG', imgX, imgY, imgW, imgH);

  // Border
  doc.setDrawColor(darkBg ? 80 : 200, darkBg ? 80 : 200, darkBg ? 100 : 220);
  doc.setLineWidth(0.5);
  doc.roundedRect(imgX, imgY, imgW, imgH, 4, 4, 'S');

  drawFooter(doc, slideNum, total);
}

export async function generatePdfSlides() {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const totalSlides = 9;

  // Load images
  const [dashImg, patientsImg, formImg] = await Promise.all([
    loadImageAsBase64(slideDashboard),
    loadImageAsBase64(slidePatients),
    loadImageAsBase64(slideForm),
  ]);

  // ============ SLIDE 1 - CAPA ============
  drawGradientBg(doc);
  doc.setFontSize(42);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('MAGNATA DO CRM', W / 2, 70, { align: 'center' });

  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.primary);
  doc.text('Sistema Inteligente de Gestão para', W / 2, 90, { align: 'center' });
  doc.text('Laboratórios de Próteses Odontológicas', W / 2, 100, { align: 'center' });

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(W / 2 - 40, 112, W / 2 + 40, 112);

  doc.setFontSize(13);
  doc.setTextColor(...COLORS.gray);
  doc.text('Controle total dos seus pacientes, agendamentos e faturamento.', W / 2, 125, { align: 'center' });
  doc.text('Tudo em um só lugar.', W / 2, 133, { align: 'center' });

  drawFooter(doc, 1, totalSlides);

  // ============ SLIDE 2 - O PROBLEMA ============
  doc.addPage();
  drawLightBg(doc);

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('O Problema', W / 2, 30, { align: 'center' });

  const problems = [
    { title: 'Falta de Organização', desc: 'Pacientes perdidos em planilhas confusas e anotações de papel.' },
    { title: 'Perda de Faturamento', desc: 'Sem controle de fechamentos, valores e ticket médio.' },
    { title: 'Tempo Desperdiçado', desc: 'Horas gastas buscando informações que deveriam estar na palma da mão.' },
    { title: 'Follow-up Esquecido', desc: 'Pacientes agendados sem acompanhamento e lembretes automáticos.' },
  ];

  problems.forEach((p, i) => {
    const y = 50 + i * 35;
    drawIcon(doc, 30, y - 5, 14, COLORS.accent);

    doc.setFontSize(14);
    doc.setTextColor(...COLORS.dark);
    doc.setFont('helvetica', 'bold');
    doc.text(p.title, 52, y + 1);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    doc.text(p.desc, 52, y + 9);
  });

  drawFooter(doc, 2, totalSlides);

  // ============ SLIDE 3 - A SOLUÇÃO ============
  doc.addPage();
  drawGradientBg(doc);

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('A Solução: MAGNATA DO CRM', W / 2, 30, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(...COLORS.gray);
  doc.text('Um sistema completo desenvolvido especialmente para laboratórios de próteses.', W / 2, 45, { align: 'center' });

  const features = [
    ['📋 Cadastro completo de pacientes', '📊 Dashboard com métricas em tempo real'],
    ['📅 Controle de agendamentos', '💰 Acompanhamento de faturamento'],
    ['🔔 Notificações automáticas', '📱 Acesso de qualquer dispositivo'],
    ['📄 Relatórios em PDF', '🔒 Dados seguros na nuvem'],
  ];

  features.forEach((row, ri) => {
    row.forEach((feat, ci) => {
      const x = 30 + ci * 130;
      const y = 65 + ri * 28;
      doc.setFillColor(45, 45, 65);
      doc.roundedRect(x, y, 120, 22, 4, 4, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.white);
      doc.text(feat, x + 10, y + 13);
    });
  });

  drawFooter(doc, 3, totalSlides);

  // ============ SLIDE 4 - SCREENSHOT DASHBOARD ============
  doc.addPage();
  addScreenshotSlide(doc, dashImg, 'Dashboard Inteligente', 'Acompanhe métricas de faturamento, conversões e agendamentos em tempo real.', 4, totalSlides, true);

  // ============ SLIDE 5 - SCREENSHOT PACIENTES ============
  doc.addPage();
  addScreenshotSlide(doc, patientsImg, 'Gestão de Pacientes', 'Tabela completa com filtros por status, mídia, procedimento e busca por nome.', 5, totalSlides, false);

  // ============ SLIDE 6 - SCREENSHOT FORMULÁRIO ============
  doc.addPage();
  addScreenshotSlide(doc, formImg, 'Cadastro de Pacientes', 'Formulário completo com todos os campos necessários para controle total.', 6, totalSlides, true);

  // ============ SLIDE 7 - FUNCIONALIDADES ============
  doc.addPage();
  drawLightBg(doc);

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Funcionalidades Principais', W / 2, 30, { align: 'center' });

  const modules = [
    { title: 'Gestão de Pacientes', items: ['Cadastro completo com telefone e procedimentos', 'Filtros por status, origem e procedimento', 'Histórico e observações detalhadas'] },
    { title: 'Dashboard Inteligente', items: ['Total faturado e ticket médio', 'Taxa de conversão em tempo real', 'Gráficos de procedimentos e origens'] },
    { title: 'Agendamentos', items: ['Controle de data e horário', 'Status: Agendado, Veio, Não Veio', 'Notificações de consultas próximas'] },
  ];

  modules.forEach((mod, i) => {
    const x = 15 + i * 92;
    const cardW = 86;
    doc.setFillColor(...COLORS.white);
    doc.roundedRect(x, 45, cardW, 130, 5, 5, 'F');
    doc.setDrawColor(220, 220, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, 45, cardW, 130, 5, 5, 'S');

    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(x, 45, cardW, 18, 5, 5, 'F');
    doc.rect(x, 55, cardW, 8, 'F');

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(mod.title, x + cardW / 2, 57, { align: 'center' });

    mod.items.forEach((item, j) => {
      const iy = 75 + j * 28;
      doc.setFillColor(...COLORS.green);
      doc.circle(x + 12, iy, 2.5, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.text);
      const lines = doc.splitTextToSize(item, cardW - 24);
      doc.text(lines, x + 18, iy + 1.5);
    });
  });

  drawFooter(doc, 7, totalSlides);

  // ============ SLIDE 8 - SEGURANÇA ============
  doc.addPage();
  drawGradientBg(doc);

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Segurança e Confiabilidade', W / 2, 30, { align: 'center' });

  const securityItems = [
    { title: '🔐 Autenticação Segura', desc: 'Login com e-mail e senha criptografados. Cada usuário acessa apenas seus dados.' },
    { title: '☁️ Dados na Nuvem', desc: 'Servidores de alta disponibilidade com backup automático.' },
    { title: '📱 Acesso Multiplataforma', desc: 'Interface responsiva para computador, tablet ou celular.' },
    { title: '🔄 Sincronização em Tempo Real', desc: 'Alterações salvas instantaneamente, sem risco de perder dados.' },
  ];

  securityItems.forEach((item, i) => {
    const y = 50 + i * 35;
    doc.setFillColor(45, 45, 65);
    doc.roundedRect(25, y, W - 50, 28, 4, 4, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(item.title, 35, y + 11);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text(item.desc, 35, y + 21);
  });

  drawFooter(doc, 8, totalSlides);

  // ============ SLIDE 9 - CTA ============
  doc.addPage();
  drawGradientBg(doc);

  doc.setFontSize(34);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Pronto para transformar', W / 2, 60, { align: 'center' });
  doc.text('a gestão do seu laboratório?', W / 2, 76, { align: 'center' });

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(1);
  doc.line(W / 2 - 50, 90, W / 2 + 50, 90);

  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(W / 2 - 55, 105, 110, 20, 8, 8, 'F');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('COMECE AGORA', W / 2, 118, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text('Entre em contato e solicite uma demonstração gratuita.', W / 2, 145, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text('MAGNATA DO CRM', W / 2, 165, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray);
  doc.text('magnatadomarketingcrm.lovable.app', W / 2, 175, { align: 'center' });

  drawFooter(doc, 9, totalSlides);

  doc.save('magnata_crm_apresentacao.pdf');
}
