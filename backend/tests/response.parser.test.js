const { parseAIResponse } = require('../src/utils/response.parser');

describe('Response Parser Validation', () => {

  it('should parse valid JSON correctly and enforce required fields', () => {
    const aiOutput = `
    \`\`\`json
    [
      {
        "name": "John Doe",
        "email": "john@example.com",
        "mobile_without_country_code": "9876543210",
        "crm_status": "GOOD_LEAD_FOLLOW_UP"
      }
    ]
    \`\`\`
    `;

    const { records, parseErrors } = parseAIResponse(aiOutput, 1);
    
    expect(parseErrors.length).toBe(0);
    expect(records[0]).not.toBeNull();
    expect(records[0].name).toBe('John Doe');
    expect(records[0].email).toBe('john@example.com');
    expect(records[0].crm_status).toBe('GOOD_LEAD_FOLLOW_UP');
    expect(records[0].company).toBe(''); // Automatically added empty string
  });

  it('should invalidate incorrect enums for crm_status and data_source', () => {
    const aiOutput = JSON.stringify([
      {
        "email": "valid@email.com",
        "crm_status": "SUPER_HOT_LEAD",
        "data_source": "random_website"
      }
    ]);

    const { records, parseErrors } = parseAIResponse(aiOutput, 1);
    
    expect(parseErrors.length).toBe(2);
    expect(parseErrors[0]).toContain('invalid crm_status');
    expect(parseErrors[1]).toContain('invalid data_source');
    expect(records[0].crm_status).toBe('');
    expect(records[0].data_source).toBe('');
  });

  it('should apply the skip rule if NO email and NO phone are present', () => {
    const aiOutput = JSON.stringify([
      {
        "name": "Ghost User",
        "email": "",
        "mobile_without_country_code": ""
      },
      {
        "name": "Only Email",
        "email": "yes@test.com",
        "mobile_without_country_code": ""
      },
      {
        "name": "Only Phone",
        "email": "",
        "mobile_without_country_code": "123456"
      }
    ]);

    const { records, parseErrors } = parseAIResponse(aiOutput, 3);
    
    expect(parseErrors.length).toBe(0);
    expect(records[0]).toBeNull(); // Skipped due to missing both
    expect(records[1]).not.toBeNull();
    expect(records[2]).not.toBeNull();
  });

});
