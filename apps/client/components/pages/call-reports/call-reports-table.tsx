"use client";

import React from "react";
import { format } from "date-fns";
import {
  Phone,
  Clock,
  DollarSign,
  Eye,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause,
  Play,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { CallReport } from "@/lib/api/call-reports";

interface CallReportsTableProps {
  callReports: CallReport[];
  loading?: boolean;
  onViewDetails: (callId: string) => void;
  onViewTranscript: (callId: string) => void;
  onDownloadRecording: (callId: string) => void;
}

export function CallReportsTable({
  callReports,
  loading,
  onViewDetails,
  onViewTranscript,
  onDownloadRecording,
}: CallReportsTableProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
      case "no_answer":
      case "busy":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "voicemail":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "in_progress":
        return <Play className="h-4 w-4 text-blue-600" />;
      case "initiated":
        return <Pause className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "failed":
      case "no_answer":
      case "busy":
        return "bg-red-100 text-red-800 border-red-200";
      case "voicemail":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "initiated":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    // Format +1234567890 to +1 (234) 567-890
    if (phoneNumber.startsWith("+1") && phoneNumber.length === 12) {
      return `+1 (${phoneNumber.slice(2, 5)}) ${phoneNumber.slice(5, 8)}-${phoneNumber.slice(8)}`;
    }
    return phoneNumber;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Call Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-12 bg-gray-300 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Call Reports ({callReports.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {callReports.length === 0 ? (
          <div className="text-center py-8">
            <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No calls found</h3>
            <p className="text-gray-500">No calls match your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callReports.map((call) => (
                  <TableRow key={call.call_id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {formatPhoneNumber(call.to)}
                        </div>
                        {call.retell_llm_dynamic_variables?.Name && (
                          <div className="text-sm text-gray-500">
                            {call.retell_llm_dynamic_variables.Name}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          Attempt #{call.metadata.attempt_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1 w-fit ${getStatusColor(call.status)}`}
                      >
                        {getStatusIcon(call.status)}
                        {call.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {call.duration_seconds > 0 ? (
                          formatDuration(call.duration_seconds)
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        {formatCurrency(call.client_cost)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {format(new Date(call.createdAt), "MMM dd, yyyy")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(call.createdAt), "HH:mm")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {call.call_analysis.user_sentiment ? (
                        <Badge
                          variant="outline"
                          className={
                            call.call_analysis.user_sentiment.toLowerCase() === "positive"
                              ? "text-green-700 border-green-200 bg-green-50"
                              : call.call_analysis.user_sentiment.toLowerCase() === "negative"
                              ? "text-red-700 border-red-200 bg-red-50"
                              : "text-yellow-700 border-yellow-200 bg-yellow-50"
                          }
                        >
                          {call.call_analysis.user_sentiment}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewDetails(call.call_id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                          </Tooltip>

                          {call.transcript && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onViewTranscript(call.call_id)}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Transcript</TooltipContent>
                            </Tooltip>
                          )}

                          {call.metadata.recording_url && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDownloadRecording(call.call_id)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Download Recording</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}