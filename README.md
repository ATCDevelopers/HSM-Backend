# React Starter Template

A clean, modern React starter template with authentication, routing, UI
components, and a complete CRUD infrastructure. Perfect for building any type of
web application.

## Features

- **React 19** with TypeScript and Vite for fast development and optimized builds
- **React Compiler** enabled for automatic optimizations
- **TypeScript** for type safety and better developer experience
- **Authentication System** with JWT token support (Laravel Sanctum compatible)
- **Code Splitting** with lazy loading for optimal performance
- **Generic CRUD Components** for rapid development
- **Comprehensive UI Library** with reusable components
- **Tailwind CSS** for styling
- **Axios** with automatic case conversion (camelCase ↔ snake_case)
- **Toast Notifications** for user feedback
- **Responsive Design** with mobile-first approach
- **Configuration System** for easy project customization

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone or copy this template:

```bash
git clone <your-repo-url>
cd react-starter-template
```

2. Install dependencies:

```bash
npm install
```

3. Configure your environment:

```bash
cp .env.example .env
```

Edit `.env` with your API configuration:

```env
VITE_API_URL=http://localhost:8000/api/v1/
VITE_BASE_URL=http://localhost:8000
VITE_API_TOKEN_KEY=auth_token
VITE_NAME="Your App Name"
VITE_VERSION=1.0.0
```

4. Start the development server:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── atoms/          # Basic UI elements (Button, Input, etc.)
│   ├── layouts/        # Layout components (Header, Sidebar, etc.)
│   └── sections/       # Complex sections (Table, List, etc.)
├── config/             # Application configuration
│   └── projectConfig.ts # Centralized config
├── contexts/           # React contexts
│   └── ReferenceDataContext.tsx # Global reference data
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── crud/           # Generic CRUD pages
│   └── home/           # Home page
├── routes/             # React Router configuration
│   ├── AppRoutes.tsx   # Main routes
│   └── ProtectedRoute.tsx # Auth wrapper
├── services/           # API services
│   ├── api.ts          # Axios instance with interceptors
│   ├── authAPI.ts      # Authentication endpoints
│   └── resourceAPI.ts  # Resource API factory
└── auth/               # Authentication context
    ├── AuthContext.ts  # Auth context
    └── AuthProvider.tsx # Auth provider
```

## Configuration

The template uses a centralized configuration system in
`src/config/projectConfig.js`. You can customize:

- API endpoints and URLs
- Application metadata (name, version)
- Feature flags
- Authentication settings
- WebSocket configuration
- File upload limits

Environment variables can override the defaults in `projectConfig.js`.

## Adding New Resources

### 1. Create API Service

Use the `createResourceAPI` factory function:

```typescript
// src/services/resourceAPI.ts
import createResourceAPI from "./services/resourceAPI";

export const productAPI = createResourceAPI("products");
```

### 2. Create Page Components

Use the generic CRUD components:

```typescript
// src/pages/products/IndexProduct.tsx
import Index from "../crud/Index";
import { productAPI } from "../../services/resourceAPI";
import { getProductIndexColumns } from "./productData";

export default function IndexProduct() {
    return (
        <Index
            resourceName="Product"
            apiService={productAPI}
            columns={getPropertyIndexColumns()}
        />
    );
}
```

### 3. Add Routes

```javascript
// src/routes/AppRoutes.jsx
const IndexProduct = lazy(() => import("../pages/products/IndexProduct"));
const FormProduct = lazy(() => import("../pages/products/FormProduct"));
const ShowProduct = lazy(() => import("../pages/products/ShowProduct"));

// Add to routes:
<Route path="products" element={<IndexProduct/>}/>
<Route path="products/create" element={<FormProduct/>}/>
<Route path="products/:id" element={<ShowProduct/>}/>
<Route path="products/edit/:id" element={<FormProduct/>}/>
```

## Available Components

### UI Components (src/components/atoms/ui/)

- Button, Input, TextArea, Select
- Modal, Alert, Toaster, Tooltip
- Card, Badge, Breadcrumb, Dropdown
- Action, AuthUser

### Form Components (src/components/atoms/forms/)

- CheckBox, Radio, ToggleSwitch
- DateTimePicker, FileUpload
- FieldSet

### Layout Components (src/components/layouts/)

- BaseLayout, Header, Footer, Sidebar, Guest

### Section Components (src/components/sections/)

- Table, List

## API Integration

The template includes:

- **Automatic case conversion**: camelCase ↔ snake_case
- **Token management**: Automatic Bearer token injection
- **Error handling**: Centralized error handling with toasts
- **Response formatting**: Consistent response structure

## Authentication

The authentication system supports:

- Login/Register endpoints
- JWT token storage in localStorage
- Automatic token refresh
- Protected routes
- Permission-based access control

## Styling

The template uses Tailwind CSS with:

- Responsive design utilities
- Custom color palette
- Font customization (Roboto default)
- Component-specific styles

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## React Compiler

The React Compiler is enabled to automatically optimize your components. Note
that this may impact Vite dev & build performance.
See [React Compiler documentation](https://react.dev/learn/react-compiler) for
more information.

## Customization

### Remove Reference Data Provider

If you don't need global reference data, remove `ReferenceDataProvider` from
`App.jsx`:

```javascript
// Before
<AuthProvider>
    <ReferenceDataProvider>
        <AppRoutes/>
    </ReferenceDataProvider>
</AuthProvider>

// After
<AuthProvider>
    <AppRoutes/>
</AuthProvider>
```

### Change Router

The template uses `MemoryRouter`. To use `BrowserRouter`:

```javascript
// src/App.jsx
import {BrowserRouter} from "react-router-dom";

// Replace MemoryRouter with BrowserRouter
<BrowserRouter>
    <AuthProvider>
        <AppRoutes/>
    </AuthProvider>
</BrowserRouter>
```

### Customize Theme

Edit `tailwind.config.js` to customize fonts, colors, and other theme settings.

## Troubleshooting

### Build Issues

If you encounter build issues:

1. Clear node_modules and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

2. Check API configuration in `.env`
3. Verify all imports are correct
4. Check browser console for errors

### API Connection Issues

1. Verify API URL in `.env`
2. Check CORS settings on your backend
3. Ensure authentication token is valid
4. Check network tab in browser dev tools

## License

This template is provided as-is for use in your projects.

## Support

For issues and questions, please refer to the documentation or create an issue
in your repository.
