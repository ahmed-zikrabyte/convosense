"use client";

import React from "react";
import {
  Card,
  CardContent,
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
import {Button} from "@workspace/ui/components/button";
import {Badge} from "@workspace/ui/components/badge";
import {Trash2} from "lucide-react";
import {cn} from "@workspace/ui/lib/utils";
interface ContactListProps {
  campaignId: string;
  contacts: any[];
  pagination: {
    totalContacts: number;
    totalPages: number;
    currentPage: number;
  };
  loading: boolean;
  error: string | null;
  contactOperationsLoading: boolean;
  onDeleteContact: (campaignId: string, contactId: string) => Promise<boolean>;
  onRefetchContacts: () => void;
}

export function ContactList({
  campaignId,
  contacts,
  pagination,
  loading,
  error,
  contactOperationsLoading,
  onDeleteContact,
  onRefetchContacts,
}: ContactListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Contact List</span>
          {pagination.totalContacts > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              {pagination.totalContacts} contacts
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No contacts uploaded yet.</p>
            <p className="text-sm mt-2">
              Upload a CSV file to add contacts to this campaign.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Dynamic Variables</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Call Attempts</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact._id}>
                    <TableCell className="font-mono">
                      {contact.phone_number}
                    </TableCell>
                    <TableCell>
                      {Object.keys(contact.dynamic_variables).length > 0 ? (
                        <div className="space-y-1">
                          {Object.entries(contact.dynamic_variables).map(
                            ([key, value]) => (
                              <div key={key} className="text-sm">
                                <span className="font-medium">{key}:</span>{" "}
                                {String(value)}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "text-xs",
                          contact.call_status === "completed" &&
                            "bg-green-100 text-green-800",
                          contact.call_status === "failed" &&
                            "bg-red-100 text-red-800",
                          contact.call_status === "pending" &&
                            "bg-gray-100 text-gray-800",
                          contact.call_status === "in_progress" &&
                            "bg-blue-100 text-blue-800"
                        )}
                      >
                        {contact.call_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{contact.call_attempts}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (
                            confirm(
                              "Are you sure you want to delete this contact?"
                            )
                          ) {
                            const success = await onDeleteContact(
                              campaignId,
                              contact._id
                            );
                            if (success) {
                              onRefetchContacts();
                            }
                          }
                        }}
                        disabled={contactOperationsLoading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === 1}
                    onClick={() => {
                      /* Pagination hook would handle this */
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === pagination.totalPages}
                    onClick={() => {
                      /* Pagination hook would handle this */
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
