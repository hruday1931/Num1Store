/**
 * Safe fetch wrapper that handles non-JSON responses gracefully
 */
export async function safeFetch(url: string, options?: RequestInit): Promise<any> {
  try {
    // Default to including credentials for authentication
    const fetchOptions = {
      ...options,
      credentials: 'include' as RequestCredentials,
    };
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      // Try to get error details from response body
      let errorDetails = '';
      let jsonResponse = null;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          jsonResponse = await response.json();
          errorDetails = JSON.stringify(jsonResponse);
        } else {
          const errorText = await response.text();
          errorDetails = errorText;
        }
      } catch (e) {
        errorDetails = 'Could not read error response';
      }
      
      // Enhanced error message for 401
      if (response.status === 401) {
        console.error('Authentication failed:', errorDetails);
        throw new Error(`HTTP 401 Unauthorized - Authentication failed. Please sign in again.`);
      }
      
      // For 400 status, always throw an error with the response message
      if (response.status === 400 && jsonResponse) {
        throw new Error(jsonResponse.error || `HTTP error! status: ${response.status}. ${errorDetails}`);
      }
      
      // Log the full error details before throwing
      console.error('=== SAFE FETCH ERROR DETAILS ===');
      console.error('Response status:', response.status);
      console.error('Response statusText:', response.statusText);
      console.error('Error details:', errorDetails);
      console.error('JSON Response:', jsonResponse);
      console.error('=== END SAFE FETCH ERROR DETAILS ===');
      
      throw new Error(`HTTP error! status: ${response.status}. ${errorDetails}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response received:', text);
      throw new Error(`Server returned non-JSON response: ${text.substring(0, 200)}`);
    }
    
    const jsonData = await response.json();
    
    // Ensure we always return an object
    if (jsonData === null || jsonData === undefined || typeof jsonData !== 'object') {
      console.error('Invalid JSON response:', jsonData);
      throw new Error('Server returned invalid response format');
    }
    
    return jsonData;
  } catch (error) {
    console.error('Fetch error:', error);
    // Re-throw the error to let the caller handle it
    throw error;
  }
}

/**
 * Check if a response is JSON before parsing
 */
export async function safeJsonParse(response: Response): Promise<any> {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Non-JSON response received:', text);
    throw new Error('Response is not JSON');
  }
  
  return await response.json();
}
