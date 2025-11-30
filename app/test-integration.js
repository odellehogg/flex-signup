// api/test-integration.js
// Debug endpoint to test Airtable and Twilio connections
// Access at: https://www.flexlaundry.co.uk/api/test-integration?phone=+447123456789

module.exports = async (req, res) => {
  // Set CORS headers for browser access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  // =========================================================================
  // TEST 1: Environment Variables
  // =========================================================================
  
  results.tests.environment = {
    name: 'Environment Variables',
    status: 'checking',
    details: {}
  };
  
  const envVars = {
    TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || 'NOT SET',
    AIRTABLE_API_KEY: !!process.env.AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID || 'NOT SET',
    TEMPLATE_WELCOME_SID: process.env.TEMPLATE_WELCOME_SID || 'not set',
    TEMPLATE_MAIN_MENU_SID: process.env.TEMPLATE_MAIN_MENU_SID || 'not set'
  };
  
  results.tests.environment.details = envVars;
  
  // Check for common issues
  const envIssues = [];
  
  if (!envVars.TWILIO_ACCOUNT_SID) {
    envIssues.push('TWILIO_ACCOUNT_SID is missing');
  }
  if (!envVars.TWILIO_AUTH_TOKEN) {
    envIssues.push('TWILIO_AUTH_TOKEN is missing');
  }
  if (envVars.TWILIO_WHATSAPP_NUMBER === 'NOT SET') {
    envIssues.push('TWILIO_WHATSAPP_NUMBER is missing');
  } else if (!envVars.TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:')) {
    envIssues.push('TWILIO_WHATSAPP_NUMBER must start with "whatsapp:" prefix');
  }
  if (!envVars.AIRTABLE_API_KEY) {
    envIssues.push('AIRTABLE_API_KEY is missing');
  }
  if (envVars.AIRTABLE_BASE_ID === 'NOT SET') {
    envIssues.push('AIRTABLE_BASE_ID is missing');
  }
  
  results.tests.environment.status = envIssues.length === 0 ? 'pass' : 'fail';
  results.tests.environment.issues = envIssues;
  
  // =========================================================================
  // TEST 2: Airtable Connection
  // =========================================================================
  
  results.tests.airtable = {
    name: 'Airtable Connection',
    status: 'checking'
  };
  
  try {
    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Members?maxRecords=1`;
    
    const airtableResponse = await fetch(airtableUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (airtableResponse.ok) {
      const data = await airtableResponse.json();
      results.tests.airtable.status = 'pass';
      results.tests.airtable.recordCount = data.records?.length || 0;
      results.tests.airtable.message = 'Successfully connected to Airtable';
      
      // Show available fields from first record
      if (data.records?.[0]) {
        results.tests.airtable.availableFields = Object.keys(data.records[0].fields);
      }
    } else {
      const errorText = await airtableResponse.text();
      results.tests.airtable.status = 'fail';
      results.tests.airtable.httpStatus = airtableResponse.status;
      results.tests.airtable.error = errorText;
      
      // Provide specific guidance based on error
      if (airtableResponse.status === 401) {
        results.tests.airtable.fix = 'API key is invalid. Generate a new Personal Access Token at airtable.com/create/tokens';
      } else if (airtableResponse.status === 403) {
        results.tests.airtable.fix = 'API key does not have permission for this base. Check token scopes include this base.';
      } else if (airtableResponse.status === 404) {
        results.tests.airtable.fix = 'Base ID or table name is wrong. Check AIRTABLE_BASE_ID matches your base.';
      }
    }
  } catch (error) {
    results.tests.airtable.status = 'fail';
    results.tests.airtable.error = error.message;
  }
  
  // =========================================================================
  // TEST 3: Member Lookup (if phone provided)
  // =========================================================================
  
  const testPhone = req.query.phone;
  
  if (testPhone) {
    results.tests.memberLookup = {
      name: 'Member Lookup',
      status: 'checking',
      searchPhone: testPhone
    };
    
    try {
      // Import the airtable module
      const { getMemberByPhone } = require('../lib/airtable');
      
      const member = await getMemberByPhone(testPhone);
      
      if (member) {
        results.tests.memberLookup.status = 'pass';
        results.tests.memberLookup.found = true;
        results.tests.memberLookup.member = {
          id: member.id,
          firstName: member.fields['First Name'],
          phone: member.fields['Phone Number'],
          status: member.fields['Status'],
          gym: member.fields['Gym'],
          conversationState: member.fields['Conversation State']
        };
      } else {
        results.tests.memberLookup.status = 'fail';
        results.tests.memberLookup.found = false;
        results.tests.memberLookup.message = 'No member found with this phone number';
        results.tests.memberLookup.fix = 'Check the phone number format in Airtable matches: ' + testPhone;
      }
    } catch (error) {
      results.tests.memberLookup.status = 'fail';
      results.tests.memberLookup.error = error.message;
    }
  } else {
    results.tests.memberLookup = {
      name: 'Member Lookup',
      status: 'skipped',
      message: 'Add ?phone=+447123456789 to test member lookup'
    };
  }
  
  // =========================================================================
  // TEST 4: Twilio Connection
  // =========================================================================
  
  results.tests.twilio = {
    name: 'Twilio Connection',
    status: 'checking'
  };
  
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    // Just verify account exists
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    
    results.tests.twilio.status = 'pass';
    results.tests.twilio.accountStatus = account.status;
    results.tests.twilio.friendlyName = account.friendlyName;
  } catch (error) {
    results.tests.twilio.status = 'fail';
    results.tests.twilio.error = error.message;
    
    if (error.message.includes('authenticate')) {
      results.tests.twilio.fix = 'TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is incorrect';
    }
  }
  
  // =========================================================================
  // SUMMARY
  // =========================================================================
  
  const passCount = Object.values(results.tests).filter(t => t.status === 'pass').length;
  const failCount = Object.values(results.tests).filter(t => t.status === 'fail').length;
  const skipCount = Object.values(results.tests).filter(t => t.status === 'skipped').length;
  
  results.summary = {
    passed: passCount,
    failed: failCount,
    skipped: skipCount,
    allPassed: failCount === 0
  };
  
  // Return results
  return res.status(200).json(results);
};
