// API del panel de control: /api/cms
import { getStore } from '@netlify/blobs';
import { createHandler } from '../lib/handler.mjs';
import { SITE } from '../lib/site.mjs';

const env = (name) => globalThis.Netlify?.env?.get(name) ?? process.env[name];

export default async (req, context) => {
  const store = getStore({ name: 'cms', consistency: 'strong' });
  return createHandler({ store, env, site: SITE })(req, context);
};

export const config = { path: '/api/cms' };
