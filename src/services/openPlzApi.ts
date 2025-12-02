const API_BASE_URL = 'https://openplzapi.org/de';

export interface Locality {
  name: string;
  postalCode: string;
}

export interface PostalCode {
  code: string;
  name: string;
}

/**
 * Search for localities by name
 * @param localityName - The name of the locality to search for
 * @returns Array of localities matching the name
 */
export const searchLocalitiesByName = async (localityName: string): Promise<Locality[]> => {
  if (!localityName || localityName.trim().length === 0) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/Localities?name=${encodeURIComponent(localityName)}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.results)) {
      return data.results;
    }
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching localities:', error);
    return [];
  }
};

/**
 * Search for postal codes by code
 * @param postalCode - The postal code to search for
 * @returns Array of postal codes matching the code
 */
export const searchPostalCodesByCode = async (postalCode: string): Promise<PostalCode[]> => {
  if (!postalCode || postalCode.trim().length === 0) {
    return [];
  }

  // German postal codes are 5 digits
  if (!/^\d{5}$/.test(postalCode)) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/PostalCodes?code=${encodeURIComponent(postalCode)}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.results)) {
      return data.results;
    }
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching postal codes:', error);
    return [];
  }
};

