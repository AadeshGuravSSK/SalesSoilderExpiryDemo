// Dashboard App Class
class SalesSoldierDashboard {
  constructor() {
    this.data = {
      config: null,
      devices: null,
      blockedDevices: null,
      incidents: null,
      dailyStats: null,
      geoStats: null,
    };

    this.charts = {};
    this.currentTab = "overview";

    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.renderOverview();
    this.updateSystemStatus();
    this.startAutoRefresh();
  }

  // Data Loading
  async loadData() {
    try {
      // Add cache busting timestamp to prevent GitHub Pages caching issues
      const cacheBuster = `?t=${Date.now()}`;

      // Load each file individually with error handling and cache busting
      const config = await fetch(`./expiry_config.json${cacheBuster}`)
        .then((r) => r.json())
        .catch(() => null);
      const devices = await fetch(
        `./devices/registered_devices.json${cacheBuster}`
      )
        .then((r) => r.json())
        .catch(() => null);
      const blocked = await fetch(
        `./devices/blocked_devices.json${cacheBuster}`
      )
        .then((r) => r.json())
        .catch(() => null);
      const incidents = await fetch(
        `./devices/security_incidents.json${cacheBuster}`
      )
        .then((r) => r.json())
        .catch(() => null);
      const daily = await fetch(`./analytics/daily_stats.json${cacheBuster}`)
        .then((r) => r.json())
        .catch(() => null);
      const geo = await fetch(
        `./analytics/geographic_distribution.json${cacheBuster}`
      )
        .then((r) => r.json())
        .catch(() => null);

      this.data = { config, devices, blocked, incidents, daily, geo };
      console.log("Data loaded successfully", this.data);

      // Log what data we actually got
      console.log("Config:", config);
      console.log("Devices:", devices);
      console.log("Blocked:", blocked);
      console.log("Geographic:", geo);

      // Show data freshness indicator
      const lastUpdated =
        config?.last_updated || devices?.metadata?.last_updated;
      if (lastUpdated) {
        console.log(`Data last updated: ${lastUpdated}`);
        this.showDataFreshness(lastUpdated);
      }

      // Validate data consistency
      this.validateDataConsistency();
    } catch (error) {
      console.error("Error loading data:", error);
      this.showError("Failed to load dashboard data");
    }
  }

