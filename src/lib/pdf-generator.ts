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

export const generateQuotationPDF = (quotation: any, project: any, companySettings: any) => {
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
  const discountPercentage = quotation.discount_percentage || 0;
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
      <div style="font-size: 9.5px; color: #64748b; line-height: 1.4; padding-left: 10px; border-left: 2px solid #e2e8f0;">
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
            height: 297mm;
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
          
          .page:last-child {
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
              height: 297mm;
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
                <tr>
                  <td class="totals-label">GST (18%)</td>
                  <td class="totals-val">INR ${(quotation.gst_amount ?? 0).toLocaleString('en-IN')}</td>
                </tr>
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
            
            <!-- Appendix clauses -->
            ${clauses.length > 0 ? `
              <div style="margin-bottom: 20px;">
                <h3 class="font-outfit" style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px;">Contractual Terms &amp; Clauses</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  ${clausesHtml}
                </div>
              </div>
            ` : `
              <div style="margin-bottom: 20px;">
                <h3 class="font-outfit" style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px;">Contractual Terms &amp; Clauses</h3>
                <div style="font-size: 9.5px; color: #64748b; line-height: 1.5;">
                  <p><strong>1. Validity:</strong> This quotation is valid for a period of 30 days from the date of issue.</p>
                  <p><strong>2. Payment Schedule:</strong> 50% mobilization advance is required for survey deployment. Balance 50% is due upon deliverable release.</p>
                </div>
              </div>
            `}
            
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
                ${quotation.terms || 'Prices are valid for 30 days. 50% advance required for mobilization.'}
              </div>
            </div>
            
          </div>
          
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
