"use client";

import React, {useState, useEffect} from "react";
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
import {Badge} from "@workspace/ui/components/badge";
import {Button} from "@workspace/ui/components/button";
import {Input} from "@workspace/ui/components/input";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import {formatDistanceToNow} from "date-fns";
import {ClientForm} from "@/components/client-form";
import api from "@/lib/axios";

interface Client {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  credits_total_minutes: number;
  credits_reserved_minutes: number;
  credits_consumed_minutes: number;
  availableCredits: number;
  billing_rate: number;
  createdAt: string;
  updatedAt: string;
}

interface ClientFilters {
  search: string;
  isActive?: boolean;
  minCredits?: number;
  maxCredits?: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ClientFilters>({
    search: "",
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch clients
  const fetchClients = async (page = 1) => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (filters.search) queryParams.append("search", filters.search);
      if (filters.isActive !== undefined)
        queryParams.append("isActive", filters.isActive.toString());
      if (filters.minCredits !== undefined)
        queryParams.append("minCredits", filters.minCredits.toString());
      if (filters.maxCredits !== undefined)
        queryParams.append("maxCredits", filters.maxCredits.toString());

      const response = await api.get(`/admin/clients?${queryParams}`);
      const data = response.data;

      if (data.status === "success") {
        setClients(data.data.clients);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchClients();
  }, []);

  // Search and filter effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchClients(1);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [filters]);

  const handleToggleStatus = async (
    clientId: string,
    currentStatus: boolean
  ) => {
    try {
      await api.patch(`/admin/clients/${clientId}/status`, {
        isActive: !currentStatus
      });

      fetchClients(pagination.currentPage);
    } catch (error) {
      console.error("Error toggling client status:", error);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      await api.delete(`/admin/clients/${clientId}`);

      fetchClients(pagination.currentPage);
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedClients.length === 0) return;

    try {
      let body: any = {
        clientIds: selectedClients,
        operation: action,
      };

      if (action === "addCredits") {
        const minutes = prompt("Enter minutes to add:");
        if (!minutes || Number(minutes) <= 0) return;
        body.value = Number(minutes);
      }

      await api.post("/admin/clients/bulk", body);

      setSelectedClients([]);
      fetchClients(pagination.currentPage);
    } catch (error) {
      console.error("Error performing bulk action:", error);
    }
  };

  const formatCredits = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleCreateClient = async (formData: any) => {
    try {
      setFormLoading(true);
      await api.post("/admin/clients", formData);

      setShowClientForm(false);
      fetchClients(pagination.currentPage);
    } catch (error) {
      console.error("Error creating client:", error);
      alert("Error creating client");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClient = async (formData: any) => {
    if (!editingClient) return;

    try {
      setFormLoading(true);
      await api.patch(
        `/admin/clients/${editingClient._id}`,
        formData
      );

      setShowClientForm(false);
      setEditingClient(null);
      fetchClients(pagination.currentPage);
    } catch (error) {
      console.error("Error updating client:", error);
      alert("Error updating client");
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormClose = () => {
    setShowClientForm(false);
    setEditingClient(null);
  };

  const openCreateForm = () => {
    setEditingClient(null);
    setShowClientForm(true);
  };

  const openEditForm = (client: Client) => {
    setEditingClient(client);
    setShowClientForm(true);
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Client Management
          </h2>
          <p className="text-muted-foreground">
            Manage your clients, credits, and account settings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => fetchClients(pagination.currentPage)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clients</CardTitle>
              <CardDescription>
                {pagination.totalCount} clients total
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({...filters, search: e.target.value})
                  }
                  className="pl-8 w-[250px]"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 p-4 border rounded-lg bg-muted/50">
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={
                    filters.isActive === undefined
                      ? ""
                      : filters.isActive.toString()
                  }
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      isActive:
                        e.target.value === ""
                          ? undefined
                          : e.target.value === "true",
                    })
                  }
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Min Credits
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minCredits || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      minCredits: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Max Credits
                </label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={filters.maxCredits || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      maxCredits: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => setFilters({search: ""})}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          {selectedClients.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm">
                {selectedClients.length} client(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("activate")}
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("deactivate")}
                >
                  <UserX className="h-4 w-4 mr-1" />
                  Deactivate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("addCredits")}
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Add Credits
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkAction("delete")}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading clients...</span>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <input
                        type="checkbox"
                        checked={
                          clients.length > 0 &&
                          selectedClients.length === clients.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClients(clients.map((c) => c._id));
                          } else {
                            setSelectedClients([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Billing Rate</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client._id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedClients.includes(client._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClients([
                                ...selectedClients,
                                client._id,
                              ]);
                            } else {
                              setSelectedClients(
                                selectedClients.filter(
                                  (id) => id !== client._id
                                )
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {client.email}
                          </div>
                          {client.phone && (
                            <div className="text-xs text-muted-foreground">
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={client.isActive ? "success" : "destructive"}
                        >
                          {client.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            Available: {formatCredits(client.availableCredits)}
                          </div>
                          <div className="text-muted-foreground">
                            Total: {formatCredits(client.credits_total_minutes)}
                          </div>
                          <div className="text-muted-foreground">
                            Used:{" "}
                            {formatCredits(client.credits_consumed_minutes)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>${client.billing_rate}/min</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(client.createdAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleToggleStatus(client._id, client.isActive)
                            }
                          >
                            {client.isActive ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditForm(client)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClient(client._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {clients.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No clients found. Try adjusting your filters.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {clients.length} of {pagination.totalCount} clients
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchClients(pagination.currentPage - 1)}
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
                    onClick={() => fetchClients(pagination.currentPage + 1)}
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

      <ClientForm
        isOpen={showClientForm}
        onClose={handleFormClose}
        onSubmit={editingClient ? handleEditClient : handleCreateClient}
        client={editingClient}
        mode={editingClient ? "edit" : "create"}
        loading={formLoading}
      />
    </div>
  );
}
