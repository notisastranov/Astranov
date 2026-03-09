import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, Globe, Send, X, Shield, Star, MessageSquare, Search, Badge, Settings } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  description: string;
  type: 'global' | 'local' | 'specialized';
  members: number;
}

interface TeamPlatformProps {
  isOpen: boolean;
  onClose: () => void;
  onPostGlobal: (content: string) => void;
  currentTeamId: string;
  onSelectTeam: (teamId: string) => void;
  teams: Team[];
  onUpdateTeams: (teams: Team[]) => void;
}

export default function TeamPlatform({ isOpen, onClose, onPostGlobal, currentTeamId, onSelectTeam, teams, onUpdateTeams }: TeamPlatformProps) {
  const [activeTab, setActiveTab] = useState<'global' | 'local' | 'specialized' | 'manage'>('global');
  const [postContent, setPostContent] = useState('');

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handlePost = () => {
    if (postContent.trim()) {
      const team = teams.find(t => t.id === currentTeamId);
      onPostGlobal(`[${team?.name || 'Message'}] ${postContent}`);
      setPostContent('');
      onClose();
    }
  };

  const handleCreateTeam = () => {
    if (newTeamName.trim()) {
      const newTeam: Team = {
        id: `team-${Date.now()}`,
        name: newTeamName,
        description: newTeamDesc || 'No description provided.',
        type: 'specialized',
        members: 1
      };
      onUpdateTeams([...teams, newTeam]);
      setNewTeamName('');
      setNewTeamDesc('');
      onSelectTeam(newTeam.id);
    }
  };

  const handleDeleteTeam = (id: string) => {
    if (id === 'global' || id === 'local') return; // Protect system teams
    onUpdateTeams(teams.filter(t => t.id !== id));
    if (currentTeamId === id) onSelectTeam('global');
  };

  const handleRenameTeam = (id: string) => {
    if (editName.trim()) {
      onUpdateTeams(teams.map(t => t.id === id ? { ...t, name: editName } : t));
      setEditingTeamId(null);
      setEditName('');
    }
  };

  const currentTeam = teams.find(t => t.id === currentTeamId) || teams[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-zinc-900/95 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-grab active:cursor-grabbing"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Badge className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Team Center</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Active: {currentTeam.name}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar">
              <TabButton 
                active={activeTab === 'global'} 
                onClick={() => setActiveTab('global')} 
                icon={<Globe className="w-4 h-4" />} 
                label="Global" 
              />
              <TabButton 
                active={activeTab === 'local'} 
                onClick={() => setActiveTab('local')} 
                icon={<Search className="w-4 h-4" />} 
                label="Local" 
              />
              <TabButton 
                active={activeTab === 'specialized'} 
                onClick={() => setActiveTab('specialized')} 
                icon={<Shield className="w-4 h-4" />} 
                label="Groups" 
              />
              <TabButton 
                active={activeTab === 'manage'} 
                onClick={() => setActiveTab('manage')} 
                icon={<Plus className="w-4 h-4" />} 
                label="Manage" 
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="space-y-6">
                {activeTab !== 'manage' ? (
                  <>
                    <div className={`p-4 rounded-2xl border flex items-start gap-4 ${
                      activeTab === 'global' ? 'bg-purple-500/10 border-purple-500/20' :
                      activeTab === 'local' ? 'bg-blue-500/10 border-blue-500/20' :
                      'bg-orange-500/10 border-orange-500/20'
                    }`}>
                      {activeTab === 'global' ? <Globe className="w-6 h-6 text-purple-400 shrink-0 mt-1" /> :
                       activeTab === 'local' ? <Search className="w-6 h-6 text-blue-400 shrink-0 mt-1" /> :
                       <Shield className="w-6 h-6 text-orange-400 shrink-0 mt-1" />}
                      <div>
                        <h4 className={`text-sm font-black uppercase italic ${
                          activeTab === 'global' ? 'text-purple-400' :
                          activeTab === 'local' ? 'text-blue-400' :
                          'text-orange-400'
                        }`}>
                          {activeTab === 'global' ? 'Global Message' :
                           activeTab === 'local' ? 'Regional Message' :
                           'Specialized Groups'}
                        </h4>
                        <p className="text-xs opacity-60 text-white">
                          {activeTab === 'global' ? 'Visible to all users in the Astranov network.' :
                           activeTab === 'local' ? 'Visible only to users within your current area.' :
                           'Select a specialized group to message.'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {teams.filter(t => t.type === activeTab).map(team => (
                        <button
                          key={team.id}
                          onClick={() => onSelectTeam(team.id)}
                          className={`p-4 rounded-xl border text-left transition-all group ${
                            currentTeamId === team.id 
                              ? 'bg-white/10 border-white/30' 
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <h5 className={`font-black uppercase italic ${currentTeamId === team.id ? 'text-white' : 'text-white/60'}`}>
                              {team.name}
                            </h5>
                            <div className="flex items-center gap-2">
                              <Users className="w-3 h-3 text-white/20" />
                              <span className="text-[10px] text-white/20 font-bold">{team.members}</span>
                            </div>
                          </div>
                          <p className="text-xs text-white/40 mt-1">{team.description}</p>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2 pt-4">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Message Content</label>
                        <textarea 
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          placeholder={`SEND MESSAGE TO ${currentTeam.name.toUpperCase()}...`}
                          className="w-full bg-black hover:bg-black focus:bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:border-purple-500/40 outline-none transition-all min-h-[100px] resize-none text-sm"
                        />
                    </div>
                    <button 
                      onClick={handlePost}
                      disabled={!postContent.trim()}
                      className="w-full py-4 rounded-xl bg-purple-500 text-white font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
                    >
                      <Send className="w-5 h-5" />
                      Send Message
                    </button>
                  </>
                ) : (
                  <div className="space-y-8">
                    {/* Create Team */}
                    <div className="space-y-4 p-6 bg-white/5 rounded-3xl border border-white/10">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-500" />
                        Initialize New Group
                      </h4>
                      <div className="space-y-3">
                        <input 
                          type="text"
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          placeholder="GROUP NAME (E.G. NIGHT RIDERS)"
                          className="w-full bg-black hover:bg-black focus:bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500/40 outline-none transition-all"
                        />
                        <input 
                          type="text"
                          value={newTeamDesc}
                          onChange={(e) => setNewTeamDesc(e.target.value)}
                          placeholder="GROUP OBJECTIVE"
                          className="w-full bg-black hover:bg-black focus:bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500/40 outline-none transition-all"
                        />
                        <button 
                          onClick={handleCreateTeam}
                          disabled={!newTeamName.trim()}
                          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest text-xs hover:bg-emerald-500 transition-all disabled:opacity-50"
                        >
                          Activate Group
                        </button>
                      </div>
                    </div>

                    {/* Team List with Management */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 ml-1">
                        <Settings className="w-4 h-4 text-purple-400" />
                        Group Management
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        {teams.filter(t => t.type === 'specialized').map(team => (
                          <div 
                            key={team.id}
                            className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group"
                          >
                            <div className="flex-1 mr-4">
                              {editingTeamId === team.id ? (
                                <div className="flex gap-2">
                                  <input 
                                    autoFocus
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRenameTeam(team.id)}
                                    className="bg-black hover:bg-black focus:bg-black border border-purple-500/40 rounded px-2 py-1 text-white text-xs outline-none w-full"
                                  />
                                  <button onClick={() => handleRenameTeam(team.id)} className="text-emerald-500"><BadgeCheck className="w-4 h-4" /></button>
                                </div>
                              ) : (
                                <>
                                  <h5 className="font-black text-white uppercase italic text-sm">{team.name}</h5>
                                  <p className="text-[10px] text-white/40">{team.description}</p>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => { setEditingTeamId(team.id); setEditName(team.name); }}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteTeam(team.id)}
                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 transition-all border-b-2 shrink-0 ${
        active 
          ? 'border-purple-500 bg-purple-500/5 text-white' 
          : 'border-transparent text-white/40 hover:text-white/60'
      }`}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{label}</span>
    </button>
  );
}

import { BadgeCheck } from 'lucide-react';
