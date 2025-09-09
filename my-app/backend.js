import express from 'express';
import cors from 'cors';
const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Sample property data with realistic addresses and zips for interview challenges
const properties = [
  {
    id: 1,
    title: "Modern Downtown Apartment",
    price: 450000,
    location: "Downtown",
    address: "123 Main Street",
    zip: "10001",
    type: "Apartment",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400",
    description: "Beautiful modern apartment in the heart of downtown with city views."
  },
  {
    id: 2,
    title: "Suburban Family Home",
    price: 650000,
    location: "Suburbs",
    address: "456 Oak Avenue",
    zip: "10002",
    type: "House",
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2400,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
    description: "Spacious family home with large yard and modern amenities."
  },
  {
    id: 3,
    title: "Luxury Penthouse",
    price: 1200000,
    location: "Uptown",
    address: "789 Park Place",
    zip: "10003",
    type: "Penthouse",
    bedrooms: 3,
    bathrooms: 3,
    sqft: 2000,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400",
    description: "Luxurious penthouse with panoramic city views and premium finishes."
  },
  {
    id: 4,
    title: "Cozy Studio",
    price: 280000,
    location: "Arts District",
    address: "321 Maple Drive",
    zip: "10001",
    type: "Studio",
    bedrooms: 1,
    bathrooms: 1,
    sqft: 600,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
    description: "Charming studio apartment in trendy arts district, perfect for young professionals."
  },
  {
    id: 5,
    title: "Riverside Condo",
    price: 520000,
    location: "Riverside",
    address: "555 Main Street",
    zip: "10001",
    type: "Condo",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1400,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400",
    description: "Modern condo with river views and luxury amenities."
  },
  {
    id: 6,
    title: "Garden Apartment",
    price: 380000,
    location: "Garden District",
    address: "777 Main Avenue", 
    zip: "10002",
    type: "Apartment",
    bedrooms: 1,
    bathrooms: 1,
    sqft: 900,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400",
    description: "Quiet garden apartment with private patio."
  },
  {
    id: 7,
    title: "Executive Townhouse",
    price: 750000,
    location: "Executive Row",
    address: "888 Oak Street",
    zip: "10002",
    type: "Townhouse",
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 2200,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
    description: "Premium townhouse in prestigious neighborhood."
  },
  {
    id: 8,
    title: "Loft Space",
    price: 425000,
    location: "Arts District", 
    address: "999 Maple Lane",
    zip: "10001",
    type: "Loft",
    bedrooms: 1,
    bathrooms: 1,
    sqft: 1100,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
    description: "Industrial loft with high ceilings and exposed brick."
  }
];

// API Routes
app.get('/api/properties', (req, res) => {
  const { type, minPrice, maxPrice, location, minBedrooms } = req.query;
  
  let filteredProperties = [...properties];
  
  if (type && type !== 'all') {
    filteredProperties = filteredProperties.filter(p => 
      p.type.toLowerCase() === type.toLowerCase()
    );
  }
  
  if (minPrice) {
    filteredProperties = filteredProperties.filter(p => p.price >= parseInt(minPrice));
  }
  
  if (maxPrice) {
    filteredProperties = filteredProperties.filter(p => p.price <= parseInt(maxPrice));
  }
  
  if (location && location !== 'all') {
    filteredProperties = filteredProperties.filter(p => 
      p.location.toLowerCase().includes(location.toLowerCase())
    );
  }
  
  if (minBedrooms) {
    filteredProperties = filteredProperties.filter(p => p.bedrooms >= parseInt(minBedrooms));
  }
  
  res.json(filteredProperties);
});

app.get('/api/properties/:id', (req, res) => {
  const propertyId = parseInt(req.params.id);
  const property = properties.find(p => p.id === propertyId);
  
  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }
  
  res.json(property);
});

// Contact form endpoint
app.post('/api/contact', (req, res) => {
  const { name, email, message, propertyId } = req.body;
  
  // In a real application, you'd save this to a database or send an email
  console.log('Contact form submission:', { name, email, message, propertyId });
  
  res.json({ 
    success: true, 
    message: 'Thank you for your inquiry! We will get back to you soon.' 
  });
});

