# Sales Soldier Expiry Management

This repository manages license expiration and device security for the Sales Soldier application.

## Repository Structure

- `expiry_config.json` - Main license configuration
- `devices/` - Device management and security tracking
- `analytics/` - Usage and geographic statistics
- `templates/` - JSON templates for consistency
- `index.html` - Beautiful dashboard interface
- `assets/` - CSS and JavaScript files for the dashboard

## 🎨 Dashboard

A beautiful, modern web dashboard is available to visualize and monitor your device data.

### Features
- **Real-time device monitoring** with animated counters
- **Interactive charts** showing device status distribution
- **Security incident tracking** with severity levels
- **Geographic distribution** of devices
- **Responsive design** that works on all devices
- **Dark theme** with glassmorphism effects

### 🚀 Running the Dashboard Locally

To view the dashboard, you need to run a local HTTP server to avoid CORS issues:

```bash
# Navigate to the project directory
cd /path/to/SalesSoldierExpiry

# Start Python HTTP server
python3 -m http.server 8000

# Open your browser and go to:
# http://localhost:8000
```

**Important:** Do not open `index.html` directly in the browser as it will cause CORS errors. Always use the HTTP server.

### 🌐 GitHub Pages

The dashboard is also available on GitHub Pages at:
https://SSKINNOVATORS.github.io/SalesSoldierExpiry

## Security Features

- Device fingerprinting and registration
- Time manipulation detection
- Strike-based blocking system
- Comprehensive audit trails

## Maintenance

This repository is automatically updated by the Sales Soldier application. Manual modifications should be done carefully to avoid breaking the license system.

Last Updated: 2025-06-24
