import apiClient from '../utils/axiosConfig';

const icSubmissionService = {
  saveDraft: async (facilityId, customerEnd, towerEnd, token) => {
    try {
      const response = await apiClient.post(
        '/api/ic-submission/draft',
        { facilityId, customerEnd, towerEnd }
      );
      return response.data;
    } catch (error) {
      console.error('Save draft error:', error);
      throw error;
    }
  },

  getDraft: async (facilityId, token) => {
    try {
      const response = await apiClient.get(
        `/api/ic-submission/draft/${facilityId}`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Get draft error:', error);
      throw error;
    }
  },

  submit: async (facilityId, customerEnd, towerEnd, token, facilityDetails = null) => {
    try {
      // Get facilityDetails from localStorage if not provided
      let facilityData = facilityDetails;
      if (!facilityData) {
        try {
          const stored = localStorage.getItem('facilityDetails');
          if (stored) {
            facilityData = JSON.parse(stored);
          }
        } catch (error) {
          console.error('Error reading facilityDetails from localStorage:', error);
        }
      }

      const response = await apiClient.post(
        '/api/ic-submission/submit',
        { facilityId, customerEnd, towerEnd, facilityDetails: facilityData }
      );
      return response.data;
    } catch (error) {
      console.error('Submit error:', error);
      throw error;
    }
  },

  getSubmission: async (id, token) => {
    try {
      const response = await apiClient.get(
        `/api/ic-submission/submission/${id}`
      );
      return response.data;
    } catch (error) {
      console.error('Get submission error:', error);
      throw error;
    }
  },

  getAllSubmissions: async (token) => {
    try {
      const response = await apiClient.get(
        '/api/ic-submission/submissions'
      );
      return response.data;
    } catch (error) {
      console.error('Get all submissions error:', error);
      throw error;
    }
  }
};

export default icSubmissionService;

