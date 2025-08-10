# Family Calendar

A comprehensive family calendar and chore management system built with SolidJS. Organize your family life with events, chores, and point-based rewards.

## Features

- **Family Members Management** - Add family members with unique colors and track individual schedules
- **Calendar Events** - Create one-time and recurring events with intuitive calendar view
- **Chores & Points System** - Assign chores with point values and track completion
- **Mobile Responsive** - Optimized for tablets and mobile devices
- **Local Storage** - All data stored locally in browser for privacy
- **Real-time Updates** - Reactive UI updates when completing tasks

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

# Start development server
npm run dev
```

### Building from Source

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

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
