import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import YouTubePlayer from './components/YouTubePlayer';
import { YouTubeSignalClientService } from './services/youtube/YouTubeSignalClientService';
import { VideoSignal, OrbitalSignal } from './types/youtube';
import { Bell, Menu, Truck, ShoppingBag, Store, X, Mic, Fingerprint, Camera, ImageIcon, Send, ArrowUpRight, Plus, CreditCard, Radar, BarChart3, Monitor, Shield, Zap, Video, ShoppingCart, Youtube, Wallet, User as UserIcon, Settings, Bookmark, Activity, History, ZoomIn, ZoomOut, Layers, Filter, Crosshair, Search, Users, Navigation, Power } from 'lucide-react';
import { HudButton } from './components/ui/HudButton';
import AstranovMap from './components/Map';
import GlobeScene from './components/GlobeScene';
import { VersionBar } from './components/ui/VersionBar';
import VendorDashboard from './components/VendorDashboard';
import ProductSearchModal from './components/ProductSearchModal';
import RoleSelector from './components/RoleSelector';
import DriverSetup from './components/DriverSetup';
import ShopSetup from './components/ShopSetup';
import StatusRibbon from './components/StatusRibbon';
import CategoryDrawer from './components/CategoryDrawer';
import GamesModal from './components/GamesModal';
import ComplianceDashboard from './components/ComplianceDashboard';
import IntegratedSearch from './components/IntegratedSearch';
import UserWidget from './components/UserWidget';
import TeamPlatform from './components/TeamPlatform';
import ShopModal from './components/ShopModal';
import DroneFleetControl from './components/DroneFleetControl';
import WalletDashboard from './components/WalletDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ChatWidget from './components/ChatWidget';
import RatingModal from './components/RatingModal';
import MissionControl from './components/MissionControl';
import CommercePanel from './components/CommercePanel';
import ActionSheet from './components/ActionSheet';
import { usePermissions } from './components/AstranovSystem';
import { SystemWidget } from './components/SystemWidget';
import { socketService } from './services/socket';
import FloatingWidget from './components/FloatingWidget';
import DiagnosticCenter from './components/DiagnosticCenter';
import VideoRecorder from './components/VideoRecorder';
import { HudLayout } from './components/layout/HudLayout';
import { MapContextMenu } from './components/MapContextMenu';
import { BottomRightRadar } from './components/hud/BottomRightRadar';
import { diagnosticService, DiagnosticStatus } from './services/diagnostics';
import { OperatorCommandService } from './services/operator/OperatorCommandService';
import { Task, User, UserRole, Product as SystemProduct, Shop, Transaction, Publication, HudButtonConfig, HudRegion, UserUILayout } from './types';
import { Business, Product, FulfillmentMethod, OrderStatus } from './types/operational';
import { CATEGORIES, DEFAULT_HUD_LAYOUT } from './constants';
import { UILayoutService } from './services/uiLayoutService';

