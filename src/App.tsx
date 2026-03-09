import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Menu, Truck, ShoppingBag, Store, X, Mic, Fingerprint, Camera, Image as ImageIcon, Send, ArrowUpRight, Plus, CreditCard, Radar, BarChart3, Monitor, Shield, Zap, Video, ShoppingCart } from 'lucide-react';
import AstranovMap from './components/Map';
import GlobeScene from './components/GlobeScene';
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
import { AppShell } from './components/layout/AppShell';
import { LeftHUD } from './components/hud/LeftHUD';
import { RightHUD } from './components/hud/RightHUD';
import { TopCenterHUD } from './components/hud/TopCenterHUD';
import { TopRightHUD } from './components/hud/TopRightHUD';
import { BottomCenterAIBar } from './components/hud/BottomCenterAIBar';
import { BottomRightRadar } from './components/hud/BottomRightRadar';
import { OverlayPanelsLayer } from './components/layout/OverlayPanelsLayer';
import { VersionBar } from './components/ui/VersionBar';
import { diagnosticService, DiagnosticStatus } from './services/diagnostics';
import { OperatorCommandService } from './services/operator/OperatorCommandService';
import { Task, User, UserRole, Product, Shop, Transaction, Publication, HudButtonConfig } from './types';
import { Business, FulfillmentMethod, OrderStatus } from './types/operational';
import { CATEGORIES, DEFAULT_HUD_LAYOUT } from './constants';

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
  const [isDriverSetupOpen, setIsDriverSetupOpen] = useState(false);
  const [isShopSetupOpen, setIsShopSetupOpen] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<{ id: string, lat: number, lng: number, text: string }[]>([]);
  const [widgets, setWidgets] = useState<{ id: string, name: string, icon: any, color: string, data?: string }[]>([]);
  const [activeRoute, setActiveRoute] = useState<[number, number][] | undefined>(undefined);

  const tasksRef = useRef<Task[]>([]);
  const usersRef = useRef<User[]>([]);

  useEffect(() => {
    localStorage.setItem('astranov_radar_mode', radarMode);
  }, [radarMode]);

  useEffect(() => {
    if (globeError && viewState !== 'local') {
      setViewState('local');
      setLastReply("Globe engine failed to initialize. Falling back to Map Mode.");
    }
  }, [globeError, viewState]);

  const handleSignalSelect = (signal: any) => {
    setViewState('zooming');
    setCenter({ lat: signal.lat, lng: signal.lng });
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
      case 'globe_map':
        toggleMapType();
        break;
      case 'wallet':
        setIsFinancialOpen(true);
        break;
      case 'login':
        setIsLoginModalOpen(true);
        break;
      case 'post':
        setIsSocialPostOpen(true);
        break;
      case 'broadcast':
        setIsVideoRecorderOpen(true);
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

  const handleMapClick = (lat: number, lng: number) => {
    setMapContextMenu(null);
  };

  const handleLongPress = (lat: number, lng: number, x: number, y: number) => {
    setMapContextMenu({ lat, lng, x, y });
  };

  const handleMarkerClick = (type: string, id: string) => {
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

  const handleSocialPost = () => {
    setLastReply("Update posted to network.");
    setIsSocialPostOpen(false);
    setSocialContent('');
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

  return (
    <AppShell
      versionBar={
        <VersionBar 
          currentVersion={appVersion} 
          latestVersion={latestVersion} 
          status={versionStatus} 
        />
      }
      leftHUD={
        <LeftHUD 
          buttons={hudButtons.filter(b => b.region === 'left')} 
          onButtonClick={handleHudButtonClick} 
        />
      }
      rightHUD={
        <RightHUD 
          buttons={hudButtons.filter(b => b.region === 'right')} 
          onButtonClick={handleHudButtonClick} 
        />
      }
      topCenterHUD={
        <TopCenterHUD 
          buttons={hudButtons.filter(b => b.region === 'top')} 
          onButtonClick={handleHudButtonClick} 
        />
      }
      topRightHUD={
        <TopRightHUD 
          onSettingsClick={() => setIsSystemConsoleOpen(true)} 
        />
      }
      bottomCenterAIBar={
        <BottomCenterAIBar 
          onCommand={handleCommand}
          isLoading={isLoading}
          lastReply={lastReply || null}
          onClearReply={() => setLastReply(undefined)}
          isListening={isListening}
          onToggleListening={handleVoiceCommand}
          transcript={transcript}
        />
      }
      bottomRightRadar={
        <BottomRightRadar 
          mode={radarMode}
          onToggleMode={toggleRadarMode}
          onClose={() => setRadarMode('hidden')}
          center={center}
          tasks={tasks}
          users={users}
          shops={Array.from(new Map([...shops, ...groundingShops].map(s => [s.id, s])).values())}
        />
      }
      overlayPanels={
        <OverlayPanelsLayer>
          {isCommercePanelOpen && selectedBusiness && (
            <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
              <div className="pointer-events-auto">
                <CommercePanel 
                  business={selectedBusiness}
                  menu={businessMenu}
                  onClose={() => setIsCommercePanelOpen(false)}
                  onPlaceOrder={handlePlaceOrder}
                />
              </div>
            </div>
          )}
          {/* ActionSheet removed per emergency policy */}
          <CategoryDrawer 
            isOpen={isCategoryDrawerOpen} 
            onClose={() => setIsCategoryDrawerOpen(false)} 
            onSelectCategory={handleCategorySelect}
            onSpawnWidget={handleSpawnWidget}
            balance={currentUser?.balance || 0} 
            userName={currentUser?.name || 'Guest'} 
            userId={currentUserId || 'guest'}
            networkStatus="ok"
            deviceInfo="ASTRANOV-X1"
            onToggleStatus={setIsActive}
            isActive={isActive}
            currentRole={role}
            onRoleChange={handleRoleChange}
            isVerifiedDriver={!!currentUser?.is_verified_driver}
            hasShop={hasShop}
            onLoginClick={() => setIsLoginModalOpen(true)}
            onComplianceClick={() => setIsComplianceOpen(true)}
            onSettingsClick={() => setLastReply("Settings accessed.")}
            onGamesClick={() => setIsGamesModalOpen(true)}
            isAuthenticated={isAuthenticated}
          />
          {isGamesModalOpen && (
            <GamesModal 
              isOpen={isGamesModalOpen} 
              onClose={() => setIsGamesModalOpen(false)} 
            />
          )}
          {isDroneFleetOpen && (
            <DroneFleetControl 
              isOpen={isDroneFleetOpen} 
              onClose={() => setIsDroneFleetOpen(false)} 
            />
          )}
          {isComplianceOpen && currentUserId && (
            <ComplianceDashboard 
              userId={currentUserId} 
              onClose={() => setIsComplianceOpen(false)} 
            />
          )}
          {isVendorDashboardOpen && currentUserId && (
            <VendorDashboard 
              userId={currentUserId} 
              onClose={() => setIsVendorDashboardOpen(false)} 
            />
          )}
          {isDriverSetupOpen && (
            <DriverSetup 
              onComplete={handleDriverSetupComplete} 
              onCancel={() => setIsDriverSetupOpen(false)} 
            />
          )}
          {isShopSetupOpen && (
            <ShopSetup 
              onComplete={handleShopSetupComplete} 
              onCancel={() => setIsShopSetupOpen(false)} 
            />
          )}
          {isTaskCreationMenuOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto">
              <div className="bg-zinc-900 border border-white/10 p-6 rounded-3xl shadow-2xl w-full max-w-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-white tracking-tight">Create Task</h3>
                  <button onClick={() => setIsTaskCreationMenuOpen(false)} className="text-white/40 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                   <button onClick={() => { setIsSocialPostOpen(true); setIsTaskCreationMenuOpen(false); }} className="w-full bg-white/5 p-4 rounded-2xl text-left text-white font-bold">Post Update</button>
                   <button onClick={() => { setIsShopSetupOpen(true); setIsTaskCreationMenuOpen(false); }} className="w-full bg-white/5 p-4 rounded-2xl text-left text-white font-bold">Enlist Shop</button>
                </div>
              </div>
            </div>
          )}
          {isSocialPostOpen && (
            <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-auto">
              <div className="bg-zinc-900 border border-white/10 p-6 rounded-3xl shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-white tracking-tight">Post Update</h3>
                  <button onClick={() => setIsSocialPostOpen(false)} className="text-white/40 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <textarea 
                  value={socialContent}
                  onChange={(e) => setSocialContent(e.target.value)}
                  className="w-full h-32 bg-black/50 border border-white/10 rounded-2xl p-4 text-white mb-4"
                />
                <button onClick={handleSocialPost} className="w-full bg-electric-blue text-black font-black py-4 rounded-xl">Post</button>
              </div>
            </div>
          )}
          {isVideoRecorderOpen && (
            <VideoRecorder 
              isOpen={isVideoRecorderOpen}
              onClose={() => setIsVideoRecorderOpen(false)}
              onPost={handleVideoPost}
            />
          )}
          {selectedShop && (
            <ShopModal 
              shop={selectedShop}
              onClose={() => setSelectedShop(null)}
              onPlaceOrder={handlePlaceOrder}
              isAuthenticated={isAuthenticated}
              onLoginRequired={() => setIsLoginModalOpen(true)}
              currentUserId={currentUserId || undefined}
            />
          )}
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
          {activeChatUser && (
            <ChatWidget 
              currentUserId={currentUserId || 'guest'}
              targetUserId={activeChatUser.id}
              targetUserName={activeChatUser.name}
              onClose={() => setActiveChatUser(null)}
            />
          )}
          {ratingTarget && (
            <RatingModal 
              targetId={ratingTarget.id}
              targetName={ratingTarget.name}
              targetType={ratingTarget.type}
              raterId={currentUserId || 'guest'}
              onClose={() => setRatingTarget(null)}
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
              onSelectShop={(shop) => { setSelectedShop(shop); setIsMissionControlOpen(false); }}
              onSelectTask={(task) => { setCenter({ lat: task.lat, lng: task.lng }); setIsMissionControlOpen(false); }}
              onSelectUser={(user) => { setCenter({ lat: user.lat, lng: user.lng }); setIsMissionControlOpen(false); }}
            />
          )}
          {isTeamPlatformOpen && (
            <TeamPlatform 
              isOpen={isTeamPlatformOpen} 
              onClose={() => setIsTeamPlatformOpen(false)} 
              onPostGlobal={(content) => setLastReply(`Message sent: ${content}`)}
              currentTeamId={selectedTeamId}
              onSelectTeam={setSelectedTeamId}
              teams={teams}
              onUpdateTeams={setTeams}
            />
          )}
          {/* System Center removed per emergency policy */}
          {isDiagnosticsOpen && (
            <DiagnosticCenter 
              isOpen={isDiagnosticsOpen} 
              onClose={() => setIsDiagnosticsOpen(false)} 
            />
          )}
          {isSearchOpen && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 pointer-events-auto">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsSearchOpen(false)} />
              <div className="relative w-full max-w-2xl bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-white uppercase tracking-widest italic">Integrated Search</h2>
                  <button onClick={() => setIsSearchOpen(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <IntegratedSearch 
                  balance={currentUser?.balance || 0}
                  healthValue={healthValue}
                  droneStatus={droneStatus}
                  onCommand={handleCommand}
                  isLoading={isLoading}
                  lastReply={lastReply}
                  onFinancialClick={() => setIsFinancialOpen(true)}
                  onFilterSelect={(filter) => handleCommand(`Show ${filter}`)}
                  onAuthClick={() => setIsLoginModalOpen(true)}
                  isActive={isActive}
                  onLayerToggle={toggleMapType}
                  onTeamClick={() => setIsTeamPlatformOpen(true)}
                  onSettingsClick={() => setIsComplianceOpen(true)}
                  onDroneClick={() => setIsDroneFleetOpen(true)}
                  onGamesClick={() => setIsGamesModalOpen(true)}
                  onPowerClick={() => setIsActive(!isActive)}
                  onSyncGPS={handleSyncGPS}
                  onConsoleClick={() => setIsSystemConsoleOpen(!isSystemConsoleOpen)}
                  onDiagnosticClick={() => setIsDiagnosticsOpen(true)}
                  systemHealth={systemHealth}
                  onVoiceClick={handleVoiceCommand}
                  isListening={isListening}
                />
              </div>
            </div>
          )}
          {isFinancialOpen && (
            <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 pointer-events-auto">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFinancialOpen(false)} />
              <div className="relative w-full max-w-5xl max-h-[90vh] bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <h2 className="text-2xl font-black text-white uppercase tracking-widest italic">Financial Center</h2>
                  <button onClick={() => setIsFinancialOpen(false)} className="text-white/40 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <WalletDashboard balance={currentUser?.balance || 0} userId={currentUserId || 'guest'} onUpdateBalance={fetchCurrentUser} />
                    <AnalyticsDashboard userId={currentUserId || 'guest'} />
                  </div>
                </div>
              </div>
            </div>
          )}
          {!isActive && (
            <div className="fixed inset-0 z-[9999] pointer-events-none bg-black/40 backdrop-grayscale flex items-center justify-center">
              <div className="bg-black/80 border border-red-500/50 px-8 py-4 rounded-full shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                <p className="text-red-500 font-black uppercase tracking-[0.5em] text-xs animate-pulse">System Offline</p>
              </div>
            </div>
          )}
        </OverlayPanelsLayer>
      }
    >
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          {viewState !== 'local' ? (
            <motion.div key="globe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
              <GlobeScene onSignalSelect={handleSignalSelect} isZooming={viewState === 'zooming' || viewState === 'atmosphere'} onTransitionComplete={handleTransitionComplete} />
            </motion.div>
          ) : (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full">
              <AstranovMap 
                center={center} tasks={tasks} shops={shops} publications={publications} groundingShops={groundingShops}
                users={currentUser ? Array.from(new Map([...users, currentUser].map(u => [u.id, u])).values()) : users} onMapClick={handleMapClick} onLongPress={handleLongPress}
                onMarkerClick={handleMarkerClick} userRole={role} userId={currentUserId || 'guest'} activeRoute={activeRoute}
                pendingTaskLocation={pendingTaskLocation} zoom={zoom} mapType={mapType}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* mapContextMenu removed per emergency policy */}
    </AppShell>
  );
}
