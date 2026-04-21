/**
 * Test script to verify JSON parsing error handling
 */
import { safeFetch } from './fetch-wrapper';

// Test successful JSON parsing
async function testValidJSON() {
  try {
    const data = await safeFetch('/api/categories');
    console.log('Valid JSON test passed:', data.categories?.length, 'categories loaded');
  } catch (error) {
    console.error('Valid JSON test failed:', error);
  }
}

// Test error handling for non-JSON responses
async function testErrorHandling() {
  try {
    // This should trigger an error since POST is not supported
    const data = await safeFetch('/api/categories', { method: 'POST' });
    console.log('Error handling test failed - should have thrown an error');
  } catch (error) {
    console.log('Error handling test passed - caught expected error:', error instanceof Error ? error.message : String(error));
  }
}

// Run tests
export async function runJSONParsingTests() {
  console.log('Running JSON parsing tests...');
  await testValidJSON();
  await testErrorHandling();
  console.log('JSON parsing tests completed');
}
