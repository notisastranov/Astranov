import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import YouTubePlayer from './components/YouTubePlayer';
import { YouTubeSignalClientService } from './services/youtube/YouTubeSignalClientService';
import { VideoSignal, OrbitalSignal } from './types/youtube';
import { Bell, Menu, Truck, ShoppingBag, Store, X, Mic, Fingerprint, Camera, ImageIcon, Send, ArrowUpRight, Plus, CreditCard, Radar, BarChart3, Monitor, Shield, Zap, Video, ShoppingCart, Youtube, Wallet, User as UserIcon, Settings, Bookmark, Activity, History, ZoomIn, ZoomOut, Layers, Filter, Crosshair, Search, Users, Navigation, Power, Satellite, Globe, Map as MapIcon, Car, Bike, Info, RefreshCw, PowerOff, Wifi, Signal, MapPin, Route, Scan, Maximize2 } from 'lucide-react';
import { HudButton } from './components/ui/HudButton';
import { AnchoredButtonMenu } from './components/ui/AnchoredButtonMenu';
import AstranovMap from './components/Map';
import GlobeScene from './components/GlobeScene';
import { TopStatusStrip } from './components/hud/TopStatusStrip';
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
import { LeftHUD } from './components/hud/LeftHUD';
import { RightHUD } from './components/hud/RightHUD';
import { AICommandBar } from './components/hud/AICommandBar';
import { diagnosticService, DiagnosticStatus } from './services/diagnostics';
import { OperatorCommandService } from './services/operator/OperatorCommandService';
import { Task, User, UserRole, Product as SystemProduct, Shop, Transaction, Publication, HudButtonConfig, HudRegion, UserUILayout } from './types';
import { Business, Product, FulfillmentMethod, OrderStatus } from './types/operational';
import { CATEGORIES, DEFAULT_HUD_LAYOUT } from './constants';
import { UILayoutService } from './services/uiLayoutService';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from './firebase';

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
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
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
  const [appVersion] = useState<string>("1.0.5"); // Sourced from client build
  const [latestVersion, setLatestVersion] = useState<string>("1.0.5");
  const [versionStatus, setVersionStatus] = useState<'up-to-date' | 'update-available' | 'critical-update'>('up-to-date');
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
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const handleMenuOpen = (e: React.MouseEvent, id: string) => {
    if (id === 'scanner') {
      setRadarMode(prev => prev === 'hidden' ? 'small' : 'hidden');
      return;
    }
    setAnchorRect(e.currentTarget.getBoundingClientRect());
    setActiveMenu(prev => prev === id ? null : id);
  };

  const handleToggleRadarMode = () => {
    setRadarMode(prev => prev === 'small' ? 'big' : 'small');
  };

  const handleCloseRadar = () => {
    setRadarMode('hidden');
  };

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

  const [isFleetMenuOpen, setIsFleetMenuOpen] = useState(false);
  const [isNetworkMenuOpen, setIsNetworkMenuOpen] = useState(false);
  const [isLayersMenuOpen, setIsLayersMenuOpen] = useState(false);
  const [isFiltersMenuOpen, setIsFiltersMenuOpen] = useState(false);
  const [isLocateMenuOpen, setIsLocateMenuOpen] = useState(false);
  const [isRouteMenuOpen, setIsRouteMenuOpen] = useState(false);
  const [isScannerMenuOpen, setIsScannerMenuOpen] = useState(false);
  const [isPowerMenuOpen, setIsPowerMenuOpen] = useState(false);

  const handleCommand = async (command: string) => {
    if (!command.trim()) return;
    
    setIsLoading(true);
    setTranscript('');
    
    try {
      const userId = currentUserId || 'guest-user';
      
      // If user is an operator, record the command
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
      }

      // Process via AI for everyone
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, userId, role, center })
      });
      
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
      
      const result = await res.json();
      setLastReply(result.reply);
      
      // Process tool results for UI actions
      if (result.toolResults) {
        result.toolResults.forEach((tr: any) => {
          if (tr.tool === 'searchNearby' || tr.tool === 'searchNearbySignals' || tr.tool === 'searchNearbyVideos') {
            if (tr.result && tr.result.length > 0) {
              const first = tr.result[0];
              if (first.lat && first.lng) {
                setCenter({ lat: first.lat, lng: first.lng });
                setZoom(16);
                setViewState('local');
              }
            }
          }
        });
      }

      if (result.action === 'navigate') {
        setCenter({ lat: result.lat, lng: result.lng });
        setZoom(18);
        setViewState('local');
      }

      if (result.action === 'OPEN_MENU') {
        setActiveMenu(result.menuId);
      }

      if (result.action === 'SHOW_SIGNAL') {
        handleSignalSelect(result.signal);
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setCurrentUserId(user.uid);
        // Fetch or create user profile in Firestore
        fetch(`/api/users/${user.uid}`)
          .then(res => res.ok ? res.json() : null)
          .then(userData => {
            if (userData) {
              setCurrentUser(userData);
            } else {
              // Create default user profile
              const newUser: User = {
                id: user.uid,
                name: user.displayName || 'New User',
                role: 'user',
                balance: 100,
                is_verified_driver: false,
                lat: center.lat,
                lng: center.lng
              };
              setCurrentUser(newUser);
            }
          });
      } else {
        setIsAuthenticated(false);
        setCurrentUserId(null);
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (username?: string, password?: string, email?: string, mode?: 'login' | 'signup') => {
    try {
      await signInWithPopup(auth, googleProvider);
      setIsLoginModalOpen(false);
    } catch (error) {
      console.error("Login error:", error);
      setLastReply("Login failed. Please check if the domain is authorized in Firebase.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setLastReply("Session terminated.");
    } catch (error) {
      console.error("Logout error:", error);
    }
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

  const handlePostGlobal = (content: string) => {
    setSocialContent(content);
    handleSocialPost();
  };

  const handleSelectShop = (shop: Shop) => {
    setSelectedShop(shop);
    setCenter({ lat: shop.lat, lng: shop.lng });
    setZoom(18);
    setIsMissionControlOpen(false);
  };

  const handleSelectTask = (task: Task) => {
    setCenter({ lat: task.lat, lng: task.lng });
    setZoom(18);
    setIsMissionControlOpen(false);
  };

  const handleSelectUser = (user: User) => {
    if (user.lat && user.lng) {
      setCenter({ lat: user.lat, lng: user.lng });
      setZoom(18);
    }
    setIsMissionControlOpen(false);
  };

  const handleUpdate = () => {
    // Force reload with cache busting to ensure newest build is fetched
    const cacheBuster = `?v=${Date.now()}`;
    window.location.href = window.location.origin + window.location.pathname + cacheBuster + window.location.hash;
  };

  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Sourced from deployment metadata / build reference endpoint
        const res = await fetch('/api/version');
        const data = await res.json();
        if (data.version) {
          setLatestVersion(data.version);
          setVersionStatus(data.version !== appVersion ? 'update-available' : 'up-to-date');
        }
      } catch (e) {
        // Fallback for simulation/dev
        setLatestVersion("1.0.6");
        setVersionStatus('update-available');
      }
    };
    checkVersion();
    const interval = setInterval(checkVersion, 300000); // 5 min interval
    return () => clearInterval(interval);
  }, [appVersion]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* MAP / GLOBE LAYER */}
      <div className="absolute inset-0 z-0">
        {(viewState === 'global' || viewState === 'zooming' || viewState === 'atmosphere') ? (
          <GlobeScene 
            onTransitionComplete={handleTransitionComplete}
            signals={orbitalSignals as any}
            onSignalSelect={handleSignalSelect}
            isZooming={viewState === 'zooming'}
            viewState={viewState === 'global' ? 'orbital' : 'map'}
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
        topStrip={
          <TopStatusStrip 
            currentVersion={appVersion}
            latestVersion={latestVersion}
            status={versionStatus === 'up-to-date' ? 'healthy' : versionStatus === 'update-available' ? 'warning' : 'problem'}
            onUpdate={handleUpdate}
            onDiagnosticClick={() => setIsSystemConsoleOpen(true)}
          />
        }
        leftHUD={
          <LeftHUD 
            activeMenu={activeMenu}
            onMenuOpen={handleMenuOpen}
            isAuthenticated={isAuthenticated}
            balance={`€${currentUser?.balance?.toFixed(2) || '0.00'}`}
            channelMode={channelMode.toUpperCase()}
            fleetMode={fleetMode.toUpperCase()}
            systemHealth={systemHealth}
            healthValue={healthValue}
          />
        }
        rightHUD={
          <RightHUD 
            activeMenu={activeMenu}
            onMenuOpen={handleMenuOpen}
            isPoweredOn={isPoweredOn}
            routingDestination={routingDestination}
            isRouting={isRouting}
            handleSyncGPS={handleSyncGPS}
            radarMode={radarMode}
            onToggleRadarMode={toggleRadarMode}
            onCloseRadar={() => setRadarMode('hidden')}
            center={center}
            tasks={tasks}
            users={users}
            shops={shops}
          />
        }
        aiCommandBar={
          <AICommandBar 
            onCommand={handleCommand}
            isListening={isListening}
            onVoiceToggle={handleVoiceCommand}
            onCameraClick={() => setLastReply("Camera scan initiated.")}
            isVoiceChatActive={isVoiceChatActive}
            onVoiceChatToggle={() => setIsVoiceChatActive(!isVoiceChatActive)}
            transcript={transcript}
            isLoading={isLoading}
          />
        }
        bottomRightRadar={null}
      />

      {/* OVERLAYS */}
      {/* ANCHORED MENUS */}
      <AnchoredButtonMenu 
        isOpen={activeMenu === 'settings'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="left" 
        title="Settings"
      >
        <button onClick={() => setIsSystemConsoleOpen(true)} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left">
          <Settings className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">System Console</span>
        </button>
        <button onClick={() => setIsDemoMode(!isDemoMode)} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left">
          <Info className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">{isDemoMode ? "Disable Demo" : "Enable Demo"}</span>
        </button>
      </AnchoredButtonMenu>

      <AnchoredButtonMenu 
        isOpen={activeMenu === 'profile'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="left" 
        title="Profile"
      >
        <button onClick={() => setIsLoginModalOpen(true)} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left">
          <UserIcon className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">{isAuthenticated ? "Account Details" : "Login / Register"}</span>
        </button>
        <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left">
          <PowerOff className="w-4 h-4 text-rose-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Disconnect</span>
        </button>
      </AnchoredButtonMenu>

      <AnchoredButtonMenu 
        isOpen={activeMenu === 'wallet'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="left" 
        title="Wallet"
      >
        <div className="flex flex-col items-center gap-1 mb-4">
          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Projected Earnings</span>
          <span className="text-sm font-black text-emerald-400">+€124.50</span>
        </div>
        <button onClick={() => setIsFinancialOpen(true)} className="flex flex-col items-center gap-1 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl transition-all">
          <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em]">Current Balance</span>
          <span className="text-xl font-black text-white">€{currentUser?.balance?.toFixed(2) || '0.00'}</span>
        </button>
      </AnchoredButtonMenu>

      <AnchoredButtonMenu 
        isOpen={activeMenu === 'post'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="left" 
        title="Post"
      >
        {!isSocialPostOpen ? (
          <>
            <button onClick={() => setIsSocialPostOpen(true)} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left">
              <Plus className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">New Publication</span>
            </button>
            <button onClick={() => setIsVideoRecorderOpen(true)} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left">
              <Video className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Video Signal</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea 
              value={socialContent}
              onChange={(e) => setSocialContent(e.target.value)}
              placeholder="Signal content..."
              className="w-full h-24 bg-black/50 border border-white/10 rounded-xl p-3 text-[10px] text-white outline-none focus:border-blue-500/50 transition-all resize-none"
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setIsSocialPostOpen(false)}
                className="flex-1 py-2 rounded-lg bg-white/5 text-white/40 text-[8px] font-black uppercase tracking-widest hover:bg-white/10"
              >
                Cancel
              </button>
              <button 
                onClick={handleSocialPost}
                disabled={!socialContent.trim() || isLoading}
                className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-[8px] font-black uppercase tracking-widest hover:bg-blue-400 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Transmit'}
              </button>
            </div>
          </div>
        )}
      </AnchoredButtonMenu>

      <AnchoredButtonMenu 
        isOpen={activeMenu === 'channel'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="left" 
        title="Channel"
      >
        <button onClick={() => { setChannelMode('global'); setActiveMenu(null); }} className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${channelMode === 'global' ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 hover:bg-white/10'}`}>
          <Globe className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Global</span>
        </button>
        <button onClick={() => { setChannelMode('team'); setActiveMenu(null); }} className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${channelMode === 'team' ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 hover:bg-white/10'}`}>
          <MapPin className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Local</span>
        </button>
      </AnchoredButtonMenu>

      <AnchoredButtonMenu 
        isOpen={activeMenu === 'fleet'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="left" 
        title="Fleet"
      >
        <button onClick={() => { setFleetMode('drivers'); setActiveMenu(null); }} className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${fleetMode === 'drivers' ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 hover:bg-white/10'}`}>
          <Bike className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Drivers Only</span>
        </button>
        <button onClick={() => { setFleetMode('drones'); setActiveMenu(null); }} className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${fleetMode === 'drones' ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 hover:bg-white/10'}`}>
          <Satellite className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Drones Only</span>
        </button>
        <button onClick={() => { setFleetMode('both'); setActiveMenu(null); }} className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${fleetMode === 'both' ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 hover:bg-white/10'}`}>
          <Truck className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Hybrid Fleet</span>
        </button>
      </AnchoredButtonMenu>

      <AnchoredButtonMenu 
        isOpen={activeMenu === 'power'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="right" 
        title="System Power"
      >
        <button onClick={() => { setIsPoweredOn(!isPoweredOn); setActiveMenu(null); }} className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${isPoweredOn ? 'bg-rose-500/20 border border-rose-500/30' : 'bg-emerald-500/20 border border-emerald-500/30'}`}>
          <Power className={`w-4 h-4 ${isPoweredOn ? 'text-rose-500' : 'text-emerald-500'}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${isPoweredOn ? 'text-rose-500' : 'text-emerald-500'}`}>{isPoweredOn ? "Shutdown System" : "Boot System"}</span>
        </button>
      </AnchoredButtonMenu>

      <AnchoredButtonMenu 
        isOpen={activeMenu === 'network'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="right" 
        title="Network"
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Uplink</span>
            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Connected</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Latency</span>
            <span className="text-[8px] font-black text-white uppercase tracking-widest">24ms</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Security</span>
            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">AES-256</span>
          </div>
        </div>
      </AnchoredButtonMenu>

      <AnchoredButtonMenu 
        isOpen={activeMenu === 'layers'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="right" 
        title="Map Layers"
      >
        <button onClick={() => { setMapType('dark'); setActiveMenu(null); }} className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${mapType === 'dark' ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 hover:bg-white/10'}`}>
          <Monitor className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Dark Tactical</span>
        </button>
        <button onClick={() => { setMapType('satellite'); setActiveMenu(null); }} className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${mapType === 'satellite' ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 hover:bg-white/10'}`}>
          <Satellite className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Satellite</span>
        </button>
        <button onClick={() => { setMapType('roadmap'); setActiveMenu(null); }} className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${mapType === 'roadmap' ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 hover:bg-white/10'}`}>
          <MapIcon className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Roadmap</span>
        </button>
      </AnchoredButtonMenu>

      <AnchoredButtonMenu 
        isOpen={activeMenu === 'route'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="right" 
        title="Routing"
      >
        {routingDestination ? (
          <div className="flex flex-col gap-3">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1">Destination</span>
              <span className="text-[10px] font-black text-white uppercase tracking-tight">{routingDestination.lat.toFixed(4)}, {routingDestination.lng.toFixed(4)}</span>
            </div>
            <button 
              onClick={() => { handleStartRouting(); setActiveMenu(null); }}
              className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
            >
              {isRouting ? "Recalculating..." : "Initiate Route"}
            </button>
            <button 
              onClick={() => { setRoutingDestination(null); setIsRouting(false); setActiveMenu(null); }}
              className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/40 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all"
            >
              Clear Target
            </button>
          </div>
        ) : (
          <div className="p-4 text-center">
            <Navigation className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-relaxed">Select a coordinate on the map to initiate routing</p>
          </div>
        )}
      </AnchoredButtonMenu>

      <AnchoredButtonMenu 
        isOpen={activeMenu === 'scanner'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="right" 
        title="Scanner"
      >
        <button onClick={() => { handleCommand("Scan for nearby signals"); setActiveMenu(null); }} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left w-full">
          <Scan className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Deep Scan</span>
        </button>
        <button onClick={() => { handleCommand("Show trending videos"); setActiveMenu(null); }} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left w-full">
          <Youtube className="w-4 h-4 text-rose-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Video Signals</span>
        </button>
      </AnchoredButtonMenu>

      <AnchoredButtonMenu 
        isOpen={activeMenu === 'fleet'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="left" 
        title="Fleet"
      >
        <button onClick={() => { setFleetMode('drones'); setActiveMenu(null); }} className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${fleetMode === 'drones' ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 hover:bg-white/10'}`}>
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Drones</span>
        </button>
        <button onClick={() => { setFleetMode('drivers'); setActiveMenu(null); }} className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${fleetMode === 'drivers' ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 hover:bg-white/10'}`}>
          <Car className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Cars</span>
        </button>
        <button onClick={() => { setFleetMode('both'); setActiveMenu(null); }} className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${fleetMode === 'both' ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 hover:bg-white/10'}`}>
          <Bike className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Bikes</span>
        </button>
      </AnchoredButtonMenu>

      <AnchoredButtonMenu 
        isOpen={activeMenu === 'status'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="left" 
        title="System Status"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Health</span>
            <span className="text-[10px] font-black text-blue-400">{healthValue}%</span>
          </div>
          <button onClick={() => { setIsDiagnosticsOpen(true); setActiveMenu(null); }} className="mt-2 p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-all text-center">
            <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">Open Diagnostics</span>
          </button>
        </div>
      </AnchoredButtonMenu>

      {/* RIGHT COLUMN MENUS */}
      <AnchoredButtonMenu 
        isOpen={activeMenu === 'power'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="right" 
        title="Power"
      >
        <button onClick={() => { setIsPoweredOn(true); setActiveMenu(null); }} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left">
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Standby</span>
        </button>
        <button onClick={() => window.location.reload()} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left">
          <RefreshCw className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Reboot</span>
        </button>
        <button onClick={() => { setIsPoweredOn(false); setActiveMenu(null); }} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left">
          <PowerOff className="w-4 h-4 text-rose-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Turn Off</span>
        </button>
      </AnchoredButtonMenu>

      <AnchoredButtonMenu 
        isOpen={activeMenu === 'network'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="right" 
        title="Network"
      >
        <button className="flex items-center gap-3 p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl transition-all text-left">
          <Wifi className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Primary Network</span>
        </button>
        <button className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left">
          <Satellite className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Satellite</span>
        </button>
      </AnchoredButtonMenu>

      <AnchoredButtonMenu 
        isOpen={activeMenu === 'layers'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="right" 
        title="Layers"
      >
        <div className="grid grid-cols-2 gap-2">
          {['Orbital', 'Planetary', 'Local', 'Traffic', 'Weather', 'Commerce', 'Signals'].map(layer => (
            <button key={layer} onClick={() => setActiveMenu(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-center">
              <span className="text-[8px] font-black uppercase tracking-widest text-white">{layer}</span>
            </button>
          ))}
        </div>
      </AnchoredButtonMenu>

      <AnchoredButtonMenu 
        isOpen={activeMenu === 'filters'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="right" 
        title="Filters"
      >
        <div className="grid grid-cols-2 gap-2">
          {['Supermarket', 'Food', 'Drinks', 'Real estate', 'Dating', 'Jobs', 'Events', 'Services', 'Deliveries'].map(filter => (
            <button key={filter} onClick={() => setActiveMenu(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-center">
              <span className="text-[8px] font-black uppercase tracking-widest text-white">{filter}</span>
            </button>
          ))}
        </div>
      </AnchoredButtonMenu>

      <AnchoredButtonMenu 
        isOpen={activeMenu === 'locate'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="right" 
        title="Positioning"
      >
        <button onClick={() => setActiveMenu(null)} className="flex items-center gap-3 p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl transition-all text-left">
          <MapPin className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">GPS (US)</span>
        </button>
        <button onClick={() => setActiveMenu(null)} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left">
          <Globe className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">GLONASS</span>
        </button>
      </AnchoredButtonMenu>

      <AnchoredButtonMenu 
        isOpen={activeMenu === 'route'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="right" 
        title="Routing"
      >
        <button onClick={() => setActiveMenu(null)} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left">
          <Route className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Road Route</span>
        </button>
        <button onClick={() => setActiveMenu(null)} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left">
          <Truck className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Off-road</span>
        </button>
      </AnchoredButtonMenu>

      <AnchoredButtonMenu 
        isOpen={activeMenu === 'scanner'} 
        onClose={() => setActiveMenu(null)} 
        anchorRect={anchorRect} 
        side="right" 
        title="Scanner"
      >
        <button onClick={() => { toggleRadarMode(); setActiveMenu(null); }} className="flex items-center gap-3 p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl transition-all text-left">
          <Scan className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Start Scan</span>
        </button>
        <button onClick={() => setActiveMenu(null)} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-left">
          <Maximize2 className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Scan Radius</span>
        </button>
      </AnchoredButtonMenu>

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
          <div className="fixed inset-0 z-[2000] pointer-events-auto flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsLoginModalOpen(false)} />
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
          </div>
        )}

        {isVendorDashboardOpen && (
          <VendorDashboard 
            userId={currentUserId || ''}
            onClose={() => setIsVendorDashboardOpen(false)}
          />
        )}

        {isGamesModalOpen && (
          <GamesModal 
            isOpen={isGamesModalOpen}
            onClose={() => setIsGamesModalOpen(false)}
          />
        )}

        {isComplianceOpen && (
          <ComplianceDashboard 
            userId={currentUserId || ''}
            onClose={() => setIsComplianceOpen(false)}
          />
        )}

        {isDroneFleetOpen && (
          <DroneFleetControl 
            isOpen={isDroneFleetOpen}
            onClose={() => setIsDroneFleetOpen(false)}
          />
        )}

        {isTeamPlatformOpen && (
          <TeamPlatform 
            isOpen={isTeamPlatformOpen}
            onClose={() => setIsTeamPlatformOpen(false)}
            teams={teams}
            currentTeamId={selectedTeamId}
            onSelectTeam={setSelectedTeamId}
            onPostGlobal={handlePostGlobal}
            onUpdateTeams={setTeams}
          />
        )}

        {isMissionControlOpen && (
          <MissionControl 
            isOpen={isMissionControlOpen}
            onClose={() => setIsMissionControlOpen(false)}
            tasks={tasks}
            shops={shops}
            groundingShops={groundingShops}
            users={users}
            currentUserId={currentUserId}
            onSelectShop={handleSelectShop}
            onSelectTask={handleSelectTask}
            onSelectUser={handleSelectUser}
          />
        )}

        {isAnalyticsOpen && (
          <AnalyticsDashboard 
            userId={currentUserId || ''}
          />
        )}

        {isFinancialOpen && (
          <WalletDashboard 
            userId={currentUserId || ''}
            balance={currentUser?.balance || 0}
            onUpdateBalance={fetchCurrentUser}
          />
        )}

        {isDiagnosticsOpen && (
          <DiagnosticCenter 
            isOpen={isDiagnosticsOpen}
            onClose={() => setIsDiagnosticsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
