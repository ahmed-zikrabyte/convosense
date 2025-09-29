"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { RefreshCw, Users } from "lucide-react";
import api from "@/lib/axios";

interface Client {
  _id: string;
  name: string;
  email: string;
}

interface Agent {
  _id: string;
  agentId: string;
  agentName: string;
  slug: string;
}

interface AssignAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (agentId: string, clientId: string) => Promise<void>;
  agent: Agent | null;
  loading: boolean;
}

export function AssignAgentModal({
  isOpen,
  onClose,
  onSubmit,
  agent,
  loading,
}: AssignAgentModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [fetchingClients, setFetchingClients] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedClientId("");
    setError("");
  }, [isOpen, agent]);

  const fetchClients = async () => {
    try {
      setFetchingClients(true);
      const response = await api.get("/admin/clients?limit=100");
      if (response.data.status === "success") {
        setClients(response.data.data.clients);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError("Failed to fetch clients");
    } finally {
      setFetchingClients(false);
    }
  };

  const handleSubmit = async () => {
    if (!agent) {
      setError("No agent selected");
      return;
    }

    if (!selectedClientId) {
      setError("Please select a client");
      return;
    }

    try {
      await onSubmit(agent._id, selectedClientId);
      handleClose();
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to assign agent");
    }
  };

  const handleClose = () => {
    setSelectedClientId("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Assign Agent to Client</span>
          </DialogTitle>
          <DialogDescription>
            Assign the selected agent to a client. The agent can only be assigned to one client at a time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {agent && (
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm font-medium">{agent.agentName}</div>
              <div className="text-xs text-muted-foreground">
                ID: {agent.agentId}
              </div>
              <div className="text-xs text-muted-foreground">
                Slug: {agent.slug}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="client">Select Client</Label>
            {fetchingClients ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Loading clients...</span>
              </div>
            ) : (
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client to assign" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client._id} value={client._id}>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {client.email}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {clients.length === 0 && !fetchingClients && (
            <div className="p-3 bg-muted/50 border rounded-md">
              <p className="text-sm text-muted-foreground">
                No clients available. Please create a client first.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedClientId || fetchingClients}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Assign Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}