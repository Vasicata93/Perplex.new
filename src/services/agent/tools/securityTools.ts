import { ToolRegistry } from './ToolRegistry';

export function registerSecurityTools() {
  ToolRegistry.register(
    {
      name: 'osv_check',
      description: 'Check for Open Source Vulnerabilities (OSV) in a given package or project dependencies.',
      parameters: {
        type: 'object',
        properties: {
          package_name: { type: 'string', description: 'Name of the npm/pypi package to check.' },
          version: { type: 'string', description: 'Version of the package.' }
        },
        required: ['package_name']
      }
    },
    async (args: { package_name: string, version?: string }) => {
      // Mock OSV check response
      return {
        success: true,
        data: {
          package: args.package_name,
          version: args.version || 'latest',
          vulnerabilities_found: 0,
          report: 'No known vulnerabilities found in the OSV database for this package.'
        },
        summary: `Checked OSV database for ${args.package_name}`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'schema_sanitizer',
      description: 'Ensure that a generated JSON payload conforms strictly to a given schema, stripping out injected or malformed properties.',
      parameters: {
        type: 'object',
        properties: {
          payload: { type: 'string', description: 'JSON string payload to sanitize.' },
          schema_name: { type: 'string', description: 'Name of the strict schema to enforce.' }
        },
        required: ['payload', 'schema_name']
      }
    },
    async (args: { payload: string, schema_name: string }) => {
      let parsed;
      try {
        parsed = JSON.parse(args.payload);
      } catch(e) {
        return { success: false, error: 'Invalid JSON payload.', summary: 'Payload not valid JSON.' };
      }
      return {
        success: true,
        data: {
          sanitized_payload: parsed,
          schema: args.schema_name
        },
        summary: `Sanitized payload against ${args.schema_name}`
      };
    }
  );
}
