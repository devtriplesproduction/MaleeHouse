const fs = require('fs');

let code = fs.readFileSync('src/components/modules/SalarySlipPreviewDialog.tsx', 'utf8');

// 1. Add onRefreshUrl to props
if (!code.includes('onRefreshUrl?: () => Promise<string | null>;')) {
  code = code.replace(
    /pdfUrl\?: string \| null;/,
    `pdfUrl?: string | null;\n  onRefreshUrl?: () => Promise<string | null>;`
  );
}

// 2. Add it to the component signature
code = code.replace(
  /export function SalarySlipPreviewDialog\(\{ open, onOpenChange, employeeName, pdfUrl \}: SalarySlipPreviewDialogProps\) \{/,
  `export function SalarySlipPreviewDialog({ open, onOpenChange, employeeName, pdfUrl, onRefreshUrl }: SalarySlipPreviewDialogProps) {`
);

// 3. Add states and effect
if (!code.includes('const [currentUrl, setCurrentUrl] = useState<string | null>(null);')) {
  const logic = `
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const initUrl = async () => {
      if (!open || !pdfUrl) {
        if (isMounted) {
          setCurrentUrl(null);
          setError(null);
        }
        return;
      }
      
      let expired = false;
      try {
        const urlObj = new URL(pdfUrl);
        const token = urlObj.searchParams.get('token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            expired = true;
          }
        }
      } catch (e) {}

      if (expired && onRefreshUrl) {
        setLoading(true);
        setError(null);
        try {
          const newUrl = await onRefreshUrl();
          if (isMounted) {
            if (newUrl) {
              setCurrentUrl(newUrl);
            } else {
              setError("Failed to regenerate salary slip URL.");
            }
          }
        } catch (err) {
          if (isMounted) setError("Failed to regenerate salary slip URL.");
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        if (isMounted) {
          setCurrentUrl(pdfUrl);
          setError(null);
        }
      }
    };
    initUrl();
    return () => { isMounted = false; };
  }, [open, pdfUrl, onRefreshUrl]);
`;
  code = code.replace(/const \[zoom, setZoom\] = useState\(1\);/, logic + '\n  const [zoom, setZoom] = useState(1);');
}

// 4. Update the iframe renderer to use currentUrl and handle loading/error states
code = code.replace(
  /\{pdfUrl \? \([\s\S]*?<div \n\s*style=\{\{ transform: `scale\(\$\{zoom\}\)`,[\s\S]*?<iframe \n\s*src=\{pdfUrl\} \n\s*className="w-full h-full border-0 min-h-\[800px\]" \n\s*title="Salary Slip Preview"\n\s*\/>\n\s*<\/div>\n\s*\) : \(\n\s*<div className="flex items-center justify-center h-full text-slate-500">\n\s*No salary slip available\.\n\s*<\/div>\n\s*\)\}/m,
  `{loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500 mb-4"></div>
              <p>Refreshing secure URL...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500 font-medium">
              {error}
            </div>
          ) : currentUrl ? (
            <div 
              style={{ transform: \`scale(\${zoom})\`, transformOrigin: 'top center', transition: 'transform 0.2s' }}
              className="bg-white shadow-xl rounded-sm max-w-full h-full flex items-center justify-center min-w-[600px] overflow-hidden"
            >
              <iframe 
                src={currentUrl} 
                className="w-full h-full border-0 min-h-[800px]" 
                title="Salary Slip Preview"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              No salary slip available.
            </div>
          )}`
);

// 5. Update actions in header to use currentUrl
code = code.replace(/disabled=\{!pdfUrl\}/g, `disabled={!currentUrl || loading}`);
code = code.replace(/if \(pdfUrl\) \{/g, `if (currentUrl) {`);
code = code.replace(/const printWin = window\.open\(pdfUrl, '_blank'\);/g, `const printWin = window.open(currentUrl, '_blank');`);
code = code.replace(/link\.href = pdfUrl;/g, `link.href = currentUrl;`);


fs.writeFileSync('src/components/modules/SalarySlipPreviewDialog.tsx', code);
console.log('Patch SalarySlipPreviewDialog.tsx complete.');
