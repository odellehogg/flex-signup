// lib/cms.js
// ============================================================================
// CMS FUNCTIONS
// Fetch editable content from Airtable for website pages
// Allows non-technical updates to website copy
// ============================================================================

import { TABLES } from './constants.js';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appkU13tG14ZLVZZ9';

// Cache for CMS content (in-memory, clears on function cold start)
const contentCache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute

// ============================================================================
// CONTENT FETCHING
// ============================================================================

/**
 * Get all content for a specific page
 */
export async function getPageContent(pageName) {
  const cacheKey = `page:${pageName}`;
  const cached = contentCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLES.CONTENT)}?` +
      new URLSearchParams({
        filterByFormula: `{Page} = '${pageName}'`,
      }),
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    const data = await response.json();
    
    // Transform to key-value object
    const content = {};
    data.records.forEach(record => {
      content[record.fields.Key] = record.fields.Value;
    });

    contentCache.set(cacheKey, { data: content, timestamp: Date.now() });
    
    return content;
  } catch (error) {
    console.error(`Error fetching content for ${pageName}:`, error);
    return {};
  }
}

/**
 * Get a specific content item
 */
export async function getContentItem(pageName, key) {
  const content = await getPageContent(pageName);
  return content[key] || null;
}

/**
 * Get page sections visibility
 */
export async function getPageSections(pageName) {
  const cacheKey = `sections:${pageName}`;
  const cached = contentCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLES.PAGE_SECTIONS)}?` +
      new URLSearchParams({
        filterByFormula: `{Page} = '${pageName}'`,
      }),
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    const data = await response.json();
    
    // Transform to object with section visibility
    const sections = {};
    data.records.forEach(record => {
      sections[record.fields.Section] = {
        visible: record.fields.Visible !== false,
        order: record.fields.Order || 0,
        config: record.fields.Config ? JSON.parse(record.fields.Config) : {},
      };
    });

    contentCache.set(cacheKey, { data: sections, timestamp: Date.now() });
    
    return sections;
  } catch (error) {
    console.error(`Error fetching sections for ${pageName}:`, error);
    return {};
  }
}

// ============================================================================
// PRICING/PLANS CONTENT
// ============================================================================

/**
 * Get pricing page content (plans from Airtable)
 * Falls back to lib/plans.js if Airtable unavailable
 */
export async function getPricingContent() {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLES.PLANS)}?` +
      new URLSearchParams({
        filterByFormula: `{Active} = TRUE()`,
        sort: JSON.stringify([{ field: 'Order', direction: 'asc' }]),
      }),
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    const data = await response.json();
    
    return data.records.map(record => ({
      id: record.id,
      name: record.fields.Name,
      price: record.fields.Price,
      drops: record.fields.Drops,
      interval: record.fields.Interval || 'month',
      description: record.fields.Description,
      features: record.fields.Features ? record.fields.Features.split('\n') : [],
      isPopular: record.fields['Is Popular'] || false,
      stripePriceId: record.fields['Stripe Price ID'],
    }));
  } catch (error) {
    console.error('Error fetching pricing content:', error);
    // Return null to signal fallback to hardcoded plans
    return null;
  }
}

// ============================================================================
// FAQ CONTENT
// ============================================================================

/**
 * Get FAQ items
 */
export async function getFaqContent() {
  const cacheKey = 'faq';
  const cached = contentCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent('FAQ')}?` +
      new URLSearchParams({
        filterByFormula: `{Published} = TRUE()`,
        sort: JSON.stringify([{ field: 'Order', direction: 'asc' }]),
      }),
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    const data = await response.json();
    
    const faqs = data.records.map(record => ({
      id: record.id,
      question: record.fields.Question,
      answer: record.fields.Answer,
      category: record.fields.Category || 'General',
    }));

    contentCache.set(cacheKey, { data: faqs, timestamp: Date.now() });
    
    return faqs;
  } catch (error) {
    console.error('Error fetching FAQ content:', error);
    return [];
  }
}

