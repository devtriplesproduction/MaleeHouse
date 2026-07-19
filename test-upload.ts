require('dotenv').config({ path: '.env.local' });
const { createElement } = require('react');
const { renderToBuffer } = require('@react-pdf/renderer');
const { SalarySlipPDF } = require('./src/components/pdf/SalarySlipPDF');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testPdf() {
  try {
    const pdfElement = createElement(SalarySlipPDF, {
      employeeName: "Test Employee",
      designation: "Test Designation",
      month: 7,
      year: 2026,
      grossSalary: 5000,
      totalDeductions: 1000,
      netPayable: 4000
    });
    const pdfBuffer = await renderToBuffer(pdfElement);
    
    console.log("Uploading buffer...");
    const { data, error } = await supabase.storage.from('salary_slips').upload('test_buffer.pdf', pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    });
    
    if (error) {
      console.error("Upload error:", error);
    } else {
      console.log("Upload success:", data);
    }
  } catch (e) {
    console.error("Error generating PDF:", e);
  }
}
testPdf();
