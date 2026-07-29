import { createAdminClient } from '../src/lib/supabase/admin';
import { insertNotification } from '../src/actions/notification.actions';

async function main() {
  const supabase = createAdminClient();
  const { data: accountants, error } = await supabase.from('profiles').select('id').eq('role', 'accountant');
  if (error || !accountants || accountants.length === 0) {
    console.error('No accountants found', error);
    return;
  }

  const { data: project } = await supabase.from('projects').select('id, name').limit(1).single() as { data: any };

  for (const acc of (accountants as { id: string }[])) {
    console.log('Inserting notification for accountant:', acc.id);
    await insertNotification({
      userId: acc.id,
      title: 'Payment Received',
      message: `Final payment for "${project?.name || 'Test Project'}" has been recorded (Test).`,
      type: 'system',
      relatedProjectId: project?.id,
    });
  }
  console.log('Done!');
}

main();
