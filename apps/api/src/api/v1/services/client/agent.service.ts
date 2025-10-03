import Agent from "../../../../models/agent.model";
import Campaign from "../../../../models/campaign.model";
import AppError from "../../../../utils/AppError";
import agentManagementService, { RetellAgentDetails, RetellLLMDetails } from "../admin/agent-management.service";

class ClientAgentService {
  async getAssignedAgents(clientId: string) {
    try {
      // Get agents assigned to this client
      const agents = await Agent.find({
        assignedClientId: clientId
      }).sort({ assignedAt: -1 });

      // Get campaigns that use each agent to filter out already used agents
      const campaignAgents = await Campaign.find({
        clientId,
        agent_id: { $exists: true, $ne: null }
      }, { agent_id: 1 });

      const usedAgentIds = new Set(campaignAgents.map(c => c.agent_id));

      // Filter out agents that are already used in campaigns
      const availableAgents = agents.filter(agent => !usedAgentIds.has(agent.agentId));

      return availableAgents.map(agent => ({
        _id: agent._id,
        agentId: agent.agentId,
        agentName: agent.agentName,
        slug: agent.slug,
        assignedAt: agent.assignedAt,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt
      }));
    } catch (error) {
      throw new AppError("Failed to fetch assigned agents", 500);
    }
  }

  async getAgentWithLLM(clientId: string, agentId: string): Promise<{
    agent: any;
    agentDetails: RetellAgentDetails;
    llmDetails?: RetellLLMDetails;
  }> {
    try {
      // First check if this agent is assigned to the client
      const agent = await Agent.findOne({
        agentId,
        assignedClientId: clientId
      });

      if (!agent) {
        throw new AppError("Agent not found or not assigned to this client", 404);
      }

      // Get agent details from Retell
      const { agentDetails, llmDetails } = await agentManagementService.getRetellAgentDetails(agentId);

      return {
        agent: {
          _id: agent._id,
          agentId: agent.agentId,
          agentName: agent.agentName,
          slug: agent.slug,
          assignedAt: agent.assignedAt,
          createdAt: agent.createdAt,
          updatedAt: agent.updatedAt
        },
        agentDetails,
        llmDetails
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to fetch agent details", 500);
    }
  }
}

export default new ClientAgentService();