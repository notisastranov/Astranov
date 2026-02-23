import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Menu, Truck, ShoppingBag, Store, X } from 'lucide-react';
import Map from './components/Map';
import AIInput from './components/AIInput';
import VendorDashboard from './components/VendorDashboard';
import ProductSearchModal from './components/ProductSearchModal';
import RoleSelector from './components/RoleSelector';
import DriverSetup from './components/DriverSetup';
import ShopSetup from './components/ShopSetup';
import StatusRibbon from './components/StatusRibbon';
import CategoryDrawer from './components/CategoryDrawer';
import GamesModal from './components/GamesModal';
import RadarWidget from './components/RadarWidget';
import { socketService } from './services/socket';
import { processCommand } from './services/gemini';
import FloatingWidget from './components/FloatingWidget';
import { Task, User, UserRole, Product, Shop, Transaction } from './types';

import { CATEGORIES } from './constants';

const USER_ID = 'user-1';

export default function App() {
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.0060 });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('customer');
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [isVendorDashboardOpen, setIsVendorDashboardOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [radarPosition, setRadarPosition] = useState({ x: window.innerWidth - 220, y: 80 });

  const handleDemo = useCallback(() => {
    setIsDemoMode(true);
    setIsActive(true);
    
    // Create some demo users if they don't exist
    setUsers(prev => {
      const demoUsers: User[] = [
        { id: 'demo-driver-1', name: 'Marco (Pro)', role: 'deliverer', lat: center.lat + 0.005, lng: center.lng + 0.005, balance: 50, is_verified_driver: true },
        { id: 'demo-driver-2', name: 'Sofia (Express)', role: 'deliverer', lat: center.lat - 0.005, lng: center.lng - 0.005, balance: 75, is_verified_driver: true },
        { id: 'demo-client-1', name: 'Luca', role: 'customer', lat: center.lat + 0.002, lng: center.lng - 0.003, balance: 200 },
      ];
      const newUsers = [...prev];
      demoUsers.forEach(du => {
        if (!newUsers.some(u => u.id === du.id)) newUsers.push(du);
      });
      return newUsers;
    });

    // Create some demo shops
    setShops(prev => {
      const demoShops: Shop[] = [
        { id: 'demo-shop-1', name: 'Pizza Nova', description: 'Best pizza in town', owner_id: 'system', lat: center.lat + 0.003, lng: center.lng + 0.002, image_url: 'https://picsum.photos/seed/pizza/400/300', is_active: true, schedule: '24/7' },
        { id: 'demo-shop-2', name: 'Tech Hub', description: 'Gadgets and more', owner_id: 'system', lat: center.lat - 0.002, lng: center.lng + 0.004, image_url: 'https://picsum.photos/seed/tech/400/300', is_active: true, schedule: '09:00-21:00' },
      ];
      const newShops = [...prev];
      demoShops.forEach(ds => {
        if (!newShops.some(s => s.id === ds.id)) newShops.push(ds);
      });
      return newShops;
    });

    setLastReply("Astranov Demo Mode Activated. Multi-agent simulation engaged.");
  }, [center]);

  useEffect(() => {
    let demoInterval: NodeJS.Timeout;
    const onDemoEvent = () => handleDemo();
    window.addEventListener('astranov-demo', onDemoEvent);

    if (isDemoMode) {
      demoInterval = setInterval(() => {
        const currentTasks = tasksRef.current;
        const currentUsers = usersRef.current;
        
        // Find tasks that need delivery
        const activeTasks = currentTasks.filter(t => t.status !== 'completed');
        
        setUsers(prevUsers => prevUsers.map(u => {
          if (u.role === 'deliverer') {
            // If there's an active task, move towards it
            if (activeTasks.length > 0) {
              const targetTask = activeTasks[0];
              const dLat = targetTask.lat - u.lat;
              const dLng = targetTask.lng - u.lng;
              const dist = Math.sqrt(dLat * dLat + dLng * dLng);
              
              if (dist < 0.0005) {
                // Task reached!
                return u;
              }
              
              const speed = 0.0008; // Slightly faster for visibility
              return {
                ...u,
                lat: u.lat + (dLat / dist) * speed,
                lng: u.lng + (dLng / dist) * speed
              };
            }
            
            // Otherwise wander
            return {
              ...u,
              lat: u.lat + (Math.random() - 0.5) * 0.001,
              lng: u.lng + (Math.random() - 0.5) * 0.001
            };
          }
          
          if (u.role === 'customer') {
            return {
              ...u,
              lat: u.lat + (Math.random() - 0.5) * 0.0005,
              lng: u.lng + (Math.random() - 0.5) * 0.0005
            };
          }
          return u;
        }));

        // Randomly complete a task if a driver is close
        setTasks(prevTasks => {
          const updatedTasks = [...prevTasks];
          let taskCompleted = false;
          
          for (let i = 0; i < updatedTasks.length; i++) {
            const t = updatedTasks[i];
            if (t.status === 'completed') continue;
            
            const nearbyDriver = currentUsers.find(u => 
              u.role === 'deliverer' && 
              Math.abs(u.lat - t.lat) < 0.001 && 
              Math.abs(u.lng - t.lng) < 0.001
            );
            
            if (nearbyDriver || Math.random() > 0.97) {
              updatedTasks[i] = { ...t, status: 'completed' };
              taskCompleted = true;
              
              setLastReply(`Delivery completed! €${t.price} credited to driver.`);
              
              if (t.creator_id === USER_ID || t.driver_id === USER_ID) {
                setCurrentUser(prev => prev ? { ...prev, balance: prev.balance + t.price } : null);
              }
              
              const newFt = { id: `ft-${Date.now()}-${i}`, lat: t.lat, lng: t.lng, text: `+€${t.price}` };
              setFloatingTexts(prev => [...prev, newFt]);
              setTimeout(() => {
                setFloatingTexts(prev => prev.filter(f => f.id !== newFt.id));
              }, 2000);
            }
          }
          return taskCompleted ? updatedTasks : prevTasks;
        });

        // Occasionally create a new task to keep it alive
        if (Math.random() > 0.90 && activeTasks.length < 5) {
          const types: ('delivery' | 'shopping' | 'service')[] = ['delivery', 'shopping', 'service'];
          const type = types[Math.floor(Math.random() * types.length)];
          const newDemoTask: Task = {
            id: `task-demo-${Date.now()}`,
            creator_id: 'demo-client-1',
            type,
            status: 'pending_driver',
            description: `Demo ${type} request: ${type === 'delivery' ? 'Package' : type === 'shopping' ? 'Groceries' : 'Maintenance'}`,
            lat: center.lat + (Math.random() - 0.5) * 0.015,
            lng: center.lng + (Math.random() - 0.5) * 0.015,
            price: 10 + Math.floor(Math.random() * 20),
            created_at: new Date().toISOString()
          };
          setTasks(prev => [newDemoTask, ...prev]);
        }
      }, 1500); // Faster interval
    }

    return () => {
      window.removeEventListener('astranov-demo', onDemoEvent);
      if (demoInterval) clearInterval(demoInterval);
    };
  }, [isDemoMode, center, handleDemo]);
  const [isDriverSetupOpen, setIsDriverSetupOpen] = useState(false);
  const [isShopSetupOpen, setIsShopSetupOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastReply, setLastReply] = useState<string>();
  const [newTaskId, setNewTaskId] = useState<string | null>(null);
  const [hasShop, setHasShop] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'ok' | 'warn' | 'bad'>('ok');
  const [deviceInfo, setDeviceInfo] = useState('—');
  const [activeRoute, setActiveRoute] = useState<[number, number][] | undefined>(undefined);
  const [isGamesModalOpen, setIsGamesModalOpen] = useState(false);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<{ id: string, lat: number, lng: number, text: string }[]>([]);
  const [widgets, setWidgets] = useState<{ id: string, name: string, icon: any, color: string, data?: string }[]>([]);

  const [isActive, setIsActive] = useState(true);
  
  const tasksRef = useRef<Task[]>([]);
  const usersRef = useRef<User[]>([]);
  
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => { usersRef.current = users; }, [users]);

  // Initialize
  useEffect(() => {
    // Get Location
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCenter({ lat: latitude, lng: longitude });
        socketService.connect(USER_ID, "Citizen", role, latitude, longitude);
      },
      (err) => {
        console.warn("Geolocation failed, using default center:", err);
        socketService.connect(USER_ID, "Citizen", role, center.lat, center.lng);
      }
    );

    // Device Info
    const cores = navigator.hardwareConcurrency || 0;
    const vp = `${window.innerWidth}×${window.innerHeight}`;
    setDeviceInfo(`${cores}c / ${vp}`);

    // Network status monitoring
    const updateOnlineStatus = () => {
      setNetworkStatus(navigator.onLine ? 'ok' : 'bad');
    };
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Fetch User Data
    fetch(`/api/users/${USER_ID}`)
      .then(res => res.ok ? res.json() : null)
      .then(user => {
        if (user) setCurrentUser(user);
      })
      .catch(err => console.error("Error fetching user:", err));

    // Fetch Initial Data
    const fetchData = () => {
      fetch('/api/users').then(res => res.json()).then(setUsers).catch(() => {});
      fetch('/api/shops').then(res => res.json()).then(shops => {
        if (Array.isArray(shops)) {
          setShops(shops);
          setHasShop(shops.some((s: Shop) => s.owner_id === USER_ID));
        }
      }).catch(() => {});
      fetch('/api/tasks').then(res => res.json()).then(setTasks).catch(() => {});
    };
    fetchData();

    // Listen for socket updates
    const handleSocketMessage = (msg: any) => {
      if (msg.type === 'task_created') {
        setTasks(prev => [msg.data, ...prev]);
        setNewTaskId(msg.data.id);
        setLastReply(`New task: ${msg.data.description}`);
        try { new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play(); } catch(e) {}
        setTimeout(() => setNewTaskId(null), 5000);
      } else if (msg.type === 'task_updated') {
        setTasks(prev => prev.map(t => t.id === msg.data.id ? { ...t, ...msg.data } : t));
        if (msg.data.status === 'assigned' && msg.data.creator_id === USER_ID) {
          setLastReply("A driver has accepted your task!");
        }
      } else if (msg.type === 'shop_created') {
        setShops(prev => {
          if (prev.some(s => s.id === msg.data.id)) return prev;
          return [...prev, msg.data];
        });
        setLastReply(`New shop opened: ${msg.data.name}`);
      } else if (msg.type === 'user_moved') {
        setUsers(prev => {
          const exists = prev.find(u => u.id === msg.data.userId);
          if (exists) {
            return prev.map(u => u.id === msg.data.userId ? { ...u, ...msg.data, role: msg.data.role } : u);
          }
          return [...prev, { id: msg.data.userId, name: "Citizen", role: msg.data.role, ...msg.data, balance: 100 }];
        });
      }
    };

    socketService.addListener(handleSocketMessage);
    return () => {
      socketService.removeListener(handleSocketMessage);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleRoleChange = (newRole: UserRole) => {
    if (newRole === 'deliverer' && !currentUser?.is_verified_driver) {
      setIsDriverSetupOpen(true);
      return;
    }
    if (newRole === 'vendor' && !hasShop) {
      setIsShopSetupOpen(true);
      return;
    }
    updateRole(newRole);
  };

  const updateRole = async (newRole: UserRole) => {
    setRole(newRole);
    await fetch(`/api/users/${USER_ID}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    });
  };

  const handleDriverSetupComplete = async (details: { vehicle: string; insurance: string }) => {
    await fetch(`/api/users/${USER_ID}/verify-driver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details)
    });
    setCurrentUser(prev => prev ? { ...prev, is_verified_driver: true } : null);
    setIsDriverSetupOpen(false);
    updateRole('deliverer');
    setLastReply("Driver account activated! You can now accept tasks.");
  };

  const handleShopSetupComplete = async (details: { name: string; description: string; schedule: string }) => {
    const newShop = {
      id: `shop-${Date.now()}`,
      owner_id: USER_ID,
      ...details,
      image_url: `https://picsum.photos/seed/${Math.random()}/800/600`,
      lat: center.lat,
      lng: center.lng,
      is_active: true
    };
    await fetch('/api/shops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newShop)
    });
    setHasShop(true);
    setIsShopSetupOpen(false);
    updateRole('vendor');
    setIsVendorDashboardOpen(true);
    setLastReply("Shop registered! Add your products to start selling.");
  };

  const handleAcceptTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId: USER_ID })
    });
    setLastReply("Task accepted! The route is now visible on your map.");
    // Close any open popups
    const mapElement = document.querySelector('.leaflet-container');
    if (mapElement) {
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      mapElement.dispatchEvent(clickEvent);
    }
  };

  useEffect(() => {
    (window as any).acceptTask = handleAcceptTask;
    return () => {
      delete (window as any).acceptTask;
    };
  }, []);

  const handleCommand = async (command: string) => {
    setIsLoading(true);
    try {
      const result = await processCommand(command, { role, center, userId: USER_ID });
      setLastReply(result.reply);

      if (result.action === 'CREATE_TASK') {
        // Calculate Price (Mocking distance for now)
        const distance = 2.5; // km
        const isNight = new Date().getHours() >= 22 || new Date().getHours() < 6;
        const isBadWeather = false; // Mock
        const weight = 2; // Mock
        
        let price = Math.ceil(distance);
        if (isNight) price += 1;
        if (isBadWeather) price += 1;
        if (weight > 3) price += 1;

        const newTask = {
          id: `task-${Date.now()}`,
          creator_id: USER_ID,
          ...result.data,
          lat: center.lat,
          lng: center.lng,
          price,
          weight,
          status: 'pending_driver'
        };
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTask)
        });
      } else if (result.action === 'REGISTER_SHOP') {
        setIsShopSetupOpen(true);
      } else if (result.action === 'UPDATE_ROLE') {
        handleRoleChange(result.data.role);
      } else if (result.action === 'IMPROVE_CODE') {
        setLastReply(`Analyzing ${result.data.targetFile}... Applying improvements: ${result.data.request}`);
      } else if (result.action === 'ISSUE_INVOICE') {
        setLastReply(`Invoice generated for task ${result.data.taskId}: €${result.data.amount}`);
        fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: `inv-${Date.now()}`, task_id: result.data.taskId, amount: result.data.amount })
        });
      } else if (result.action === 'ADD_PRODUCT' && role === 'vendor') {
        setIsVendorDashboardOpen(true);
      } else if (result.action === 'SEARCH_PRODUCTS') {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(result.data.query)}`);
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error("AI Error:", error);
      setLastReply("Sorry, I couldn't process that.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapClick = useCallback((lat: number, lng: number, x: number, y: number) => {
    // Map click menu disabled as requested
  }, []);

  const handleCategorySelect = (category: string) => {
    if (category === 'Games') {
      setIsGamesModalOpen(true);
    } else if (category === 'Simulation') {
      handleDemo();
    } else if (category === 'Radar') {
      setIsRadarOpen(true);
    } else if (category === 'Drivers') {
      handleRoleChange('deliverer');
    } else if (category === 'Shops') {
      handleRoleChange('vendor');
    } else if (category === 'Invoices') {
      setLastReply("Accessing billing records...");
    }
    setIsCategoryDrawerOpen(false);
  };

  const handleSpawnWidget = (cat: any) => {
    if (cat.name === 'Radar') {
      setIsRadarOpen(true);
      setIsCategoryDrawerOpen(false);
    } else {
      const id = `widget-${Date.now()}`;
      setWidgets(prev => [...prev, { ...cat, id }]);
      setIsCategoryDrawerOpen(false);
    }
  };

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  };

  const handleMarkerClick = (id: string, type: 'task' | 'shop' | 'user') => {
    if (type === 'task') {
      const task = tasks.find(t => t.id === id);
      if (task) {
        setNewTaskId(task.id);
        // Calculate route if driver
        if (role === 'deliverer') {
          setActiveRoute([
            [currentUser?.lat || center.lat, currentUser?.lng || center.lng],
            [task.lat, task.lng]
          ]);
        }
      }
    } else if (type === 'shop') {
      const shop = shops.find(s => s.id === id);
      if (shop) {
        setCenter({ lat: shop.lat, lng: shop.lng });
        setLastReply(`Viewing ${shop.name}.`);
      }
    }
  };

  const handleDropOnMap = (e: React.DragEvent) => {
    e.preventDefault();
    const catName = e.dataTransfer.getData('text/plain');
    if (catName) {
      if (catName === 'Radar') {
        setRadarPosition({ x: e.clientX - 96, y: e.clientY - 96 }); // 96 is half of 192px (w-48)
        setIsRadarOpen(true);
        setIsCategoryDrawerOpen(false);
      } else {
        const cat = CATEGORIES.find(c => c.name === catName);
        if (cat) {
          const id = `widget-${Date.now()}`;
          setWidgets(prev => [...prev, { ...cat, id, initialX: e.clientX - 50, initialY: e.clientY - 50 }]);
          setIsCategoryDrawerOpen(false);
        }
      }
    }
  };

  const handleDragOverMap = (e: React.DragEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    if (center.lat !== 40.7128 && isActive) {
      socketService.updateLocation(center.lat, center.lng, role);
    }
  }, [center, role, isActive]);

  return (
    <div 
      className="relative w-screen h-screen bg-black overflow-hidden font-sans"
      onDrop={handleDropOnMap}
      onDragOver={handleDragOverMap}
    >
      {/* Background Map */}
      <div className="absolute inset-0 z-0">
        <Map 
          center={center} 
          tasks={tasks} 
          shops={shops}
          users={users} 
          onMapClick={handleMapClick} 
          onMarkerClick={handleMarkerClick}
          userRole={role}
          userId={USER_ID}
          activeRoute={activeRoute}
          floatingTexts={floatingTexts}
        />
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 pointer-events-none h-full w-full">
        {/* Search Bar & Drawer Toggle */}
        <div className="absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[600px] z-[1100] pointer-events-auto flex flex-col gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-[22px] bg-[rgba(10,14,18,0.72)] border border-white/10 shadow-2xl backdrop-blur-ribbon">
            <div className="h-7 px-2.5 flex items-center rounded-full border border-electric-blue/30 bg-electric-blue/10 text-white font-black text-[12px] uppercase tracking-widest">
              AI
            </div>
            <div className="flex-1">
              <AIInput 
                onCommand={handleCommand} 
                isLoading={isLoading} 
                lastReply={lastReply} 
                inline={true}
              />
            </div>
            <button 
              onClick={() => setIsCategoryDrawerOpen(!isCategoryDrawerOpen)}
              className="w-11 h-11 shrink-0 rounded-xl border border-white/10 bg-white/5 text-white flex items-center justify-center hover:border-electric-blue/40 hover:bg-electric-blue/5 transition-all active:scale-[0.98]"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <CategoryDrawer 
            isOpen={isCategoryDrawerOpen} 
            onClose={() => setIsCategoryDrawerOpen(false)} 
            onSelectCategory={handleCategorySelect}
            onSpawnWidget={handleSpawnWidget}
            balance={currentUser?.balance || 0} 
            userName={currentUser?.name || 'Guest'} 
            userId={USER_ID}
            networkStatus={networkStatus}
            deviceInfo={deviceInfo}
            onToggleStatus={setIsActive}
            isActive={isActive}
            currentRole={role}
            onRoleChange={handleRoleChange}
            isVerifiedDriver={!!currentUser?.is_verified_driver}
            hasShop={hasShop}
          />
        </div>

        <GamesModal 
          isOpen={isGamesModalOpen} 
          onClose={() => setIsGamesModalOpen(false)} 
        />
      </div>

      {/* Render Floating Widgets */}
      {widgets.map(w => (
        <FloatingWidget 
          key={w.id} 
          {...w} 
          onClose={() => removeWidget(w.id)} 
          initialX={window.innerWidth / 2 - 50}
          initialY={window.innerHeight / 2 - 50}
        />
      ))}

      {/* Radar Widget */}
      {isRadarOpen && (
        <RadarWidget 
          onClose={() => setIsRadarOpen(false)}
          center={center}
          tasks={tasks}
          users={users}
          shops={shops}
          initialX={radarPosition.x}
          initialY={radarPosition.y}
        />
      )}

      {/* Vendor Dashboard */}
      {isVendorDashboardOpen && (
        <VendorDashboard 
          userId={USER_ID} 
          onClose={() => setIsVendorDashboardOpen(false)} 
        />
      )}

      {/* Product Search Results */}
      {searchResults && (
        <ProductSearchModal 
          products={searchResults} 
          onClose={() => setSearchResults(null)} 
        />
      )}

      {/* Setup Modals */}
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

      {/* Role Selector moved inside StatusRibbon User Button expansion logic */}

      {/* Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
}
