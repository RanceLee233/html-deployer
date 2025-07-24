# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HTML Deployer is a web application that allows users to deploy and manage HTML content using Notion as a backend database for persistent storage. The project consists of:

- **Frontend**: Vanilla HTML/CSS/JavaScript (`index.html`, `script.js`, `styles.css`)
- **Backend**: Node.js Express server (`server.js`) that acts as a proxy to Notion API
- **Deployment**: Configured for Vercel with `vercel.json`

## Architecture

### Backend API Structure (`server.js`)
The Express server provides a REST API that interfaces with Notion:
- `GET /api/deployments` - Retrieves all deployed pages
- `POST /api/deploy` - Creates a new page deployment
- `GET /api/deployments/:id` - Gets a specific page's details  
- `DELETE /api/deployments/:id` - Archives/deletes a page

### Frontend Architecture (`script.js`)
- Environment-aware API base URL switching (localhost vs production)
- Async/await pattern for all API calls
- DOM manipulation for dynamic content rendering
- Error handling with user feedback

### Data Flow
1. Frontend sends requests to Express server endpoints
2. Server authenticates with Notion API using environment variables
3. Server formats Notion responses into simplified JSON for frontend consumption
4. Notion database stores pages with properties: 页面标题, HTML代码, 描述, 创建时间

## Development Commands

```bash
# Install dependencies
npm install

# Run server locally
node server.js
# or
npm start

# Server runs on http://localhost:3000
# Open index.html in browser to test frontend
```

## Notion Integration Details

### Required Environment Variables
- `NOTION_API_KEY`: Notion integration token (starts with `secret_` or `ntn_`)
- `NOTION_DATABASE_ID`: Target Notion database UUID

### Database Schema Requirements
The Notion database must have these exact property names (in Chinese):
- **页面标题**: Title type (page title)
- **HTML代码**: Text type (full HTML content)
- **描述**: Text type (short description)  
- **创建时间**: Created time type (auto-managed by Notion)

## Data Format Consistency

**Critical**: The backend transforms Notion's complex property structure into simplified objects:
```javascript
// Backend output format
{
  id: string,
  title: string,
  htmlContent: string, 
  description: string,
  createdAt: string
}
```

Frontend expects this exact format. When modifying API responses, maintain this structure to avoid breaking the UI.

## Deployment Configuration

### Vercel Setup (`vercel.json`)
- API routes (`/api/*`) → `server.js`
- Static files (`/`, `*.css`, `*.js`, `*.html`) → direct file serving
- Environment variables must be configured in Vercel dashboard

### Common Issues
- API 404 errors: Check `vercel.json` route configuration
- Data format mismatches: Ensure backend returns simplified objects, not raw Notion responses
- CORS issues: Server includes `cors()` middleware for cross-origin requests