// TestCookies.tsx
import { useEffect } from 'react';
import {api} from '@/lib/axios'; // Adjust the import path as necessary

const TestCookies = () => {
  useEffect(() => {
    const testCookieEndpoint = async () => {
      try {
        console.log('Testing cookie endpoint...');
        
        // First request to set the test cookie
        const setResponse = await api.get('/auth/test-cookies');
        console.log('Set cookie response:', setResponse.data);
        
        // Second request to verify cookies are being sent
        const verifyResponse = await api.get('/auth/verify-cookies');
        console.log('Verify cookies response:', verifyResponse.data);
        
        // Check document.cookie (won't show HTTP-only cookies)
        console.log('Document cookies:', document.cookie);
        
      } catch (error) {
        console.error('Cookie test failed:', error);
      }
    };
    
    testCookieEndpoint();
  }, []);

  return (
    <div>
      <h2>Cookie Test</h2>
      <p>Check browser console for results</p>
    </div>
  );
};

export default TestCookies;