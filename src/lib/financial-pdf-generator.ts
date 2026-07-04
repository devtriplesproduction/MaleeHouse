import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

export const generateFinancialReportPDF = (
  reportData: any,
  generatedConfig: {
    type: 'profit_loss' | 'income' | 'expense' | 'cash_flow' | 'balance_sheet' | 'project_statement',
    from: Date | string,
    to: Date | string,
    projectId?: string
  },
  companySettings: any,
  project: any,
  title: string
) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to preview/print the report.");
    return;
  }

  const issueDate = new Date();
  
  let periodText = '';
  if (generatedConfig.type === 'balance_sheet') {
    periodText = `As of: ${format(new Date(generatedConfig.to), 'MMM d, yyyy')}`;
  } else {
    periodText = `Period: ${format(new Date(generatedConfig.from), 'MMM d, yyyy')} to ${format(new Date(generatedConfig.to), 'MMM d, yyyy')}`;
  }

  let reportContentHtml = '';

  const generateTable = (headers: string[], rows: string[][], totals?: {label: string, value: string}[]) => {
    let html = `
      <table class="items-table">
        <thead>
          <tr>
            ${headers.map((h, i) => `<th style="text-align: ${i === headers.length - 1 ? 'right' : 'left'}">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;
    
    rows.forEach(row => {
      html += `<tr class="item-row">`;
      row.forEach((cell, i) => {
        html += `<td style="padding: 12px 8px; font-size: 11px; color: #0f172a; text-align: ${i === row.length - 1 ? 'right' : 'left'}">${cell}</td>`;
      });
      html += `</tr>`;
    });

    html += `</tbody></table>`;
    
    if (totals && totals.length > 0) {
      html += `
        <div class="totals-container">
          <table class="totals-table">
            ${totals.map((t, i) => `
              <tr ${i === totals.length - 1 ? 'class="grand-total-row"' : ''}>
                <td class="totals-label ${i === totals.length - 1 ? 'grand-total-label' : ''}">${t.label}</td>
                <td class="totals-val ${i === totals.length - 1 ? 'grand-total-val' : ''}">${t.value}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      `;
    }
    
    return html;
  };

  if (generatedConfig.type === 'profit_loss' || generatedConfig.type === 'cash_flow') {
    const revRows = Object.entries(reportData.revenueByProject || {}).map(([k, v]) => [k, formatCurrency(v as number)]);
    const costRows = Object.entries(reportData.costsByCategory || {}).map(([k, v]) => [k, formatCurrency(v as number)]);
    
    reportContentHtml += `
      <div style="margin-bottom: 20px;">
        <h3 class="font-outfit" style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">Revenue by Project</h3>
        ${generateTable(['Project', 'Amount'], revRows, [{label: 'Total Revenue', value: formatCurrency(reportData.totalRevenue)}])}
      </div>
      <div style="margin-bottom: 20px;">
        <h3 class="font-outfit" style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">Costs by Category</h3>
        ${generateTable(['Category', 'Amount'], costRows, [{label: 'Total Costs', value: formatCurrency(reportData.totalCosts)}])}
      </div>
      <div class="totals-container" style="border-top: none; padding-top: 0;">
          <table class="totals-table">
              <tr class="grand-total-row">
                  <td class="totals-label grand-total-label">Net Profit</td>
                  <td class="totals-val grand-total-val" style="color: ${reportData.netProfit >= 0 ? '#10b981' : '#ef4444'}">${formatCurrency(reportData.netProfit)}</td>
              </tr>
          </table>
      </div>
    `;
  } else if (generatedConfig.type === 'income') {
    const rows = (reportData.incomeTransactions || []).map((t: any) => [
      new Date(t.date).toLocaleDateString(),
      t.project,
      formatCurrency(t.amount)
    ]);
    reportContentHtml += generateTable(['Date', 'Project', 'Amount'], rows, [{label: 'Total Income', value: formatCurrency(reportData.totalIncome)}]);
  } else if (generatedConfig.type === 'expense') {
    const rows = Object.entries(reportData.expensesByCategory || {}).map(([k, v]) => [k, formatCurrency(v as number)]);
    reportContentHtml += generateTable(['Category', 'Amount'], rows, [{label: 'Total Expenses', value: formatCurrency(reportData.totalExpenses)}]);
  } else if (generatedConfig.type === 'balance_sheet') {
    const assetRows = Object.entries(reportData.assets || {}).map(([k, v]) => [k, formatCurrency(v as number)]);
    const liabRows = Object.entries(reportData.liabilities || {}).map(([k, v]) => [k, formatCurrency(v as number)]);
    
    reportContentHtml += `
      <div style="margin-bottom: 20px;">
        <h3 class="font-outfit" style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">Assets</h3>
        ${generateTable(['Asset', 'Amount'], assetRows, [{label: 'Total Assets', value: formatCurrency(reportData.totalAssets)}])}
      </div>
      <div style="margin-bottom: 20px;">
        <h3 class="font-outfit" style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">Liabilities</h3>
        ${generateTable(['Liability', 'Amount'], liabRows, [{label: 'Total Liabilities', value: formatCurrency(reportData.totalLiabilities)}])}
      </div>
      <div class="totals-container" style="border-top: none; padding-top: 0;">
          <table class="totals-table">
              <tr class="grand-total-row">
                  <td class="totals-label grand-total-label">Total Equity</td>
                  <td class="totals-val grand-total-val">${formatCurrency(reportData.equity)}</td>
              </tr>
          </table>
      </div>
    `;
  } else if (generatedConfig.type === 'project_statement') {
    const rows = (reportData.timeline || []).map((t: any) => [
      t.title,
      t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A',
      t.status.toUpperCase(),
      formatCurrency(t.total_amount)
    ]);
    
    reportContentHtml += `
      <h3 class="font-outfit" style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">Payment Timeline</h3>
      ${generateTable(['Milestone', 'Due Date', 'Status', 'Total'], rows, [
        {label: 'Total Billed', value: formatCurrency(reportData.summary?.totalBilled || 0)},
        {label: 'Total Paid', value: formatCurrency(reportData.summary?.totalPaid || 0)},
        {label: 'Outstanding', value: formatCurrency(reportData.summary?.outstanding || 0)}
      ])}
    `;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');
          
          @page { size: A4 portrait; margin: 0; }
          
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            color: #1e293b;
            margin: 0; padding: 0;
            background-color: #f1f5f9;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .page {
            width: 210mm; min-height: 297mm;
            padding: 20mm; margin: 10px auto;
            box-sizing: border-box; position: relative;
            background-color: #ffffff;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            display: flex; flex-direction: column;
            page-break-after: always;
          }
          
          .page:last-child { page-break-after: avoid; }
          .font-outfit { font-family: 'Outfit', sans-serif; }
          
          .brand-logo {
            width: 38px; height: 38px;
            background-color: #4f46e5; color: white;
            font-size: 20px; font-weight: 800; font-style: italic;
            text-align: center; line-height: 38px;
            border-radius: 8px; display: inline-block;
          }
          
          .info-card {
            border: 1px solid #e2e8f0; border-radius: 12px;
            padding: 16px; background-color: #f8fafc;
            width: 48%; box-sizing: border-box;
          }
          
          .items-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .items-table th {
            border-bottom: 2px solid #0f172a; color: #475569; font-weight: 700;
            text-transform: uppercase; font-size: 9px; letter-spacing: 0.05em; padding: 8px;
          }
          .item-row { border-bottom: 1px solid #f1f5f9; }
          
          .totals-container { border-top: 2px double #0f172a; padding-top: 15px; margin-top: 20px; display: flex; justify-content: flex-end; }
          .totals-table { width: 280px; border-collapse: collapse; }
          .totals-table td { padding: 5px 0; font-size: 11px; }
          .totals-label { font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
          .totals-val { text-align: right; font-weight: 700; font-family: monospace; color: #0f172a; }
          
          .grand-total-row td { padding-top: 10px; border-top: 1px solid #e2e8f0; }
          .grand-total-label { font-weight: 800; color: #4f46e5; font-size: 11px; }
          .grand-total-val { font-size: 16px; font-weight: 900; color: #0f172a; }
          
          .footer-section {
            border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: auto;
            display: flex; justify-content: space-between; font-size: 8px;
            color: #94a3b8; font-weight: 600; text-transform: uppercase;
          }

          @media print {
            body { background-color: #ffffff; margin: 0; }
            .page { margin: 0; box-shadow: none; width: 210mm; height: 297mm; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div style="flex: 1; display: flex; flex-direction: column;">
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #f1f5f9; padding-bottom: 18px; margin-bottom: 18px;">
              <div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                  <div class="brand-logo font-outfit">M</div>
                  <div>
                    <h1 class="font-outfit" style="font-size: 16px; font-weight: 900; text-transform: uppercase; margin: 0; color: #0f172a; letter-spacing: -0.02em;">Malee House</h1>
                    <p class="font-outfit" style="font-size: 8px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.15em; margin: 0;">Engineering &amp; Survey Services</p>
                  </div>
                </div>
                
                <div style="font-size: 10px; color: #64748b; line-height: 1.5; font-weight: 500;">
                  <strong style="color: #334155;">${companySettings?.name || 'Malee House'}</strong><br/>
                  ${companySettings?.address || ''}<br/>
                  <span style="font-weight: 600; color: #4f46e5;">GSTIN: ${companySettings?.gstin || ''}</span>
                </div>
              </div>
              
              <div style="text-align: right;">
                <h1 class="font-outfit" style="font-size: 24px; font-weight: 900; color: #e2e8f0; text-transform: uppercase; margin: 0 0 10px 0; letter-spacing: -0.03em;">${title}</h1>
                
                <table style="border-collapse: collapse; margin-left: auto;">
                  <tr>
                    <td style="font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; text-align: right; padding-right: 8px; padding-bottom: 2px;">Report Date</td>
                    <td style="font-size: 10px; font-weight: 600; color: #334155; text-align: right; padding-bottom: 2px;">${issueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; text-align: right; padding-right: 8px;">Period</td>
                    <td style="font-size: 10px; font-weight: 600; color: #ef4444; text-align: right;">${periodText}</td>
                  </tr>
                </table>
              </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 18px;">
              <div class="info-card">
                <div style="font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Client Bill To:</div>
                <div style="font-size: 12px; font-weight: 700; color: #0f172a; line-height: 1.2;">${project?.client_name || (generatedConfig.projectId ? 'Client' : 'All Projects (Company-wide)')}</div>
                <div style="font-size: 10px; color: #64748b; margin-top: 3px; font-weight: 500;">${project?.client_address || (generatedConfig.projectId ? 'Address Not Provided' : 'N/A')}</div>
                <div style="font-size: 10px; color: #64748b; margin-top: 1px; font-weight: 500;">${project?.client_contact || (generatedConfig.projectId ? '' : 'N/A')}</div>
              </div>
              <div class="info-card">
                <div style="font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Report Details:</div>
                <div style="font-size: 12px; font-weight: 700; color: #0f172a; line-height: 1.2;">${title}</div>
                <div style="font-size: 10px; color: #64748b; margin-top: 3px; font-weight: 500;">Generated via Malee House OS</div>
              </div>
            </div>
            
            ${reportContentHtml}
            
          </div>
          <div class="footer-section">
            <span>Malee House Document Reference: Financial Report</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(() => { window.print(); }, 500);
          };
        </script>
      </body>
    </html>
  `;
  
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
