import jsPDF from 'jspdf';

const COLORS = {
  primary: [139, 92, 246] as [number, number, number],     // purple
  dark: [30, 30, 46] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightBg: [245, 243, 255] as [number, number, number],
  accent: [236, 72, 153] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
  gray: [148, 163, 184] as [number, number, number],
  text: [51, 51, 51] as [number, number, number],
};

const W = 297; // A4 landscape width
const H = 210; // A4 landscape height

function drawGradientBg(doc: jsPDF) {
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, W, H, 'F');
  // accent bar top
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
  doc.text(`MAGNATA DO CRM  •  Apresentação Comercial`, 15, H - 8);
  doc.text(`${slideNum}/${total}`, W - 15, H - 8, { align: 'right' });
}

function drawIcon(doc: jsPDF, x: number, y: number, size: number, color: [number, number, number]) {
  doc.setFillColor(...color);
  doc.roundedRect(x, y, size, size, 3, 3, 'F');
}

export function generatePdfSlides() {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const totalSlides = 7;

  // ============ SLIDE 1 - CAPA ============
  drawGradientBg(doc);
  
  // Title
  doc.setFontSize(42);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('MAGNATA DO CRM', W / 2, 70, { align: 'center' });

  // Subtitle
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.primary);
  doc.text('Sistema Inteligente de Gestão para', W / 2, 90, { align: 'center' });
  doc.text('Laboratórios de Próteses Odontológicas', W / 2, 100, { align: 'center' });

  // Decorative line
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(W / 2 - 40, 112, W / 2 + 40, 112);

  // Tagline
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
    { icon: '⚠️', title: 'Falta de Organização', desc: 'Pacientes perdidos em planilhas confusas e anotações de papel.' },
    { icon: '📉', title: 'Perda de Faturamento', desc: 'Sem controle de fechamentos, valores e ticket médio.' },
    { icon: '🕐', title: 'Tempo Desperdiçado', desc: 'Horas gastas buscando informações que deveriam estar na palma da mão.' },
    { icon: '📞', title: 'Follow-up Esquecido', desc: 'Pacientes agendados sem acompanhamento e lembretes automáticos.' },
  ];

  problems.forEach((p, i) => {
    const y = 50 + i * 35;
    drawIcon(doc, 30, y - 5, 14, COLORS.accent);
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.text(p.icon, 37, y + 4, { align: 'center' });

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

  // ============ SLIDE 4 - FUNCIONALIDADES ============
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

    // Header bar
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

  drawFooter(doc, 4, totalSlides);

  // ============ SLIDE 5 - RELATÓRIOS ============
  doc.addPage();
  drawGradientBg(doc);

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Relatórios e Exportações', W / 2, 30, { align: 'center' });

  const reportFeatures = [
    { title: 'PDF Completo', desc: 'Relatórios profissionais com gráficos, tabelas e resumo financeiro para impressão ou envio.' },
    { title: 'Exportação CSV', desc: 'Exporte seus dados para Excel com filtros personalizados por status e origem de mídia.' },
    { title: 'Filtros por Período', desc: 'Relatórios diários, semanais, mensais ou por período personalizado (ano/mês).' },
    { title: 'Dashboard Visual', desc: 'Gráficos interativos de faturamento por procedimento e origem das conversões.' },
  ];

  reportFeatures.forEach((f, i) => {
    const isLeft = i % 2 === 0;
    const x = isLeft ? 20 : W / 2 + 10;
    const y = 50 + Math.floor(i / 2) * 60;

    doc.setFillColor(45, 45, 65);
    doc.roundedRect(x, y, W / 2 - 30, 48, 5, 5, 'F');

    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(f.title, x + 12, y + 16);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    const lines = doc.splitTextToSize(f.desc, W / 2 - 55);
    doc.text(lines, x + 12, y + 28);
  });

  drawFooter(doc, 5, totalSlides);

  // ============ SLIDE 6 - SEGURANÇA ============
  doc.addPage();
  drawLightBg(doc);

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Segurança e Confiabilidade', W / 2, 30, { align: 'center' });

  const securityItems = [
    { title: '🔐 Autenticação Segura', desc: 'Login com e-mail e senha criptografados. Cada usuário tem acesso apenas aos seus dados.' },
    { title: '☁️ Dados na Nuvem', desc: 'Seus dados ficam seguros em servidores de alta disponibilidade, com backup automático.' },
    { title: '📱 Acesso Multiplataforma', desc: 'Use no computador, tablet ou celular. Interface responsiva que se adapta a qualquer tela.' },
    { title: '🔄 Sincronização em Tempo Real', desc: 'Alterações são salvas instantaneamente. Sem risco de perder informações importantes.' },
  ];

  securityItems.forEach((item, i) => {
    const y = 48 + i * 35;
    doc.setFillColor(...COLORS.white);
    doc.roundedRect(25, y, W - 50, 28, 4, 4, 'F');
    doc.setDrawColor(220, 220, 240);
    doc.roundedRect(25, y, W - 50, 28, 4, 4, 'S');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(item.title, 35, y + 11);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    doc.text(item.desc, 35, y + 21);
  });

  drawFooter(doc, 6, totalSlides);

  // ============ SLIDE 7 - CTA / CONTATO ============
  doc.addPage();
  drawGradientBg(doc);

  // Big CTA
  doc.setFontSize(34);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Pronto para transformar', W / 2, 60, { align: 'center' });
  doc.text('a gestão do seu laboratório?', W / 2, 76, { align: 'center' });

  // Decorative line
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(1);
  doc.line(W / 2 - 50, 90, W / 2 + 50, 90);

  // CTA button
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(W / 2 - 55, 105, 110, 20, 8, 8, 'F');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('COMECE AGORA', W / 2, 118, { align: 'center' });

  // Contact info
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

  drawFooter(doc, 7, totalSlides);

  // Save
  doc.save('magnata_crm_apresentacao.pdf');
}
