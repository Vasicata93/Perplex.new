import { ISkill } from '../../../types/integration';
import { connectorManager } from '../ConnectorManager';

export const searchGoogleDriveSkill: ISkill = {
  id: 'search_google_drive',
  name: 'search_google_drive',
  description: 'Search for files in Google Drive.',
  icon: 'google',
  isActive: true,
  requiredConnectors: ['google_workspace'],
  
  schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query for Google Drive files.'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of files to return (default 5)'
      }
    },
    required: ['query']
  },
  
  execute: async (params: { query: string; limit?: number }) => {
    const creds = await connectorManager.getCredentials('google_workspace');
    const token = creds?.accessToken || creds?.apiKey;
    if (!token) {
      throw new Error('Google Workspace credentials not found. Please authenticate.');
    }

    const limit = params.limit || 5;

    // Return dummy data if using a simulated token
    if (token.startsWith('simulated_token_')) {
      console.log('Using simulated Google token, returning mock data.');
      return Array.from({ length: limit }, (_, i) => ({
        id: `gdrive_file_${i}_simulated`,
        name: params.query ? `simulated-${params.query}-doc-${i}` : `simulated-doc-${i}`,
        type: 'application/vnd.google-apps.document',
        url: `https://docs.google.com/document/d/simulated_id_${i}/edit`
      }));
    }

    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(params.query)}&pageSize=${limit}&fields=files(id,name,mimeType,webViewLink)`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      type: file.mimeType,
      url: file.webViewLink
    }));
  }
};
