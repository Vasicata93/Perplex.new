import { IConnector } from '../../../types/integration';
import { connectorManager } from '../ConnectorManager';

export const vercelConnector: IConnector = {
  id: 'vercel',
  name: 'Vercel',
  description: 'Connect to Vercel to manage deployments, projects, and domains.',
  icon: 'vercel',
  authType: 'oauth2', // Changed to oauth2 for seamless flow
  status: 'disconnected',
  
  connect: async () => {
    return true;
  },
  
  disconnect: async () => {
    await connectorManager.disconnect('vercel');
    return true;
  },
  
  checkStatus: async () => {
    const creds = await connectorManager.getCredentials('vercel');
    return creds?.apiKey ? 'connected' : 'disconnected';
  }
};
