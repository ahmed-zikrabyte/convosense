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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Plus,
  Search,
  Filter,
  Phone,
  UserCheck,
  UserX,
  Link,
  Unlink,
  Trash2,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PhoneNumberForm } from "@/components/phone-number-form";
import { AssignmentDialog } from "@/components/assignment-dialog";
import api from "@/lib/axios";

interface PhoneNumber {
  _id: string;
  phone_number: string;
  provider: "retell" | "twilio" | "manual";
  assigned_client_id?: {
    _id: string;
    name: string;
    email: string;
  };
  type: "local" | "toll_free" | "international";
  imported: boolean;
  is_active: boolean;
  metadata: {
    country_code?: string;
    region?: string;
    capabilities?: string[];
    monthly_cost?: number;
    setup_cost?: number;
  };
  assigned_at?: string;
  purchased_at: string;
  isAvailable: boolean;
}

interface PhoneNumberFilters {
  search: string;
  provider?: string;
  type?: string;
  isActive?: boolean;
  assigned?: boolean;
  country?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function PhoneNumbersPage() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PhoneNumberFilters>({
    search: "",
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [selectedPhoneNumbers, setSelectedPhoneNumbers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [editingPhone, setEditingPhone] = useState<PhoneNumber | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigningPhone, setAssigningPhone] = useState<PhoneNumber | null>(
    null
  );
  const [dialog, setDialog] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // Fetch phone numbers
  const fetchPhoneNumbers = async (page = 1) => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        sortBy: "purchased_at",
        sortOrder: "desc",
      });

      if (filters.search) queryParams.append("search", filters.search);
      if (filters.provider) queryParams.append("provider", filters.provider);
      if (filters.type) queryParams.append("type", filters.type);
      if (filters.isActive !== undefined)
        queryParams.append("isActive", filters.isActive.toString());
      if (filters.assigned !== undefined)
        queryParams.append("assigned", filters.assigned.toString());
      if (filters.country) queryParams.append("country", filters.country);

      const response = await api.get(`/admin/phone-numbers?${queryParams}`);
      const data = response.data;

