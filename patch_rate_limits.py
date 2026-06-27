import os
import re

actions_to_patch = {
    'uploadFileToServerAction': 'storage.actions.ts',
    'registerFileAction': 'file.actions.ts',
    'createQuotationAction': 'quotation.actions.ts',
    'createInvoiceAction': 'finance.actions.ts',
    'logPaymentAction': 'finance.actions.ts',
    'createProjectAction': 'project.actions.ts',
    'createTaskAction': 'task.actions.ts',
    'createIssueAction': 'issue.actions.ts',
    'addProjectCommentAction': 'comment.actions.ts',
    'sendSystemBroadcastAction': 'broadcast.actions.ts',
    'globalSearchAction': 'search.actions.ts'
}

import_statement = "import { checkActionRateLimit } from '@/lib/rate-limit';\n"

for action, filename in actions_to_patch.items():
    filepath = os.path.join('src', 'actions', filename)
    if not os.path.exists(filepath):
        print(f"Skipping {filepath} - not found")
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if "checkActionRateLimit" not in content:
        # Add import after 'use server'
        content = re.sub(r"('use server';\n)", r"\1\n" + import_statement, content)
        
    # Find the function definition
    # Need to match export async function actionName(
    pattern = r'(export async function ' + action + r'\b[^\{]*\{)'
    
    # We need to insert the rate limit logic right after we resolve the user ID
    # This is tricky because different actions resolve user ID differently.
    # Usually `const profile: any = await getUserProfileAction();` 
    # followed by `if (!profile) return ...;`
    # Let's try to insert after `getUserProfileAction()` or `supabase.auth.getUser()`.
    
    match = re.search(pattern, content)
    if match:
        print(f"Found {action} in {filename}")
        
        # We need to find the user profile check inside this function
        func_start = match.end()
        # Find next occurrences of profile check
        profile_match = re.search(r'const profile: any = await getUserProfileAction\(\);\s+if \(!profile\) return \{[^\}]+\};', content[func_start:])
        if not profile_match:
            profile_match = re.search(r'const profile: any = await getUserProfileAction\(\);\s+if \(!profile \|\| !profile\.id\) return \{[^\}]+\};', content[func_start:])
        
        user_id_var = "profile.id"
        
        if not profile_match:
            # Maybe supabase.auth.getUser() ?
            profile_match = re.search(r'const \{ data: \{ user \} \} = await supabase\.auth\.getUser\(\);\s+if \(!user\) return \{[^\}]+\};', content[func_start:])
            user_id_var = "user.id"
            
        if profile_match:
            insert_pos = func_start + profile_match.end()
            rate_limit_code = f"""
    
    if (!checkActionRateLimit({user_id_var}, '{action}', 15, 60 * 1000)) {{
      return {{ success: false, error: 'Rate limit exceeded for this action. Please try again later.' }};
    }}
"""
            content = content[:insert_pos] + rate_limit_code + content[insert_pos:]
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Successfully patched {action}")
        else:
            print(f"Could not find auth check in {action}")

