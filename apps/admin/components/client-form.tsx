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

interface ClientFormData {
  name: string;
  email: string;
  password?: string;
  phone: string;
  address: string;
  credits_total_minutes: number;
  billing_rate: number;
  isActive: boolean;
}

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClientFormData) => void;
  client?: any; // For editing existing client
  mode: "create" | "edit";
  loading?: boolean;
}

export function ClientForm({
  isOpen,
  onClose,
  onSubmit,
  client,
  mode,
  loading = false,
}: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    credits_total_minutes: 0,
    billing_rate: 0.10,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or client changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && client) {
        setFormData({
          name: client.name || "",
          email: client.email || "",
          phone: client.phone || "",
          address: client.address || "",
          credits_total_minutes: client.credits_total_minutes || 0,
          billing_rate: client.billing_rate || 0.10,
          isActive: client.isActive !== false,
        });
      } else {
        setFormData({
          name: "",
          email: "",
          password: "",
          phone: "",
          address: "",
          credits_total_minutes: 0,
          billing_rate: 0.10,
          isActive: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, client]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (mode === "create" && !formData.password?.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.credits_total_minutes < 0) {
      newErrors.credits_total_minutes = "Credits cannot be negative";
    }

    if (formData.billing_rate < 0) {
      newErrors.billing_rate = "Billing rate cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = { ...formData };

    // Don't send password if it's empty during edit
    if (mode === "edit" && !submitData.password) {
      delete submitData.password;
    }

    onSubmit(submitData);
  };

  const handleInputChange = (field: keyof ClientFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field if it exists
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Client" : "Edit Client"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new client account with initial credit allocation."
              : "Update client information and credit settings."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter client name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          </div>

          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password || ""}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Enter password (min 6 characters)"
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>
          )}

          {mode === "edit" && (
            <div className="space-y-2">
              <Label htmlFor="password">Password (leave empty to keep current)</Label>
              <Input
                id="password"
                type="password"
                value={formData.password || ""}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing_rate">Billing Rate ($/min)</Label>
              <Input
                id="billing_rate"
                type="number"
                step="0.01"
                min="0"
                value={formData.billing_rate}
                onChange={(e) => handleInputChange("billing_rate", Number(e.target.value))}
                className={errors.billing_rate ? "border-red-500" : ""}
              />
              {errors.billing_rate && (
                <p className="text-sm text-red-500">{errors.billing_rate}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credits">Credits (minutes)</Label>
              <Input
                id="credits"
                type="number"
                min="0"
                value={formData.credits_total_minutes}
                onChange={(e) => handleInputChange("credits_total_minutes", Number(e.target.value))}
                className={errors.credits_total_minutes ? "border-red-500" : ""}
              />
              {errors.credits_total_minutes && (
                <p className="text-sm text-red-500">{errors.credits_total_minutes}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Initial credit allocation in minutes
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <select
                id="isActive"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.isActive.toString()}
                onChange={(e) => handleInputChange("isActive", e.target.value === "true")}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : (
                mode === "create" ? "Create Client" : "Update Client"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}