  // Event Listeners
  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Auto-refresh data every 30 seconds
    setInterval(() => {
      this.loadData().then(() => {
        this.updateMetrics();
        this.updateCharts();
      });
    }, 30000);
  }

  // Tab Switching
  switchTab(tabName) {
    if (tabName === this.currentTab) return;

    // Update navigation
    document
      .querySelectorAll(".nav-btn")
      .forEach((btn) => btn.classList.remove("active"));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

    // Update content
    document
      .querySelectorAll(".tab-content")
      .forEach((content) => content.classList.remove("active"));
    document.getElementById(tabName).classList.add("active");

    this.currentTab = tabName;

    // Load tab-specific content
    switch (tabName) {
      case "overview":
        this.renderOverview();
        break;
      case "devices":
        this.renderDevices();
        break;
      case "security":
        this.renderSecurity();
        break;
      case "analytics":
        this.renderAnalytics();
        break;
    }
  }

  // Overview Tab
  renderOverview() {
    this.updateMetrics();
    this.createStatusChart();
  }

  updateMetrics() {
    // Count actual devices instead of relying on potentially stale metadata
    const devices = this.data.devices?.devices || [];
    const totalDevices = devices.length;
    const activeDevices = devices.filter((d) => d.status === "active").length;

    // For blocked devices, also count from actual data
    const blockedDevicesFromDevices = devices.filter(
      (d) => d.status === "blocked"
    ).length;
    const blockedDevicesFromFile = this.data.blocked?.devices?.length || 0;
    const blockedDevices = Math.max(
      blockedDevicesFromDevices,
      blockedDevicesFromFile
    );

    // Count actual incidents
    const totalIncidents = this.data.incidents?.incidents?.length || 0;

    console.log("Updating metrics (corrected):", {
      totalDevices,
      activeDevices,
      blockedDevices,
      totalIncidents,
      devicesArrayLength: devices.length,
      metadataTotal: this.data.devices?.metadata?.total_devices,
    });

    this.animateCounter("totalDevices", totalDevices);
    this.animateCounter("activeDevices", activeDevices);
    this.animateCounter("blockedDevices", blockedDevices);
    this.animateCounter("incidents", totalIncidents);
  }

  animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentValue = Math.floor(
        startValue + (targetValue - startValue) * this.easeOutQuart(progress)
      );
      element.textContent = currentValue;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  createStatusChart() {
    const ctx = document.getElementById("statusChart").getContext("2d");

    if (this.charts.statusChart) {
      this.charts.statusChart.destroy();
    }

    // Use actual device counts for chart consistency
    const devices = this.data.devices?.devices || [];
    const totalDevices = devices.length;
    const activeDevices = devices.filter(d => d.status === 'active').length;
    const blockedDevicesFromDevices = devices.filter(d => d.status === 'blocked').length;
    const blockedDevicesFromFile = this.data.blocked?.devices?.length || 0;
    const blockedDevices = Math.max(blockedDevicesFromDevices, blockedDevicesFromFile);
    const suspendedDevices = Math.max(
      0,
      totalDevices - activeDevices - blockedDevices
    );

    this.charts.statusChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Active", "Blocked", "Suspended"],
        datasets: [
          {
            data: [activeDevices, blockedDevices, suspendedDevices],
            backgroundColor: [
              "rgba(78, 205, 196, 0.8)",
              "rgba(255, 107, 107, 0.8)",
              "rgba(255, 230, 109, 0.8)",
            ],
            borderColor: [
              "rgba(78, 205, 196, 1)",
              "rgba(255, 107, 107, 1)",
              "rgba(255, 230, 109, 1)",
            ],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#b8b8cc",
              font: { family: "Inter" },
            },
          },
          tooltip: {
            backgroundColor: "rgba(26, 26, 37, 0.9)",
            titleColor: "#ffffff",
            bodyColor: "#b8b8cc",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
          },
        },
      },
    });
  }

  // Devices Tab
  renderDevices() {
    const devicesList = document.getElementById("devicesList");
    const devices = this.data.devices?.devices || [];

    if (devices.length === 0) {
      devicesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-mobile-alt"></i>
                    <h3>No devices registered</h3>
                    <p>Devices will appear here once they connect to the system</p>
                </div>
            `;
      return;
    }

    // Create device cards with real data
    devicesList.innerHTML = devices
      .map((device) => this.createDeviceCard(device))
      .join("");

    console.log(`Rendered ${devices.length} devices`);
  }

  createDeviceCard(device) {
    const statusClass =
      device.status === "active" ? "status-active" : "status-blocked";
    const lastSeen = new Date(device.last_seen).toLocaleDateString();

    return `
            <div class="device-card">
                <div class="device-header">
                    <h3>${device.device_model || "Unknown Device"}</h3>
                    <span class="device-status ${statusClass}">${
      device.status
    }</span>
                </div>
                <div class="device-info">
                    <p><i class="fas fa-mobile-alt"></i> ${device.platform}</p>
                    <p><i class="fas fa-clock"></i> Last seen: ${lastSeen}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${
                      device.location?.country || "Unknown"
                    }</p>
                    <p><i class="fas fa-exclamation-triangle"></i> Strikes: ${
                      device.strikes || 0
                    }</p>
                </div>
            </div>
        `;
  }

  // Security Tab
  renderSecurity() {
    const securityContent = document.getElementById("securityContent");
    const incidents = this.data.incidents?.incidents || [];
    const severityCounts = this.data.incidents?.metadata?.severity_counts || {};

    securityContent.innerHTML = `
            <div class="security-card">
                <h3>Threat Overview</h3>
                <div class="security-metric">
                    <span>Critical Incidents</span>
                    <span class="text-danger">${
                      severityCounts.critical || 0
                    }</span>
                </div>
                <div class="security-metric">
                    <span>High Priority</span>
                    <span class="text-warning">${
                      severityCounts.high || 0
                    }</span>
                </div>
                <div class="security-metric">
                    <span>Medium Priority</span>
                    <span class="text-warning">${
                      severityCounts.medium || 0
                    }</span>
                </div>
                <div class="security-metric">
                    <span>Low Priority</span>
                    <span class="text-muted">${severityCounts.low || 0}</span>
                </div>
            </div>
            
            <div class="security-card">
                <h3>Recent Incidents</h3>
                ${
                  incidents.length === 0
                    ? `
                    <div class="empty-state">
                        <i class="fas fa-shield-check"></i>
                        <p>No security incidents</p>
                        <small>Your system is secure</small>
                    </div>
                `
                    : incidents
                        .slice(0, 5)
                        .map(
                          (incident) => `
                    <div class="incident-item">
                        <span class="incident-type">${
                          incident.incident_type
                        }</span>
                        <span class="incident-severity ${incident.severity}">${
                            incident.severity
                          }</span>
                        <small>${new Date(
                          incident.timestamp
                        ).toLocaleString()}</small>
                    </div>
                `
                        )
                        .join("")
                }
            </div>
        `;
  }

  // Analytics Tab
  renderAnalytics() {
    const analyticsContent = document.getElementById("analyticsContent");

    analyticsContent.innerHTML = `
            <div class="analytics-card">
                <h3>Usage Statistics</h3>
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <p>Analytics data will appear here</p>
                    <small>Usage patterns and trends will be displayed once data is available</small>
                </div>
            </div>
        `;
  }

  // System Status Updates
  updateSystemStatus() {
    const config = this.data.config;
    if (!config) return;

    const statusElement = document.getElementById("systemStatus");
    const expiryElement = document.getElementById("licenseExpiry");

    statusElement.textContent = config.is_active
      ? "System Active"
      : "System Inactive";
    statusElement.className = config.is_active ? "text-success" : "text-danger";

    const expiryDate = new Date(config.expiration_date);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    if (daysLeft > 30) {
      expiryElement.textContent = expiryDate.toLocaleDateString();
      expiryElement.className = "text-success";
    } else if (daysLeft > 7) {
      expiryElement.textContent = `${daysLeft} days left`;
      expiryElement.className = "text-warning";
    } else {
      expiryElement.textContent = `${daysLeft} days left`;
      expiryElement.className = "text-danger pulse";
    }
  }

  updateCharts() {
    if (this.currentTab === "overview") {
      this.createStatusChart();
    }
  }

  // Error Handling
  showError(message) {
    console.error(message);
    // You could show a toast notification here
  }

  // Data Validation
  validateDataConsistency() {
    const devices = this.data.devices?.devices || [];
    const metadataTotal = this.data.devices?.metadata?.total_devices || 0;
    const metadataActive = this.data.devices?.metadata?.active_devices || 0;
    const actualTotal = devices.length;
    const actualActive = devices.filter(d => d.status === 'active').length;
    
    if (metadataTotal !== actualTotal || metadataActive !== actualActive) {
      console.warn('⚠️ Data inconsistency detected:', {
        metadataTotal,
        actualTotal,
        metadataActive,
        actualActive,
        message: 'Metadata counts do not match actual device array. Using actual counts.'
      });
      
      // Show warning indicator
      this.showDataWarning('Data inconsistency detected - using actual device counts');
    }
  }
  
  showDataWarning(message) {
    const warningIndicator = document.createElement('div');
    warningIndicator.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      background: rgba(255, 152, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 1000;
      font-family: Inter, sans-serif;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 300px;
    `;
    warningIndicator.textContent = `⚠️ ${message}`;
    
    document.body.appendChild(warningIndicator);
    
    setTimeout(() => {
      warningIndicator.style.opacity = '0';
      setTimeout(() => warningIndicator.remove(), 300);
    }, 8000);
  }

  // Data Freshness Indicator
  showDataFreshness(lastUpdated) {
    const freshnessIndicator = document.createElement("div");
    freshnessIndicator.id = "data-freshness";
    freshnessIndicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(78, 205, 196, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 1000;
      transition: opacity 0.3s;
      font-family: Inter, sans-serif;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    const updateTime = new Date(lastUpdated);
    const now = new Date();
    const diffMinutes = Math.floor((now - updateTime) / (1000 * 60));

    if (diffMinutes < 1) {
      freshnessIndicator.textContent = "🟢 Data: Just updated";
      freshnessIndicator.style.background = "rgba(78, 205, 196, 0.9)";
    } else if (diffMinutes < 60) {
      freshnessIndicator.textContent = `🟡 Data: ${diffMinutes}m ago`;
      freshnessIndicator.style.background = "rgba(255, 230, 109, 0.9)";
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      freshnessIndicator.textContent = `🔴 Data: ${diffHours}h ago`;
      freshnessIndicator.style.background = "rgba(255, 107, 107, 0.9)";
    }

    // Remove existing indicator
    const existing = document.getElementById("data-freshness");
    if (existing) existing.remove();

    document.body.appendChild(freshnessIndicator);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      freshnessIndicator.style.opacity = "0";
      setTimeout(() => freshnessIndicator.remove(), 300);
    }, 5000);
  }

  // Auto-refresh
  startAutoRefresh() {
    // Refresh data every 30 seconds
    setInterval(async () => {
      await this.loadData();
      this.updateMetrics();
      this.updateSystemStatus();

      if (this.currentTab === "overview") {
        this.updateCharts();
      }
    }, 30000);
  }
}

