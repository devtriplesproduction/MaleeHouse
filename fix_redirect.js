const fs = require('fs');
const path = 'src/components/auth/LoginForm.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('isRedirectError')) {
  code = code.replace(
    /import \{ useRouter \} from "next\/navigation";/,
    'import { useRouter } from "next/navigation";\nimport { isRedirectError } from "next/dist/client/components/redirect";'
  );
  
  code = code.replace(
    /if \(err\.message === 'NEXT_REDIRECT'\) \{/,
    'if (err.message === \'NEXT_REDIRECT\' || isRedirectError(err)) {'
  );
  
  fs.writeFileSync(path, code);
}
