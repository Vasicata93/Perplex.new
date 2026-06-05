import { ISkill } from '../../../types/integration';
import { connectorManager } from '../ConnectorManager';

export const listVercelDeploymentsSkill: ISkill = {
  id: 'list_vercel_deployments',
  name: 'list_vercel_deployments',
  description: 'List recent deployments from Vercel for a specific project or all projects.',
  icon: 'vercel',
  isActive: true,
  requiredConnectors: ['vercel'],
  
  schema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of deployments to return (default 5, max 20)'
      },
      projectId: {
        type: 'string',
        description: 'Optional. Filter deployments by a specific Vercel Project ID.'
      }
    }
  },
  
  execute: async (params: { limit?: number; projectId?: string }) => {
    const creds = await connectorManager.getCredentials('vercel');
    if (!creds || !creds.apiKey) {
      throw new Error('Vercel credentials not found.');
    }

    const limit = params.limit || 5;

    // Return dummy data if using a simulated token
    if (creds.apiKey.startsWith('simulated_token_')) {
      console.log('Using simulated Vercel token, returning mock data.');
      return Array.from({ length: limit }, (_, i) => ({
        uid: `dep_${i}_simulated`,
        name: params.projectId ? `project-${params.projectId}` : `demo-project-${i}`,
        url: `https://demo-project-${i}.vercel.app`,
        state: i === 0 ? 'READY' : 'BUILDING',
        creator: 'demo_user',
        createdAt: new Date(Date.now() - i * 3600000).toISOString()
      }));
    }

    let url = `https://api.vercel.com/v6/deployments?limit=${limit}`;
    if (params.projectId) {
      url += `&projectId=${params.projectId}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${creds.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.deployments.map((dep: any) => ({
      uid: dep.uid,
      name: dep.name,
      url: dep.url,
      state: dep.state,
      creator: dep.creator?.username,
      createdAt: new Date(dep.createdAt).toISOString()
    }));
  }
};
