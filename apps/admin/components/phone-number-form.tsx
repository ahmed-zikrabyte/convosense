"use client";

import React, {useState, useEffect} from "react";
import {Button} from "@workspace/ui/components/button";
import {Input} from "@workspace/ui/components/input";
import {Label} from "@workspace/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";

interface PhoneNumberFormData {
  phone_number: string;
  provider: "retell" | "twilio" | "manual";
  type: "local" | "toll_free" | "international";
  imported: boolean;
  metadata: {
    country_code?: string;
    region?: string;
    capabilities?: string[];
    monthly_cost?: number;
    setup_cost?: number;
  };
}

interface PhoneNumberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PhoneNumberFormData) => void;
  phoneNumber?: any;
  mode: "create" | "edit";
  loading?: boolean;
}

export function PhoneNumberForm({
  isOpen,
  onClose,
  onSubmit,
  phoneNumber,
  mode,
  loading = false,
}: PhoneNumberFormProps) {
  const [formData, setFormData] = useState<PhoneNumberFormData>({
    phone_number: "",
    provider: "manual",
    type: "local",
    imported: false,
    metadata: {
      capabilities: ["voice"],
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or phoneNumber changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && phoneNumber) {
        setFormData({
          phone_number: phoneNumber.phone_number || "",
          provider: phoneNumber.provider || "manual",
          type: phoneNumber.type || "local",
          imported: phoneNumber.imported || false,
          metadata: {
            country_code: phoneNumber.metadata?.country_code || "",
            region: phoneNumber.metadata?.region || "",
            capabilities: phoneNumber.metadata?.capabilities || ["voice"],
            monthly_cost: phoneNumber.metadata?.monthly_cost || undefined,
            setup_cost: phoneNumber.metadata?.setup_cost || undefined,
          },
        });
      } else {
        setFormData({
          phone_number: "",
          provider: "manual",
          type: "local",
          imported: false,
          metadata: {
            capabilities: ["voice"],
          },
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, phoneNumber]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Phone number validation (E.164 format)
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    } else if (!/^\+[1-9]\d{1,14}$/.test(formData.phone_number)) {
      newErrors.phone_number =
        "Phone number must be in E.164 format (+1234567890)";
    }

    if (!formData.provider) {
      newErrors.provider = "Provider is required";
    }

    if (!formData.type) {
      newErrors.type = "Type is required";
    }

    if (
      formData.metadata.country_code &&
      !/^[A-Z]{2}$/.test(formData.metadata.country_code)
    ) {
      newErrors.country_code =
        "Country code must be 2 uppercase letters (e.g., US, UK)";
    }

    if (
      formData.metadata.monthly_cost !== undefined &&
      formData.metadata.monthly_cost < 0
    ) {
      newErrors.monthly_cost = "Monthly cost cannot be negative";
    }

    if (
      formData.metadata.setup_cost !== undefined &&
      formData.metadata.setup_cost < 0
    ) {
      newErrors.setup_cost = "Setup cost cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Clean up metadata - remove empty values
    const cleanedMetadata = {
      ...formData.metadata,
      country_code: formData.metadata.country_code?.toUpperCase() || undefined,
      monthly_cost: formData.metadata.monthly_cost || undefined,
      setup_cost: formData.metadata.setup_cost || undefined,
    };

    // Remove undefined values
    Object.keys(cleanedMetadata).forEach((key) => {
      if (
        cleanedMetadata[key as keyof typeof cleanedMetadata] === undefined ||
        cleanedMetadata[key as keyof typeof cleanedMetadata] === ""
      ) {
        delete cleanedMetadata[key as keyof typeof cleanedMetadata];
      }
    });

    const submitData = {
      ...formData,
      metadata: cleanedMetadata,
    };

    onSubmit(submitData);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith("metadata.")) {
      const metadataField = field.replace("metadata.", "");
      setFormData((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metadataField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCapabilityChange = (capability: string, checked: boolean) => {
    const currentCapabilities = formData.metadata.capabilities || [];
    let newCapabilities;

    if (checked) {
      newCapabilities = [...currentCapabilities, capability];
    } else {
      newCapabilities = currentCapabilities.filter((cap) => cap !== capability);
    }

    handleInputChange("metadata.capabilities", newCapabilities);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Phone Number" : "Edit Phone Number"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new phone number to your inventory."
              : "Update phone number information and settings."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number *</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) =>
                  handleInputChange("phone_number", e.target.value)
                }
                placeholder="+1234567890"
                className={errors.phone_number ? "border-red-500" : ""}
                disabled={mode === "edit"} // Don't allow changing the number when editing
              />
              {errors.phone_number && (
                <p className="text-sm text-red-500">{errors.phone_number}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be in E.164 format (e.g., +1234567890)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Provider *</Label>
              <select
                id="provider"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.provider}
                onChange={(e) => handleInputChange("provider", e.target.value)}
              >
                <option value="retell">Retell</option>
                <option value="twilio">Twilio</option>
                <option value="manual">Manual</option>
              </select>
              {errors.provider && (
                <p className="text-sm text-red-500">{errors.provider}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <select
                id="type"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
              >
                <option value="local">Local</option>
                <option value="toll_free">Toll Free</option>
                <option value="international">International</option>
              </select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="country_code">Country Code</Label>
              <Input
                id="country_code"
                value={formData.metadata.country_code || ""}
                onChange={(e) =>
                  handleInputChange("metadata.country_code", e.target.value)
                }
                placeholder="US"
                maxLength={2}
                className={errors.country_code ? "border-red-500" : ""}
              />
              {errors.country_code && (
                <p className="text-sm text-red-500">{errors.country_code}</p>
              )}
              <p className="text-xs text-muted-foreground">
                2-letter code (US, UK, etc.)
              </p>
            </div>
            <div className="space-y-2">
              <Label>
                <input
                  type="checkbox"
                  checked={formData.imported}
                  onChange={(e) =>
                    handleInputChange("imported", e.target.checked)
                  }
                  className="mr-2"
                />
                Imported Number
              </Label>
              <p className="text-xs text-muted-foreground">
                Check if this number was imported from another system
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              value={formData.metadata.region || ""}
              onChange={(e) =>
                handleInputChange("metadata.region", e.target.value)
              }
              placeholder="New York, California, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="setup_cost">Setup Cost ($)</Label>
              <Input
                id="setup_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.metadata.setup_cost || ""}
                onChange={(e) =>
                  handleInputChange(
                    "metadata.setup_cost",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className={errors.setup_cost ? "border-red-500" : ""}
              />
              {errors.setup_cost && (
                <p className="text-sm text-red-500">{errors.setup_cost}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly_cost">Monthly Cost ($)</Label>
              <Input
                id="monthly_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.metadata.monthly_cost || ""}
                onChange={(e) =>
                  handleInputChange(
                    "metadata.monthly_cost",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className={errors.monthly_cost ? "border-red-500" : ""}
              />
              {errors.monthly_cost && (
                <p className="text-sm text-red-500">{errors.monthly_cost}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Capabilities</Label>
            <div className="flex flex-wrap gap-4">
              {["voice", "sms", "mms", "fax"].map((capability) => (
                <Label key={capability} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(formData.metadata.capabilities || []).includes(
                      capability
                    )}
                    onChange={(e) =>
                      handleCapabilityChange(capability, e.target.checked)
                    }
                    className="mr-2"
                  />
                  {capability.toUpperCase()}
                </Label>
              ))}
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
                  {mode === "create" ? "Adding..." : "Updating..."}
                </>
              ) : mode === "create" ? (
                "Add Phone Number"
              ) : (
                "Update Phone Number"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
