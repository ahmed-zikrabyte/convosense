"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Plus,
  Search,
  Bot,
  RefreshCw,
  Trash2,
  Eye,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "@/lib/axios";
import { AddAgentModal } from "@/components/add-agent-modal";

interface Agent {
  _id: string;
  agentId: string;
  agentName: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

interface AgentFilters {
  search: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AgentFilters>({
    search: "",
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchAgents = async (page = 1) => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (filters.search) queryParams.append("search", filters.search);

      const response = await api.get(`/admin/agents?${queryParams}`);
      const data = response.data;

      if (data.status === "success") {
        setAgents(data.data.agents);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchAgents(1);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [filters]);

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;

    try {
      await api.delete(`/admin/agents/${agentId}`);
      fetchAgents(pagination.currentPage);
    } catch (error) {
      console.error("Error deleting agent:", error);
    }
  };

  const handleAddAgent = async (agentData: { agentId: string; agentName: string }) => {
    try {
      setModalLoading(true);
      await api.post("/admin/agents", agentData);
      setShowAddModal(false);
      fetchAgents(pagination.currentPage);
    } catch (error) {
      console.error("Error creating agent:", error);
      throw error;
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Agent Management
          </h2>
          <p className="text-muted-foreground">
            Manage your AI agents and their configurations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => fetchAgents(pagination.currentPage)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Agent
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Agents</CardTitle>
              <CardDescription>
                {pagination.totalCount} agents total
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-8 w-[250px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading agents...</span>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Agent ID</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent._id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Bot className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{agent.agentName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {agent.agentId}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{agent.slug}</Badge>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(agent.createdAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.location.href = `/agents/${agent._id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteAgent(agent._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {agents.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No agents found. Add your first agent to get started.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {agents.length} of {pagination.totalCount} agents
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchAgents(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchAgents(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AddAgentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddAgent}
        loading={modalLoading}
      />
    </div>
  );
}