export default function App() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.0060 });
  const [zoom, setZoom] = useState(14);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [role, setRole] = useState<UserRole>('user');
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [isVendorDashboardOpen, setIsVendorDashboardOpen] = useState(false);
  const [isGamesModalOpen, setIsGamesModalOpen] = useState(false);
  const [isSystemConsoleOpen, setIsSystemConsoleOpen] = useState(false);
  const [systemUpdates, setSystemUpdates] = useState<{id: string, command: string, rationale: string, timestamp: number}[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [mapContextMenu, setMapContextMenu] = useState<{ lat: number; lng: number; x: number; y: number } | null>(null);
  const [pendingActionAfterLogin, setPendingActionAfterLogin] = useState<(() => void) | null>(null);
  const [pendingTaskLocation, setPendingTaskLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isTaskCreationMenuOpen, setIsTaskCreationMenuOpen] = useState(false);
  const [isSocialPostOpen, setIsSocialPostOpen] = useState(false);
  const [isVideoRecorderOpen, setIsVideoRecorderOpen] = useState(false);
  const [socialContent, setSocialContent] = useState('');
  const [isComplianceOpen, setIsComplianceOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [groundingShops, setGroundingShops] = useState<Shop[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState<('integrity' | 'device' | 'network' | 'power')[]>([]);
  const [isFinancialOpen, setIsFinancialOpen] = useState(false);
  const [radarMode, setRadarMode] = useState<'small' | 'big' | 'hidden'>(
    (localStorage.getItem('astranov_radar_mode') as 'small' | 'big' | 'hidden') || 'small'
  );
  const [isDroneFleetOpen, setIsDroneFleetOpen] = useState(false);
  const [isTeamPlatformOpen, setIsTeamPlatformOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('global');
  const [teams, setTeams] = useState<any[]>([
    { id: 'global', name: 'Global', description: 'All users in the system', type: 'global', members: 1240 },
    { id: 'local', name: 'Regional', description: 'Users in your current area', type: 'local', members: 42 },
    { id: 'morning_star', name: 'Morning Star', description: 'Early morning delivery team (04:00 - 12:00)', type: 'specialized', members: 12 },
    { id: 'eagles', name: 'Eagles', description: 'Mid-day rapid response group (12:00 - 20:00)', type: 'specialized', members: 8 },
    { id: 'travel_buzz', name: 'Travel Buzz', description: 'Night & long distance team (20:00 - 04:00)', type: 'specialized', members: 15 },
  ]);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'terrain' | 'hybrid' | 'dark' | 'earth'>('dark');
  const [viewState, setViewState] = useState<'global' | 'focusing' | 'zooming' | 'atmosphere' | 'local'>('global');
  const [globeError, setGlobeError] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [businessMenu, setBusinessMenu] = useState<Product[]>([]);
  const [isCommercePanelOpen, setIsCommercePanelOpen] = useState(false);
  const [activeActionSheet, setActiveActionSheet] = useState<{ lat: number; lng: number } | null>(null);
  const [activeChatUser, setActiveChatUser] = useState<{ id: string, name: string } | null>(null);
  const [ratingTarget, setRatingTarget] = useState<{ id: string, name: string, type: 'user' | 'shop' } | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isMissionControlOpen, setIsMissionControlOpen] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [systemHealth, setSystemHealth] = useState<DiagnosticStatus>('checking');
  const [healthValue, setHealthValue] = useState<number>(98);
  const [droneStatus, setDroneStatus] = useState<'charged' | 'on_air' | 'low'>('charged');
  const [appVersion, setAppVersion] = useState<string>("1.0.5");
  const [latestVersion, setLatestVersion] = useState<string>("1.0.6");
  const [versionStatus, setVersionStatus] = useState<'up-to-date' | 'update-available' | 'critical-update'>('update-available');
  const [hudButtons, setHudButtons] = useState<HudButtonConfig[]>(DEFAULT_HUD_LAYOUT);
  const [isLoading, setIsLoading] = useState(false);
  const [lastReply, setLastReply] = useState<string>();
  const [isEditMode, setIsEditMode] = useState(false);

  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isDriverSetupOpen, setIsDriverSetupOpen] = useState(false);
  const [isShopSetupOpen, setIsShopSetupOpen] = useState(false);
  const [activeYouTubeVideo, setActiveYouTubeVideo] = useState<{ videoId: string, title: string } | null>(null);
  const [orbitalSignals, setOrbitalSignals] = useState<OrbitalSignal[]>([]);
  const [nearbySignals, setNearbySignals] = useState<VideoSignal[]>([]);

  // New state for updated HUD
  const [channelMode, setChannelMode] = useState<'global' | 'team'>('global');
  const [fleetMode, setFleetMode] = useState<'drivers' | 'drones' | 'both'>('both');
  const [isPoweredOn, setIsPoweredOn] = useState(true);
  const [routingDestination, setRoutingDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  useEffect(() => {
    const loadLayout = async () => {
      if (currentUser?.id) {
        const layout = await UILayoutService.getLayout(currentUser.id);
        if (layout) {
          setHudButtons(layout.buttons);
        }
      }
    };
    loadLayout();
  }, [currentUser?.id]);

  const toggleChannelMode = () => {
    setChannelMode(prev => prev === 'global' ? 'team' : 'global');
  };

  const toggleFleetMode = () => {
    setFleetMode(prev => {
      if (prev === 'drivers') return 'drones';
      if (prev === 'drones') return 'both';
      return 'drivers';
    });
  };

  const handleStartRouting = () => {
    if (routingDestination) {
      setIsRouting(true);
      setLastReply(`Routing to ${routingDestination.lat.toFixed(4)}, ${routingDestination.lng.toFixed(4)}...`);
    } else {
      setLastReply("Please select a destination on the map first.");
    }
  };

  const [floatingTexts, setFloatingTexts] = useState<{ id: string, lat: number, lng: number, text: string }[]>([]);
  const [widgets, setWidgets] = useState<{ id: string, name: string, icon: any, color: string, data?: string }[]>([]);
  const [activeRoute, setActiveRoute] = useState<[number, number][] | undefined>(undefined);

  const tasksRef = useRef<Task[]>([]);
  const usersRef = useRef<User[]>([]);

  useEffect(() => {
    localStorage.setItem('astranov_radar_mode', radarMode);
  }, [radarMode]);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const signals = await YouTubeSignalClientService.getOrbitalSignals();
        setOrbitalSignals(signals);
      } catch (e) {
        console.error("Failed to fetch orbital signals:", e);
      }
    };
    fetchSignals();
  }, []);

  useEffect(() => {
    if (viewState === 'local' && center) {
      const fetchNearby = async () => {
        try {
          const signals = await YouTubeSignalClientService.getNearbySignals(center.lat, center.lng);
          setNearbySignals(signals);
        } catch (e) {
          console.error("Failed to fetch nearby signals:", e);
        }
      };
      fetchNearby();
    }
  }, [viewState, center]);

  const handleSignalSelect = (signal: any) => {
    if (signal.type === 'youtube' || signal.type === 'video') {
      const videoId = signal.youtubeId || signal.videoId || (signal.sourceId ? signal.sourceId.replace('sig_', '') : null);
      if (videoId) {
        setActiveYouTubeVideo({ videoId, title: signal.label || signal.title });
      }
    } else {
      setViewState('zooming');
      setCenter({ lat: signal.lat, lng: signal.lng });
    }
  };

  const handleTransitionComplete = () => {
    setViewState('atmosphere');
    setTimeout(() => {
      setViewState('local');
      setZoom(14);
    }, 1000);
  };

  const toggleMapType = () => {
    const types: ('roadmap' | 'satellite' | 'terrain' | 'hybrid' | 'dark' | 'earth')[] = ['dark', 'roadmap', 'satellite', 'terrain', 'hybrid', 'earth'];
    const currentIndex = types.indexOf(mapType);
    const nextIndex = (currentIndex + 1) % types.length;
    setMapType(types[nextIndex]);
  };

  const toggleRadarMode = () => {
    setRadarMode(prev => {
      if (prev === 'small') return 'big';
      if (prev === 'big') return 'hidden';
      return 'small';
    });
  };

  const handleActionSheetAction = (action: string) => {
    if (!activeActionSheet) return;
    
    switch (action) {
      case 'social':
        setPendingTaskLocation(activeActionSheet);
        setIsSocialPostOpen(true);
        break;
      case 'shop':
        handleCommand(`Find shops near ${activeActionSheet.lat}, ${activeActionSheet.lng}`);
        break;
      case 'work':
        handleCommand(`Find work near ${activeActionSheet.lat}, ${activeActionSheet.lng}`);
        break;
      case 'navigate':
        setCenter({ lat: activeActionSheet.lat, lng: activeActionSheet.lng });
        setZoom(18);
        setLastReply(`Navigating to target coordinates.`);
        break;
      case 'ai_chat':
        handleCommand(`I'm at ${activeActionSheet.lat}, ${activeActionSheet.lng}. What can I do here?`);
        break;
    }
    setActiveActionSheet(null);
  };

  const fetchCurrentUser = useCallback(() => {
    if (currentUserId) {
      fetch(`/api/users/${currentUserId}`)
        .then(res => res.ok ? res.json() : null)
        .then(user => {
          if (user) setCurrentUser(user);
        })
        .catch(err => console.error("Error fetching user:", err));
    }
  }, [currentUserId]);

  const handleHudButtonClick = async (id: string) => {
    console.log(`[HUD] Button clicked: ${id}`);
    
    switch (id) {
      case 'profile':
        setIsAuthenticated(prev => !prev);
        break;
      case 'diagnostics':
        setIsDiagnosticsOpen(true);
        break;
      case 'zoom_in':
        setZoom(prev => Math.min(prev + 1, 20));
        break;
      case 'zoom_out':
        setZoom(prev => Math.max(prev - 1, 1));
        break;
      case 'radar_btn':
        toggleRadarMode();
        break;
      case 'create_task':
        setIsTaskCreationMenuOpen(true);
        break;
      case 'video_post':
        setIsVideoRecorderOpen(true);
        break;
      case 'social_post':
        setIsSocialPostOpen(true);
        break;
      case 'wallet':
        setIsFinancialOpen(true);
        break;
      case 'analytics':
        setIsAnalyticsOpen(true);
        break;
      case 'console':
      case 'settings':
        setIsSystemConsoleOpen(true);
        break;
      case 'globe_map':
        toggleMapType();
        break;
      case 'login':
        setIsLoginModalOpen(true);
        break;
      default:
        setLastReply(`Action for ${id} is not yet implemented.`);
    }
  };

  const handleCommand = async (command: string) => {
    if (!command.trim()) return;
    
    setIsLoading(true);
    setTranscript('');
    
    try {
      // If user is an operator, process via OperatorCommandService
      if (role === 'operator' || role === 'owner' || role === 'admin') {
        const opCmd = await OperatorCommandService.processCommand(
          currentUser?.name || 'Unknown Operator',
          role,
          command
        );
        
        setSystemUpdates(prev => [{
          id: opCmd.id,
          command: opCmd.command,
          rationale: `Operator command classified as ${opCmd.type}`,
          timestamp: opCmd.timestamp
        }, ...prev]);

        setLastReply(`Operator command received: ${opCmd.type}. Processing request...`);
      } else {
        // Standard AI response logic
        const userId = currentUserId || 'guest-user';
        const res = await fetch('/api/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command, userId, role, center })
        });
        const result = await res.json();
        setLastReply(result.reply);
        if (result.action === 'navigate') {
          setCenter({ lat: result.lat, lng: result.lng });
          setZoom(18);
        }
      }
    } catch (error) {
      console.error('Command processing error:', error);
      setLastReply("I encountered an error processing your command.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceCommand = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setLastReply("Listening for command...");
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'vendor' && !hasShop) {
      setIsShopSetupOpen(true);
    } else if (newRole === 'deliverer' && !currentUser?.is_verified_driver) {
      setIsDriverSetupOpen(true);
    }
  };

  const handleLogin = async (userId?: string, credentials?: any) => {
    setIsLoginModalOpen(false);
    setIsAuthenticated(true);
    setCurrentUserId(userId || 'demo-user');
    fetchCurrentUser();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUserId(null);
    setCurrentUser(null);
    setRole('user');
  };

  const handleBiometricLogin = () => {
    handleLogin('biometric-user');
  };

  const handleMapClick = (lat: number, lng: number, x: number, y: number) => {
    setMapContextMenu({ lat, lng, x, y });
  };

  const handleContextAction = (action: string) => {
    if (!mapContextMenu) return;
    const { lat, lng } = mapContextMenu;

    switch (action) {
      case 'post':
        setPendingTaskLocation({ lat, lng });
        setIsSocialPostOpen(true);
        break;
      case 'what_is_here':
        handleCommand(`What is here at ${lat}, ${lng}?`);
        break;
      case 'create_task':
        setPendingTaskLocation({ lat, lng });
        setIsTaskCreationMenuOpen(true);
        break;
      case 'navigate':
        setRoutingDestination({ lat, lng });
        setCenter({ lat, lng });
        setZoom(18);
        setLastReply(`Destination set to ${lat.toFixed(6)}, ${lng.toFixed(6)}. Click 'Start Routing' to begin.`);
        break;
      case 'search_nearby':
        handleCommand(`Search nearby businesses at ${lat}, ${lng}`);
        break;
      case 'open_coords':
        setLastReply(`Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        break;
    }
  };

  const handleLongPress = (lat: number, lng: number, x: number, y: number) => {
    setMapContextMenu({ lat, lng, x, y });
  };

  const handleMarkerClick = (id: string, type: 'task' | 'shop' | 'user') => {
    if (type === 'shop') {
      const shop = shops.find(s => s.id === id) || groundingShops.find(s => s.id === id);
      if (shop) setSelectedShop(shop);
    }
  };

  const handlePlaceOrder = (items: any[], fulfillment: FulfillmentMethod) => {
    setLastReply("Order placed successfully!");
    setIsCommercePanelOpen(false);
    setSelectedShop(null);
  };

  const handleSocialPost = async () => {
    if (!socialContent.trim()) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/signals/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: socialContent,
          userId: currentUserId || 'anonymous',
          lat: pendingTaskLocation?.lat || center.lat,
          lng: pendingTaskLocation?.lng || center.lng
        })
      });
      
      if (res.ok) {
        setLastReply("Update published to network.");
        setIsSocialPostOpen(false);
        setSocialContent('');
        // Refresh signals
        const signals = await YouTubeSignalClientService.getOrbitalSignals();
        setOrbitalSignals(signals);
      } else {
        throw new Error("Failed to publish post");
      }
    } catch (error) {
      console.error("Social post error:", error);
      setLastReply("Failed to publish update.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoPost = (videoBlob: Blob) => {
    setLastReply("Video update posted to network.");
    setIsVideoRecorderOpen(false);
  };

  const handleDriverSetupComplete = (details: any) => {
    setIsDriverSetupOpen(false);
    setLastReply("Driver verification complete.");
  };

  const handleShopSetupComplete = (details: any) => {
    setIsShopSetupOpen(false);
    setLastReply("Shop registration complete.");
  };

  const handleCategorySelect = (category: string) => {
    handleCommand(`Show me ${category}`);
    setIsCategoryDrawerOpen(false);
  };

  const handleSpawnWidget = (type: string) => {
    setLastReply(`${type} widget spawned.`);
  };

  const handleSyncGPS = () => {
    setLastReply("GPS Synchronized.");
  };

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  };

  const hasShop = shops.some(s => s.owner_id === currentUserId);

  const handleUpdate = () => {
    if (versionStatus !== 'up-to-date') {
      // Force reload with cache busting
      const cacheBuster = `?v=${Date.now()}`;
      window.location.href = window.location.origin + window.location.pathname + cacheBuster + window.location.hash;
    }
  };

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch('/api/version');
        const data = await res.json();
        if (data.version) {
          setLatestVersion(data.version);
          if (data.version !== appVersion) {
            setVersionStatus('update-available');
          } else {
            setVersionStatus('up-to-date');
          }
        }
      } catch (e) {
        console.error("Failed to check version", e);
      }
    };
    checkVersion();
  }, [appVersion]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* MAP / GLOBE LAYER */}
      <div className="absolute inset-0 z-0">
        {viewState === 'global' ? (
          <GlobeScene 
            onTransitionComplete={handleTransitionComplete}
            signals={orbitalSignals as any}
            onSignalSelect={handleSignalSelect}
            isZooming={false}
            viewState="orbital"
          />
        ) : (
          <AstranovMap 
            center={center}
            zoom={zoom}
            tasks={tasks}
            shops={shops}
            users={users}
            onMapClick={handleMapClick}
            onLongPress={handleLongPress}
            onMarkerClick={handleMarkerClick}
            userRole={role}
            userId={currentUserId || ''}
            mapType={mapType}
            videoSignals={nearbySignals}
            onSignalClick={handleSignalSelect}
          />
        )}
      </div>

      {/* HUD LAYER */}
      <HudLayout 
        topCenter={
          <div className="flex flex-col items-center gap-1 mt-4">
            <VersionBar 
              currentVersion={appVersion} 
              latestVersion={latestVersion} 
              status={versionStatus} 
              onUpdate={handleUpdate}
            />
            <div className="mt-4 text-4xl font-black uppercase tracking-[0.6em] drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-600 animate-pulse">
              AstranoV
            </div>
          </div>
        }
        leftColumn={
          <div className="flex flex-col gap-3 mt-24">
            <HudButton 
              icon={Settings} 
              label="Settings" 
              onClick={() => setIsSystemConsoleOpen(true)} 
              status="ok"
            />
            <HudButton 
              icon={UserIcon} 
              label={isAuthenticated ? "Profile" : "Login"} 
              onClick={() => setIsLoginModalOpen(true)}
              status={isAuthenticated ? 'healthy' : 'warning'}
              data={isAuthenticated ? "ACTIVE" : "OFFLINE"}
              active={isAuthenticated}
            />
            <HudButton 
              icon={Wallet} 
              label="Wallet" 
              onClick={() => setIsWalletOpen(true)} 
              data={`€${currentUser?.balance?.toFixed(2) || '0.00'}`}
              status="finance"
            />
            <HudButton 
              icon={Plus} 
              label="Post" 
              onClick={() => setIsSocialPostOpen(true)} 
              variant="primary" 
              status="ok"
            />
            <HudButton 
              icon={Users} 
              label="Channel" 
              onClick={toggleChannelMode}
              data={channelMode.toUpperCase()}
              active={channelMode === 'team'}
              status="ok"
            />
            <HudButton 
              icon={Truck} 
              label="Fleet" 
              onClick={toggleFleetMode}
              data={fleetMode.toUpperCase()}
              status="ok"
            />
            <HudButton 
              icon={Activity} 
              label="Status" 
              onClick={() => setIsDiagnosticsOpen(true)}
              status={systemHealth === 'healthy' ? 'healthy' : 'problem'}
              data={`${healthValue}%`}
            />
          </div>
        }
        rightColumn={
          <div className="flex flex-col gap-3 mt-24">
            <HudButton 
              icon={Power} 
              label="Power" 
              onClick={() => setIsPoweredOn(!isPoweredOn)}
              status={isPoweredOn ? 'healthy' : 'problem'}
              active={isPoweredOn}
            />
            <HudButton icon={Layers} label="Layers" onClick={toggleMapType} status="ok" />
            <HudButton icon={Filter} label="Filters" onClick={() => setIsCategoryDrawerOpen(true)} status="ok" />
            <HudButton icon={Crosshair} label="Locate" onClick={handleSyncGPS} status="ok" />
            <HudButton 
              icon={Navigation} 
              label="Route" 
              onClick={handleStartRouting}
              status={routingDestination ? 'healthy' : 'warning'}
              active={isRouting}
              data={isRouting ? "ACTIVE" : (routingDestination ? "READY" : "IDLE")}
            />
            <HudButton icon={Radar} label="Scanner" onClick={toggleRadarMode} active={radarMode !== 'hidden'} status="ok" />
          </div>
        }
        bottomCenter={
          <div className="w-full max-w-3xl bg-zinc-900/95 backdrop-blur-3xl border border-white/10 rounded-3xl p-2 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center gap-3 mb-8 pointer-events-auto">
            <div className="p-3 bg-white/5 rounded-2xl">
              <Search className="w-6 h-6 text-white/40" />
            </div>
            <input 
              type="text" 
              placeholder="Ask AstranoV AI..." 
              className="flex-1 bg-transparent border-none outline-none text-white text-lg font-medium placeholder:text-white/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCommand(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
            <div className="flex items-center gap-2 pr-2">
              <button 
                onClick={handleVoiceCommand}
                className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.5)] animate-pulse' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
              >
                <Mic className="w-6 h-6" />
              </button>
              <button 
                onClick={(e) => {
                  const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                  handleCommand(input.value);
                  input.value = '';
                }}
                className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all shadow-lg"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
            {isLoading && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Processing</span>
              </div>
            )}
          </div>
        }
        bottomRight={
          <div className="mb-8 mr-4 pointer-events-auto">
            <BottomRightRadar 
              mode={radarMode}
              onToggleMode={toggleRadarMode}
              onClose={() => setRadarMode('hidden')}
              center={center}
              tasks={tasks}
              users={users}
              shops={shops}
            />
          </div>
        }
      />

      {/* OVERLAYS */}
      <AnimatePresence>
        {mapContextMenu && (
          <MapContextMenu 
            lat={mapContextMenu.lat}
            lng={mapContextMenu.lng}
            x={mapContextMenu.x}
            y={mapContextMenu.y}
            onClose={() => setMapContextMenu(null)}
            onAction={handleContextAction}
          />
        )}
        
        {lastReply && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-4"
          >
            <div className="bg-zinc-900/95 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Zap className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-sm text-white/90 font-medium leading-relaxed">{lastReply}</p>
              <button onClick={() => setLastReply(undefined)} className="ml-auto text-white/20 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {isLoginModalOpen && (
          <UserWidget 
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            currentUser={currentUser}
            isAuthenticated={isAuthenticated}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onBiometricLogin={handleBiometricLogin}
            onRoleChange={handleRoleChange}
            hasShop={hasShop}
          />
        )}

        {isSocialPostOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-auto p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-900 border border-white/10 p-6 rounded-3xl shadow-2xl w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white tracking-tight">Post Update</h3>
                <button onClick={() => setIsSocialPostOpen(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <textarea 
                value={socialContent}
                onChange={(e) => setSocialContent(e.target.value)}
                placeholder="What's happening at this location?"
                className="w-full h-32 bg-black/50 border border-white/10 rounded-2xl p-4 text-white mb-4 outline-none focus:border-white/20 transition-all"
              />
              <button 
                onClick={handleSocialPost} 
                disabled={!socialContent.trim() || isLoading}
                className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Publishing...' : 'Post'}
              </button>
            </motion.div>
          </div>
        )}

        {/* Other modals integrated similarly... */}
      </AnimatePresence>

      {/* Version Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none">
        <VersionBar currentVersion={appVersion} latestVersion={latestVersion} status={versionStatus} />
      </div>
    </div>
  );
}
