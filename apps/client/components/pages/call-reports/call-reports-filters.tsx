"use client";

import React, { useState } from "react";
import { Search, Filter, Calendar, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { CallReportsFilters } from "@/lib/api/call-reports";

interface CallReportsFiltersProps {
  filters: CallReportsFilters;
  onFiltersChange: (filters: CallReportsFilters) => void;
  campaigns?: Array<{ campaignId: string; name: string }>;
  showCampaignFilter?: boolean;
}

export function CallReportsFiltersComponent({
  filters,
  onFiltersChange,
  campaigns = [],
  showCampaignFilter = true,
}: CallReportsFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<CallReportsFilters>(filters);

  const handleFilterChange = (key: keyof CallReportsFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value, page: 1 };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilter = (key: keyof CallReportsFilters) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];
    newFilters.page = 1;
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const newFilters = { page: 1, limit: filters.limit };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.campaign_id) count++;
    if (filters.status) count++;
    if (filters.start_date) count++;
    if (filters.end_date) count++;
    if (filters.search) count++;
    return count;
  };

  const statusOptions = [
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
    { value: "no_answer", label: "No Answer" },
    { value: "busy", label: "Busy" },
    { value: "voicemail", label: "Voicemail" },
    { value: "in_progress", label: "In Progress" },
    { value: "initiated", label: "Initiated" },
  ];

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Quick search and expand button */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by phone number, transcript, or summary..."
                value={localFilters.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="shrink-0"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Active filters badges */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.campaign_id && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Campaign: {campaigns.find(c => c.campaignId === filters.campaign_id)?.name || filters.campaign_id}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => clearFilter("campaign_id")}
                  />
                </Badge>
              )}
              {filters.status && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Status: {statusOptions.find(s => s.value === filters.status)?.label || filters.status}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => clearFilter("status")}
                  />
                </Badge>
              )}
              {filters.start_date && (
                <Badge variant="outline" className="flex items-center gap-1">
                  From: {new Date(filters.start_date).toLocaleDateString()}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => clearFilter("start_date")}
                  />
                </Badge>
              )}
              {filters.end_date && (
                <Badge variant="outline" className="flex items-center gap-1">
                  To: {new Date(filters.end_date).toLocaleDateString()}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => clearFilter("end_date")}
                  />
                </Badge>
              )}
              {filters.search && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Search: "{filters.search}"
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => clearFilter("search")}
                  />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear all
              </Button>
            </div>
          )}

          {/* Expanded filters */}
          {isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              {showCampaignFilter && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Campaign</label>
                  <Select
                    value={localFilters.campaign_id || ""}
                    onValueChange={(value) => handleFilterChange("campaign_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All campaigns" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All campaigns</SelectItem>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.campaignId} value={campaign.campaignId}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={localFilters.status || ""}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="date"
                    value={localFilters.start_date || ""}
                    onChange={(e) => handleFilterChange("start_date", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="date"
                    value={localFilters.end_date || ""}
                    onChange={(e) => handleFilterChange("end_date", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}