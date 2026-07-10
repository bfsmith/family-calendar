# Family Calendar

A comprehensive family calendar and chore management system built with SolidJS and Vite. Organize your family life with events, chores, and point-based rewards.

## Features

- **Family Members Management** - Add family members with unique colors and track individual schedules
- **Calendar Events** - Create one-time and recurring events with intuitive calendar view
- **Chores & Points System** - Assign chores with point values and track completion
- **Progressive Web App (PWA)** - Install on any device, works offline, native app experience
- **Mobile Responsive** - Optimized for tablets and mobile devices
- **Local Storage** - All data stored locally in browser for privacy
- **Real-time Updates** - Reactive UI updates when completing tasks
- **Offline Support** - Continue using the app even without internet connection

## Quick Start

### Using Docker (Recommended)

Pull and run the latest image from GitHub Container Registry:

```bash
# Pull the latest image
docker pull ghcr.io/YOURUSERNAME/family-calendar:latest

# Run the container
docker run -p 3000:3000 ghcr.io/YOURUSERNAME/family-calendar:latest
```

Or use Docker Compose:

```bash
# Create docker-compose.yml with the pre-built image
version: '3.8'
services:
  family-calendar:
    image: ghcr.io/YOURUSERNAME/family-calendar:latest
    ports:
      - "3000:3000"
    restart: unless-stopped
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOURUSERNAME/family-calendar.git
cd family-calendar

# Install dependencies
npm install

# Start development server (Vite)
npm run dev
```

### Building from Source

```bash
# Install dependencies
npm install

# Build for production (Vite)
npm run build

# Preview production build locally
npm run serve

# Start production server (Docker recommended for deployment)
npm start
```

## Progressive Web App (PWA)

Family Calendar is a full-featured PWA that provides:

### 🔧 **Installation**
- **Browser Install Prompt**: Automatic install prompts on supported browsers
- **Desktop & Mobile**: Install on any device (Windows, macOS, iOS, Android)
- **Native App Experience**: Runs in standalone mode without browser UI

### 📱 **Offline Functionality**
- **Offline Indicator**: Visual notification when offline
- **Service Worker Caching**: Automatic caching of app assets and data
- **Offline Data Access**: Continue viewing and editing your calendar data without internet

### ⚡ **Performance Features**
- **Fast Loading**: Instant app startup with cached resources
- **Background Updates**: Automatic app updates without user intervention
- **Efficient Caching**: Smart caching strategy for optimal performance

## Technical Stack

- **Frontend Framework**: SolidJS (pure SolidJS without SolidStart)
- **Build Tool**: Vite with PWA plugin
- **Styling**: TailwindCSS with DaisyUI components
- **Routing**: @solidjs/router
- **Data Storage**: Browser local storage (client-side only)
- **PWA Features**: Service Worker, Web App Manifest, offline caching
- **Cache Strategy**: Workbox for efficient asset caching and offline support

## Docker Images

Docker images are automatically built and published to GitHub Container Registry on every push to main branch and for tagged releases.

Available tags:
- `latest` - Latest stable release from main branch
- `v1.0.0` - Specific version tags
- `main` - Latest from main branch
- `develop` - Latest from develop branch

### Multi-platform Support

Images are built for both AMD64 and ARM64 architectures, supporting:
- x86_64 servers and desktops
- Apple Silicon Macs (M1/M2)
- ARM-based servers and Raspberry Pi

## Usage

1. **Add Family Members** - Start by adding your family members with unique colors
2. **Create Events** - Add one-time or recurring events to the calendar
3. **Set Up Chores** - Create chores with optional point values
4. **Track Progress** - Complete chores to earn points and stay organized

## Technology Stack

- **Frontend**: SolidJS with TypeScript
- **Styling**: TailwindCSS with DaisyUI components
- **Storage**: Browser IndexedDB for local data persistence
- **Build Tool**: Vinxi
- **Deployment**: Docker with multi-stage builds

## Development

### Prerequisites

- Node.js 22 or later
- npm

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure build works
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Privacy

All data is stored locally in your browser using IndexedDB. No data is sent to external servers, ensuring complete privacy for your family information.


Sound effects were found on [Pixabay](https://pixabay.com/)
