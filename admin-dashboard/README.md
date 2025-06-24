# 🚌 Travel Booking Admin Dashboard

A modern, responsive Next.js admin dashboard for managing the travel booking system. Built with TypeScript, Tailwind CSS, and professional UI components.

## 🚀 Features

### 🔐 **Authentication**
- JWT token-based authentication
- Admin key authentication (for quick access)
- Secure session management
- Auto token refresh

### 📊 **Dashboard**
- Real-time statistics and metrics
- Revenue tracking
- Booking analytics
- System status monitoring
- Recent bookings overview

### 🛣️ **Route Management**
- Create, edit, and delete routes
- Route status management
- Search and filter capabilities
- Bulk operations

### 🚗 **Vehicle Management**
- Complete vehicle fleet management
- Vehicle type categorization (Bus, Van, Car)
- Seat configuration
- Pricing management
- Image upload support
- Route assignment

### 📅 **Booking Management**
- View all customer bookings
- Filter by status (Pending, Confirmed, Cancelled)
- Booking details modal
- Confirm/Cancel bookings
- Customer information management

### 💳 **Payment Tracking**
- Payment status monitoring
- Revenue analytics
- Transaction history
- Payment retry functionality

### 👥 **Admin Management**
- User role management
- Admin registration
- Profile management
- Activity tracking

### ⚙️ **System Settings**
- Configuration management
- System maintenance tools
- Expired seat cleanup
- Database optimization

## 🛠️ **Technology Stack**

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Charts**: Recharts
- **Authentication**: JWT + Cookie-based sessions

## 📦 **Installation**

### 1. **Navigate to Admin Dashboard**
```bash
cd admin-dashboard
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Environment Setup**
Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Travel Booking Admin
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 4. **Start Development Server**
```bash
npm run dev
```

The admin dashboard will be available at `http://localhost:3001`

## 🔧 **Configuration**

### **API Connection**
The dashboard connects to your backend API running on `http://localhost:3000`. Make sure your backend server is running before starting the admin dashboard.

### **Authentication Methods**

#### **1. JWT Authentication**
- Username: `testadmin`
- Password: `Admin123!`

#### **2. Admin Key Authentication**
- Admin Key: `your_super_secret_admin_key_2024`

## 📱 **Responsive Design**

The dashboard is fully responsive and works perfectly on:
- 🖥️ Desktop (1920px+)
- 💻 Laptop (1024px - 1919px)
- 📱 Tablet (768px - 1023px)
- 📱 Mobile (320px - 767px)

## 🎨 **UI Components**

### **Custom Components**
- **Button**: Multiple variants (primary, secondary, danger, ghost)
- **Input**: Form inputs with validation
- **Card**: Content containers
- **Table**: Data tables with sorting
- **Modal**: Overlay dialogs
- **Layout**: Sidebar navigation

### **Design System**
- **Colors**: Primary blue theme with semantic colors
- **Typography**: Inter font family
- **Spacing**: 8px grid system
- **Shadows**: Subtle elevation system
- **Animations**: Smooth transitions and micro-interactions

## 📊 **Dashboard Features**

### **Statistics Cards**
- Total bookings with growth indicators
- Revenue tracking with daily/monthly views
- Active vehicles and routes count
- System health monitoring

### **Charts & Analytics**
- Booking trends over time
- Revenue analytics
- Popular routes analysis
- Vehicle utilization rates

### **Real-time Updates**
- Live booking notifications
- Payment status updates
- System alerts
- Auto-refresh capabilities

## 🔒 **Security Features**

- **CSRF Protection**: Secure form submissions
- **XSS Prevention**: Input sanitization
- **Secure Headers**: Security-first configuration
- **Token Management**: Automatic token refresh
- **Role-based Access**: Permission-based UI

## 🚀 **Performance Optimizations**

- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Lazy Loading**: Component-level lazy loading
- **Caching**: Intelligent API response caching
- **Bundle Analysis**: Optimized bundle sizes

## 📱 **Mobile Experience**

- **Touch-friendly**: Large touch targets
- **Swipe Gestures**: Natural mobile interactions
- **Responsive Tables**: Horizontal scrolling
- **Mobile Navigation**: Collapsible sidebar
- **Optimized Forms**: Mobile-first form design

## 🔧 **Development**

### **Project Structure**
```
admin-dashboard/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components
│   │   ├── layout/         # Layout components
│   │   └── dashboard/      # Dashboard-specific components
│   ├── contexts/           # React contexts
│   ├── lib/               # Utilities and API clients
│   └── styles/            # Global styles
├── public/                # Static assets
└── package.json          # Dependencies and scripts
```

### **Available Scripts**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### **Code Quality**
- **TypeScript**: Full type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality checks

## 🌟 **Key Features Showcase**

### **1. Smart Dashboard**
- Real-time metrics and KPIs
- Interactive charts and graphs
- Quick action buttons
- System health indicators

### **2. Advanced Table Management**
- Sortable columns
- Advanced filtering
- Bulk operations
- Export functionality
- Pagination

### **3. Form Validation**
- Real-time validation
- Error handling
- Success feedback
- Auto-save capabilities

### **4. Modal System**
- Keyboard navigation
- Focus management
- Backdrop click handling
- Responsive sizing

### **5. Notification System**
- Toast notifications
- Success/Error states
- Auto-dismiss
- Action buttons

## 🔄 **API Integration**

The dashboard seamlessly integrates with your backend API:

### **Endpoints Used**
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/routes` - Route management
- `GET /api/admin/vehicles` - Vehicle management
- `GET /api/admin/bookings` - Booking management
- `POST /api/auth/login` - Authentication
- `POST /api/admin/maintenance/unlock-expired-seats` - System maintenance

### **Error Handling**
- Automatic retry logic
- User-friendly error messages
- Fallback UI states
- Network error detection

## 🎯 **Best Practices**

### **Performance**
- Optimized bundle sizes
- Lazy loading strategies
- Efficient re-rendering
- Memory leak prevention

### **Accessibility**
- WCAG 2.1 compliance
- Keyboard navigation
- Screen reader support
- High contrast support

### **SEO**
- Meta tag optimization
- Structured data
- Sitemap generation
- Performance metrics

## 🚀 **Deployment**

### **Build for Production**
```bash
npm run build
npm run start
```

### **Environment Variables**
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_APP_NAME=Travel Booking Admin
```

### **Deployment Platforms**
- ✅ Vercel (Recommended)
- ✅ Netlify
- ✅ AWS Amplify
- ✅ Docker containers

## 📞 **Support**

For technical support or questions:
- Check the component documentation
- Review the API integration guide
- Test with the demo credentials provided

---

**🎉 Your professional admin dashboard is ready to manage your travel booking system efficiently!**

## 🔗 **Quick Links**

- **Dashboard**: `http://localhost:3001/dashboard`
- **Login**: `http://localhost:3001/auth/login`
- **API Docs**: Check your backend README
- **Component Library**: `/src/components/ui/`

**Built with ❤️ for efficient travel business management**