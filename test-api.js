// Test file to debug API URL issues
console.log('=== API URL DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

const hardcodedUrl = "https://product-data-explorer.onrender.com/api";
console.log('Hardcoded URL:', hardcodedUrl);

// Test fetch
fetch(`${hardcodedUrl}/health`)
  .then(response => response.json())
  .then(data => console.log('Render API working:', data))
  .catch(error => console.error('Render API failed:', error));