// Utility Functions
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function timeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

// Initialize Dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SalesSoldierDashboard();

  // Add some loading animations
  document.body.classList.add("loading");
  setTimeout(() => {
    document.body.classList.remove("loading");
  }, 1000);
});

// Add smooth scroll behavior
document.documentElement.style.scrollBehavior = "smooth";

// Add keyboard navigation
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case "1":
        e.preventDefault();
        document.querySelector('[data-tab="overview"]').click();
        break;
      case "2":
        e.preventDefault();
        document.querySelector('[data-tab="devices"]').click();
        break;
      case "3":
        e.preventDefault();
        document.querySelector('[data-tab="security"]').click();
        break;
      case "4":
        e.preventDefault();
        document.querySelector('[data-tab="analytics"]').click();
        break;
    }
  }
});

// Add fancy console message
console.log(
  `
%c
╔═══════════════════════════════════════╗
║        Sales Soldier Dashboard        ║
║     Built with ❤️  and JavaScript     ║
╚═══════════════════════════════════════╝
%c
Welcome to the Sales Soldier Device Management Dashboard!
This beautiful interface was crafted to help you monitor and manage your devices.

🚀 Features:
• Real-time device monitoring
• Security incident tracking  
• Beautiful charts and analytics
• Responsive design
• Auto-refresh capabilities

Need help? Contact: dev.malekar@sskinnov.com
`,
  "color: #00f5ff; font-family: monospace; font-size: 12px;",
  "color: #b8b8cc; font-family: Inter, sans-serif;"
);
