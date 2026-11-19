import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ALL_INDICATORS,
  COMPONENTS_META,
  MADRASAH_INFO,
  PIC_USERS,
  type IndicatorProgress,
} from '../data/pkkmData';

const LOGO_URL = '/assets/aistudio/LOGO_MIA_06_23b19dba.png';

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generatePkkmPdfReport(
  progressMap: Record<string, IndicatorProgress>
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;

  const logoDataUrl = await loadLogoDataUrl();
  const now = new Date();
  const tanggalCetak = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const waktuCetak = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // ============================================================
  // KOP LAPORAN RESMI MADRASAH
  // ============================================================
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', marginX, 11, 20, 20);
  }

  const headerTextX = logoDataUrl ? marginX + 24 : marginX;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 118, 110); // teal-700
  doc.text('SISTEM INFORMASI PEMANTAUAN PENILAIAN KINERJA KEPALA MADRASAH', headerTextX, 14.5);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(MADRASAH_INFO.namaMadrasah, headerTextX, 20.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(
    `NSM: ${MADRASAH_INFO.nsm}  |  NPSN: ${MADRASAH_INFO.npsn}  |  Periode: ${MADRASAH_INFO.periodePenilaian}`,
    headerTextX,
    25.2
  );
  doc.text(
    `Kepala Madrasah: ${MADRASAH_INFO.kepalaMadrasah}  |  Pengawas: ${MADRASAH_INFO.pengawasPembina}`,
    headerTextX,
    29.5
  );

  // Garis pemisah kop
  doc.setDrawColor(15, 118, 110);
  doc.setLineWidth(0.7);
  doc.line(marginX, 33.5, pageWidth - marginX, 33.5);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.line(marginX, 34.4, pageWidth - marginX, 34.4);

  // Judul Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN REKAPITULASI PROGRES CEKLIST BUKTI FISIK (LEVEL 4)', marginX, 41);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Dicetak pada: ${tanggalCetak}, pukul ${waktuCetak} WIB   ·   Target Batas Akhir Penyetoran: 3 Desember 2026`,
    marginX,
    45.8
  );

  // ============================================================
  // HITUNG RINGKASAN EKSEKUTIF
  // ============================================================
  const totalIndicators = ALL_INDICATORS.length;
  const disetorkanCount = ALL_INDICATORS.filter(
    (i) => progressMap[i.id]?.status === 'disetorkan'
  ).length;
  const prosesCount = ALL_INDICATORS.filter(
    (i) => progressMap[i.id]?.status === 'proses'
  ).length;
  const belumCount = totalIndicators - disetorkanCount - prosesCount;
  const archivedCount = ALL_INDICATORS.filter(
    (i) => Boolean(progressMap[i.id]?.archived)
  ).length;

  const totalSubItems = ALL_INDICATORS.reduce((s, i) => s + i.buktiFisik.length, 0);
  const checkedSubItems = ALL_INDICATORS.reduce(
    (s, i) => s + (progressMap[i.id]?.checkedSubItems?.length ?? 0),
    0
  );
  const pctGlobal = totalIndicators > 0 ? Math.round((disetorkanCount / totalIndicators) * 100) : 0;
  const pctSub = totalSubItems > 0 ? Math.round((checkedSubItems / totalSubItems) * 100) : 0;

  // Kotak Ringkasan Eksekutif
  autoTable(doc, {
    startY: 49.5,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 2.5,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      halign: 'center',
      fontStyle: 'bold',
      textColor: [15, 23, 42],
    },
    head: [
      [
        'Total Indikator',
        'Sudah Disetorkan',
        'Dalam Proses',
        'Belum Disetor',
        'Capaian Global',
        'Kelengkapan Bukti',
        'Diarsipkan',
      ],
    ],
    body: [
      [
        `${totalIndicators} Butir`,
        `${disetorkanCount} Butir`,
        `${prosesCount} Butir`,
        `${belumCount} Butir`,
        `${pctGlobal}%`,
        `${checkedSubItems}/${totalSubItems} (${pctSub}%)`,
        `${archivedCount} Butir`,
      ],
    ],
  });

  // ============================================================
  // TABEL 1: REKAPITULASI PER KOMPONEN
  // ============================================================
  let currentY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 68;
  currentY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Rekapitulasi Progres Per Komponen Penilaian', marginX, currentY);

  const compRows = COMPONENTS_META.map((comp) => {
    const inds = ALL_INDICATORS.filter((i) => i.componentId === comp.id);
    const done = inds.filter((i) => progressMap[i.id]?.status === 'disetorkan').length;
    const proc = inds.filter((i) => progressMap[i.id]?.status === 'proses').length;
    const belum = inds.length - done - proc;
    const subTot = inds.reduce((s, i) => s + i.buktiFisik.length, 0);
    const subDone = inds.reduce(
      (s, i) => s + (progressMap[i.id]?.checkedSubItems?.length ?? 0),
      0
    );
    const pct = inds.length > 0 ? Math.round((done / inds.length) * 100) : 0;

    return [
      `K${comp.id}`,
      comp.title,
      String(comp.maxScore),
      String(inds.length),
      String(done),
      String(proc),
      String(belum),
      `${subDone}/${subTot}`,
      `${pct}%`,
    ];
  });

  autoTable(doc, {
    startY: currentY + 2.5,
    margin: { left: marginX, right: marginX },
    theme: 'striped',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [51, 65, 85], // slate-700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'center', cellWidth: 14 },
      4: { halign: 'center', cellWidth: 18, textColor: [15, 118, 110], fontStyle: 'bold' },
      5: { halign: 'center', cellWidth: 14, textColor: [180, 83, 9] },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'center', cellWidth: 22 },
      8: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
    },
    head: [['Kode', 'Komponen Penilaian', 'Skor', 'Butir', 'Disetorkan', 'Proses', 'Belum', 'Bukti Fisik', 'Capaian']],
    body: compRows,
  });

  // ============================================================
  // TABEL 2: REKAPITULASI PELAKSANA / PIC
  // ============================================================
  currentY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? currentY + 40;
  currentY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Rekapitulasi Capaian Per Pelaksana / Penanggung Jawab (PIC)', marginX, currentY);

  const picRows = PIC_USERS.map((u) => {
    const assigned = ALL_INDICATORS.filter((i) => i.pics.includes(u.id));
    const done = assigned.filter((i) => progressMap[i.id]?.status === 'disetorkan').length;
    const proc = assigned.filter((i) => progressMap[i.id]?.status === 'proses').length;
    const belum = assigned.length - done - proc;
    const pct = assigned.length > 0 ? Math.round((done / assigned.length) * 100) : 0;

    return [
      u.name,
      u.role,
      String(assigned.length),
      String(done),
      String(proc),
      String(belum),
      `${pct}%`,
    ];
  });

  autoTable(doc, {
    startY: currentY + 2.5,
    margin: { left: marginX, right: marginX },
    theme: 'striped',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 42 },
      1: { cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'center', cellWidth: 20, textColor: [15, 118, 110], fontStyle: 'bold' },
      4: { halign: 'center', cellWidth: 16, textColor: [180, 83, 9] },
      5: { halign: 'center', cellWidth: 16 },
      6: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
    },
    head: [['Nama Pelaksana', 'Jabatan / Peran', 'Tugas', 'Disetorkan', 'Proses', 'Belum', 'Capaian']],
    body: picRows,
  });

  // ============================================================
  // TABEL 3: RINCIAN LENGKAP 89 INDIKATOR
  // ============================================================
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Rincian Status Penyetoran & Lokasi Bukti Fisik (89 Indikator)', marginX, 16);

  const detailRows = ALL_INDICATORS.map((ind) => {
    const prog = progressMap[ind.id];
    const status = prog?.status ?? 'belum';
    const statusLabel =
      status === 'disetorkan'
        ? 'Disetorkan'
        : status === 'proses'
        ? 'Proses'
        : 'Belum';
    const checkedCount = prog?.checkedSubItems?.length ?? 0;
    const lokasi = prog?.lokasiBerkas?.trim() || '-';
    const arsipNote = prog?.archived ? ' [Arsip]' : '';

    return [
      `K${ind.componentId} #${ind.no}`,
      ind.indikatorKinerja,
      ind.rawKeterangan,
      `${statusLabel}${arsipNote}`,
      `${checkedCount}/${ind.buktiFisik.length}`,
      lokasi,
    ];
  });

  autoTable(doc, {
    startY: 20,
    margin: { left: marginX, right: marginX, bottom: 18 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.4,
      cellPadding: 1.8,
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15, fontStyle: 'bold' },
      1: { cellWidth: 68 },
      2: { cellWidth: 30 },
      3: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
      4: { halign: 'center', cellWidth: 14 },
      5: { cellWidth: 'auto' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const text = String(data.cell.raw ?? '');
        if (text.startsWith('Disetorkan')) {
          data.cell.styles.textColor = [15, 118, 110];
        } else if (text.startsWith('Proses')) {
          data.cell.styles.textColor = [180, 83, 9];
        } else {
          data.cell.styles.textColor = [100, 116, 139];
        }
      }
    },
    head: [['Butir', 'Indikator Kinerja', 'Pelaksana / PIC', 'Status', 'Bukti', 'Lokasi Berkas / Link']],
    body: detailRows,
  });

  // ============================================================
  // BLOK PENGESAHAN / TANDA TANGAN PIMPINAN
  // ============================================================
  let signY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 40) + 10;
  if (signY + 34 > pageHeight - 16) {
    doc.addPage();
    signY = 22;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const leftSignX = marginX + 6;
  const rightSignX = pageWidth - marginX - 66;

  doc.text('Mengetahui,', leftSignX, signY);
  doc.text('Kepala MIS Almaarif 06 Toyomarto', leftSignX, signY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(MADRASAH_INFO.kepalaMadrasah, leftSignX, signY + 23);

  doc.setFont('helvetica', 'normal');
  doc.text(`Toyomarto, ${tanggalCetak}`, rightSignX, signY);
  doc.text('Administrator / Tata Usaha Madrasah', rightSignX, signY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Tim Administrasi PKKM 2026', rightSignX, signY + 23);

  // ============================================================
  // FOOTER SETIAP HALAMAN
  // ============================================================
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `SIP-PKKM 2026 · ${MADRASAH_INFO.namaMadrasah}  |  Developer By Administrator MI Almaarif 06 Toyomarto`,
      marginX,
      pageHeight - 7.5
    );
    doc.text(`Halaman ${p} dari ${totalPages}`, pageWidth - marginX, pageHeight - 7.5, {
      align: 'right',
    });
  }

  const dateSlug = now.toISOString().slice(0, 10);
  doc.save(`Laporan-Rekap-PKKM-2026-MI-Almaarif-06-${dateSlug}.pdf`);
}
