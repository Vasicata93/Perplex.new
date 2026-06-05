import { connectorManager } from './ConnectorManager';
import { skillManager } from './SkillManager';
import { githubConnector } from './connectors/githubConnector';
import { vercelConnector } from './connectors/vercelConnector';
import { googleWorkspaceConnector } from './connectors/googleConnector';
import { searchGithubRepositoriesSkill } from './skills/githubSkills';
import { listVercelDeploymentsSkill } from './skills/vercelSkills';
import { searchGoogleDriveSkill } from './skills/googleSkills';

import { marketplaceConnectors } from './connectors/marketplaceConnectors';
import { marketplaceSkills } from './skills/marketplaceSkills';

export const initializeIntegrations = () => {
  // Register Connectors
  connectorManager.registerConnector(githubConnector);
  connectorManager.registerConnector(vercelConnector);
  connectorManager.registerConnector(googleWorkspaceConnector);
  
  marketplaceConnectors.forEach(c => connectorManager.registerConnector(c));
  
  // Register Skills
  skillManager.registerSkill(searchGithubRepositoriesSkill);
  skillManager.registerSkill(listVercelDeploymentsSkill);
  skillManager.registerSkill(searchGoogleDriveSkill);
  
  marketplaceSkills.forEach(s => skillManager.registerSkill(s));
  
  console.log('Integrations initialized.');
};
