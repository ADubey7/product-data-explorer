# Product Data Explorer

A full-stack web application that scrapes and displays product data from World of Books, built with React, Next.js, and Express.js.

## Features

- **Live Data Scraping**: Real-time scraping from World of Books website
- **Hierarchical Navigation**: Browse from headings → categories → products → details
- **Search Functionality**: Search across all products with pagination
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Error Handling**: Comprehensive error handling and retry logic
- **Caching**: Intelligent caching system for improved performance
- **Loading States**: Smooth loading indicators throughout the app

## Tech Stack

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **Cheerio** for HTML parsing
- **Axios** for HTTP requests
- **Custom caching** system

## Project Structure

\`\`\`
product-data-explorer/
├── app/                          # Next.js app directory
│   ├── categories/[heading]/     # Category pages
│   ├── products/[category]/      # Product listing pages
│   ├── product/[id]/            # Product detail pages
│   ├── search/                  # Search results page
│   └── page.tsx                 # Homepage
├── components/                   # Reusable React components
│   ├── ui/                      # Shadcn/ui components
│   ├── navigation-breadcrumb.tsx
│   ├── search-header.tsx
│   ├── product-card.tsx
│   └── error-boundary.tsx
├── lib/                         # Utility libraries
│   ├── utils.ts                 # General utilities
│   └── api.ts                   # API client
└── server/                      # Backend Express server
    ├── middleware/              # Express middleware
    ├── utils/                   # Server utilities
    └── index.js                 # Main server file
\`\`\`

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
\`\`\`bash
cd server
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the root directory and install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The frontend will run on `http://localhost:3000`

## API Endpoints

- `GET /api/headings` - Get all top-level categories
- `GET /api/categories/:heading` - Get subcategories for a heading
- `GET /api/products/:category` - Get products in a category
- `GET /api/product/:id` - Get detailed product information
- `GET /api/search` - Search products
- `GET /api/health` - Health check endpoint
- `GET /api/cache/stats` - Cache statistics
- `DELETE /api/cache` - Clear cache

## Features in Detail

### Web Scraping
- Robust scraping with retry logic
- User-agent rotation to avoid blocking
- Graceful fallbacks when scraping fails
- Intelligent data extraction and cleaning

### Caching System
- In-memory caching with TTL (Time To Live)
- Automatic cleanup of expired entries
- Cache size limits to prevent memory issues
- Cache statistics and management endpoints

### Error Handling
- Comprehensive error boundaries in React
- Retry logic for failed requests
- User-friendly error messages
- Development vs production error details

### Performance
- Image optimization with Next.js
- Lazy loading and pagination
- Efficient caching strategies
- Responsive design for all devices

## Development

### Running in Development Mode

1. Start the backend server:
\`\`\`bash
cd server && npm run dev
\`\`\`

2. Start the frontend (in a new terminal):
\`\`\`bash
npm run dev
\`\`\`

### Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NODE_ENV=development
\`\`\`

### Building for Production

1. Build the frontend:
\`\`\`bash
npm run build
\`\`\`

2. Start the production server:
\`\`\`bash
npm start
\`\`\`

## Deployment

### Backend Deployment
The backend can be deployed to any Node.js hosting service (Heroku, Railway, DigitalOcean, etc.)

### Frontend Deployment
The frontend can be deployed to Vercel, Netlify, or any static hosting service.

Make sure to update the `NEXT_PUBLIC_API_URL` environment variable to point to your deployed backend.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
