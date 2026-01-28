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
 * Search for localities by name and optionally by postal code
 * @param localityName - The name of the locality to search for
 * @param postalCode - Optional postal code to filter the search
 * @param page - Page number for pagination (default: 1)
 * @param pageSize - Number of results per page (default: 50)
 * @returns Array of localities matching the name and postal code (if provided)
 */
export const searchLocalitiesByName = async (
  localityName: string,
  postalCode?: string,
  page: number = 1,
  pageSize: number = 50
): Promise<Locality[]> => {
  if (!localityName || localityName.trim().length === 0) {
    return [];
  }

  try {
    const searchTerm = postalCode ? `${localityName} ${postalCode}` : localityName;
    const url = `${API_BASE_URL}/FullTextSearch?searchTerm=${encodeURIComponent(searchTerm)}&page=${page}&pageSize=${pageSize}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    let results: any[] = [];

    // Handle different response formats
    if (Array.isArray(data)) {
      results = data;
    } else if (data && Array.isArray(data.results)) {
      results = data.results;
    } else if (data && Array.isArray(data.data)) {
      results = data.data;
    }

    // Map results to Locality objects and deduplicate
    const uniqueLocalities = new Map<string, Locality>();
    
    results.forEach((item) => {
      const name = item.locality || item.name;
      const code = item.postalcode || item.postalCode;

      if (name && code) {
        const key = `${name}-${code}`;
        if (!uniqueLocalities.has(key)) {
          uniqueLocalities.set(key, { name, postalCode: code });
        }
      }
    });

    return Array.from(uniqueLocalities.values());
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
    // Use Localities endpoint with postalCode parameter (not PostalCodes endpoint)
    const response = await fetch(`${API_BASE_URL}/Localities?postalCode=${encodeURIComponent(postalCode)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        // No results found for this postal code
        return [];
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    // The API returns localities, but we need to transform them to PostalCode format
    let localities: Locality[] = [];
    
    // Handle different response formats
    if (Array.isArray(data)) {
      localities = data;
    } else if (data && Array.isArray(data.results)) {
      localities = data.results;
    } else if (data && Array.isArray(data.data)) {
      localities = data.data;
    }
    
    // Transform localities to postal codes format
    // Group by postal code and get unique localities
    const postalCodeMap = new Map<string, string[]>();
    localities.forEach((locality) => {
      const code = locality.postalCode;
      if (!postalCodeMap.has(code)) {
        postalCodeMap.set(code, []);
      }
      postalCodeMap.get(code)!.push(locality.name);
    });
    
    // Convert to PostalCode array format
    const postalCodes: PostalCode[] = Array.from(postalCodeMap.entries()).map(([code, names]) => ({
      code,
      name: names[0], // Use first locality name, or could join multiple
    }));
    
    return postalCodes;
  } catch (error) {
    console.error('Error fetching postal codes:', error);
    return [];
  }
};
