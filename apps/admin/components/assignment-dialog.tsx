"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Search } from "lucide-react";
import api from "@/lib/axios";

interface Client {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  availableCredits: number;
}

interface AssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (phoneNumberId: string, clientId: string) => void;
  phoneNumber?: any;
}

export function AssignmentDialog({
  isOpen,
  onClose,
  onAssign,
  phoneNumber,
}: AssignmentDialogProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingClients, setFetchingClients] = useState(false);

  // Fetch active clients when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchClients();
      setSearchTerm("");
      setSelectedClient(null);
    }
  }, [isOpen]);

  // Filter clients based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(
        client =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  const fetchClients = async () => {
    try {
      setFetchingClients(true);
      const response = await api.get("/admin/clients?isActive=true&limit=50");
      const data = response.data;

      if (data.status === "success") {
        setClients(data.data.clients);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setFetchingClients(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedClient || !phoneNumber) return;

    setLoading(true);
    try {
      await onAssign(phoneNumber._id, selectedClient._id);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchTerm("");
    setSelectedClient(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Phone Number</DialogTitle>
          <DialogDescription>
            Assign {phoneNumber?.phone_number} to a client
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search Clients</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Client</Label>
            {fetchingClients ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <span className="ml-2">Loading clients...</span>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto border rounded-md">
                {filteredClients.length > 0 ? (
                  <div className="space-y-1 p-2">
                    {filteredClients.map((client) => (
                      <div
                        key={client._id}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          selectedClient?._id === client._id
                            ? "bg-blue-100 border-2 border-blue-500"
                            : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                        }`}
                        onClick={() => setSelectedClient(client)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{client.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {client.email}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">
                              Credits: {Math.floor(client.availableCredits / 60)}h {client.availableCredits % 60}m
                            </div>
                            <div className={`text-xs ${client.isActive ? "text-green-600" : "text-red-600"}`}>
                              {client.isActive ? "Active" : "Inactive"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground">
                      {searchTerm ? "No clients found matching your search" : "No active clients available"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedClient && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Selected Client:</h4>
              <div className="text-sm">
                <div><strong>Name:</strong> {selectedClient.name}</div>
                <div><strong>Email:</strong> {selectedClient.email}</div>
                <div><strong>Available Credits:</strong> {Math.floor(selectedClient.availableCredits / 60)}h {selectedClient.availableCredits % 60}m</div>
                <div><strong>Status:</strong> {selectedClient.isActive ? "Active" : "Inactive"}</div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedClient || loading || !selectedClient.isActive}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Assigning...
              </>
            ) : (
              "Assign Number"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}