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
      return await api.get(url);
    } catch (error) {
      console.error("Error fetching email history:", error);
      throw error;
    }
  },

  /**
   * Get email history for a specific document type
   * @param {string} documentType - The document type to filter by
   * @returns {Promise} Promise with email history data for the document
   */
  getEmailHistoryByDocument: async (documentType) => {
    try {
      console.log('EmailHistoryService: Fetching for documentType:', documentType);
      const response = await api.get(`/email-history/document/${documentType}`);
      console.log('EmailHistoryService: Raw API response:', response);
      
      // The api.get() returns the parsed JSON directly, not wrapped in { data: ... }
      // So response should be: { documentType: "concept", emails: [...] }
      const result = {
        data: {
          documentType: response.documentType || documentType,
          emails: response.emails || []
        }
      };
      console.log('EmailHistoryService: Processed result:', result);
      return result;
    } catch (error) {
      console.error(`Error fetching email history for ${documentType}:`, error);
      
      // If it's a 404 or server error, return empty structure instead of throwing
      if (error.message?.includes('404') || error.message?.includes('500')) {
        console.log('EmailHistoryService: Returning empty due to error status');
        return {
          data: {
            documentType,
            emails: []
          }
        };
      }
      
      throw error;
    }
  },
};

export default emailHistoryService;