// ============================================================================
// GYM CONTENT
// ============================================================================

/**
 * Get public gym information for display
 */
export async function getPublicGyms() {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLES.GYMS)}?` +
      new URLSearchParams({
        filterByFormula: `AND({Status} = 'Active', {Show on Website} = TRUE())`,
        sort: JSON.stringify([{ field: 'Name', direction: 'asc' }]),
      }),
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    const data = await response.json();
    
    return data.records.map(record => ({
      id: record.id,
      name: record.fields.Name,
      address: record.fields.Address,
      code: record.fields.Code,
      area: record.fields.Area,
      logo: record.fields.Logo?.[0]?.url,
    }));
  } catch (error) {
    console.error('Error fetching public gyms:', error);
    return [];
  }
}

// ============================================================================
// CONFIG
// ============================================================================

/**
 * Get system configuration
 */
export async function getConfig(key) {
  const cacheKey = `config:${key}`;
  const cached = contentCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLES.CONFIG)}?` +
      new URLSearchParams({
        filterByFormula: `{Key} = '${key}'`,
        maxRecords: '1',
      }),
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    const data = await response.json();
    
    if (data.records.length === 0) {
      return null;
    }

    const value = data.records[0].fields.Value;
    
    // Try to parse as JSON if it looks like JSON
    let parsedValue;
    try {
      if (value.startsWith('{') || value.startsWith('[')) {
        parsedValue = JSON.parse(value);
      } else {
        parsedValue = value;
      }
    } catch {
      parsedValue = value;
    }

    contentCache.set(cacheKey, { data: parsedValue, timestamp: Date.now() });
    
    return parsedValue;
  } catch (error) {
    console.error(`Error fetching config ${key}:`, error);
    return null;
  }
}

/**
 * Get all config values
 */
export async function getAllConfig() {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLES.CONFIG)}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    const data = await response.json();
    
    const config = {};
    data.records.forEach(record => {
      let value = record.fields.Value;
      try {
        if (value.startsWith('{') || value.startsWith('[')) {
          value = JSON.parse(value);
        }
      } catch {
        // Keep as string
      }
      config[record.fields.Key] = value;
    });

    return config;
  } catch (error) {
    console.error('Error fetching all config:', error);
    return {};
  }
}

// ============================================================================
// DISCOUNTS
// ============================================================================

/**
 * Validate discount code
 */
export async function validateDiscountCode(code) {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLES.DISCOUNTS)}?` +
      new URLSearchParams({
        filterByFormula: `AND({Code} = '${code.toUpperCase()}', {Active} = TRUE())`,
        maxRecords: '1',
      }),
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    const data = await response.json();
    
    if (data.records.length === 0) {
      return { valid: false, error: 'Invalid code' };
    }

    const discount = data.records[0].fields;
    
    // Check if expired
    if (discount['Expires At'] && new Date(discount['Expires At']) < new Date()) {
      return { valid: false, error: 'Code expired' };
    }

    // Check usage limit
    if (discount['Usage Limit'] && discount['Times Used'] >= discount['Usage Limit']) {
      return { valid: false, error: 'Code usage limit reached' };
    }

    return {
      valid: true,
      code: discount.Code,
      type: discount.Type, // 'percentage' or 'fixed'
      amount: discount.Amount,
      stripeCouponId: discount['Stripe Coupon ID'],
    };
  } catch (error) {
    console.error('Error validating discount code:', error);
    return { valid: false, error: 'Unable to validate code' };
  }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

export function clearCache() {
  contentCache.clear();
}

export function clearCacheKey(key) {
  contentCache.delete(key);
}

export default {
  getPageContent,
  getContentItem,
  getPageSections,
  getPricingContent,
  getFaqContent,
  getPublicGyms,
  getConfig,
  getAllConfig,
  validateDiscountCode,
  clearCache,
};
