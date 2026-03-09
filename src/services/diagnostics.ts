import { socketService } from './socket';

export type DiagnosticStatus = 'healthy' | 'warning' | 'critical' | 'checking';

export interface DiagnosticResult {
  id: string;
  name: string;
  status: DiagnosticStatus;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  technicalDetails?: string;
}

class DiagnosticService {
  private results: Map<string, DiagnosticResult> = new Map();
  private listeners: Set<(results: DiagnosticResult[]) => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    this.runAllChecks();
    setInterval(() => this.runAllChecks(), 30000); // Periodic check
  }

  public subscribe(callback: (results: DiagnosticResult[]) => void) {
    this.listeners.add(callback);
    callback(this.getAllResults());
    return () => this.listeners.delete(callback);
  }

  private notify() {
    const results = this.getAllResults();
    this.listeners.forEach(cb => cb(results));
  }

  public getAllResults(): DiagnosticResult[] {
    return Array.from(this.results.values());
  }

  public async runAllChecks() {
    await Promise.all([
      this.checkGeminiAPI(),
      this.checkGoogleMapsAPI(),
      this.checkNetwork(),
      this.checkSocket(),
      this.checkPermissions(),
      this.checkBrowserSupport(),
      this.checkUIHealth()
    ]);
    this.notify();
  }

  private async checkUIHealth() {
    const hiddenCount = (window as any).ASTRANOV_HIDDEN_BUTTONS_COUNT || 0;
    const isSystemOff = (window as any).ASTRANOV_SYSTEM_ACTIVE === false;

    if (isSystemOff) {
      this.results.set('ui_power', {
        id: 'ui_power',
        name: 'System Power',
        status: 'critical',
        message: 'The system is currently powered down. Most interface elements are disabled.',
        actionLabel: 'Power Up System',
        onAction: () => {
          if ((window as any).ASTRANOV_TOGGLE_POWER) (window as any).ASTRANOV_TOGGLE_POWER();
          this.runAllChecks();
        }
      });
    } else {
      this.results.delete('ui_power');
    }

    if (hiddenCount > 0) {
      this.results.set('ui_buttons', {
        id: 'ui_buttons',
        name: 'Interface Layout',
        status: 'warning',
        message: `${hiddenCount} system buttons are currently docked/hidden.`,
        actionLabel: 'Restore All Buttons',
        onAction: () => {
          if ((window as any).ASTRANOV_RESTORE_BUTTONS) (window as any).ASTRANOV_RESTORE_BUTTONS();
          this.runAllChecks();
        }
      });
    } else {
      this.results.delete('ui_buttons');
    }
  }

  private async checkGeminiAPI() {
    const hasKey = !!process.env.GEMINI_API_KEY;
    this.results.set('gemini', {
      id: 'gemini',
      name: 'Gemini AI Engine',
      status: hasKey ? 'healthy' : 'critical',
      message: hasKey ? 'AI Core is operational.' : 'Gemini API Key is missing.',
      technicalDetails: hasKey ? 'Key detected in environment.' : 'Missing GEMINI_API_KEY.'
    });
  }

  private async checkGoogleMapsAPI() {
    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAMYYBnaazrVUTAx9i11HMR0JHwMwIaScA';
    const hasKey = !!GOOGLE_MAPS_API_KEY;
    const mapError = (window as any).ASTRANOV_MAP_ERROR;
    
    let message = 'Maps key detected.';
    let status: DiagnosticStatus = 'healthy';
    let actionLabel = undefined;
    let onAction = undefined;

    if (!hasKey) {
      status = 'critical';
      message = 'CRITICAL: Google Maps API Key is missing.';
      actionLabel = 'Setup Guide';
      onAction = () => window.open('https://developers.google.com/maps/documentation/javascript/get-api-key', '_blank');
    } else if (mapError === 'ApiProjectMapError') {
      status = 'critical';
      message = 'API_PROJECT_ERROR: Maps JavaScript API is not enabled or key is restricted.';
      actionLabel = 'Enable API';
      onAction = () => window.open('https://console.cloud.google.com/google/maps-apis/api-list', '_blank');
    } else if (mapError) {
      status = 'critical';
      message = `Map Error: ${mapError}`;
      actionLabel = 'Troubleshoot';
      onAction = () => window.open('https://developers.google.com/maps/documentation/javascript/error-messages', '_blank');
    }

    this.results.set('maps', {
      id: 'maps',
      name: 'Geospatial Core',
      status,
      message,
      technicalDetails: mapError ? `Error: ${mapError}` : hasKey ? 'Key detected in environment.' : 'Missing GOOGLE_MAPS_API_KEY in .env.',
      actionLabel,
      onAction
    });
  }

  private async checkNetwork() {
    const isOnline = navigator.onLine;
    this.results.set('network', {
      id: 'network',
      name: 'Network Connectivity',
      status: isOnline ? 'healthy' : 'critical',
      message: isOnline ? 'System is online.' : 'System is offline.',
      actionLabel: !isOnline ? 'Retry Connection' : undefined,
      onAction: () => window.location.reload()
    });
  }

  private async checkSocket() {
    const isConnected = socketService.isConnected();
    this.results.set('socket', {
      id: 'socket',
      name: 'Real-time Sync',
      status: isConnected ? 'healthy' : 'warning',
      message: isConnected ? 'Socket connection active.' : 'Socket disconnected.',
      actionLabel: !isConnected ? 'Refresh System' : undefined,
      onAction: () => {
        window.location.reload();
      }
    });
  }

  private async checkBrowserSupport() {
    const hasSpeech = 'speechSynthesis' in window;
    const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    this.results.set('browser', {
      id: 'browser',
      name: 'Interface Engine',
      status: hasSpeech && hasRecognition ? 'healthy' : 'warning',
      message: hasSpeech ? 'Voice synthesis active.' : 'Voice synthesis unavailable.',
      technicalDetails: `Speech: ${hasSpeech}, Recognition: ${hasRecognition}`
    });
  }

  private async checkPermissions() {
    try {
      const geo = await navigator.permissions.query({ name: 'geolocation' as any });
      this.results.set('geo_perm', {
        id: 'geo_perm',
        name: 'Location Access',
        status: geo.state === 'granted' ? 'healthy' : geo.state === 'prompt' ? 'warning' : 'critical',
        message: geo.state === 'granted' ? 'Location access granted.' : 'Location access restricted.',
        actionLabel: geo.state !== 'granted' ? 'Request Access' : undefined,
        onAction: () => navigator.geolocation.getCurrentPosition(() => this.runAllChecks())
      });

      try {
        const cam = await navigator.permissions.query({ name: 'camera' as any });
        this.results.set('cam_perm', {
          id: 'cam_perm',
          name: 'Visual Sensors',
          status: cam.state === 'granted' ? 'healthy' : cam.state === 'prompt' ? 'warning' : 'critical',
          message: cam.state === 'granted' ? 'Camera access granted.' : 'Camera access restricted.',
          actionLabel: cam.state !== 'granted' ? 'Request Access' : undefined,
          onAction: () => navigator.mediaDevices.getUserMedia({ video: true }).then(() => this.runAllChecks())
        });
      } catch (e) {}

      try {
        const mic = await navigator.permissions.query({ name: 'microphone' as any });
        this.results.set('mic_perm', {
          id: 'mic_perm',
          name: 'Audio Sensors',
          status: mic.state === 'granted' ? 'healthy' : mic.state === 'prompt' ? 'warning' : 'critical',
          message: mic.state === 'granted' ? 'Microphone access granted.' : 'Microphone access restricted.',
          actionLabel: mic.state !== 'granted' ? 'Request Access' : undefined,
          onAction: () => navigator.mediaDevices.getUserMedia({ audio: true }).then(() => this.runAllChecks())
        });
      } catch (e) {}
    } catch (e) {
      // Some browsers don't support permissions.query for all types
    }
  }

  public async autoFix() {
    const criticals = this.getAllResults().filter(r => r.status === 'critical' || r.status === 'warning');
    for (const result of criticals) {
      if (result.onAction) {
        console.log(`Auto-fixing: ${result.name}`);
        result.onAction();
      }
    }
    await this.runAllChecks();
  }
}

export const diagnosticService = new DiagnosticService();
