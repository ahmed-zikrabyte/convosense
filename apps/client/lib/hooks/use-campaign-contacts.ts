import { useState, useEffect, useCallback, useMemo } from "react";
import {
  campaignContactAPI,
  CampaignContact,
  ContactsResponse,
  ContactFilters,
} from "../api/campaign-contacts";

export const useCampaignContacts = (campaignId: string, filters: ContactFilters = {}) => {
  const [contacts, setContacts] = useState<CampaignContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalContacts: 0,
    limit: 50,
  });

  // Memoize filters to prevent infinite re-renders
  const memoizedFilters = useMemo(() => filters, [
    filters.page,
    filters.limit,
    filters.status,
  ]);

  const fetchContacts = useCallback(async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await campaignContactAPI.getContacts(campaignId, memoizedFilters);
      setContacts(response.contacts);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contacts");
    } finally {
      setLoading(false);
    }
  }, [campaignId, memoizedFilters]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    loading,
    error,
    pagination,
    refetch: fetchContacts,
  };
};

export const useCampaignContactOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteContact = async (campaignId: string, contactId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await campaignContactAPI.deleteContact(campaignId, contactId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete contact");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateContact = async (
    campaignId: string,
    contactId: string,
    updateData: Partial<CampaignContact>
  ): Promise<CampaignContact | null> => {
    try {
      setLoading(true);
      setError(null);
      const contact = await campaignContactAPI.updateContact(campaignId, contactId, updateData);
      return contact;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update contact");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    deleteContact,
    updateContact,
  };
};