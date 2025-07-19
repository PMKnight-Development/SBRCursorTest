# SBR CAD - Summit Bechtel Reserve Computer Aided Dispatch System

A modern, cloud-based Computer Aided Dispatch (CAD) system designed specifically for the Summit Bechtel Reserve's unique public safety requirements during large-scale events and daily operations.

## 🚨 Overview

The SBR CAD system is a comprehensive emergency management platform that provides real-time dispatch capabilities, unit tracking, incident management, and reporting for the Summit Bechtel Reserve's public safety operations. Built to handle the unique challenges of large-scale events like the National Jamboree while remaining efficient for daily camp operations.

## ✨ Key Features

### 🚔 Calls for Service Management
- **Customizable Call Types**: Fully configurable call natures with priorities and response plans
- **Protocol-Driven Dispatch**: ProQA-style workflow guidance for dispatchers
- **Location Services**: GPS pinning and Points of Interest (POI) integration
- **Caller Information**: Comprehensive caller data collection and management
- **Unit Assignment**: Intelligent unit assignment with group-based notifications

### 🚑 Unit Management
- **Real-Time Tracking**: GPS location updates every 30-60 seconds
- **Status Management**: Complete unit status lifecycle tracking
- **Group-Based Operations**: Organized unit groups (EMS, Fire, Security, etc.)
- **Availability Monitoring**: Real-time unit availability and assignment tracking

### 🗺️ Mapping & Location Services
- **ArcGIS Integration**: Seamless integration with ArcGIS Field Maps
- **POI Management**: Customizable Points of Interest with search capabilities
- **Real-Time Visualization**: Live unit and incident mapping
- **Location History**: Complete location tracking and history

### 📊 Reporting & Analytics
- **Custom Reports**: Flexible report generation with multiple formats
- **Performance Metrics**: Response times, call volumes, and unit performance
- **Data Export**: PDF, Excel, CSV, and JSON export capabilities
- **Historical Analysis**: Comprehensive historical data analysis

### 🔔 Notifications & Communication
- **Active911 Integration**: Seamless integration with Active911 platform
- **Real-Time Alerts**: Instant notifications for critical events
- **Email Notifications**: Configurable email alert system
- **WebSocket Updates**: Real-time updates across all connected clients

### 👥 User Management & Security
- **Role-Based Access**: Dispatcher, Admin, Supervisor, Field Unit, and Viewer roles
- **Secure Authentication**: JWT-based authentication with refresh tokens
- **Audit Logging**: Complete system activity logging
- **Session Management**: Secure session handling and timeout controls

## 🏗️ Architecture

### Backend Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with middleware stack
- **Database**: PostgreSQL with Knex.js ORM
- **Real-Time**: Socket.IO for WebSocket connections
- **Caching**: Redis for session and data caching
- **Authentication**: JWT with bcrypt password hashing

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) with custom theme
- **State Management**: React Query for server state
- **Routing**: React Router v6
- **Maps**: React Leaflet with OpenStreetMap
- **Forms**: React Hook Form with Yup validation

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for development
- **Cloud Ready**: Optimized for DigitalOcean deployment
- **Auto-scaling**: Designed for horizontal scaling
- **Monitoring**: Built-in health checks and logging

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 15+ (for local development)
- Redis 7+ (for local development)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sbr-cad
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   docker-compose exec backend npm run db:migrate
   ```

5. **Seed initial data**
   ```bash
   docker-compose exec backend npm run db:seed
   ```

6. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - Database: localhost:5432
   - Redis: localhost:6379

### Manual Setup

1. **Install dependencies**
   ```bash
   npm install
   cd client && npm install
   ```

2. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb sbr_cad
   
   # Run migrations
   npm run db:migrate
   
   # Seed data
   npm run db:seed
   ```

3. **Start development servers**
   ```bash
   # Terminal 1: Backend
   npm run dev:server
   
   # Terminal 2: Frontend
   npm run dev:client
   ```

## 🌐 Production Deployment

### DigitalOcean Deployment

1. **Create Droplet**
   ```bash
   # Use DigitalOcean CLI or web interface
   doctl compute droplet create sbr-cad \
     --size s-2vcpu-4gb \
     --image docker-20-04 \
     --region nyc1
   ```

