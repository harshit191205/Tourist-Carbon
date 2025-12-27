import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ExportReport = ({ emissions, tripData, ecoMode }) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(24);
    doc.setTextColor(34, 197, 94);
    doc.text('Carbon Footprint Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(34, 197, 94);
    doc.text('Trip Summary', 14, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['Detail', 'Value']],
      body: [
        ['Origin', tripData.tripDetails?.origin || 'N/A'],
        ['Destination', tripData.tripDetails?.destination || 'N/A'],
        ['Purpose', tripData.tripDetails?.purpose || 'N/A'],
        ['Transport Mode', tripData.transportData.mode.toUpperCase()],
        ['Distance', `${tripData.transportData.distance} km`],
        ['Accommodation', tripData.accommodationData.type],
        ['Duration', `${tripData.accommodationData.nights} nights`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255] },
      styles: { fontSize: 10 }
    });
    
    let finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.setTextColor(34, 197, 94);
    doc.text('Carbon Emissions Breakdown', 14, finalY);
    
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Category', 'CO₂ (kg)', 'Percentage']],
      body: [
        ['Transport', emissions.transport, `${((emissions.transport / emissions.total) * 100).toFixed(1)}%`],
        ['Accommodation', emissions.accommodation, `${((emissions.accommodation / emissions.total) * 100).toFixed(1)}%`],
        ['Activities', emissions.activities, `${((emissions.activities / emissions.total) * 100).toFixed(1)}%`],
      ],
      foot: [['TOTAL', emissions.total, '100%']],
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] },
      footStyles: { fillColor: [239, 68, 68], fontStyle: 'bold' }
    });
    
    finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.setTextColor(34, 197, 94);
    doc.text('Impact Metrics', 14, finalY);
    
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Metric', 'Value']],
      body: [
        ['Total CO₂', `${emissions.total} kg`],
        ['Daily Average', `${emissions.perDay} kg/day`],
        ['Carbon Category', emissions.category],
        ['Trees to Offset', `${emissions.treesNeeded} trees`],
        ['vs Global Average', `${emissions.comparisonPercentage}%`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [56, 189, 248] }
    });
    
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Carbon Footprint Dashboard - Page ${i} of ${pageCount}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`Carbon_Report_${tripData.tripDetails?.destination || 'Trip'}_${Date.now()}.pdf`);
  };
  
  const generateCSV = () => {
    const csvData = [
      ['Carbon Footprint Report'],
      ['Generated', new Date().toLocaleDateString()],
      [''],
      ['Trip Details'],
      ['Origin', tripData.tripDetails?.origin || 'N/A'],
      ['Destination', tripData.tripDetails?.destination || 'N/A'],
      ['Transport', tripData.transportData.mode],
      ['Distance', `${tripData.transportData.distance} km`],
      ['Accommodation', tripData.accommodationData.type],
      ['Nights', tripData.accommodationData.nights],
      [''],
      ['Emissions'],
      ['Transport', `${emissions.transport} kg`],
      ['Accommodation', `${emissions.accommodation} kg`],
      ['Activities', `${emissions.activities} kg`],
      ['TOTAL', `${emissions.total} kg`],
      [''],
      ['Metrics'],
      ['Daily Average', `${emissions.perDay} kg`],
      ['Category', emissions.category],
      ['Trees Needed', emissions.treesNeeded],
      ['vs Global Avg', `${emissions.comparisonPercentage}%`]
    ];
    
    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Carbon_Report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`glass-card p-8 hover-lift animate-slideUp delay-600 ${
      ecoMode ? 'glow-green' : 'glow-blue'
    }`}>
      <h2 className="text-2xl font-bold text-text-primary mb-3 flex items-center text-glow-white">
        <span className="mr-3 floating">📥</span>
        Export Your Report
      </h2>
      <p className="text-text-secondary mb-6">
        Download your carbon footprint analysis for sharing or record-keeping
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={generatePDF}
          className="glass-card p-6 flex items-center space-x-4 hover-lift button-press glow-red group"
        >
          <div className="w-16 h-16 glass-card flex items-center justify-center text-4xl floating glow-red">
            📄
          </div>
          <div className="text-left">
            <div className="text-lg font-bold text-accent-red mb-1">Download PDF</div>
            <div className="text-xs text-text-muted">Professional report format</div>
          </div>
        </button>
        
        <button
          onClick={generateCSV}
          className={`glass-card p-6 flex items-center space-x-4 hover-lift button-press group ${
            ecoMode ? 'glow-green' : 'glow-blue'
          }`}
        >
          <div className={`w-16 h-16 glass-card flex items-center justify-center text-4xl floating ${
            ecoMode ? 'glow-green' : 'glow-blue'
          }`}>
            📊
          </div>
          <div className="text-left">
            <div className={`text-lg font-bold mb-1 ${
              ecoMode ? 'text-eco-primary' : 'text-accent-blue'
            }`}>
              Export CSV
            </div>
            <div className="text-xs text-text-muted">Excel-compatible data</div>
          </div>
        </button>
      </div>
      
      <div className="glass-card p-5">
        <h3 className="font-bold text-text-primary mb-4 flex items-center">
          <span className="mr-2">📋</span> Report Contents
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm text-text-secondary">
          {['Trip summary', 'Emission breakdown', 'Impact metrics', 'Recommendations'].map((item, i) => (
            <div key={i} className="glass-card p-2 flex items-center space-x-2 hover-lift">
              <span className={ecoMode ? 'text-eco-primary' : 'text-accent-blue'}>✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExportReport;