// Get property statistics
app.get('/api/stats', (req, res) => {
  const stats = {
    totalProperties: properties.length,
    averagePrice: Math.round(properties.reduce((sum, p) => sum + p.price, 0) / properties.length),
    propertyTypes: [...new Set(properties.map(p => p.type))],
    locations: [...new Set(properties.map(p => p.location))]
  };
  
  res.json(stats);
});

// INTERVIEW CHALLENGE 1: Nearest Comps by Price
// Given an address+zip, return the N most similar properties in price within the same zip
app.get('/api/comps/:zip/:price/:count', (req, res) => {
  const { zip, price, count = 5 } = req.params;
  const targetPrice = parseInt(price);
  const limit = Math.min(parseInt(count), 20); // Cap at 20 for performance
  
  // Filter properties in the same zip
  const sameZipProperties = properties.filter(p => p.zip === zip && p.price !== targetPrice);
  
  if (sameZipProperties.length === 0) {
    return res.json([]);
  }
  
  // Sort by price for efficient nearest neighbor search
  const sortedProperties = sameZipProperties.sort((a, b) => a.price - b.price);
  
  // Find insertion point using binary search concept
  let insertIndex = 0;
  for (let i = 0; i < sortedProperties.length; i++) {
    if (sortedProperties[i].price < targetPrice) {
      insertIndex = i + 1;
    } else {
      break;
    }
  }
  
  // Collect nearest neighbors by expanding outward from insertion point
  const comps = [];
  let leftIndex = insertIndex - 1;
  let rightIndex = insertIndex;
  
  while (comps.length < limit && (leftIndex >= 0 || rightIndex < sortedProperties.length)) {
    const leftDiff = leftIndex >= 0 ? Math.abs(sortedProperties[leftIndex].price - targetPrice) : Infinity;
    const rightDiff = rightIndex < sortedProperties.length ? Math.abs(sortedProperties[rightIndex].price - targetPrice) : Infinity;
    
    if (leftDiff <= rightDiff) {
      comps.push(sortedProperties[leftIndex]);
      leftIndex--;
    } else {
      comps.push(sortedProperties[rightIndex]);
      rightIndex++;
    }
  }
  
  res.json(comps);
});

// INTERVIEW CHALLENGE 2: Unique Values Extraction
// Return the unique set of zip codes from the dataset
app.get('/api/zips', (req, res) => {
  // Use Set for O(1) deduplication - shows knowledge of JS collections
  const uniqueZips = [...new Set(properties.map(p => p.zip))];
  res.json(uniqueZips.sort()); // Sort for consistent response
});

// INTERVIEW CHALLENGE 3: Prefix Search / Suggestions
// Given an address prefix, return up to 10 matching addresses
app.get('/api/address-suggestions/:prefix', (req, res) => {
  const { prefix = '' } = req.params;
  const { limit = 10 } = req.query;
  const maxResults = Math.min(parseInt(limit), 50); // Cap results
  
  if (!prefix || prefix.length < 2) {
    return res.json([]);
  }
  
  // Case-insensitive prefix matching with early termination
  const suggestions = [];
  const searchPrefix = prefix.toLowerCase();
  
  for (const property of properties) {
    if (suggestions.length >= maxResults) break;
    
    const address = property.address.toLowerCase();
    if (address.startsWith(searchPrefix)) {
      suggestions.push({
        id: property.id,
        address: property.address,
        zip: property.zip,
        price: property.price,
        title: property.title
      });
    }
  }
  
  res.json(suggestions);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET /api/properties - Get all properties (with optional filters)`);
  console.log(`  GET /api/properties/:id - Get property by ID`);
  console.log(`  POST /api/contact - Submit contact form`);
  console.log(`  GET /api/stats - Get property statistics`);
  console.log(`\n--- Interview Challenge Endpoints ---`);
  console.log(`  GET /api/comps/:zip/:price/:count - Find price comparables in same zip`);
  console.log(`  GET /api/zips - Get unique zip codes`);
  console.log(`  GET /api/address-suggestions/:prefix - Address prefix search`);
});