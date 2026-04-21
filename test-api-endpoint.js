// Test if the API endpoint is accessible
async function testAPIEndpoint() {
  try {
    console.log('Testing API endpoint accessibility...');
    
    const response = await fetch('http://localhost:3000/api/create-cod-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: 'connection'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);
    
    const text = await response.text();
    console.log('Response body:', text);
    
  } catch (error) {
    console.error('API endpoint test failed:', error.message);
  }
}

testAPIEndpoint();
