import api from "./api";

/**
 * Service for handling email history operations
 */
const emailHistoryService = {
  /**
   * Get paginated email history
   * @param {Object} params - Query parameters
   * @param {string} [params.documentType] - Filter by document type
   * @param {number} [params.limit] - Number of records to fetch
   * @param {number} [params.offset] - Number of records to skip
   * @returns {Promise} Promise with email history data
   */
  getEmailHistory: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.documentType) {
        queryParams.append('documentType', params.documentType);
      }
      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params.offset) {
        queryParams.append('offset', params.offset.toString());
      }

      const url = `/email-history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      
      // Format response to match expected structure
      return {
        data: {
          emails: response.emails || [],
          pagination: response.pagination || { total: 0, hasMore: false }
        }
      };
    } catch (error) {
      console.error("Error fetching email history:", error);
      throw error;
    }
  },

  /**
   * Get email history for a specific document type
   * @param {string} documentType - The document type to filter by
   * @param {Object} [params] - Optional pagination parameters
   * @param {number} [params.limit] - Number of records to fetch (default: 20)
   * @param {number} [params.offset] - Number of records to skip (default: 0)
   * @returns {Promise} Promise with email history data for the document
   */
  getEmailHistoryByDocument: async (documentType, params = {}) => {
    try {
      const { limit = 20, offset = 0 } = params;
      
      // Use the general endpoint with documentType filter for pagination support
      const queryParams = new URLSearchParams();
      queryParams.append('documentType', documentType);
      queryParams.append('limit', limit.toString());
      queryParams.append('offset', offset.toString());

      const url = `/email-history?${queryParams.toString()}`;
      const response = await api.get(url);
      
      // The paginated endpoint returns { emails: [...], pagination: {...} }
      const result = {
        data: {
          documentType,
          emails: response.emails || [],
          pagination: response.pagination || { total: 0, hasMore: false, limit, offset }
        }
      };
      return result;
    } catch (error) {
      console.error(`Error fetching email history for ${documentType}:`, error);
      
      // If it's a 404 or server error, return empty structure instead of throwing
      if (error.message?.includes('404') || error.message?.includes('500')) {
        return {
          data: {
            documentType,
            emails: [],
            pagination: { total: 0, hasMore: false, limit: 20, offset: 0 }
          }
        };
      }
      
      throw error;
    }
  },

  /**
   * Get email history for a specific document type (simple version, no pagination)
   * @param {string} documentType - The document type to filter by
   * @param {string} [serviceDate] - Optional service date to filter by
   * @param {string} [recipientType] - Optional recipient type to filter by ('pastor', 'music', etc.)
   * @returns {Promise} Promise with email history data for the document
   */
  getEmailHistoryByDocumentSimple: async (documentType, serviceDate = null, recipientType = null) => {
    try {
      let url = `/email-history/document/${documentType}`;
      
      // Add query parameters if provided
      const queryParams = new URLSearchParams();
      if (serviceDate) {
        queryParams.append('serviceDate', serviceDate);
      }
      if (recipientType) {
        queryParams.append('recipientType', recipientType);
      }
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      const response = await api.get(url);
      
      // The api.get() returns the parsed JSON directly, not wrapped in { data: ... }
      // So response should be: { documentType: "concept", emails: [...], serviceDate?: "...", recipientType?: "..." }
      const result = {
        data: {
          documentType: response.documentType || documentType,
          serviceDate: response.serviceDate || serviceDate,
          recipientType: response.recipientType || recipientType,
          emails: response.emails || []
        }
      };
      return result;
    } catch (error) {
      console.error(`Error fetching email history for ${documentType}:`, error);
      
      // If it's a 404 or server error, return empty structure instead of throwing
      if (error.message?.includes('404') || error.message?.includes('500')) {
        return {
          data: {
            documentType,
            serviceDate,
            recipientType,
            emails: []
          }
        };
      }
      
      throw error;
    }
  },
};

export default emailHistoryService;