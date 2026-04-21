import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, Image as ImageIcon, Layout, FileText, Power, User, Upload, Palette, Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, ExternalLink, StickyNote, Plus, Trash2, Save } from 'lucide-react';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function Login({ setToken }) {
  const [username, setUsername] = useState('shoerack381@gmail.com');
  const [password, setPassword] = useState('PakistanA381');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      navigate('/');
    } catch { alert('Invalid credentials'); }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-96">
        <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Username" className="w-full mb-4 p-3 bg-gray-700 rounded" value={username} onChange={e => setUsername(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full mb-6 p-3 bg-gray-700 rounded" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-green-600 hover:bg-green-500 py-3 rounded font-bold">Login</button>
        </form>
      </div>
    </div>
  );
}

function Sidebar({ onLogout }) {
  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-green-500">ADMIN<span className="text-white">PANEL</span></h1>
      </div>
      <nav className="flex-1 px-4 space-y-2 font-medium">
        <Link to="/" className="flex items-center space-x-3 text-gray-300 hover:text-white px-4 py-3 rounded hover:bg-gray-800">
          <Layout size={20} /><span>Slides & Points</span>
        </Link>
        <Link to="/notes" className="flex items-center space-x-3 text-gray-300 hover:text-white px-4 py-3 rounded hover:bg-gray-800">
          <StickyNote size={20} /><span>Notes Board</span>
        </Link>
        <Link to="/themes" className="flex items-center space-x-3 text-gray-300 hover:text-white px-4 py-3 rounded hover:bg-gray-800">
          <Settings size={20} /><span>Theme Manager</span>
        </Link>
      </nav>
      <div className="p-4 border-t border-gray-800 space-y-2">
        <a href="http://localhost:3001/" target="_blank" rel="noreferrer" className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded transition-colors text-sm font-bold">
          <ExternalLink size={16} className="mr-2" /> View Frontend
        </a>
        <button onClick={onLogout} className="flex items-center w-full text-red-400 hover:bg-gray-800 px-4 py-2 rounded">
          <Power size={20} className="mr-3" /> Logout
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const [slides, setSlides] = useState([]);
  const [settings, setSettings] = useState({
    master_point_font: '', master_point_size: '', master_point_color: '#ffffff', master_point_bg: 'transparent',
    master_point_bold: 0, master_point_italic: 0, master_point_underline: 0, master_point_align: 'right'
  });

  useEffect(() => { 
    loadSlides(); 
    api.get('/settings').then(res => setSettings(res.data || {}));
  }, []);

  const loadSlides = () => api.get('/slides').then(res => setSlides(res.data));
  const saveMasterStyle = async () => {
    await api.put('/settings', settings);
    alert('Master Style applied successfully!');
  };

  const addSlide = async () => {
    await api.post('/slides', { order_index: slides.length });
    loadSlides();
  };

  const deleteSlide = async (id) => {
    if(confirm('Delete slide?')) { await api.delete(`/slides/${id}`); loadSlides(); }
  };

  const addPoint = async (slideId) => {
    await api.post('/instructions', { slide_id: slideId, text: 'New Point Text', icon_path: '', icon_position: 'left' });
    loadSlides();
  };

  const updatePoint = async (pointId, updates) => {
    // Merge with existing
    let pointToUpdate = null;
    for(let s of slides) {
        let found = s.instructions.find(i => i.id === pointId);
        if(found) pointToUpdate = found;
    }
    if(!pointToUpdate) return;

    await api.put(`/instructions/${pointId}`, { ...pointToUpdate, ...updates });
    loadSlides();
  };

  const deletePoint = async (id) => {
    if(confirm('Delete point?')) { await api.delete(`/instructions/${id}`); loadSlides(); }
  };

  const handleIconUpload = async (e, pointId) => {
    const file = e.target.files[0];
    if(!file) return;
    const formData = new FormData();
    formData.append('image', file);
    const uploadRes = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    updatePoint(pointId, { icon_path: uploadRes.data.path });
  };

  return (
    <div className="p-8 pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold">Manage 12-Point System</h2>
          <p className="text-gray-400 text-sm mt-1">Add or edit your text points below.</p>
        </div>
        <button onClick={addSlide} className="bg-green-600 px-4 py-2 rounded font-bold text-sm">+ Add Slide Block</button>
      </div>

      {/* MASTER POINT STYLE CONTROLS */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-10 shadow-xl">
        <h3 className="text-xl font-bold text-pink-400 mb-4 border-b border-gray-700 pb-2 flex justify-between items-center">
            Master Data Point Style
            <button onClick={saveMasterStyle} className="bg-pink-600 hover:bg-pink-500 text-white text-sm px-4 py-2 rounded">Apply Master Style</button>
        </h3>
        <p className="text-sm text-gray-400 mb-6">These styling rules automatically apply uniformly across all 12 points simultaneously.</p>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
           <div>
             <label className="block text-sm mb-1 text-gray-400">Master Font Family</label>
             <select className="w-full bg-gray-900 rounded p-2 text-white" value={settings.master_point_font || ''} onChange={e => setSettings({...settings, master_point_font: e.target.value})}>
               <option value="">Default Font (Urdu Nasta'liq)</option>
               <option value="'Amiri', serif">Amiri Arabic</option>
               <option value="sans-serif">Modern Sans-Serif</option>
             </select>
           </div>
           
           <div>
             <label className="block text-sm mb-1 text-gray-400">Master Font Size (px)</label>
             <input type="number" className="w-full bg-gray-900 rounded p-2" placeholder="e.g. 24" value={settings.master_point_size || ''} onChange={e => setSettings({...settings, master_point_size: e.target.value})} />
           </div>

           <div>
              <label className="block text-sm mb-1 text-gray-400">Text Display Attributes</label>
              <div className="flex space-x-2">
                 <button onClick={() => setSettings({...settings, master_point_bold: settings.master_point_bold ? 0 : 1})} className={`px-4 py-2 rounded ${settings.master_point_bold ? 'bg-green-600' : 'bg-gray-900 hover:bg-gray-700'}`}><Bold size={18}/></button>
                 <button onClick={() => setSettings({...settings, master_point_italic: settings.master_point_italic ? 0 : 1})} className={`px-4 py-2 rounded ${settings.master_point_italic ? 'bg-green-600' : 'bg-gray-900 hover:bg-gray-700'}`}><Italic size={18}/></button>
                 <button onClick={() => setSettings({...settings, master_point_underline: settings.master_point_underline ? 0 : 1})} className={`px-4 py-2 rounded ${settings.master_point_underline ? 'bg-green-600' : 'bg-gray-900 hover:bg-gray-700'}`}><Underline size={18}/></button>
              </div>
           </div>

           <div>
              <label className="block text-sm mb-1 text-gray-400">Master Alignment</label>
              <div className="flex space-x-2">
                 <button onClick={() => setSettings({...settings, master_point_align: 'left'})} className={`px-4 py-2 rounded ${settings.master_point_align === 'left' ? 'text-green-400 bg-gray-900' : 'text-gray-400 bg-gray-900 hover:text-green-400'}`}><AlignLeft size={18}/></button>
                 <button onClick={() => setSettings({...settings, master_point_align: 'center'})} className={`px-4 py-2 rounded ${settings.master_point_align === 'center' ? 'text-green-400 bg-gray-900' : 'text-gray-400 bg-gray-900 hover:text-green-400'}`}><AlignCenter size={18}/></button>
                 <button onClick={() => setSettings({...settings, master_point_align: 'right'})} className={`px-4 py-2 rounded ${settings.master_point_align === 'right' ? 'text-green-400 bg-gray-900' : 'text-gray-400 bg-gray-900 hover:text-green-400'}`}><AlignRight size={18}/></button>
              </div>
           </div>

           <div>
             <label className="flex items-center text-sm mb-1 text-gray-400"><Palette size={14} className="mr-2"/> Text Color</label>
             <input type="color" className="w-full h-10 bg-transparent cursor-pointer" value={settings.master_point_color || '#ffffff'} onChange={e => setSettings({...settings, master_point_color: e.target.value})} />
           </div>

           <div>
             <label className="flex items-center text-sm mb-1 text-gray-400"><Palette size={14} className="mr-2"/> Background Color Overlay</label>
             <div className="flex items-center space-x-2">
                 <input type="color" className="w-full h-10 bg-transparent cursor-pointer" value={settings.master_point_bg === 'transparent' ? '#000000' : settings.master_point_bg} onChange={e => setSettings({...settings, master_point_bg: e.target.value})} />
                 <button onClick={() => setSettings({...settings, master_point_bg: 'transparent'})} className="bg-gray-900 border border-gray-600 px-3 py-2 rounded text-xs hover:bg-red-900/50">Clear</button>
             </div>
           </div>
        </div>
      </div>

      {/* GLOBAL TOP SECTIONS (HEADER & CLOCK) moved from themes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          
        {/* Header Text Controls */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-xl">
            <h3 className="text-xl font-bold text-blue-400 mb-4 border-b border-gray-700 pb-2">Top Header Section</h3>
            <div className="space-y-4">
               <div>
                 <label className="block text-sm mb-1 text-gray-400">Editable Urdu Text</label>
                 <input type="text" dir="rtl" className="w-full bg-gray-900 rounded p-2 text-lg text-white" value={settings.header_text || ''} onChange={e => setSettings({...settings, header_text: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-6">
                   <div>
                      <label className="block text-sm mb-1 text-gray-400">Font</label>
                      <select className="w-full bg-gray-900 rounded p-2 text-white" value={settings.header_font || ''} onChange={e => setSettings({...settings, header_font: e.target.value})}>
                         <option value="">Default Nastaliq</option>
                         <option value="'Amiri', serif">Amiri Arabic</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-sm mb-1 text-gray-400">Size (px)</label>
                      <input type="number" placeholder="Size" className="w-full bg-gray-900 rounded p-2 text-white" value={settings.header_size || ''} onChange={e => setSettings({...settings, header_size: e.target.value})} />
                   </div>
                   <div className="col-span-2">
                     <label className="flex items-center text-sm mb-1 text-gray-400"><Palette size={14} className="mr-2"/> Text Color</label>
                     <input type="color" className="w-full h-10 bg-transparent cursor-pointer" value={settings.header_text_color || '#ffffff'} onChange={e => setSettings({...settings, header_text_color: e.target.value})} />
                   </div>
               </div>
               <button onClick={saveMasterStyle} className="mt-4 w-full bg-blue-600 hover:bg-blue-500 py-2 rounded text-sm font-bold text-white">Save Header Style</button>
            </div>
        </div>

        {/* Clock Controls */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-xl">
            <h3 className="text-xl font-bold text-green-400 mb-4 border-b border-gray-700 pb-2">Digital Clock</h3>
            <div className="grid grid-cols-2 gap-6">
               <div>
                 <label className="block text-sm mb-1 text-gray-400">Format</label>
                 <select className="w-full bg-gray-900 rounded p-2 text-white" value={settings.clock_format || '12'} onChange={e => setSettings({...settings, clock_format: e.target.value})}>
                   <option value="12">12-Hour (AM/PM)</option>
                   <option value="24">24-Hour (Military)</option>
                 </select>
               </div>
               <div>
                 <label className="block text-sm mb-1 text-gray-400">Font Size (px)</label>
                 <input type="number" className="w-full bg-gray-900 rounded p-2 text-white" placeholder="e.g. 64" value={settings.clock_size || ''} onChange={e => setSettings({...settings, clock_size: e.target.value})} />
               </div>
               <div>
                 <label className="block text-sm mb-1 text-gray-400">Font Family</label>
                 <select className="w-full bg-gray-900 rounded p-2 text-white" value={settings.clock_font || ''} onChange={e => setSettings({...settings, clock_font: e.target.value})}>
                   <option value="">Default OS Font</option>
                   <option value="monospace">Digital Monospace</option>
                 </select>
               </div>
               <div>
                 <label className="flex items-center text-sm mb-1 text-gray-400"><Palette size={14} className="mr-2"/> Color</label>
                 <input type="color" className="w-full h-10 bg-transparent cursor-pointer" value={settings.clock_color || '#ffffff'} onChange={e => setSettings({...settings, clock_color: e.target.value})} />
               </div>
            </div>
            <button onClick={saveMasterStyle} className="mt-4 w-full bg-green-600 hover:bg-green-500 py-2 rounded text-sm font-bold text-white">Save Clock Style</button>
        </div>

      </div>

      <div className="space-y-10">
        {slides.map((s, idx) => (
          <div key={s.id} className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
            <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-700">
              <h3 className="font-bold text-lg text-green-400">Layer {idx + 1}</h3>
              <div className="space-x-4">
                 <button onClick={() => addPoint(s.id)} className="text-blue-400 hover:text-blue-300 text-sm font-bold">+ Add Data Point</button>
                 <button onClick={() => deleteSlide(s.id)} className="text-red-400 hover:text-red-300 text-sm">Delete Block</button>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-800">
              {s.instructions.map(inst => (
                <div key={inst.id} className="bg-gray-700 rounded border border-gray-600 flex flex-col h-full">
                  
                  {/* Point Content */}
                  <div className="p-4 flex-1">
                    <textarea 
                      className="w-full bg-gray-900 border border-gray-600 block text-white p-2 rounded"
                      rows="3" dir="rtl" value={inst.text} 
                      onChange={e => updatePoint(inst.id, { text: e.target.value })}
                    />
                  </div>

                  {/* Icon & Footer */}
                  <div className="p-3 bg-gray-800 border-t border-gray-600 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                       {inst.icon_path ? (
                         <img src={`http://localhost:3001${inst.icon_path}`} className="w-8 h-8 rounded border border-gray-600 bg-gray-900 object-contain" alt="" />
                       ) : <div className="w-8 h-8 rounded border border-gray-600 bg-gray-900 flex items-center justify-center"><ImageIcon size={14} className="text-gray-500"/></div>}
                       <label className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer font-bold">
                         Change Icon <input type="file" className="hidden" onChange={e => handleIconUpload(e, inst.id)} />
                       </label>
                    </div>
                    <button onClick={() => deletePoint(inst.id)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                  </div>

                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesBoard() {
  const [notes, setNotes] = useState([]);
  const [boardTheme, setBoardTheme] = useState('dark');
  const [expandedNote, setExpandedNote] = useState(null);
  const [zoomLevels, setZoomLevels] = useState({});
  const [notesBoardActive, setNotesBoardActive] = useState(false);

  const toggleNotesBoard = async (active) => {
    await api.post('/settings/toggle-notes', { active });
    setNotesBoardActive(active);
  };
  
  const FONTS = [
    { value: "'Inter', sans-serif", label: 'Inter (Modern)' },
    { value: "sans-serif", label: 'System Sans' },
    { value: "serif", label: 'Classic Serif' },
    { value: "'Georgia', serif", label: 'Georgia' },
    { value: "'Courier New', monospace", label: 'Courier (Code)' },
    { value: "monospace", label: 'Monospace' },
    { value: "'Noto Nastaliq Urdu', serif", label: 'Urdu Nastaliq' },
    { value: "'Amiri', serif", label: 'Arabic Amiri' },
    { value: "'Palatino Linotype', serif", label: 'Palatino' },
    { value: "'Trebuchet MS', sans-serif", label: 'Trebuchet' },
    { value: "'Lucida Console', monospace", label: 'Lucida Console' },
    { value: "'Comic Sans MS', cursive", label: 'Comic (Casual)' },
  ];

  const BOARD_THEMES = {
    dark:     { bg: '#0f172a', card: '#1e293b', border: '#334155', text: '#e2e8f0', accent: '#3b82f6', label: 'Dark Mode' },
    light:    { bg: '#f8fafc', card: '#ffffff', border: '#e2e8f0', text: '#1e293b', accent: '#2563eb', label: 'Light Mode' },
    soft:     { bg: '#fdf2f8', card: '#fff1f2', border: '#fecdd3', text: '#881337', accent: '#e11d48', label: 'Soft Rose' },
    gradient: { bg: '#0c0a09', card: '#1c1917', border: '#44403c', text: '#fafaf9', accent: '#f59e0b', label: 'Amber Glow' },
    minimal:  { bg: '#fafaf9', card: '#f5f5f4', border: '#d6d3d1', text: '#292524', accent: '#78716c', label: 'Minimal Stone' },
  };

  const theme = BOARD_THEMES[boardTheme];

  useEffect(() => {
    loadNotes();
    api.get('/settings').then(res => setNotesBoardActive(res.data?.notes_board_active === 1));
  }, []);
  const loadNotes = () => api.get('/notes').then(res => setNotes(res.data));

  const addNote = async (type = 'text') => {
    await api.post('/notes', { type, title: '', content: '', image_path: '', font_family: "'Inter', sans-serif", font_size: '18', bg_color: theme.card, text_color: theme.text });
    loadNotes();
  };

  const updateNote = async (id, updates) => {
    const target = notes.find(n => n.id === id);
    if (!target) return;
    await api.put(`/notes/${id}`, { ...target, ...updates });
    loadNotes();
  };

  const deleteNote = async (id) => {
    if(confirm('Delete this note permanently?')) { await api.delete(`/notes/${id}`); loadNotes(); }
  };

  const handleImageUpload = async (e, id) => {
    const file = e.target.files[0];
    if(!file) return;
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    updateNote(id, { image_path: res.data.path });
  };

  const getZoom = (id) => zoomLevels[id] || 1;
  const setZoom = (id, level) => setZoomLevels(prev => ({ ...prev, [id]: level }));
  const ZOOM_OPTIONS = [0.75, 1, 1.25, 1.5, 2, 2.5, 3];

  const renderNoteCard = (note) => {
    const zoom = getZoom(note.id);
    const isExpanded = expandedNote === note.id;
    const baseFontSize = parseInt(note.font_size || 18);

    return (
      <div key={note.id} id={`note-card-${note.id}`}
        className={`rounded-2xl overflow-hidden flex flex-col transition-all duration-300 resize ${isExpanded ? 'col-span-full row-span-2' : ''}`}
        style={{
          width: note.width && note.width > 0 ? `${note.width}px` : 'auto',
          height: note.height && note.height > 0 ? `${note.height}px` : (isExpanded ? '70vh' : '320px'),
          backgroundColor: note.bg_color || theme.card,
          color: note.text_color || theme.text,
          border: `1px solid ${theme.border}`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
          minHeight: isExpanded ? '70vh' : '320px',
        }}>
        
        {/* ─── Top Toolbar ─── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: theme.border, backgroundColor: 'rgba(0,0,0,0.08)' }}>
          {/* Title */}
          <input type="text"
            className="bg-transparent font-semibold text-base outline-none flex-1 mr-3"
            style={{ color: note.text_color || theme.text }}
            value={note.title}
            onChange={e => updateNote(note.id, { title: e.target.value })}
            placeholder="Untitled note…"
          />
          {/* Action Icons */}
          <div className="flex items-center space-x-1.5">
            <button onClick={() => {
                const el = document.getElementById(`note-card-${note.id}`);
                const rect = el.getBoundingClientRect();
                updateNote(note.id, { 
                  width: Math.round(rect.width), 
                  height: Math.round(rect.height) 
                });
                alert('Note settings and dimensions saved!');
              }}
              title="Save Note & Dimensions"
              className="p-1.5 rounded-lg hover:bg-emerald-500 hover:bg-opacity-30 text-emerald-400 transition-colors">
              <Save size={14} />
            </button>
            <button onClick={() => setExpandedNote(isExpanded ? null : note.id)}
              title={isExpanded ? 'Collapse' : 'Expand'}
              className="p-1.5 rounded-lg hover:bg-black hover:bg-opacity-20 transition-colors">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d={isExpanded ? "M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" : "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"} /></svg>
            </button>
            <button onClick={() => deleteNote(note.id)}
              title="Delete"
              className="p-1.5 rounded-lg hover:bg-red-500 hover:bg-opacity-30 text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* ─── Formatting Toolbar ─── */}
        <div className="flex items-center px-3 py-1.5 gap-1.5 flex-wrap border-b overflow-x-auto" style={{ borderColor: theme.border, backgroundColor: 'rgba(0,0,0,0.04)' }}>
          {/* Font Selector */}
          <select
            className="text-xs rounded-md px-2 py-1.5 outline-none cursor-pointer truncate max-w-[130px]"
            style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: note.text_color || theme.text, border: `1px solid ${theme.border}` }}
            value={note.font_family || "'Inter', sans-serif"}
            onChange={e => updateNote(note.id, { font_family: e.target.value })}
          >
            {FONTS.map(f => <option key={f.value} value={f.value} style={{color:'#000'}}>{f.label}</option>)}
          </select>

          {/* Divider */}
          <div className="w-px h-5 mx-1" style={{backgroundColor: theme.border}}></div>

          {/* Zoom Selector */}
          <div className="flex items-center text-xs rounded-md overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
            {ZOOM_OPTIONS.map(z => (
              <button key={z}
                onClick={() => setZoom(note.id, z)}
                className="px-2 py-1.5 transition-colors"
                style={{
                  backgroundColor: zoom === z ? theme.accent : 'rgba(0,0,0,0.1)',
                  color: zoom === z ? '#fff' : (note.text_color || theme.text),
                  fontWeight: zoom === z ? 700 : 400,
                  fontSize: '10px',
                }}>
                {z}x
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-5 mx-1" style={{backgroundColor: theme.border}}></div>

          {/* Font Size Input */}
          <div className="flex items-center space-x-1 bg-black bg-opacity-20 rounded-md px-2 py-1" style={{ border: `1px solid ${theme.border}` }}>
            <span className="text-[10px] opacity-60">Size</span>
            <input 
              type="number" 
              className="w-12 bg-transparent text-xs outline-none text-center"
              style={{ color: note.text_color || theme.text }}
              value={note.font_size || 18}
              onChange={e => updateNote(note.id, { font_size: e.target.value })}
            />
            <span className="text-[10px] opacity-40">px</span>
          </div>

          {/* Divider */}
          <div className="w-px h-5 mx-1" style={{backgroundColor: theme.border}}></div>

          {/* Color Pickers */}
          <div className="flex items-center space-x-1">
            <label className="flex items-center cursor-pointer px-1.5 py-1 rounded-md text-xs hover:bg-black hover:bg-opacity-10 transition-colors" title="Text Color">
              <span className="mr-1 text-[10px] opacity-60">A</span>
              <input type="color" className="w-5 h-5 rounded cursor-pointer bg-transparent border-0" value={note.text_color || '#ffffff'} onChange={e => updateNote(note.id, { text_color: e.target.value })} />
            </label>
            <label className="flex items-center cursor-pointer px-1.5 py-1 rounded-md text-xs hover:bg-black hover:bg-opacity-10 transition-colors" title="Background Color">
              <span className="mr-1 text-[10px] opacity-60">BG</span>
              <input type="color" className="w-5 h-5 rounded cursor-pointer bg-transparent border-0" value={note.bg_color || '#374151'} onChange={e => updateNote(note.id, { bg_color: e.target.value })} />
            </label>
          </div>
        </div>

        {/* ─── Image Area (if image note) ─── */}
        {note.type === 'image' && (
          <div className="px-4 pt-3">
            <div className="flex flex-col items-center justify-center rounded-xl p-4" style={{border: `2px dashed ${theme.border}`, minHeight: '120px'}}>
              {note.image_path ? (
                <img src={`http://localhost:3001${note.image_path}`} className="object-contain max-h-52 rounded-lg" alt="Note" />
              ) : (
                <div className="text-center opacity-50">
                  <ImageIcon size={28} className="mx-auto mb-2" />
                  <span className="text-xs">No image yet</span>
                </div>
              )}
              <label className="mt-3 px-4 py-1.5 rounded-full text-xs cursor-pointer font-semibold transition-colors" style={{backgroundColor: theme.accent, color: '#fff'}}>
                {note.image_path ? 'Replace' : 'Upload'} Image
                <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, note.id)} />
              </label>
            </div>
          </div>
        )}

        {/* ─── Writing Area ─── */}
        <div className="flex-1 px-4 py-3 overflow-auto" style={{ maxHeight: isExpanded ? '60vh' : '400px' }}>
          <textarea
            className="w-full h-full bg-transparent border-none outline-none resize-none leading-relaxed"
            style={{
              fontFamily: note.font_family || "'Inter', sans-serif",
              fontSize: `${baseFontSize * zoom}px`,
              color: note.text_color || theme.text,
              minHeight: isExpanded ? '50vh' : '200px',
              lineHeight: 1.8,
            }}
            dir="auto"
            value={note.content}
            onChange={e => updateNote(note.id, { content: e.target.value })}
            placeholder="Start writing your note here…"
          />
        </div>

        {/* ─── Status Footer ─── */}
        <div className="px-4 py-1.5 text-[10px] flex justify-between items-center opacity-40 border-t" style={{ borderColor: theme.border }}>
          <span>{(note.content || '').length} chars</span>
          <span>Zoom: {zoom}x · {FONTS.find(f => f.value === note.font_family)?.label || 'Default'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full transition-colors duration-500" style={{ backgroundColor: theme.bg, color: theme.text }}>

      {/* ─── Live Status Banner ─── */}
      <div className="px-8 py-3 flex items-center justify-between" style={{ backgroundColor: notesBoardActive ? '#065f46' : '#7f1d1d' }}>
        <div className="flex items-center space-x-3">
          <span className="inline-block w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: notesBoardActive ? '#34d399' : '#fca5a5' }}></span>
          <span className="text-white text-sm font-semibold">
            {notesBoardActive
              ? '✅ Notes Board is ACTIVE — The 12-point slides are hidden. Notes are displayed on the frontend.'
              : '⏸ Notes Board is INACTIVE — The 12-point slides are displayed on the frontend.'}
          </span>
        </div>
        <div className="flex space-x-2">
          {notesBoardActive ? (
            <button onClick={() => toggleNotesBoard(false)}
              className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors shadow">
              Deactivate Notes Board
            </button>
          ) : (
            <button onClick={() => toggleNotesBoard(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors shadow">
              ✓ Activate Notes Board
            </button>
          )}
        </div>
      </div>

      {/* ─── Page Header ─── */}
      <div className="sticky top-0 z-20 backdrop-blur-xl border-b px-8 py-5" style={{ borderColor: theme.border, backgroundColor: theme.bg + 'e6' }}>
        <div className="flex justify-between items-center max-w-[1600px] mx-auto">
          <div>
            <h2 className="text-3xl font-bold flex items-center">
              <StickyNote className="mr-3" style={{ color: theme.accent }} />
              Notes Board
            </h2>
            <p className="text-sm mt-1 opacity-60">Your visual workspace & digital pinboard.</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Theme Switcher */}
            <div className="flex items-center rounded-xl overflow-hidden text-xs font-medium" style={{ border: `1px solid ${theme.border}` }}>
              {Object.entries(BOARD_THEMES).map(([key, t]) => (
                <button key={key}
                  onClick={() => setBoardTheme(key)}
                  className="px-3 py-2 transition-all duration-200"
                  style={{
                    backgroundColor: boardTheme === key ? theme.accent : 'transparent',
                    color: boardTheme === key ? '#fff' : theme.text,
                    fontWeight: boardTheme === key ? 700 : 400,
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Add Buttons */}
            <button onClick={() => addNote('text')}
              className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center transition-all duration-200 shadow-lg hover:shadow-xl"
              style={{ backgroundColor: theme.accent, color: '#fff' }}>
              <Plus size={16} className="mr-2" /> Text Note
            </button>
            <button onClick={() => addNote('image')}
              className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center transition-all duration-200 border shadow hover:shadow-lg"
              style={{ borderColor: theme.accent, color: theme.accent }}>
              <ImageIcon size={16} className="mr-2" /> Image Note
            </button>
          </div>
        </div>
      </div>

      {/* ─── Notes Grid ─── */}
      <div className="px-8 py-8 max-w-[1600px] mx-auto">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-40">
            <StickyNote size={56} className="mb-4" />
            <p className="text-lg font-medium">No notes yet</p>
            <p className="text-sm mt-1">Click "Text Note" or "Image Note" to create one.</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${expandedNote ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
            {notes.map(note => expandedNote && expandedNote !== note.id ? null : renderNoteCard(note))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThemeSettings() {
  const [settings, setSettings] = useState({ 
    global_bg_color: '', global_header_bg: '', global_footer_bg: '', global_button_bg: ''
  });

  useEffect(() => { api.get('/settings').then(res => setSettings(res.data || {})); }, []);

  const saveSettings = async () => {
    await api.put('/settings', settings);
    alert('Global master settings saved successfully!');
  };

  const applyPreset = (preset) => {
    if (preset === 'light') {
       setSettings({...settings, global_bg_color: '#fdf8e8', global_header_bg: '#054020', global_footer_bg: '#1a7a3e', global_button_bg: '#4caf50'});
    } else if (preset === 'dark') {
       setSettings({...settings, global_bg_color: '#111827', global_header_bg: '#000000', global_footer_bg: '#1f2937', global_button_bg: '#3b82f6'});
    } else if (preset === 'gold') {
       setSettings({...settings, global_bg_color: '#fffef5', global_header_bg: '#b8922e', global_footer_bg: '#d4a843', global_button_bg: '#f5e6a3'});
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 pb-20">
      <div>
         <h2 className="text-4xl font-bold mb-2">Theme Manager</h2>
         <p className="text-gray-400">Fully customize the color palette and visual styling across the entire digital signage application in real-time.</p>
      </div>

      {/* Theme Presets */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow flex justify-between items-center">
         <div>
            <h3 className="text-xl font-bold text-white mb-1">Theme Presets</h3>
            <p className="text-sm text-gray-400">Quickly apply an optimized default theme palette.</p>
         </div>
         <div className="flex space-x-3">
            <button onClick={() => applyPreset('light')} className="bg-gray-100 text-gray-900 border border-gray-300 font-bold px-6 py-2 rounded shadow hover:bg-white transition-colors">Light/Classic</button>
            <button onClick={() => applyPreset('dark')} className="bg-gray-900 text-white border border-gray-600 font-bold px-6 py-2 rounded shadow hover:bg-black transition-colors">Dark Mode</button>
            <button onClick={() => applyPreset('gold')} className="bg-yellow-600 text-white border border-yellow-500 font-bold px-6 py-2 rounded shadow hover:bg-yellow-500 transition-colors">Premium Gold</button>
         </div>
      </div>

      {/* Full Palette Customization */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow">
        <h3 className="text-xl font-bold text-blue-400 mb-6 border-b border-gray-700 pb-2">Global Color Palette (Advanced UI)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Color Block */}
           <div className="flex flex-col bg-gray-900 p-4 rounded-lg border border-gray-700 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-2 h-full" style={{backgroundColor: settings.global_bg_color || '#fdf8e8'}}></div>
             <label className="text-sm font-bold text-gray-300 mb-1">Main Background Color</label>
             <p className="text-xs text-gray-500 mb-4">Affects the core background of the display.</p>
             <input type="color" className="w-full h-12 bg-transparent cursor-pointer rounded" value={settings.global_bg_color || '#fdf8e8'} onChange={e => setSettings({...settings, global_bg_color: e.target.value})} />
           </div>

           {/* Color Block */}
           <div className="flex flex-col bg-gray-900 p-4 rounded-lg border border-gray-700 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-2 h-full" style={{backgroundColor: settings.global_header_bg || '#064a2b'}}></div>
             <label className="text-sm font-bold text-gray-300 mb-1">Top Header Banner Color</label>
             <p className="text-xs text-gray-500 mb-4">The container framing the Digital Clock and Title.</p>
             <input type="color" className="w-full h-12 bg-transparent cursor-pointer rounded" value={settings.global_header_bg || '#064a2b'} onChange={e => setSettings({...settings, global_header_bg: e.target.value})} />
           </div>

           {/* Color Block */}
           <div className="flex flex-col bg-gray-900 p-4 rounded-lg border border-gray-700 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-2 h-full" style={{backgroundColor: settings.global_footer_bg || '#1a7a3e'}}></div>
             <label className="text-sm font-bold text-gray-300 mb-1">Footer & Navigation Track</label>
             <p className="text-xs text-gray-500 mb-4">Color for progress bar, navigation arrows, or footer info.</p>
             <input type="color" className="w-full h-12 bg-transparent cursor-pointer rounded" value={settings.global_footer_bg || '#1a7a3e'} onChange={e => setSettings({...settings, global_footer_bg: e.target.value})} />
           </div>

           {/* Color Block */}
           <div className="flex flex-col bg-gray-900 p-4 rounded-lg border border-gray-700 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-2 h-full" style={{backgroundColor: settings.global_button_bg || '#d4a843'}}></div>
             <label className="text-sm font-bold text-gray-300 mb-1">Primary Button / Accent Color</label>
             <p className="text-xs text-gray-500 mb-4">Highlights, badges, and prominent active items.</p>
             <input type="color" className="w-full h-12 bg-transparent cursor-pointer rounded" value={settings.global_button_bg || '#d4a843'} onChange={e => setSettings({...settings, global_button_bg: e.target.value})} />
           </div>
        </div>
      </div>

      <button onClick={saveSettings} className="w-full bg-blue-600 hover:bg-blue-500 py-5 font-bold text-xl rounded-lg shadow-2xl transition-colors">Apply Global Theme Settings</button>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  if (!token) return <Router basename="/admin"><Routes><Route path="*" element={<Login setToken={setToken} />} /></Routes></Router>;
  return (
    <Router basename="/admin">
      <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
        <Sidebar onLogout={() => { localStorage.removeItem('token'); setToken(null); }} />
        <div className="flex-1 overflow-auto"><Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/notes" element={<NotesBoard />} />
          <Route path="/themes" element={<ThemeSettings />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes></div>
      </div>
    </Router>
  );
}
