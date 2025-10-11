"use client";

import React, {useState} from "react";
import {format} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {Badge} from "@workspace/ui/components/badge";
import {Button} from "@workspace/ui/components/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {ScrollArea} from "@workspace/ui/components/scroll-area";
import {
  Phone,
  Clock,
  DollarSign,
  User,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
} from "lucide-react";
import {CallReport} from "@/lib/api/call-reports";
import {useCallReportDetail} from "@/lib/hooks/use-call-reports";
import {callReportsAPI} from "@/lib/api/call-reports";

interface CallDetailModalProps {
  callId: string | null;
  open: boolean;
  onClose: () => void;
}

export function CallDetailModal({callId, open, onClose}: CallDetailModalProps) {
  const {callReport, loading} = useCallReportDetail(callId || "");
  const [transcriptData, setTranscriptData] = useState<any>(null);
  const [recordingData, setRecordingData] = useState<any>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [loadingRecording, setLoadingRecording] = useState(false);

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
    if (phoneNumber.startsWith("+1") && phoneNumber.length === 12) {
      return `+1 (${phoneNumber.slice(2, 5)}) ${phoneNumber.slice(5, 8)}-${phoneNumber.slice(8)}`;
    }
    return phoneNumber;
  };

  const loadTranscript = async () => {
    if (!callId || transcriptData) return;

    try {
      setLoadingTranscript(true);
      const data = await callReportsAPI.getCallTranscript(callId);
      setTranscriptData(data);
    } catch (error) {
      console.error("Failed to load transcript:", error);
    } finally {
      setLoadingTranscript(false);
    }
  };

  const loadRecording = async () => {
    if (!callId || recordingData) return;

    try {
      setLoadingRecording(true);
      const data = await callReportsAPI.getCallRecording(callId);
      setRecordingData(data);
    } catch (error) {
      console.error("Failed to load recording:", error);
    } finally {
      setLoadingRecording(false);
    }
  };

  const downloadRecording = (url: string, type: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `call-${callId}-${type}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!callReport && !loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : callReport ? (
          <Tabs defaultValue="overview" className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transcript" onClick={loadTranscript}>
                Transcript
              </TabsTrigger>
              <TabsTrigger value="recording" onClick={loadRecording}>
                Recording
              </TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[calc(90vh-200px)] mt-4">
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Call Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1 ${getStatusColor(callReport.status)}`}
                        >
                          {getStatusIcon(callReport.status)}
                          {callReport.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">To:</span>
                        <span className="text-sm">
                          {formatPhoneNumber(callReport.to)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">From:</span>
                        <span className="text-sm">
                          {formatPhoneNumber(callReport.from)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Duration:</span>
                        <span className="text-sm flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {callReport.duration_seconds > 0
                            ? formatDuration(callReport.duration_seconds)
                            : "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Cost:</span>
                        <span className="text-sm flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(callReport.client_cost)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Attempt:</span>
                        <span className="text-sm">
                          #{callReport.metadata.attempt_number}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Timing */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Timing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Initiated:</span>
                        <span className="text-sm">
                          {format(
                            new Date(callReport.createdAt),
                            "MMM dd, yyyy HH:mm:ss"
                          )}
                        </span>
                      </div>

                      {callReport.start_ts && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Started:</span>
                          <span className="text-sm">
                            {format(
                              new Date(callReport.start_ts),
                              "MMM dd, yyyy HH:mm:ss"
                            )}
                          </span>
                        </div>
                      )}

                      {callReport.end_ts && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Ended:</span>
                          <span className="text-sm">
                            {format(
                              new Date(callReport.end_ts),
                              "MMM dd, yyyy HH:mm:ss"
                            )}
                          </span>
                        </div>
                      )}

                      {callReport.metadata.disconnect_reason && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Disconnect Reason:
                          </span>
                          <span className="text-sm">
                            {callReport.metadata.disconnect_reason}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Dynamic Variables */}
                {callReport.retell_llm_dynamic_variables &&
                  Object.keys(callReport.retell_llm_dynamic_variables).length >
                    0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Contact Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(
                            callReport.retell_llm_dynamic_variables
                          ).map(([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm font-medium">
                                {key}:
                              </span>
                              <span className="text-sm">{value as string}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </TabsContent>

              <TabsContent value="transcript" className="space-y-4">
                {loadingTranscript ? (
                  <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : transcriptData ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Call Transcript
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {transcriptData.transcript ? (
                        <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm">
                          {transcriptData.transcript}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">
                          No transcript available for this call.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex justify-center items-center p-8">
                    <p className="text-gray-500">Click to load transcript</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recording" className="space-y-4">
                {loadingRecording ? (
                  <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : recordingData ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Call Recording
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {recordingData.recording_url ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium">
                              Standard Recording
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                downloadRecording(
                                  recordingData.recording_url,
                                  "standard"
                                )
                              }
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>

                          {recordingData.recording_multi_channel_url && (
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium">
                                Multi-Channel Recording
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  downloadRecording(
                                    recordingData.recording_multi_channel_url,
                                    "multi-channel"
                                  )
                                }
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">
                          No recording available for this call.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex justify-center items-center p-8">
                    <p className="text-gray-500">
                      Click to load recording information
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analysis" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Call Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {callReport.call_analysis.user_sentiment && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Sentiment:</span>
                        <Badge
                          variant="outline"
                          className={
                            callReport.call_analysis.user_sentiment.toLowerCase() ===
                            "positive"
                              ? "text-green-700 border-green-200 bg-green-50"
                              : callReport.call_analysis.user_sentiment.toLowerCase() ===
                                  "negative"
                                ? "text-red-700 border-red-200 bg-red-50"
                                : "text-yellow-700 border-yellow-200 bg-yellow-50"
                          }
                        >
                          {callReport.call_analysis.user_sentiment}
                        </Badge>
                      </div>
                    )}

                    {callReport.call_analysis.call_successful !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Successful:</span>
                        <Badge
                          variant={
                            callReport.call_analysis.call_successful
                              ? "default"
                              : "secondary"
                          }
                        >
                          {callReport.call_analysis.call_successful
                            ? "Yes"
                            : "No"}
                        </Badge>
                      </div>
                    )}

                    {callReport.call_analysis.in_voicemail !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Voicemail:</span>
                        <Badge
                          variant={
                            callReport.call_analysis.in_voicemail
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {callReport.call_analysis.in_voicemail ? "Yes" : "No"}
                        </Badge>
                      </div>
                    )}

                    {callReport.call_analysis.summary && (
                      <div>
                        <span className="text-sm font-medium block mb-2">
                          Summary:
                        </span>
                        <div className="bg-gray-50 p-4 rounded-lg text-sm">
                          {callReport.call_analysis.summary}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
