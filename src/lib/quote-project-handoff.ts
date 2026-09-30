/** Session handoff so Quote → create works even if server project fetch fails. */

const key = (projectId: string) => `mh_quote_create_${projectId}`;

export function stashQuoteProject(project: {
  id: string;
  name?: string;
  client_name?: string;
  client_contact?: string;
  services?: string[];
  site_type?: string;
  plot_area?: string;
  survey_requirements?: string;
  status?: string;
  gst_number?: string;
}) {
  if (typeof window === 'undefined' || !project?.id) return;
  try {
    sessionStorage.setItem(
      key(project.id),
      JSON.stringify({
        id: project.id,
        name: project.name || '',
        client_name: project.client_name || '',
        client_contact: project.client_contact || '',
        services: project.services || [],
        site_type: project.site_type || '',
        plot_area: project.plot_area || '',
        survey_requirements: project.survey_requirements || '',
        status: project.status || '',
        gst_number: project.gst_number || '',
      })
    );
  } catch {
    // ignore quota / private mode
  }
}

export function peekQuoteProject(projectId: string): any | null {
  if (typeof window === 'undefined' || !projectId) return null;
  try {
    const raw = sessionStorage.getItem(key(projectId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
