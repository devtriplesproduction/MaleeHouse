import { toast } from '@/hooks/use-toast';

interface ProjectReportData {
  project: any;
  team: any[];
  tasks: any[];
}

export const generateProjectReport = (data: ProjectReportData) => {
  const { project, team, tasks } = data;
  
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast({
      title: "Popup Blocked",
      description: "Please allow popups to print/download the project summary.",
      variant: "error"
    });
    return;
  }

  const teamHtml = team.map((member: any) => `
    <tr>
      <td style="font-weight: 600;">${member.profiles?.first_name || ""} ${member.profiles?.last_name || ""}</td>
      <td class="capitalize" style="color: #4f46e5; font-weight: 700;">${member.role ? member.role.replace('_', ' ') : 'N/A'}</td>
      <td>${member.profiles?.email || ""}</td>
    </tr>
  `).join("");

  const tasksHtml = tasks.map((task: any) => `
    <tr>
      <td style="font-weight: 600;">${task.title}</td>
      <td class="capitalize">${task.stage ? task.stage.replace('_', ' ') : 'N/A'}</td>
      <td class="status-cell ${task.status?.toLowerCase()}">${task.status ? task.status.toUpperCase() : 'N/A'}</td>
      <td>${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</td>
    </tr>
  `).join("");

  const htmlContent = `
    <html>
      <head>
        <title>Project Report - ${project.name}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 40px;
            background-color: #ffffff;
            line-height: 1.5;
          }
          .header {
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            color: white;
            padding: 35px;
            border-radius: 24px;
            margin-bottom: 40px;
            box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.2);
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.03em;
          }
          .header p {
            margin: 6px 0 0 0;
            font-size: 15px;
            opacity: 0.9;
            font-weight: 500;
          }
          .meta-info {
            display: flex;
            justify-content: space-between;
            margin-top: 25px;
            font-size: 12px;
            opacity: 0.85;
            font-family: monospace;
          }
          h2 {
            font-size: 15px;
            font-weight: 800;
            color: #4f46e5;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-top: 40px;
            margin-bottom: 20px;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 35px;
            font-size: 13px;
          }
          th, td {
            padding: 12px 14px;
            text-align: left;
            border-bottom: 1px solid #f1f5f9;
          }
          th {
            background-color: #f8fafc;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.05em;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .status-cell {
            font-weight: 700;
            font-size: 11px;
            letter-spacing: 0.05em;
          }
          .status-cell.completed { color: #059669; }
          .status-cell.pending { color: #d97706; }
          .status-cell.in_progress { color: #2563eb; }
          .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
            padding-top: 20px;
            font-weight: 500;
          }
          @media print {
            body { padding: 0; }
            .header { border-radius: 0; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MALEE HOUSE SURVEY WORKFLOW</h1>
          <p>Project Status Summary Report</p>
          <div class="meta-info">
            <span>PROJECT: ${project.id}</span>
            <span>DATE: ${new Date().toLocaleString()}</span>
          </div>
        </div>

        <h2>Project Overview</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 30%;">Operational Metric</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Project Name</strong></td>
              <td>${project.name}</td>
            </tr>
            <tr>
              <td><strong>Client Name</strong></td>
              <td>${project.client_name}</td>
            </tr>
            <tr>
              <td><strong>Current Status</strong></td>
              <td style="font-weight: bold; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.05em;">${project.status.replace('_', ' ')}</td>
            </tr>
            <tr>
              <td><strong>Target Date</strong></td>
              <td>${project.target_completion_date ? new Date(project.target_completion_date).toLocaleDateString() : 'N/A'}</td>
            </tr>
          </tbody>
        </table>

        <h2>Project Team</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            ${teamHtml || '<tr><td colspan="3" style="text-align:center; color:#94a3b8;">No team members assigned.</td></tr>'}
          </tbody>
        </table>

        <h2>Task Progression</h2>
        <table>
          <thead>
            <tr>
              <th>Task Title</th>
              <th>Stage</th>
              <th>Status</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${tasksHtml || '<tr><td colspan="4" style="text-align:center; color:#94a3b8;">No tasks recorded.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          Malee House Survey Workflow Management · Proprietary & Confidential
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const generateQuotationPDF = (quotation: any, project: any, companySettings: any, bankDetails?: any) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast({
      title: "Popup Blocked",
      description: "Please allow popups to preview/print the quotation.",
      variant: "error"
    });
    return;
  }

  const items = quotation.items || [];
  const discountAmount = quotation.discount_amount || 0;
  const discountPercentage = quotation.discount_pct || quotation.discount_percentage || 0;
  const clauses = quotation.clauses || [];

  const itemsHtml = items.map((item: any, i: number) => `
    <tr class="item-row">
      <td style="font-weight: 600; color: #94a3b8; padding: 12px 8px; font-size: 11px;">${i + 1}</td>
      <td style="padding: 12px 8px;">
        <div style="font-weight: 700; color: #0f172a; text-transform: uppercase; font-size: 11px; letter-spacing: -0.01em;">${item.service_name}</div>
        <div style="color: #64748b; font-size: 10px; margin-top: 3px; line-height: 1.4;">${item.description || 'Professional services as per technical scope.'}</div>
      </td>
      <td style="text-align: center; font-weight: 600; color: #0f172a; padding: 12px 8px; font-size: 11px;">${item.quantity}</td>
      <td style="text-align: right; font-weight: 600; font-family: monospace; color: #334155; padding: 12px 8px; font-size: 11px;">INR ${Number(item.unit_price).toLocaleString('en-IN')}</td>
      <td style="text-align: right; font-weight: 700; font-family: monospace; color: #0f172a; padding: 12px 8px; font-size: 11px;">INR ${Number(item.total).toLocaleString('en-IN')}</td>
    </tr>
  `).join("");

  const clausesHtml = clauses.map((clause: any, index: number) => `
    <div style="margin-bottom: 12px; page-break-inside: avoid;">
      <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #1e293b; margin-bottom: 2px;">
        ${index + 1}. ${clause.title || clause.clause_title || 'Condition'}
      </div>
      <div style="font-size: 9.5px; color: #64748b; line-height: 1.4; padding-left: 10px; border-left: 2px solid #e2e8f0; white-space: pre-wrap;">
        ${clause.content || clause.clause_content || ''}
      </div>
    </div>
  `).join("");

  const issueDate = new Date(quotation.created_at);
  const validityDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Quotation - ${quotation.quotation_number}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');
          
          @page {
            size: A4 portrait;
            margin: 0;
          }
          
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 10px auto;
            box-sizing: border-box;
            position: relative;
            background-color: #ffffff;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-after: always;
            break-after: page;
          }
          
          .page:last-of-type {
            page-break-after: avoid;
            break-after: avoid;
          }
          
          .font-outfit {
            font-family: 'Outfit', sans-serif;
          }
          
          .brand-logo {
            width: 38px;
            height: 38px;
            background-color: #4f46e5;
            color: white;
            font-size: 20px;
            font-weight: 800;
            font-style: italic;
            text-align: center;
            line-height: 38px;
            border-radius: 8px;
            display: inline-block;
          }
          
          .info-card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            background-color: #f8fafc;
            width: 48%;
            box-sizing: border-box;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          
          .items-table th {
            border-bottom: 2px solid #0f172a;
            color: #475569;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.05em;
            padding: 8px;
            text-align: left;
          }
          
          .item-row {
            border-bottom: 1px solid #f1f5f9;
          }
          
          .totals-container {
            border-top: 2px double #0f172a;
            padding-top: 15px;
            margin-top: 20px;
            display: flex;
            justify-content: flex-end;
          }
          
          .totals-table {
            width: 280px;
            border-collapse: collapse;
          }
          
          .totals-table td {
            padding: 5px 0;
            font-size: 11px;
          }
          
          .totals-label {
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          .totals-val {
            text-align: right;
            font-weight: 700;
            font-family: monospace;
            color: #0f172a;
          }
          
          .grand-total-row td {
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
          }
          
          .grand-total-label {
            font-weight: 800;
            color: #4f46e5;
            font-size: 11px;
          }
          
          .grand-total-val {
            font-size: 16px;
            font-weight: 900;
            color: #0f172a;
          }
          
          .signature-box {
            width: 130px;
            text-align: center;
          }
          
          .signature-line {
            border-bottom: 1px solid #cbd5e1;
            margin-top: 40px;
            margin-bottom: 6px;
          }
          
          .qr-badge {
            border: 1px dashed #10b981;
            border-radius: 8px;
            background-color: #f0fdf4;
            padding: 6px 10px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          
          .qr-text {
            font-size: 8px;
            font-weight: 700;
            color: #166534;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-align: left;
            line-height: 1.2;
          }
          
          .footer-section {
            border-top: 1px solid #f1f5f9;
            padding-top: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8px;
            color: #94a3b8;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          @media print {
            body {
              background-color: #ffffff;
              margin: 0;
            }
            .page {
              margin: 0;
              box-shadow: none;
              width: 210mm;
              min-height: 297mm;
            }
          }
        </style>
      </head>
      <body>
        
        <!-- ==================== PAGE 1 ==================== -->
        <div class="page">
          <!-- Page 1 Content -->
          <div style="flex: 1; display: flex; flex-direction: column;">
            
            <!-- Document Header -->
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
                  <strong style="color: #334155;">${companySettings?.name || 'Malee House Head Office'}</strong><br/>
                  ${companySettings?.address || '4th Floor, Alpha Block, Sigma Tech Park'}<br/>
                  ${companySettings?.cityStateZip || 'Whitefield, Bangalore, Karnataka 560066'}<br/>
                  <span style="font-weight: 600; color: #4f46e5;">GSTIN: ${companySettings?.gstin || '36AAAAA1111A1Z1'} | Tel: ${companySettings?.telephone || '+91 80 4987 6543'}</span>
                </div>
              </div>
              
              <div style="text-align: right;">
                <h1 class="font-outfit" style="font-size: 26px; font-weight: 900; color: #e2e8f0; text-transform: uppercase; margin: 0 0 10px 0; letter-spacing: -0.03em;">Quotation</h1>
                
                <table style="border-collapse: collapse; margin-left: auto;">
                  <tr>
                    <td style="font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; text-align: right; padding-right: 8px; padding-bottom: 2px;">Quote Number</td>
                    <td style="font-size: 11px; font-weight: 700; color: #0f172a; text-align: right; padding-bottom: 2px; font-family: monospace;">#${quotation.quotation_number}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; text-align: right; padding-right: 8px; padding-bottom: 2px;">Date Issued</td>
                    <td style="font-size: 10px; font-weight: 600; color: #334155; text-align: right; padding-bottom: 2px;">${issueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; text-align: right; padding-right: 8px;">Valid Until</td>
                    <td style="font-size: 10px; font-weight: 600; color: #ef4444; text-align: right;">${validityDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                  </tr>
                </table>
              </div>
            </div>
            
            <!-- Info Cards Row -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 18px;">
              <div class="info-card">
                <div style="font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Client Bill To:</div>
                <div style="font-size: 12px; font-weight: 700; color: #0f172a; line-height: 1.2;">${project.client_name}</div>
                ${project.gst_number ? `<div style="font-size: 9.5px; color: #64748b; margin-top: 3px; font-weight: 600;">GSTIN: ${project.gst_number}</div>` : ''}
                <div style="font-size: 10px; color: #64748b; margin-top: 3px; font-weight: 500;">Authorized Project Engagement</div>
              </div>
              <div class="info-card">
                <div style="font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Project Assignment:</div>
                <div style="font-size: 12px; font-weight: 700; color: #0f172a; line-height: 1.2;">${project.name}</div>
                <div style="font-size: 10px; color: #64748b; margin-top: 3px; font-weight: 500;">Location: Site Technical Survey</div>
              </div>
            </div>
            
            <!-- Services Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 30px;">#</th>
                  <th>Service Description</th>
                  <th style="width: 50px; text-align: center;">Qty</th>
                  <th style="width: 120px; text-align: right;">Unit Price</th>
                  <th style="width: 120px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
          </div>
          
          <!-- Page 1 Footer and Totals Panel (Locked at bottom of Page 1) -->
          <div style="margin-top: 15px;">
            <div class="totals-container">
              <table class="totals-table">
                <tr>
                  <td class="totals-label">Subtotal</td>
                  <td class="totals-val">INR ${(quotation.subtotal ?? 0).toLocaleString('en-IN')}</td>
                </tr>
                ${discountAmount > 0 ? `
                  <tr>
                    <td class="totals-label" style="color: #ef4444;">Discount (${discountPercentage}%)</td>
                    <td class="totals-val" style="color: #ef4444;">- INR ${discountAmount.toLocaleString('en-IN')}</td>
                  </tr>
                ` : ''}
                ${(!quotation.client_details?.gst_type && (quotation.gst_amount ?? 0) > 0) ? `
                  <tr>
                    <td class="totals-label">GST (${quotation.gst_rate ?? 18}%)</td>
                    <td class="totals-val">INR ${(quotation.gst_amount ?? 0).toLocaleString('en-IN')}</td>
                  </tr>
                ` : quotation.client_details?.gst_type === 'NO_GST' || (quotation.gst_amount ?? 0) === 0 ? '' : 
                  quotation.client_details?.gst_type === 'IGST' ? `
                  <tr>
                    <td class="totals-label">IGST (${quotation.gst_rate ?? 18}%)</td>
                    <td class="totals-val">INR ${(quotation.gst_amount ?? 0).toLocaleString('en-IN')}</td>
                  </tr>
                  ` : `
                  <tr>
                    <td class="totals-label">CGST (${(quotation.gst_rate ?? 18) / 2}%)</td>
                    <td class="totals-val">INR ${((quotation.gst_amount ?? 0) / 2).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td class="totals-label">SGST (${(quotation.gst_rate ?? 18) / 2}%)</td>
                    <td class="totals-val">INR ${((quotation.gst_amount ?? 0) / 2).toLocaleString('en-IN')}</td>
                  </tr>
                  `
                }
                <tr class="grand-total-row">
                  <td class="totals-label grand-total-label">Grand Total</td>
                  <td class="totals-val grand-total-val">INR ${(quotation.total_amount ?? 0).toLocaleString('en-IN')}</td>
                </tr>
              </table>
            </div>
            
            <div class="footer-section" style="margin-top: 25px;">
              <span>Malee House Document Reference: #${quotation.quotation_number}</span>
              <span>Page 1 of 2</span>
            </div>
          </div>
        </div>
        
        <!-- ==================== PAGE 2 ==================== -->
        <div class="page">
          <!-- Page 2 Content -->
          <div style="flex: 1; display: flex; flex-direction: column;">
            
            <!-- Brand Header Reference -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 20px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="brand-logo font-outfit" style="width: 28px; height: 28px; font-size: 15px; line-height: 28px;">M</div>
                <div>
                  <h2 class="font-outfit" style="font-size: 12px; font-weight: 800; text-transform: uppercase; margin: 0; color: #0f172a;">Malee House</h2>
                  <p class="font-outfit" style="font-size: 7px; font-weight: 700; color: #64748b; text-transform: uppercase; margin: 0; letter-spacing: 0.1em;">Proposal Appendix</p>
                </div>
              </div>
              <p style="font-size: 10px; color: #94a3b8; font-weight: 600; margin: 0;">Quote Ref: #${quotation.quotation_number}</p>
            </div>
            

            
            <!-- Privacy Statement -->
            <div style="border-top: 1px solid #f1f5f9; padding-top: 15px; margin-bottom: 20px;">
              <h3 class="font-outfit" style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px;">Privacy &amp; Data Security Policy</h3>
              <div style="font-size: 9px; color: #64748b; font-weight: 500; line-height: 1.5;">
                <p style="margin: 4px 0;"><span style="font-weight: 700; color: #334155;">• Data Security:</span> All surveyor drone imagery, CAD drafts, GIS maps, and site technical measurements are encrypted and saved securely within isolated local database nodes.</p>
                <p style="margin: 4px 0;"><span style="font-weight: 700; color: #334155;">• Strict Confidentiality:</span> Customer site boundaries, project parameters, client contact profiles, and financial transaction records are kept strictly confidential and will never be shared with third parties.</p>
              </div>
            </div>
            
            <!-- Notes -->
            <div style="border-top: 1px solid #f1f5f9; padding-top: 15px;">
              <h3 class="font-outfit" style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">Quotation Notes</h3>
              <div style="font-size: 9.5px; color: #475569; font-weight: 500; line-height: 1.5; padding-left: 8px; border-left: 2.5px solid #4f46e5; background-color: #fafafa; padding-top: 6px; padding-bottom: 6px;">
                ${(quotation.notes || 'Prices are valid for 30 days. 50% advance required for mobilization.').split('\n').map((p: string) => p.trim() ? `<p style="margin: 0 0 6px 0;">${p}</p>` : '').join('')}
                ${clauses && clauses.length > 0 ? clauses.map((c: any) => `<p style="margin: 0 0 6px 0;"><strong style="color: #1e293b; text-transform: uppercase;">${c.title || c.clause_title}:</strong> ${c.content || c.clause_content}</p>`).join('') : `
                  <p style="margin: 0 0 6px 0;"><strong style="color: #1e293b; text-transform: uppercase;">Validity:</strong> This quotation is valid for a period of 30 days from the date of issue.</p>
                  <p style="margin: 0 0 6px 0;"><strong style="color: #1e293b; text-transform: uppercase;">Payment Schedule:</strong> 50% mobilization advance is required for survey deployment. Balance 50% is due upon deliverable release.</p>
                `}
              </div>
            </div>
            
          </div>

          ${bankDetails ? `
          <div style="border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 15px;">
            <h3 class="font-outfit" style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">Payment Details</h3>
            <table style="width: 100%; font-size: 9px; color: #475569;">
              <tr>
                <td style="width: 120px; font-weight: 600;">Bank Name:</td>
                <td>${bankDetails.bank_name}</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">Account Name:</td>
                <td>${bankDetails.account_name}</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">Account Number:</td>
                <td style="font-family: monospace; font-weight: 600;">${bankDetails.account_number}</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">IFSC Code:</td>
                <td style="font-family: monospace; font-weight: 600;">${bankDetails.ifsc_code}</td>
              </tr>
            </table>
          </div>
          ` : ''}
          
          <!-- Prepared By & Signatures Section (Locked at bottom of Page 2) -->
          <div style="margin-top: auto; border-top: 1px solid #e2e8f0; padding-top: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
              
              <!-- Digitally Verified Shield Badge -->
              <div class="qr-badge">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 11 2 2 4-4"/>
                </svg>
                <div class="qr-text">
                  Digitally Verified<br/>
                  <span style="font-family: monospace; font-size: 7.5px; color: #047857; font-weight: 500;">ID: ${quotation.id?.slice(0, 12)}</span>
                </div>
              </div>
              
              <!-- Signature Lines -->
              <div style="display: flex; gap: 30px;">
                <div class="signature-box">
                  <div class="signature-line"></div>
                  <div class="signature-name font-outfit" style="font-size: 9px; font-weight: 600; color: #1e293b;">Accounts Dept</div>
                  <div class="signature-title" style="font-size: 7.5px; color: #94a3b8;">Malee House Survey</div>
                </div>
                <div class="signature-box">
                  <div class="signature-line"></div>
                  <div class="signature-name font-outfit" style="font-size: 9px; font-weight: 600; color: #1e293b;">Authorized Representative</div>
                  <div class="signature-title" style="font-size: 7.5px; color: #94a3b8;">Approved By Client</div>
                </div>
              </div>
              
            </div>
            
            <div class="footer-section" style="margin-top: 25px;">
              <span>Malee House Surveying OS &middot; Secure proposal record</span>
              <span>Page 2 of 2</span>
            </div>
          </div>
        </div>
        
        <script>
          // Wait for fonts and resources to fully load before printing
          function doPrint() {
            window.focus();
            window.print();
          }
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function() {
              setTimeout(doPrint, 400);
            });
          } else {
            window.onload = function() {
              setTimeout(doPrint, 600);
            };
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const generateInvoicePDF = (invoice: any, project: any, companySettings: any, bankDetails?: any) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    return;
  }

  const issueDate = new Date(invoice.created_at);
  const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const verifiedPayments = (invoice.payments || []).filter((p: any) => p.status === 'verified' || p.status === 'paid');
  const amountPaid = verifiedPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const totalAmount = Number(invoice.total_amount);
  const remainingAmount = Math.max(0, totalAmount - amountPaid);

  const projectBudget = Number(project?.budget) || 0;
  
  // Extract GST type from the active quotation (assuming the first one or the one with client_details)
  const gstType = project?.quotations?.[0]?.client_details?.gst_type || 'CGST_SGST';
  const projectPayments = project?.payments || [];
  const projectVerifiedPayments = projectPayments.filter((p: any) => p.status === 'verified' || p.status === 'paid');
  const projectAmountPaid = projectVerifiedPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const projectAmountRemaining = Math.max(0, projectBudget - projectAmountPaid);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice - ${invoice.invoice_number}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #f1f5f9; }
          @page { size: A4 portrait; margin: 0; }
          @media print {
            body { background-color: white !important; margin: 0; padding: 0; }
            .page-container { box-shadow: none !important; border: none !important; min-height: auto !important; margin: 0 !important; padding: 15mm !important; width: 100% !important; max-width: none !important; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body class="p-8 flex justify-center">
        <div class="page-container bg-white text-slate-800 shadow-2xl border border-slate-200/60 rounded-xl overflow-hidden flex flex-col p-10 relative w-full max-w-4xl min-h-[1050px] justify-between mx-auto">
           <div class="absolute top-4 right-4 text-[8px] text-slate-300 uppercase tracking-widest pointer-events-none select-none font-medium">Page 1 of 1</div>

           <div class="space-y-8 flex-1">
              <!-- Document Header with Full Malee House Details -->
              <div class="flex justify-between items-start border-b border-slate-100 pb-6">
                 <div class="space-y-4">
                    <div class="flex items-center gap-3">
                       <div class="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-lg font-bold italic">M</div>
                       <div class="space-y-0.5">
                          <h1 class="text-lg font-bold text-slate-900 tracking-tight uppercase leading-none">Malee House</h1>
                          <p class="text-[9px] text-indigo-600 font-semibold uppercase tracking-wider">Engineering & Survey Services</p>
                       </div>
                    </div>
                    
                    <div class="text-[11px] text-slate-500 leading-relaxed font-medium">
                       <p class="font-semibold text-slate-800">${companySettings?.name || 'Malee House Head Office'}</p>
                       <p>${companySettings?.address || '4th Floor, Alpha Block, Sigma Tech Park'}</p>
                       <p>${companySettings?.cityStateZip || 'Whitefield, Bangalore, Karnataka 560066'}</p>
                       <p class="text-[10px] mt-0.5 font-semibold text-indigo-600/80">GSTIN: ${companySettings?.gstin || '36AAAAA1111A1Z1'} | Tel: ${companySettings?.telephone || '+91 80 4987 6543'}</p>
                    </div>
                 </div>

                 <div class="text-right space-y-4">
                    <h1 class="text-3xl font-extrabold text-slate-200 uppercase tracking-tight leading-none">Invoice</h1>
                    
                    <div class="space-y-2 text-xs">
                       <div class="flex flex-col items-end">
                          <p class="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Invoice Number</p>
                          <p class="font-semibold text-slate-800 nums">#${invoice.invoice_number}</p>
                       </div>
                       <div class="flex flex-col items-end">
                          <p class="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Date Issued</p>
                          <p class="font-semibold text-slate-800">${formatDate(issueDate)}</p>
                       </div>
                       <div class="flex flex-col items-end">
                          <p class="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Due Date</p>
                          <p class="font-semibold text-slate-800">
                              ${dueDate ? formatDate(dueDate) : 'Upon Receipt'}
                          </p>
                       </div>
                    </div>
                 </div>
              </div>

              <!-- Client Bill To & Project info -->
              <div class="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200/50 text-slate-700">
                 <div>
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Client Bill To:</p>
                    <h2 class="text-sm font-semibold text-slate-800 leading-tight">${project?.client_name || 'Client Name'}</h2>
                    <p class="text-xs text-slate-500 font-medium mt-0.5">${project?.client_contact || 'Authorized project engagement'}</p>
                    ${project?.gst_number ? `<p class="text-[10px] text-slate-500 font-medium mt-1 uppercase font-semibold">GSTIN: ${project.gst_number}</p>` : ''}
                 </div>
                 <div>
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Assignment:</p>
                    <h2 class="text-sm font-semibold text-slate-800 leading-tight">${project?.name || 'Project Name'}</h2>
                    <p class="text-xs text-slate-500 font-medium mt-0.5">Location: ${project?.site_details?.address || 'Site Technical Survey'}</p>
                 </div>
              </div>

              <!-- Services Table -->
              <div class="space-y-4">
                 <table class="w-full border-collapse">
                    <thead>
                       <tr class="border-b border-slate-900 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          <th class="py-2.5 text-left w-12">#</th>
                          <th class="py-2.5 text-left">Service Description</th>
                          <th class="py-2.5 text-center w-20">Qty</th>
                          <th class="py-2.5 text-right w-36">Unit Price</th>
                          <th class="py-2.5 text-right w-36">Total</th>
                       </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-slate-700">
                       <tr class="align-top">
                          <td class="py-4 text-xs font-semibold text-slate-400">1</td>
                          <td class="py-4">
                             <p class="text-xs font-semibold text-slate-900 uppercase tracking-tight">Professional Services</p>
                             <p class="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-lg">As per project milestone agreement.</p>
                          </td>
                          <td class="py-4 text-center text-xs font-semibold text-slate-800">1</td>
                          <td class="py-4 text-right text-xs font-medium text-slate-800 nums">INR ${Number(invoice.amount).toLocaleString('en-IN')}</td>
                          <td class="py-4 text-right text-xs font-semibold text-slate-900 nums">INR ${Number(invoice.amount).toLocaleString('en-IN')}</td>
                       </tr>
                    </tbody>
                 </table>
              </div>
           </div>

           <!-- Totals and Bank Details panel located right below services -->
           <div class="border-t-2 border-double border-slate-900 pt-6 mt-8 flex justify-between items-start gap-8">
              <!-- Bank Details on the left -->
              <div class="flex-1 max-w-sm">
                 <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Payment Information</h3>
                 ${bankDetails ? `
                    <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2 text-[11px] text-slate-700 font-medium">
                       <div class="flex justify-between border-b border-slate-200 pb-1.5">
                          <span class="text-slate-500">Bank</span>
                          <span class="font-semibold text-slate-900">${bankDetails.bank_name}</span>
                       </div>
                       <div class="flex justify-between border-b border-slate-200 pb-1.5">
                          <span class="text-slate-500">Account Name</span>
                          <span class="font-semibold text-slate-900">${bankDetails.account_name}</span>
                       </div>
                       <div class="flex justify-between border-b border-slate-200 pb-1.5">
                          <span class="text-slate-500">Account No.</span>
                          <span class="font-mono font-semibold text-slate-900">${bankDetails.account_number}</span>
                       </div>
                       <div class="flex justify-between border-b border-slate-200 pb-1.5">
                          <span class="text-slate-500">IFSC Code</span>
                          <span class="font-mono font-semibold text-slate-900">${bankDetails.ifsc_code}</span>
                       </div>
                       <div class="flex justify-between">
                          <span class="text-slate-500">Branch</span>
                          <span class="font-semibold text-slate-900">${bankDetails.branch_name}</span>
                       </div>
                    </div>
                 ` : `
                    <div class="bg-amber-50 p-4 rounded-xl border border-amber-200/60 text-[11px] text-amber-700 font-medium flex items-center justify-center text-center">
                       No bank account selected for this invoice.
                    </div>
                 `}
              </div>

              <div class="w-full md:w-72 space-y-2.5">
                 <div class="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider nums">
                    <span>Subtotal</span>
                    <span>INR ${Number(invoice.amount).toLocaleString('en-IN')}</span>
                 </div>

                 ${(!gstType || gstType === 'CGST_SGST') && Number(invoice.gst_amount) > 0 ? `
                    <div class="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider nums">
                       <span>CGST (${Number(invoice.gst_rate) / 2}%)</span>
                       <span>INR ${(Number(invoice.gst_amount) / 2).toLocaleString('en-IN')}</span>
                    </div>
                    <div class="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider nums">
                       <span>SGST (${Number(invoice.gst_rate) / 2}%)</span>
                       <span>INR ${(Number(invoice.gst_amount) / 2).toLocaleString('en-IN')}</span>
                    </div>
                 ` : gstType === 'IGST' && Number(invoice.gst_amount) > 0 ? `
                    <div class="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider nums">
                       <span>IGST (${Number(invoice.gst_rate)}%)</span>
                       <span>INR ${Number(invoice.gst_amount).toLocaleString('en-IN')}</span>
                    </div>
                 ` : ''}

                 <div class="pt-3 border-t border-slate-200 flex justify-between items-end">
                    <p class="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Grand Total</p>
                    <p class="text-xl font-bold text-slate-900 tracking-tight nums">INR ${Number(invoice.total_amount).toLocaleString('en-IN')}</p>
                 </div>

                 <div class="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider nums pt-2 border-t border-slate-100">
                    <span>Amount Paid</span>
                    <span>INR ${amountPaid.toLocaleString('en-IN')}</span>
                 </div>

                 <div class="flex justify-between items-end p-2 rounded-lg ${remainingAmount > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}">
                    <p class="text-[11px] font-bold uppercase tracking-wider">Invoice Balance</p>
                    <p class="text-lg font-bold tracking-tight nums">INR ${remainingAmount.toLocaleString('en-IN')}</p>
                 </div>

                 <!-- Project Totals -->
                 ${projectBudget > 0 ? `
                   <div class="pt-4 mt-2 border-t border-slate-200">
                     <p class="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2">Project Financial Summary</p>
                     <div class="space-y-1.5">
                       <div class="flex justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider nums">
                          <span>Total Cost of Project</span>
                          <span>INR ${projectBudget.toLocaleString('en-IN')}</span>
                       </div>
                       <div class="flex justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider nums">
                          <span>Total Project Paid</span>
                          <span>INR ${projectAmountPaid.toLocaleString('en-IN')}</span>
                       </div>
                       <div class="flex justify-between text-[10px] font-semibold text-slate-600 uppercase tracking-wider nums bg-slate-100 p-1.5 rounded">
                          <span>Project Balance Remaining</span>
                          <span class="font-bold">INR ${projectAmountRemaining.toLocaleString('en-IN')}</span>
                       </div>
                     </div>
                   </div>
                 ` : ''}
              </div>
           </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(() => { window.print(); window.close(); }, 1200);
          };
        </script>
      </body>
    </html>
  `;
  
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