      if (data.status === "success") {
        setPhoneNumbers(data.data.phoneNumbers);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching phone numbers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

  // Search and filter effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchPhoneNumbers(1);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [filters]);

  const handleToggleStatus = async (
    phoneNumberId: string,
    currentStatus: boolean
  ) => {
    try {
      await api.patch(`/admin/phone-numbers/${phoneNumberId}`, {
        is_active: !currentStatus,
      });

      fetchPhoneNumbers(pagination.currentPage);
    } catch (error) {
      console.error("Error toggling phone number status:", error);
    }
  };

  const handleUnassignPhone = async (phoneNumberId: string) => {
    try {
      await api.post(`/admin/phone-numbers/${phoneNumberId}/unassign`);

      fetchPhoneNumbers(pagination.currentPage);
    } catch (error) {
      console.error("Error unassigning phone number:", error);
    }
  };

  const handleDeletePhone = (phoneNumberId: string) => {
    setDialog({
      title: "Are you sure you want to delete this phone number?",
      description: "This action cannot be undone.",
      onConfirm: async () => {
        try {
          await api.delete(`/admin/phone-numbers/${phoneNumberId}`);
          fetchPhoneNumbers(pagination.currentPage);
        } catch (error) {
          console.error("Error deleting phone number:", error);
        }
      },
    });
  };

  const handleBulkAction = async (action: string, clientId?: string) => {
    if (selectedPhoneNumbers.length === 0) return;

    try {
      const body: any = {
        phoneNumberIds: selectedPhoneNumbers,
        operation: action,
      };

      if (action === "assign" && clientId) {
        body.clientId = clientId;
      }

      await api.post("/admin/phone-numbers/bulk", body);

      setSelectedPhoneNumbers([]);
      fetchPhoneNumbers(pagination.currentPage);
    } catch (error) {
      console.error("Error performing bulk action:", error);
    }
  };

  const handleBulkDelete = () => {
    if (selectedPhoneNumbers.length === 0) return;
    setDialog({
      title: `Are you sure you want to delete ${selectedPhoneNumbers.length} phone numbers?`,
      description: "This action cannot be undone.",
      onConfirm: () => handleBulkAction("delete"),
    });
  };

  const handleCreatePhone = async (formData: any) => {
    try {
      setFormLoading(true);
      await api.post("/admin/phone-numbers", formData);

      setShowPhoneForm(false);
      fetchPhoneNumbers(pagination.currentPage);
    } catch (error) {
      console.error("Error creating phone number:", error);
      alert("Error creating phone number");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditPhone = async (formData: any) => {
    if (!editingPhone) return;

    try {
      setFormLoading(true);
      await api.patch(`/admin/phone-numbers/${editingPhone._id}`, formData);

      setShowPhoneForm(false);
      setEditingPhone(null);
      fetchPhoneNumbers(pagination.currentPage);
    } catch (error) {
      console.error("Error updating phone number:", error);
      alert("Error updating phone number");
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormClose = () => {
    setShowPhoneForm(false);
    setEditingPhone(null);
  };

  const openCreateForm = () => {
    setEditingPhone(null);
    setShowPhoneForm(true);
  };

  const openEditForm = (phone: PhoneNumber) => {
    setEditingPhone(phone);
    setShowPhoneForm(true);
  };

  const openAssignDialog = (phone: PhoneNumber) => {
    setAssigningPhone(phone);
    setShowAssignDialog(true);
  };

  const handleAssignment = async (phoneNumberId: string, clientId: string) => {
    try {
      await api.post(`/admin/phone-numbers/${phoneNumberId}/assign`, {
        clientId,
      });

      setShowAssignDialog(false);
      setAssigningPhone(null);
      fetchPhoneNumbers(pagination.currentPage);
    } catch (error) {
      console.error("Error assigning phone number:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getProviderBadgeVariant = (provider: string) => {
    switch (provider) {
      case "retell":
        return "default";
      case "twilio":
        return "secondary";
      case "manual":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Phone Number Management
          </h2>
          <p className="text-muted-foreground">
            Manage your phone number inventory and client assignments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => fetchPhoneNumbers(pagination.currentPage)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={openCreateForm}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Purchase Number
          </Button>
          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add Number
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Phone Numbers</CardTitle>
              <CardDescription>
                {pagination.totalCount} phone numbers total
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search phone numbers..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4 p-4 border rounded-lg bg-muted/50">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Provider
                </label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={filters.provider || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      provider: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">All</option>
                  <option value="retell">Retell</option>
                  <option value="twilio">Twilio</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Type</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={filters.type || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      type: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">All</option>
                  <option value="local">Local</option>
                  <option value="toll_free">Toll Free</option>
                  <option value="international">International</option>
                </select>
              </div>
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
                  Assignment
                </label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={
                    filters.assigned === undefined
                      ? ""
                      : filters.assigned.toString()
                  }
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      assigned:
                        e.target.value === ""
                          ? undefined
                          : e.target.value === "true",
                    })
                  }
                >
                  <option value="">All</option>
                  <option value="true">Assigned</option>
                  <option value="false">Available</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => setFilters({ search: "" })}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          {selectedPhoneNumbers.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm">
                {selectedPhoneNumbers.length} phone number(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("activate")}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("deactivate")}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Deactivate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("unassign")}
                >
                  <Unlink className="h-4 w-4 mr-1" />
                  Unassign
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
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
              <span className="ml-2">Loading phone numbers...</span>
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
                          phoneNumbers.length > 0 &&
                          selectedPhoneNumbers.length === phoneNumbers.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPhoneNumbers(
                              phoneNumbers.map((p) => p._id)
                            );
                          } else {
                            setSelectedPhoneNumbers([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Purchased</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {phoneNumbers.map((phone) => (
                    <TableRow key={phone._id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedPhoneNumbers.includes(phone._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPhoneNumbers([
                                ...selectedPhoneNumbers,
                                phone._id,
                              ]);
                            } else {
                              setSelectedPhoneNumbers(
                                selectedPhoneNumbers.filter(
                                  (id) => id !== phone._id
                                )
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{phone.phone_number}</div>
                        {phone?.metadata?.region && (
                          <div className="text-xs text-muted-foreground">
                            {phone?.metadata?.region}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getProviderBadgeVariant(phone?.provider)}
                        >
                          {phone?.provider}
                        </Badge>
                        {phone?.imported && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Imported
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {phone?.type?.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={phone?.is_active ? "success" : "destructive"}
                        >
                          {phone?.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {phone?.assigned_client_id ? (
                          <div>
                            <div className="font-medium text-sm">
                              {phone?.assigned_client_id?.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {phone?.assigned_client_id?.email}
                            </div>
                            {phone?.assigned_at && (
                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(
                                  new Date(phone?.assigned_at),
                                  {
                                    addSuffix: true,
                                  }
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline">Available</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {phone?.metadata?.setup_cost && (
                            <div>
                              Setup:{" "}
                              {formatCurrency(phone?.metadata?.setup_cost)}
                            </div>
                          )}
                          {phone?.metadata?.monthly_cost && (
                            <div className="text-muted-foreground">
                              Monthly:{" "}
                              {formatCurrency(phone?.metadata?.monthly_cost)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {phone?.purchased_at &&
                          formatDistanceToNow(new Date(phone?.purchased_at), {
                            addSuffix: true,
                          })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleToggleStatus(phone._id, phone.is_active)
                            }
                          >
                            {phone.is_active ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                          {phone.assigned_client_id ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnassignPhone(phone._id)}
                            >
                              <Unlink className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAssignDialog(phone)}
                              disabled={!phone.is_active}
                            >
                              <Link className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePhone(phone._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {phoneNumbers.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No phone numbers found. Try adjusting your filters.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {phoneNumbers.length} of {pagination.totalCount} phone
                  numbers
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      fetchPhoneNumbers(pagination.currentPage - 1)
                    }
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
                    onClick={() =>
                      fetchPhoneNumbers(pagination.currentPage + 1)
                    }
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

      <PhoneNumberForm
        isOpen={showPhoneForm}
        onClose={handleFormClose}
        onSubmit={editingPhone ? handleEditPhone : handleCreatePhone}
        phoneNumber={editingPhone}
        mode={editingPhone ? "edit" : "create"}
        loading={formLoading}
      />

      <AssignmentDialog
        isOpen={showAssignDialog}
        onClose={() => {
          setShowAssignDialog(false);
          setAssigningPhone(null);
        }}
        onAssign={handleAssignment}
        phoneNumber={assigningPhone}
      />
      <AlertDialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialog?.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialog?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                dialog?.onConfirm();
                setDialog(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
