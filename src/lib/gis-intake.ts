import { z } from 'zod';

export const GIS_TEMPLATES = {
  direct: 'gis_direct_client',
  vendor_needs_prototype: 'gis_vendor_prototype_first',
  vendor_ready: 'gis_vendor_ready',
} as const;

export function resolveGisWorkflowTemplate(input: {
  channel?: 'direct' | 'vendor';
  vendor_intake?: 'needs_prototype' | 'survey_and_prototype_ready' | null;
}): string {
  if (input.channel === 'vendor' && input.vendor_intake === 'survey_and_prototype_ready') {
    return GIS_TEMPLATES.vendor_ready;
  }
  if (input.channel === 'vendor') {
    return GIS_TEMPLATES.vendor_needs_prototype;
  }
  return GIS_TEMPLATES.direct;
}

export function isGisWorkflowTemplate(template?: string | null): boolean {
  return !!template && template.startsWith('gis_');
}
