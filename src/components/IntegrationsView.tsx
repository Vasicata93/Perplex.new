import React, { useState } from 'react';
import { useIntegrationStore } from '../store/integrationStore';
import { connectorManager } from '../services/integration/ConnectorManager';
import { Plug, Key, CheckCircle, XCircle, Search, Github, Triangle, Mail } from 'lucide-react';

export const IntegrationsView: React.FC = () => {
  const { connectors, skills, toggleSkill } = useIntegrationStore();
  const [activeTab, setActiveTab] = useState<'connectors' | 'skills'>('connectors');
  const [editingConnector, setEditingConnector] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');

  const handleConnect = async (connectorId: string) => {
    const connector = connectors[connectorId];
    if (connector.authType === 'api_key') {
      setEditingConnector(connectorId);
      setApiKeyInput('');
    } else {
      // Handle OAuth or other types
      await connector.connect();
    }
  };

  const handleSaveApiKey = async () => {
    if (editingConnector && apiKeyInput) {
      await connectorManager.saveCredentials({
        connectorId: editingConnector,
        apiKey: apiKeyInput
      });
      setEditingConnector(null);
    }
  };

  const handleDisconnect = async (connectorId: string) => {
    await connectorManager.disconnect(connectorId);
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'github': return <Github className="w-5 h-5" />;
      case 'vercel': return <Triangle className="w-5 h-5" />;
      case 'google': return <Mail className="w-5 h-5" />;
      case 'search': return <Search className="w-5 h-5" />;
      default: return <Plug className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-pplx-primary text-pplx-text overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-pplx-border shrink-0">
        <h1 className="text-2xl font-serif font-medium text-pplx-text mb-1">Integrations & Skills</h1>
        <p className="text-sm text-pplx-muted">
          Connect external services and enable skills for your AI agent.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-pplx-border px-4 md:px-6 shrink-0 overflow-x-auto no-scrollbar">
        <button
          className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'connectors'
              ? 'border-pplx-accent text-pplx-accent'
              : 'border-transparent text-pplx-muted hover:text-pplx-text'
          }`}
          onClick={() => setActiveTab('connectors')}
        >
          Connectors
        </button>
        <button
          className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'skills'
              ? 'border-pplx-accent text-pplx-accent'
              : 'border-transparent text-pplx-muted hover:text-pplx-text'
          }`}
          onClick={() => setActiveTab('skills')}
        >
          Skills
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'connectors' && (
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {Object.values(connectors).map((connector) => (
              <div key={connector.id} className="border border-pplx-border rounded-2xl p-5 bg-pplx-sidebar flex flex-col transition-all hover:border-pplx-border/80">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-pplx-hover text-pplx-text rounded-xl shadow-sm">
                    {renderIcon(connector.icon)}
                  </div>
                  {connector.status === 'connected' ? (
                    <span className="flex items-center text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      <CheckCircle className="w-3 h-3 mr-1.5" /> Connected
                    </span>
                  ) : (
                    <span className="flex items-center text-[11px] font-bold text-pplx-muted bg-pplx-hover px-2.5 py-1 rounded-full uppercase tracking-wider">
                      <XCircle className="w-3 h-3 mr-1.5" /> Disconnected
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-medium text-pplx-text mb-1">{connector.name}</h3>
                <p className="text-sm text-pplx-muted mb-6 flex-1 leading-relaxed">
                  {connector.description}
                </p>

                {editingConnector === connector.id ? (
                  <div className="mt-auto space-y-3">
                    <input
                      type="password"
                      placeholder="Enter API Key"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      className="w-full px-3 py-2.5 bg-pplx-primary border border-pplx-border rounded-xl text-sm text-pplx-text focus:outline-none focus:border-pplx-accent placeholder-pplx-muted transition-colors"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveApiKey}
                        className="flex-1 bg-pplx-accent hover:opacity-90 text-white px-3 py-2.5 rounded-xl text-sm font-medium transition-opacity"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingConnector(null)}
                        className="flex-1 bg-pplx-hover hover:bg-pplx-border text-pplx-text px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto">
                    {connector.status === 'connected' ? (
                      <button
                        onClick={() => handleDisconnect(connector.id)}
                        className="w-full py-2.5 px-4 border border-pplx-border text-pplx-text hover:bg-pplx-hover rounded-xl text-sm font-medium transition-colors"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(connector.id)}
                        className="w-full py-2.5 px-4 bg-pplx-text text-pplx-primary hover:opacity-90 rounded-xl text-sm font-medium transition-opacity flex items-center justify-center gap-2"
                      >
                        <Key className="w-4 h-4" /> Connect
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-4 max-w-4xl">
            {Object.values(skills).map((skill) => {
              const missingConnectors = skill.requiredConnectors.filter(
                (connId) => connectors[connId]?.status !== 'connected'
              );
              
              return (
                <div key={skill.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 border border-pplx-border rounded-2xl bg-pplx-sidebar gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="p-2.5 bg-pplx-hover text-pplx-text rounded-xl shadow-sm mt-0.5 shrink-0">
                      {renderIcon(skill.icon)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-medium text-pplx-text flex flex-wrap items-center gap-2">
                        {skill.name}
                        {missingConnectors.length > 0 && (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Requires: {missingConnectors.map(id => connectors[id]?.name || id).join(', ')}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-pplx-muted mt-1 leading-relaxed">
                        {skill.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="sm:ml-4 flex-shrink-0 self-end sm:self-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={skill.isActive}
                        onChange={(e) => toggleSkill(skill.id, e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-pplx-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pplx-accent"></div>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
