import { Integration, IntegrationStatus } from "./types";

// Mock integration data - replace with actual API calls
export const mockIntegrations: Integration[] = [
  {
    id: 1,
    name: "Project Management Integration",
    description: "Connect your project management tools",
    image: "/app/dashboard/_integrations/images/integration-card-1.png",
    connected: false,
    category: "Project Management",
    provider: "Asana",
  },
  {
    id: 2,
    name: "Document Management System",
    description: "Sync documents across platforms",
    image: "/app/dashboard/_integrations/images/integration-card-2.svg",
    connected: true,
    category: "Document Management",
    provider: "Google Drive",
    lastSync: "2024-01-15T10:30:00Z",
  },
];

export class IntegrationService {
  static async getIntegrations(): Promise<Integration[]> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockIntegrations);
      }, 500);
    });
  }

  static async connectIntegration(id: number): Promise<Integration> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const integration = mockIntegrations.find((i) => i.id === id);
        if (integration) {
          integration.connected = true;
          integration.lastSync = new Date().toISOString();
          resolve(integration);
        }
        throw new Error("Integration not found");
      }, 1000);
    });
  }

  static async disconnectIntegration(id: number): Promise<Integration> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const integration = mockIntegrations.find((i) => i.id === id);
        if (integration) {
          integration.connected = false;
          integration.lastSync = undefined;
          resolve(integration);
        }
        throw new Error("Integration not found");
      }, 1000);
    });
  }

  static async getIntegrationStatus(): Promise<IntegrationStatus> {
    const integrations = await this.getIntegrations();
    return {
      total: integrations.length,
      connected: integrations.filter((i) => i.connected).length,
      disconnected: integrations.filter((i) => !i.connected).length,
    };
  }
}