2. **Deploy with Docker**
   ```bash
   # Build and run
   docker build -t sbr-cad .
   docker run -d -p 80:3000 --name sbr-cad sbr-cad
   ```

3. **Set up reverse proxy (optional)**
   ```bash
   # Configure nginx for SSL termination
   # See nginx.conf.example
   ```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Application
NODE_ENV=production
PORT=3000
CLIENT_PORT=3001

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=sbr_cad
DB_SSL=true

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@sbr-cad.com

# Active911 Integration (optional)
ACTIVE911_API_KEY=your-active911-api-key
ACTIVE911_BASE_URL=https://api.active911.com

# ArcGIS Integration (optional)
ARCGIS_API_KEY=your-arcgis-api-key
ARCGIS_BASE_URL=https://services.arcgis.com

# CORS
CORS_ORIGIN=https://your-domain.com

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# GPS Settings
GPS_UPDATE_INTERVAL=30
GPS_ACCURACY_THRESHOLD=50

# Notifications
EMAIL_NOTIFICATIONS=true
ACTIVE911_NOTIFICATIONS=true
WEBHOOK_NOTIFICATIONS=false
WEBHOOK_URL=

# Reports
REPORTS_STORAGE_PATH=./reports
REPORTS_RETENTION_DAYS=90

# Security
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=3600

# Features
REAL_TIME_TRACKING=true
MAP_INTEGRATION=true
REPORTING=true
NOTIFICATIONS=true
```

## 📋 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token

### Calls Endpoints
- `GET /api/calls` - List calls with filters
- `POST /api/calls` - Create new call
- `GET /api/calls/:id` - Get call details
- `PUT /api/calls/:id` - Update call
- `DELETE /api/calls/:id` - Delete call

### Units Endpoints
- `GET /api/units` - List units with filters
- `POST /api/units` - Create new unit
- `GET /api/units/:id` - Get unit details
- `PUT /api/units/:id` - Update unit
- `PUT /api/units/:id/status` - Update unit status
- `PUT /api/units/:id/location` - Update unit location

### Admin Endpoints
- `GET /api/admin/users` - Manage users
- `GET /api/admin/call-types` - Manage call types
- `GET /api/admin/unit-groups` - Manage unit groups
- `GET /api/admin/pois` - Manage Points of Interest
- `GET /api/admin/config` - System configuration

### Reports Endpoints
- `GET /api/reports` - List reports
- `POST /api/reports` - Generate new report
- `GET /api/reports/:id` - Get report details
- `GET /api/reports/:id/download` - Download report file

## 🔧 Configuration

### Call Types
Configure call types through the admin interface:
- Name and description
- Default priority (1-4)
- Response plan
- Protocol questions

### Unit Groups
Organize units into logical groups:
- EMS (Emergency Medical Services)
- Fire (Fire and Rescue)
- Security (Security and Law Enforcement)
- Search & Rescue
- Support (Logistics and Support)

### Points of Interest
Add and manage POIs:
- Buildings and facilities
- Trails and activity areas
- Camp sites
- Emergency exits
- Water sources
- Parking areas

## 📊 Monitoring & Logging

### Health Checks
- Application health: `GET /health`
- Database connectivity
- Redis connectivity
- WebSocket connections

### Logging
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- HTTP access logs via Morgan
- Structured JSON logging with Winston

### Metrics
- Call volume and response times
- Unit availability and performance
- System performance metrics
- User activity tracking

## 🔒 Security Features

- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API rate limiting protection
- **CORS**: Configurable cross-origin resource sharing
- **HTTPS**: SSL/TLS encryption in production
- **Audit Logging**: Complete system activity tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core CAD functionality
- ✅ Real-time unit tracking
- ✅ Call management
- ✅ Basic reporting

### Phase 2 (Planned)
- 🔄 Advanced mapping features
- 🔄 Mobile app for field units
- 🔄 Advanced analytics dashboard
- 🔄 Integration with external systems

### Phase 3 (Future)
- 📋 AI-powered dispatch recommendations
- 📋 Predictive analytics
- 📋 Advanced resource optimization
- 📋 Multi-site support

---

**Built with ❤️ for the Summit Bechtel Reserve** 