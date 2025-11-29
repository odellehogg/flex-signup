// lib/cms.js
// CMS helper functions for fetching page content and sections

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

// Fetch page sections (for show/hide control)
export async function getPageSections(page) {
  try {
    const filterFormula = `{Page} = '${page}'`
    const params = new URLSearchParams({
      filterByFormula: filterFormula,
      sort: JSON.stringify([{ field: 'Sort Order', direction: 'asc' }]),
    })

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Page%20Sections?${params}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
        next: { revalidate: 60 },
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    return data.records.map(r => ({
      id: r.fields['Section ID'],
      title: r.fields['Title'] || '',
      isActive: r.fields['Is Active'] !== false,
      sortOrder: r.fields['Sort Order'] || 0,
    }))
  } catch (error) {
    console.error('Error fetching sections:', error)
    return null
  }
}

// Fetch page content (for text editing)
export async function getPageContent(page) {
  try {
    const filterFormula = `{Page} = '${page}'`
    const params = new URLSearchParams({
      filterByFormula: filterFormula,
    })

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Page%20Content?${params}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
        next: { revalidate: 60 },
      }
    )

    if (!response.ok) return {}

    const data = await response.json()
    const content = {}
    for (const record of data.records) {
      const key = record.fields['Key']
      const value = record.fields['Value']
      const isActive = record.fields['Is Active'] !== false
      if (key && isActive) {
        content[key] = value
      }
    }
    return content
  } catch (error) {
    console.error('Error fetching content:', error)
    return {}
  }
}

// Check if a section should be shown
export function isSectionActive(sections, sectionId) {
  if (!sections) return true // Show all if no CMS data
  const section = sections.find(s => s.id === sectionId)
  return section ? section.isActive : true
}

// Get content with fallback
export function getContent(content, key, fallback) {
  return content[key] !== undefined ? content[key] : fallback
}

// Parse JSON content safely
export function parseJsonContent(content, key, fallback) {
  try {
    const value = content[key]
    if (value) {
      return JSON.parse(value)
    }
  } catch (error) {
    console.error(`Error parsing JSON for ${key}:`, error)
  }
  return fallback
}

// Get items array from sections or content (with fallback)
export function getItems(sections, content, sectionId, contentKey, fallback) {
  // If section is disabled, return empty array
  if (sections && !isSectionActive(sections, sectionId)) {
    return []
  }
  // Try to get from content (JSON), otherwise use fallback
  return parseJsonContent(content, contentKey, fallback)
}
