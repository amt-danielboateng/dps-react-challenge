import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { searchLocalitiesByName, searchPostalCodesByCode, type Locality, type PostalCode } from '../services/openPlzApi';

const AddressForm = () => {
  const [locality, setLocality] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [postalCodeOptions, setPostalCodeOptions] = useState<string[]>([]);
  const [isPostalCodeDropdown, setIsPostalCodeDropdown] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [localityTouched, setLocalityTouched] = useState<boolean>(false);
  const [postalCodeTouched, setPostalCodeTouched] = useState<boolean>(false);
  const skipPostalCodeSearchRef = useRef<boolean>(false);
  const postalCodeRef = useRef<string>(postalCode);

  const debouncedLocality = useDebounce(locality, 1000);
  const debouncedPostalCode = useDebounce(postalCode, 1000);

  // Keep ref in sync with state for use in effects without dependency cycles
  useEffect(() => {
    postalCodeRef.current = postalCode;
  }, [postalCode]);

  // Handle locality lookup
  useEffect(() => {
    if (!debouncedLocality || debouncedLocality.trim().length === 0) {
      setPostalCodeOptions([]);
      setIsPostalCodeDropdown(false);
      if (localityTouched && postalCodeTouched) {
        setPostalCode('');
      }
      // Clear error if field is empty (user cleared the input)
      if (!locality || locality.trim().length === 0) {
        setError('');
      }
      return;
    }

    if (!localityTouched) {
      return;
    }

    const fetchLocalities = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Fetch with a larger page size to handle pagination and ensure we find exact matches
        const localities: Locality[] = await searchLocalitiesByName(debouncedLocality.trim(), undefined, 1, 50);
        
        // Filter for exact matches to avoid showing postal codes for "Münster" when user typed "Mü"
        const exactMatches = localities.filter(l => l.name.trim().toLowerCase() === debouncedLocality.trim().toLowerCase());
        
        if (exactMatches.length === 0) {
          setPostalCodeOptions([]);
          setIsPostalCodeDropdown(false);
          setPostalCode('');
          setError(`${debouncedLocality} is not a locality in Germany.`);
        } else if (exactMatches.length === 1) {
          // Single postal code - auto-fill
          const uniquePostalCodes = [...new Set(exactMatches.map(l => l.postalCode))];
          if (uniquePostalCodes.length === 1) {
            setPostalCode(uniquePostalCodes[0]);
            setIsPostalCodeDropdown(false);
            setPostalCodeOptions([]);
          } else {
            // Multiple postal codes for same locality name
            setPostalCodeOptions(uniquePostalCodes);
            setIsPostalCodeDropdown(true);
            // Only clear postal code if the current one is not in the valid list
            if (!uniquePostalCodes.includes(postalCodeRef.current)) {
              setPostalCode('');
            }
          }
        } else {
          // Multiple localities with potentially multiple postal codes
          const uniquePostalCodes = [...new Set(exactMatches.map(l => l.postalCode))];
          if (uniquePostalCodes.length === 1) {
            setPostalCode(uniquePostalCodes[0]);
            setIsPostalCodeDropdown(false);
            setPostalCodeOptions([]);
          } else {
            setPostalCodeOptions(uniquePostalCodes);
            setIsPostalCodeDropdown(true);
            // Only clear postal code if the current one is not in the valid list
            if (!uniquePostalCodes.includes(postalCodeRef.current)) {
              setPostalCode('');
            }
          }
        }
      } catch (err) {
        setError('Error fetching locality data. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocalities();
  }, [debouncedLocality, localityTouched]);

  // Handle postal code lookup
  useEffect(() => {
    if (!debouncedPostalCode || debouncedPostalCode.trim().length === 0) {
      setError('');
      return;
    }

    if (!postalCodeTouched) {
      return;
    }

    // Don't trigger lookup if postal code was selected from dropdown
    if (skipPostalCodeSearchRef.current) {
      skipPostalCodeSearchRef.current = false;
      return;
    }

    // Validate format (5 digits)
    if (!/^\d{5}$/.test(debouncedPostalCode)) {
      setError('Postal code must be 5 digits');
      setLocality('');
      return;
    }

    const fetchPostalCodes = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const postalCodes: PostalCode[] = await searchPostalCodesByCode(debouncedPostalCode);
        
        if (postalCodes.length === 0) {
          setError('Invalid postal code. Please enter a valid German postal code.');
          setLocality('');
        } else if (postalCodes.length === 1) {
          // Single locality - auto-fill
          setLocality(postalCodes[0].name);
          setError('');
        } else {
          // Multiple localities for same postal code - use first one or show all
          setLocality(postalCodes[0].name);
          setError('');
        }
      } catch (err) {
        setError('Error fetching postal code data. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostalCodes();
  }, [debouncedPostalCode, postalCodeTouched]);

  const handleLocalityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocality(value);
    setLocalityTouched(true);
    setError('');
    
    // Reset postal code if user is typing in locality
    if (value.length > 0) {
      setIsPostalCodeDropdown(false);
      setPostalCodeOptions([]);
    }
  };

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setPostalCode(value);
    setPostalCodeTouched(true);
    setError('');
    
    // If selecting from dropdown, mark it so we don't trigger another lookup
    if (isPostalCodeDropdown && e.target.tagName === 'SELECT') {
      skipPostalCodeSearchRef.current = true;
    } else {
      // Reset locality if user is typing in postal code (not selecting from dropdown)
      if (value.length > 0 && !isPostalCodeDropdown) {
        setLocality('');
      }
      skipPostalCodeSearchRef.current = false;
    }
  };

  const handleLocalityBlur = () => {
    setLocalityTouched(true);
  };

  const handlePostalCodeBlur = () => {
    setPostalCodeTouched(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        German Address Validator
      </h2>
      
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {/* Locality Field */}
        <div>
          <label 
            htmlFor="locality" 
            className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
          >
            Locality (City/Town) <span className="text-red-500">*</span>
          </label>
          <input
            id="locality"
            type="text"
            value={locality}
            onChange={handleLocalityChange}
            onBlur={handleLocalityBlur}
            onKeyDown={handleKeyDown}
            placeholder="Enter city or town name"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            aria-label="Locality input field"
            aria-required="true"
            tabIndex={0}
          />
        </div>

        {/* Postal Code Field */}
        <div>
          <label 
            htmlFor="postalCode" 
            className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
          >
            Postal Code (PLZ) <span className="text-red-500">*</span>
          </label>
          {isPostalCodeDropdown ? (
            <select
              id="postalCode"
              value={postalCode}
              onChange={handlePostalCodeChange}
              onBlur={handlePostalCodeBlur}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              aria-label="Postal code dropdown"
              aria-required="true"
              tabIndex={0}
            >
              <option value="">Select a postal code</option>
              {postalCodeOptions.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="postalCode"
              type="text"
              value={postalCode}
              onChange={handlePostalCodeChange}
              onBlur={handlePostalCodeBlur}
              onKeyDown={handleKeyDown}
              placeholder="Enter 5-digit postal code"
              maxLength={5}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              aria-label="Postal code input field"
              aria-required="true"
              tabIndex={0}
            />
          )}
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading...</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div 
            className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {/* Info Message */}
        {!error && !isLoading && locality && postalCode && (
          <div 
            className="p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg text-sm"
            role="status"
          >
            ✓ Address validated successfully
          </div>
        )}
      </form>
    </div>
  );
};

export default AddressForm;
