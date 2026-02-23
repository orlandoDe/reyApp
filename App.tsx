import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  Plus, 
  Settings,
  Save,
  Eye,
  EyeOff, 
  Wrench, 
  Search, 
  Bell, 
  ChevronRight, 
  Camera, 
  Check,
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Smartphone,
  Sparkles,
  ArrowLeft,
  LogOut,
  Hand,
  User,
  List,
  Headphones,
  Plane,
  UserCircle,
  History,
  Mail,
  Lock,
  ArrowRight,
  ScanLine,
  X,
  Calendar,
  DollarSign,
  FileText,
  Share2,
  Info,
  MessageCircle,
  CreditCard,
  Phone,
  Trash2,
  Puzzle,
  Cog,
  ShieldCheck,
  Package,
  Play,
  CheckSquare
} from 'lucide-react';
import { RepairJob, RepairStatus, AiDiagnosisResponse, RepairPart } from './types';
import { SignaturePad } from './components/SignaturePad';
import { analyzeDroneIssue, generateClientUpdateMessage } from './services/geminiService';

// --- MOCK DATA ---
const MOCK_JOBS: RepairJob[] = [
  {
    id: 'R-1024',
    customerName: 'Alex Morgan',
    customerEmail: 'alex@example.com',
    customerPhone: '+1 (555) 012-3456',
    drone: { manufacturer: 'DJI', model: 'Mavic 3 Cine', serialNumber: '1581F4X' },
    issueDescription: 'Gimbal vibration during high speed flight.',
    status: RepairStatus.IN_PROGRESS,
    receivedDate: 'Oct 20, 2023',
    estimatedCost: 150.00,
    technician: 'Alex M.',
    images: ['https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&q=80&w=400'],
    technicianNotes: ['Waiting for specialized adhesive to cure before final assembly.'],
    parts: [],
    timeline: [
      { status: RepairStatus.RECEIVED, date: 'Oct 20, 10:00 AM' },
      { status: RepairStatus.DIAGNOSING, date: 'Oct 21, 02:30 PM' },
      { status: RepairStatus.IN_PROGRESS, date: 'Oct 22, 09:15 AM' },
    ]
  },
  {
    id: 'R-1025',
    customerName: 'Sarah Connor',
    customerEmail: 'sarah@example.com',
    customerPhone: '+1 (555) 999-8888',
    drone: { manufacturer: 'DJI', model: 'Mini 2', serialNumber: '847291038' },
    issueDescription: 'Motor obstruction error on rear left arm.',
    status: RepairStatus.WAITING_PARTS,
    receivedDate: 'Oct 26, 2023',
    estimatedCost: 85.00,
    technician: 'Sarah L.',
    images: ['https://images.unsplash.com/photo-1506947411487-a56738267384?auto=format&fit=crop&q=80&w=400'],
    technicianNotes: ['Debris found in motor bell.', 'Needs new bearings.'],
    parts: [],
    timeline: [
      { status: RepairStatus.RECEIVED, date: 'Oct 26, 11:00 AM' },
      { status: RepairStatus.DIAGNOSING, date: 'Oct 26, 11:45 AM' },
      { status: RepairStatus.WAITING_PARTS, date: 'Oct 26, 04:00 PM' },
    ]
  },
  {
    id: 'R-1026',
    customerName: 'Mike Ross',
    customerEmail: 'mike@example.com',
    customerPhone: '+1 (555) 111-2222',
    drone: { manufacturer: 'DJI', model: 'Mavic Air', serialNumber: '992837461' },
    issueDescription: 'Battery latch broken.',
    status: RepairStatus.READY,
    receivedDate: 'Oct 20, 2023',
    estimatedCost: 45.00,
    technician: 'Mike R.',
    images: ['https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&q=80&w=400'],
    technicianNotes: ['Replaced shell.', 'Flight test passed.'],
    parts: [
      { id: 101, category: 'part', name: 'Upper Shell Assembly', partNumber: 'MA-sh-001', warranty: true }
    ],
    timeline: [
      { status: RepairStatus.RECEIVED, date: 'Oct 20, 09:00 AM' },
      { status: RepairStatus.READY, date: 'Oct 22, 02:00 PM' },
    ]
  }
];

// --- HELPER FUNCTIONS ---

const getProgressStats = (status: RepairStatus) => {
  switch (status) {
    case RepairStatus.RECEIVED: return { percent: 10, color: 'bg-blue-600', text: 'text-blue-600' };
    case RepairStatus.DIAGNOSING: return { percent: 25, color: 'bg-blue-600', text: 'text-blue-600' };
    case RepairStatus.WAITING_PARTS: return { percent: 50, color: 'bg-orange-500', text: 'text-orange-500' };
    case RepairStatus.IN_PROGRESS: return { percent: 75, color: 'bg-blue-600', text: 'text-blue-600' };
    case RepairStatus.READY: return { percent: 100, color: 'bg-emerald-500', text: 'text-emerald-500' };
    case RepairStatus.COMPLETED: return { percent: 100, color: 'bg-emerald-500', text: 'text-emerald-500' };
    default: return { percent: 0, color: 'bg-slate-300', text: 'text-slate-500' };
  }
};

const getStatusLabelStyle = (status: RepairStatus) => {
  switch (status) {
    case RepairStatus.DIAGNOSING: return 'bg-blue-50 text-blue-700';
    case RepairStatus.WAITING_PARTS: return 'bg-orange-50 text-orange-700';
    case RepairStatus.IN_PROGRESS: return 'bg-blue-50 text-blue-700';
    case RepairStatus.READY: return 'bg-emerald-50 text-emerald-700';
    case RepairStatus.COMPLETED: return 'bg-emerald-50 text-emerald-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

// --- SETTINGS COMPONENT ---

interface SettingsProps {
  onBack: () => void;
}

const SettingsView: React.FC<SettingsProps> = ({ onBack }) => {
  const [mercadoPagoEnabled, setMercadoPagoEnabled] = useState(false);
  const [testModeEnabled, setTestModeEnabled] = useState(false);
  const [prodToken, setProdToken] = useState('');
  const [testToken, setTestToken] = useState('');
  const [showProdToken, setShowProdToken] = useState(false);
  const [showTestToken, setShowTestToken] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setMercadoPagoEnabled(parsed.mercadoPagoEnabled || false);
        setTestModeEnabled(parsed.testModeEnabled || false);
        setProdToken(parsed.prodToken || '');
        setTestToken(parsed.testToken || '');
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const handleSave = () => {
    const settings = {
      mercadoPagoEnabled,
      testModeEnabled,
      prodToken,
      testToken
    };
    localStorage.setItem('appSettings', JSON.stringify(settings));
    alert('Settings saved successfully!');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white px-6 py-6 border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
        
        {/* Payment Gateway Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Payment Gateway</h2>
              <p className="text-sm text-slate-500">Configure payment providers</p>
            </div>
          </div>

          {/* Mercado Pago Toggle */}
          <div className="flex items-center justify-between py-4 border-b border-slate-50">
            <div>
              <h3 className="font-medium text-slate-900">Mercado Pago</h3>
              <p className="text-xs text-slate-500">Enable Mercado Pago integration</p>
            </div>
            <button 
              onClick={() => setMercadoPagoEnabled(!mercadoPagoEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${mercadoPagoEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mercadoPagoEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {mercadoPagoEnabled && (
            <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              
              {/* Test Mode Toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="font-medium text-slate-900">Test Mode</h3>
                  <p className="text-xs text-slate-500">Use Sandbox environment</p>
                </div>
                <button 
                  onClick={() => setTestModeEnabled(!testModeEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${testModeEnabled ? 'bg-amber-500' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${testModeEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Production Token */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Production Access Token</label>
                <div className="relative">
                  <input
                    type={showProdToken ? "text" : "password"}
                    value={prodToken}
                    onChange={(e) => setProdToken(e.target.value)}
                    placeholder="APP_USR-..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowProdToken(!showProdToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showProdToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">Server-side secret key for production payments</p>
              </div>

              {/* Test Token */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Test Access Token</label>
                <div className="relative">
                  <input
                    type={showTestToken ? "text" : "password"}
                    value={testToken}
                    onChange={(e) => setTestToken(e.target.value)}
                    placeholder="TEST-..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTestToken(!showTestToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showTestToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">Server-side secret key for sandbox testing</p>
              </div>

            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 text-sm font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200"
        >
          <Save size={18} /> Save Settings
        </button>

      </div>
    </div>
  );
};

// --- APP MAIN ---

export default function App() {
  const [currentView, setCurrentView] = useState<'hub' | 'list' | 'intake' | 'details' | 'addParts' | 'updateStatus' | 'profile' | 'clientList' | 'clientProfile' | 'uploadMediaList' | 'uploadMediaForm' | 'notifications' | 'settings'>('hub');
  const [jobs, setJobs] = useState<RepairJob[]>(MOCK_JOBS);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');
  const [selectedPart, setSelectedPart] = useState<RepairPart | null>(null);
  const [isWarrantyApplied, setIsWarrantyApplied] = useState(false);
  
  const [userProfile, setUserProfile] = useState({
    name: 'Alex Morgan',
    role: 'Senior Technician',
    email: 'alex.m@dronefix.pro',
    phone: '+1 (555) 012-3456',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    location: 'San Francisco, CA',
    joinedDate: 'September 2021'
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState(userProfile);
  
  // Intake Form State
  const [intakeStep, setIntakeStep] = useState(1);
  const [newDrone, setNewDrone] = useState({ 
    manufacturer: '', 
    model: '', 
    serial: '', 
    issue: '', 
    customerName: 'Alex Morgan', 
    customerPhone: '+1 (555) 000-0000', 
    customerEmail: 'alex@example.com',
    smsUpdates: true,
    whatsappUpdates: false,
    emailUpdates: true,
    images: [] as string[],
    signature: null as string | null,
    authorized: false
  });
  
  // Add Parts Form State - Changed to List
  const [partsList, setPartsList] = useState<RepairPart[]>([
    { id: 1, category: 'part', name: '', partNumber: '' }
  ]);

  // Update Status State
  const [statusDraft, setStatusDraft] = useState<RepairStatus | null>(null);
  const [costDraft, setCostDraft] = useState<string>('');

  const [aiDiagnosis, setAiDiagnosis] = useState<AiDiagnosisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDroneDetailsModal, setShowDroneDetailsModal] = useState(false);

  // Client Portal State
  const clientJob = selectedJobId ? jobs.find(j => j.id === selectedJobId) : null;

  // --- ACTIONS ---

  const handleRegisterDrone = () => {
    const newJob: RepairJob = {
      id: `R-${Math.floor(Math.random() * 10000)}`,
      customerName: newDrone.customerName,
      customerEmail: newDrone.customerEmail,
      customerPhone: newDrone.customerPhone,
      drone: { manufacturer: newDrone.manufacturer, model: newDrone.model, serialNumber: newDrone.serial },
      issueDescription: newDrone.issue,
      aiDiagnosis: aiDiagnosis?.likelyIssue,
      technician: userProfile.name,
      status: RepairStatus.RECEIVED,
      receivedDate: new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}),
      estimatedCost: 0,
      images: newDrone.images.length > 0 ? newDrone.images : ['https://picsum.photos/400/300?grayscale'],
      technicianNotes: aiDiagnosis?.recommendedActions || [],
      parts: [],
      timeline: [{ status: RepairStatus.RECEIVED, date: new Date().toLocaleString() }],
      notificationPreferences: {
        sms: newDrone.smsUpdates,
        whatsapp: newDrone.whatsappUpdates,
        email: newDrone.emailUpdates
      },
      clientSignature: newDrone.signature || undefined
    };
    setJobs([newJob, ...jobs]);
    setCurrentView('list');
    // Reset
    setNewDrone({ manufacturer: '', model: '', serial: '', issue: '', customerName: '', customerPhone: '', customerEmail: '', smsUpdates: true, whatsappUpdates: false, emailUpdates: true, images: [], signature: null, authorized: false });
    setAiDiagnosis(null);
    setIntakeStep(1);
  };

  const runAiDiagnosis = async () => {
    if (!newDrone.model || !newDrone.issue) return;
    setIsAnalyzing(true);
    const result = await analyzeDroneIssue(newDrone.model, newDrone.issue);
    setAiDiagnosis(result);
    setIsAnalyzing(false);
  };

  const handleStatusUpdate = (jobId: string, newStatus: RepairStatus) => {
    setJobs(jobs.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          status: newStatus,
          timeline: [...j.timeline, { status: newStatus, date: new Date().toLocaleString() }]
        };
      }
      return j;
    }));
  };

  const handleConfirmStatusUpdate = () => {
      if (!clientJob) return;

      setJobs(jobs.map(j => {
        if (j.id === clientJob.id) {
            let updatedJob = { ...j };
            
            // Update Status if changed
            if (statusDraft && statusDraft !== j.status) {
                updatedJob.status = statusDraft;
                updatedJob.timeline = [...j.timeline, { status: statusDraft, date: new Date().toLocaleString() }];
            }

            // Update Cost if changed
            const newCost = parseFloat(costDraft);
            if (!isNaN(newCost) && newCost !== j.estimatedCost) {
                updatedJob.estimatedCost = newCost;
            }

            return updatedJob;
        }
        return j;
      }));

      setCurrentView('details');
      setStatusDraft(null);
  };

  const generateNotification = async (job: RepairJob) => {
     alert(await generateClientUpdateMessage(job.customerName, job.drone.model, job.status));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            setNewDrone(prev => ({...prev, images: [...prev.images, ev.target!.result as string]}));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setProfileDraft(prev => ({...prev, avatar: ev.target!.result as string}));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = () => {
    setUserProfile(profileDraft);
    setIsEditingProfile(false);
  };

  const cancelEditProfile = () => {
    setProfileDraft(userProfile);
    setIsEditingProfile(false);
  };

  const handleJobImageUpload = (jobId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            const newImageData = ev.target!.result as string;
            setJobs(prevJobs => prevJobs.map(job => {
              if (job.id === jobId) {
                return { ...job, images: [...job.images, newImageData] };
              }
              return job;
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // --- Parts Logic ---
  const handleAddPart = () => {
    setPartsList(prev => [...prev, { id: Date.now(), category: 'part', name: '', partNumber: '' }]);
  };

  const handleRemovePart = (id: number) => {
    setPartsList(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdatePart = (id: number, field: keyof RepairPart, value: string) => {
    setPartsList(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSaveParts = () => {
    if (!clientJob) return;

    // Apply warranty if selected
    const partsToSave = partsList.map(p => ({
        ...p,
        warranty: isWarrantyApplied
    }));

    const updatedJobs = jobs.map(job => {
        if (job.id === clientJob.id) {
            const currentParts = job.parts || [];
            return { 
                ...job, 
                parts: [...currentParts, ...partsToSave],
                // If we add parts, ensure status reflects progress if it was just received
                status: job.status === RepairStatus.RECEIVED ? RepairStatus.IN_PROGRESS : job.status,
                // Ensure timeline has IN_PROGRESS if we moved status
                timeline: job.status === RepairStatus.RECEIVED 
                    ? [...job.timeline, { status: RepairStatus.IN_PROGRESS, date: new Date().toLocaleString() }]
                    : job.timeline
            };
        }
        return job;
    });

    setJobs(updatedJobs);
    
    // Cleanup
    setPartsList([{ id: Date.now(), category: 'part', name: '', partNumber: '' }]);
    setIsWarrantyApplied(false);
    setCurrentView('details');
  };

  // --- VIEWS ---

  const renderHub = () => (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-start">
        <div className="flex gap-3 items-center">
          <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
             <Plane className="text-white transform -rotate-45 relative top-0.5" size={24} fill="currentColor" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg leading-tight">Drone Repair Hub</h1>
            <p className="text-xs text-slate-500 font-medium">Technician Dashboard</p>
          </div>
        </div>
        <button className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-200 transition">
           Logout <LogOut size={12} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar">
        {/* Welcome Section */}
        <div className="mb-8 mt-4">
          <h2 className="text-3xl font-bold text-slate-900 leading-tight">
            Welcome back, <br />
            <span className="text-blue-600">Technician</span>
          </h2>
          <p className="text-slate-500 mt-3 leading-relaxed">
            What would you like to handle today? Select a service module below.
          </p>
        </div>

        {/* Grid Cards */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Welcome Tour */}
          <button className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition text-left group">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-600 group-hover:scale-110 transition-transform">
              <Hand size={24} />
            </div>
            <h3 className="font-bold text-slate-900">Welcome Tour</h3>
            <p className="text-xs text-slate-400 mt-1">App introduction</p>
          </button>

          {/* New Request */}
          <button 
            onClick={() => setCurrentView('intake')}
            className="bg-blue-50 p-5 rounded-[2rem] border border-blue-100 shadow-sm hover:shadow-md hover:bg-blue-100 transition text-left group relative overflow-hidden"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform relative z-10">
              <Plus size={24} />
            </div>
            <h3 className="font-bold text-blue-900 relative z-10">New Request</h3>
            <p className="text-xs text-blue-600/70 mt-1 relative z-10">Register drone</p>
            {/* Decor element */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-100 rounded-full opacity-50 z-0"></div>
          </button>

          {/* Upload Media */}
          <button 
            onClick={() => setCurrentView('uploadMediaList')}
            className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition text-left group"
          >
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 text-purple-600 group-hover:scale-110 transition-transform">
              <Camera size={24} />
            </div>
            <h3 className="font-bold text-slate-900">Upload Media</h3>
            <p className="text-xs text-slate-400 mt-1">Add damage photos</p>
          </button>

          {/* Client Profile */}
          <button 
            onClick={() => setCurrentView('clientList')}
            className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition text-left group"
          >
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 text-orange-600 group-hover:scale-110 transition-transform">
              <User size={24} />
            </div>
            <h3 className="font-bold text-slate-900">Client List</h3>
            <p className="text-xs text-slate-400 mt-1">Contact details</p>
          </button>

          {/* Service History */}
          <button 
            onClick={() => setCurrentView('list')}
            className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition text-left group"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 text-emerald-600 group-hover:scale-110 transition-transform">
              <List size={24} />
            </div>
            <h3 className="font-bold text-slate-900">Service History</h3>
            <p className="text-xs text-slate-400 mt-1">My drones list</p>
          </button>

          {/* Track Repair */}
          <button 
             onClick={() => setCurrentView('list')}
             className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition text-left group"
          >
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4 text-red-600 group-hover:scale-110 transition-transform">
              <Wrench size={24} />
            </div>
            <h3 className="font-bold text-slate-900">Track Repair</h3>
            <p className="text-xs text-slate-400 mt-1">Check status</p>
          </button>

        </div>
      </div>
      
      {/* Render Bottom Nav specifically for Hub view inside the container */}
      {renderBottomNav()}
    </div>
  );

  const renderBottomNav = () => (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 rounded-b-[2rem] flex justify-between items-center z-20">
      <button 
        onClick={() => setCurrentView('hub')}
        className={`flex flex-col items-center gap-1.5 ${currentView === 'hub' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <div className={`p-1.5 rounded-lg ${currentView === 'hub' ? 'bg-blue-50' : ''}`}>
          <LayoutGrid size={22} strokeWidth={currentView === 'hub' ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-bold">Hub</span>
      </button>

      <button 
        onClick={() => setCurrentView('profile')}
        className={`flex flex-col items-center gap-1.5 ${currentView === 'profile' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <div className={`p-1.5 rounded-lg ${currentView === 'profile' ? 'bg-blue-50' : ''}`}>
          <UserCircle size={22} strokeWidth={currentView === 'profile' ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-medium">Profile</span>
      </button>

      <button 
        onClick={() => setCurrentView('settings')}
        className={`flex flex-col items-center gap-1.5 ${currentView === 'settings' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <div className={`p-1.5 rounded-lg ${currentView === 'settings' ? 'bg-blue-50' : ''}`}>
          <Settings size={22} strokeWidth={currentView === 'settings' ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-medium">Settings</span>
      </button>

      <button 
        onClick={() => setCurrentView('notifications')}
        className={`flex flex-col items-center gap-1.5 ${currentView === 'notifications' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <div className={`p-1.5 rounded-lg ${currentView === 'notifications' ? 'bg-blue-50' : ''}`}>
          <div className="relative">
            <Bell size={22} strokeWidth={currentView === 'notifications' ? 2.5 : 2} />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
          </div>
        </div>
        <span className="text-[10px] font-medium">Alerts</span>
      </button>
    </div>
  );

  const renderJobList = () => {
    // Basic filter logic
    const filteredJobs = activeTab === 'active' 
      ? jobs.filter(j => j.status !== RepairStatus.COMPLETED && j.status !== RepairStatus.READY)
      : jobs; 

    const displayJobs = jobs; 

    return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Tab Header */}
      <div className="px-6 pt-8 pb-4 bg-slate-50">
        <div className="flex bg-slate-200/50 p-1 rounded-2xl mb-2">
            <button 
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all shadow-sm ${activeTab === 'active' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Active Repairs
            </button>
            <button 
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'all' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
                All Drones
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4">
        {displayJobs.map(job => {
          const stats = getProgressStats(job.status);
          return (
          <div 
            key={job.id} 
            onClick={() => { setSelectedJobId(job.id); setCurrentView('details'); }}
            className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-200 transition active:scale-[0.98] cursor-pointer"
          >
            <div className="flex gap-4 mb-4">
                {/* Image Thumbnail */}
                <div className="w-24 h-24 bg-slate-100 rounded-2xl overflow-hidden shrink-0">
                    <img src={job.images[0]} alt="Drone" className="w-full h-full object-cover" />
                </div>
                
                {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-lg">{job.drone.manufacturer} {job.drone.model}</h3>
                            {job.isPaid && (
                                <div className="bg-emerald-100 text-emerald-600 p-0.5 rounded-full" title="Paid">
                                    <CircleDollarSign size={14} strokeWidth={3} />
                                </div>
                            )}
                        </div>
                        <ChevronRight className="text-slate-300" size={20} />
                    </div>
                    
                    <p className="text-xs text-slate-400 font-medium mb-3">SN: {job.drone.serialNumber}</p>
                    
                    <div className="flex items-center gap-2">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getStatusLabelStyle(job.status)}`}>
                             {job.status}
                         </span>
                         <span className="text-[10px] text-slate-400">• 2h ago</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar Section */}
            <div className="pt-2">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs text-slate-400 font-medium">{stats.percent === 100 ? 'Repair Complete' : 'Repair Progress'}</span>
                    <span className={`text-xs font-bold ${stats.text}`}>{stats.percent}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${stats.color} rounded-full transition-all duration-500`} 
                        style={{ width: `${stats.percent}%` }}
                    ></div>
                </div>
            </div>
          </div>
        )})}
      </div>
      {renderBottomNav()}
    </div>
  )};

  const renderUpdateStatus = () => {
      if (!clientJob) return null;

      const currentStatus = statusDraft || clientJob.status;
      
      const allStatuses = [
          RepairStatus.RECEIVED,
          RepairStatus.DIAGNOSING,
          RepairStatus.WAITING_PARTS,
          RepairStatus.IN_PROGRESS,
          RepairStatus.READY,
          RepairStatus.COMPLETED
      ];

      const steps = [
        { label: 'Received', status: RepairStatus.RECEIVED },
        { label: 'Diagnostics', status: RepairStatus.DIAGNOSING },
        { label: 'Repairing', status: RepairStatus.IN_PROGRESS }, // Merges WAITING_PARTS visually often, but here we separate logic
        { label: 'Ready', status: RepairStatus.READY },
        { label: 'Complete', status: RepairStatus.COMPLETED }
      ];

      // Determine active step index based on current selected status
      const getActiveStepIndex = (s: RepairStatus) => {
          if (s === RepairStatus.COMPLETED) return 4;
          if (s === RepairStatus.READY) return 3;
          if (s === RepairStatus.IN_PROGRESS || s === RepairStatus.WAITING_PARTS) return 2;
          if (s === RepairStatus.DIAGNOSING) return 1;
          return 0;
      };

      const activeStepIndex = getActiveStepIndex(currentStatus);

      return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            <header className="bg-white px-6 pt-8 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
                 <button onClick={() => { setCurrentView('details'); setStatusDraft(null); }} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition">
                     <ArrowLeft size={20} className="text-slate-900" />
                 </button>
                 <h1 className="font-bold text-slate-900 text-base">Update Status</h1>
                 <div className="w-8"></div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-6 pb-32 space-y-6">
                
                {/* Section 1: Job Status Selection */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <CheckSquare size={18} className="text-blue-600" />
                        Select New Status
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {allStatuses.map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusDraft(status)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                                    currentStatus === status 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 scale-105' 
                                    : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section 2: Update Cost */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <DollarSign size={18} className="text-blue-600" />
                        Update Estimated Cost
                    </h3>
                    <div className="relative">
                        <div className="absolute left-4 top-3.5 text-slate-400 font-bold">$</div>
                        <input 
                            type="number" 
                            value={costDraft}
                            onChange={(e) => setCostDraft(e.target.value)}
                            className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Section 3: Timeline Stage (Visual Stepper) */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <History size={18} className="text-blue-600" />
                        Mark Timeline Step
                    </h3>
                    
                    <div className="relative pl-2">
                        {/* Vertical Line */}
                        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-100"></div>

                        <div className="space-y-6 relative z-10">
                            {steps.map((step, idx) => {
                                const isActive = idx === activeStepIndex;
                                const isPast = idx < activeStepIndex;

                                return (
                                    <div 
                                        key={step.label} 
                                        onClick={() => setStatusDraft(step.status)}
                                        className={`flex items-center gap-4 cursor-pointer group transition-all ${isActive ? 'translate-x-1' : ''}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all ${
                                            isActive 
                                            ? 'bg-blue-600 border-blue-100 text-white shadow-lg shadow-blue-200 scale-110' 
                                            : isPast 
                                                ? 'bg-blue-600 border-white text-white' 
                                                : 'bg-white border-slate-200 text-transparent group-hover:border-blue-300'
                                        }`}>
                                            {(isActive || isPast) && <Check size={14} strokeWidth={3} />}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold transition-colors ${isActive ? 'text-blue-600' : 'text-slate-600'}`}>
                                                {step.label}
                                            </p>
                                            {isActive && <p className="text-[10px] text-blue-400 font-medium">Current Stage</p>}
                                        </div>
                                        {isActive && <ChevronRight size={16} className="text-blue-600" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="bg-white p-6 border-t border-slate-100 absolute bottom-0 left-0 right-0 rounded-t-[2rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                <button 
                    onClick={handleConfirmStatusUpdate}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2"
                >
                    Update Job <ArrowRight size={18} />
                </button>
            </div>
        </div>
      );
  }

  const renderIntake = () => (
    <div className="flex flex-col h-full bg-white relative">
        <header className="px-6 pt-8 pb-4 border-b border-slate-50">
            <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={() => intakeStep === 1 ? setCurrentView('hub') : setIntakeStep(s => s - 1)} 
                  className="p-2 -ml-2 text-slate-800 hover:bg-slate-100 rounded-full transition"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="font-bold text-base text-slate-900">
                    {intakeStep === 1 ? 'Contact Info' : intakeStep === 2 ? 'Drone & Issue' : 'Review'}
                </h1>
                <div className="w-8"></div> {/* Spacer for centering */}
            </div>
            
            {/* Progress Bar */}
            <div className="flex gap-2 mb-2">
                {[1, 2, 3].map(step => (
                    <div 
                        key={step} 
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step <= intakeStep ? 'bg-blue-600' : 'bg-slate-100'}`}
                    ></div>
                ))}
            </div>
            <div className="flex justify-between text-[10px] font-medium text-blue-600">
                <span>Step {intakeStep} of 3</span>
                <span>{Math.round((intakeStep / 3) * 100)}%</span>
            </div>
        </header>
        
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-6">
            
            {/* STEP 1: CLIENT DETAILS */}
            {intakeStep === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Who is this <br/><span className="text-blue-600">repair for?</span></h2>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                        We need your contact details to send you status updates regarding your drone and the final invoice.
                    </p>

                    <div className="space-y-4">
                        <div className="space-y-1">
                           <label className="text-xs font-bold text-slate-700 ml-1">Full Name</label>
                           <div className="relative">
                               <div className="absolute left-4 top-3.5 text-slate-400">
                                   <User size={18} />
                               </div>
                               <input 
                                  type="text" 
                                  value={newDrone.customerName}
                                  onChange={e => setNewDrone({...newDrone, customerName: e.target.value})}
                                  className="w-full pl-11 pr-10 py-3 bg-slate-50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-800"
                                  placeholder="Full Name"
                               />
                               {newDrone.customerName.length > 2 && (
                                   <div className="absolute right-4 top-3.5 text-emerald-500">
                                       <CheckCircle2 size={18} fill="currentColor" className="text-white" />
                                   </div>
                               )}
                           </div>
                        </div>

                        <div className="space-y-1">
                           <label className="text-xs font-bold text-slate-700 ml-1">Mobile Number</label>
                           <div className="relative">
                               <div className="absolute left-4 top-3.5 text-slate-400">
                                   <Smartphone size={18} />
                               </div>
                               <input 
                                  type="tel" 
                                  value={newDrone.customerPhone}
                                  onChange={e => setNewDrone({...newDrone, customerPhone: e.target.value})}
                                  className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-800"
                                  placeholder="+1 (555) 000-0000"
                               />
                           </div>
                        </div>

                        <div className="space-y-1">
                           <label className="text-xs font-bold text-slate-700 ml-1">Email Address</label>
                           <div className="relative">
                               <div className="absolute left-4 top-3.5 text-slate-400">
                                   <Mail size={18} />
                               </div>
                               <input 
                                  type="email" 
                                  value={newDrone.customerEmail}
                                  onChange={e => setNewDrone({...newDrone, customerEmail: e.target.value})}
                                  className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-800"
                                  placeholder="john@example.com"
                               />
                           </div>
                        </div>

                        <div className="space-y-3 mt-2">
                             {/* SMS Updates */}
                             <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                          <Bell size={20} />
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-sm text-slate-900">SMS Updates</h4>
                                          <p className="text-xs text-slate-400">Get instant repair alerts</p>
                                      </div>
                                  </div>
                                  <button 
                                     onClick={() => setNewDrone({...newDrone, smsUpdates: !newDrone.smsUpdates})}
                                     className={`w-12 h-6 rounded-full transition-colors relative ${newDrone.smsUpdates ? 'bg-blue-600' : 'bg-slate-200'}`}
                                  >
                                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${newDrone.smsUpdates ? 'left-6.5 translate-x-6' : 'left-0.5'}`}></div>
                                  </button>
                             </div>

                             {/* WhatsApp Updates */}
                             <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                          <MessageCircle size={20} />
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-sm text-slate-900">WhatsApp Updates</h4>
                                          <p className="text-xs text-slate-400">Get updates via WhatsApp</p>
                                      </div>
                                  </div>
                                  <button 
                                     onClick={() => setNewDrone({...newDrone, whatsappUpdates: !newDrone.whatsappUpdates})}
                                     className={`w-12 h-6 rounded-full transition-colors relative ${newDrone.whatsappUpdates ? 'bg-green-600' : 'bg-slate-200'}`}
                                  >
                                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${newDrone.whatsappUpdates ? 'left-6.5 translate-x-6' : 'left-0.5'}`}></div>
                                  </button>
                             </div>

                             {/* Email Updates */}
                             <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                                          <Mail size={20} />
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-sm text-slate-900">Email Updates</h4>
                                          <p className="text-xs text-slate-400">Get detailed reports</p>
                                      </div>
                                  </div>
                                  <button 
                                     onClick={() => setNewDrone({...newDrone, emailUpdates: !newDrone.emailUpdates})}
                                     className={`w-12 h-6 rounded-full transition-colors relative ${newDrone.emailUpdates ? 'bg-orange-500' : 'bg-slate-200'}`}
                                  >
                                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${newDrone.emailUpdates ? 'left-6.5 translate-x-6' : 'left-0.5'}`}></div>
                                  </button>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: DRONE DETAILS & ISSUE */}
            {intakeStep === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Drone <span className="text-blue-600">Details</span></h2>
                    <p className="text-slate-500 text-sm mb-6">Device info and problem description.</p>
                     
                     <div className="space-y-6">
                        {/* Identity Section */}
                        <div className="space-y-4">
                            <div>
                               <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Manufacturer</label>
                               <input 
                                  type="text" 
                                  placeholder="e.g. DJI"
                                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-medium text-slate-600"
                                  value={newDrone.manufacturer}
                                  onChange={e => setNewDrone({...newDrone, manufacturer: e.target.value})}
                               />
                            </div>
                            <div>
                               <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Model Name</label>
                               <input 
                                  type="text" 
                                  placeholder="e.g. Mavic 3"
                                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-medium text-slate-600"
                                  value={newDrone.model}
                                  onChange={e => setNewDrone({...newDrone, model: e.target.value})}
                               />
                            </div>
                            <div>
                               <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Serial Number</label>
                               <div className="relative">
                                  <input 
                                    type="text" 
                                    placeholder="S/N located on battery compartment"
                                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-medium text-slate-600"
                                    value={newDrone.serial}
                                    onChange={e => setNewDrone({...newDrone, serial: e.target.value})}
                                  />
                                  <ScanLine className="absolute right-3 top-3 text-slate-400 cursor-pointer hover:text-blue-600" size={20} />
                               </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* The Issue Section */}
                        <div>
                             <h3 className="text-lg font-bold text-slate-900 mb-3">The Issue</h3>
                             <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Description</label>
                             <textarea 
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition min-h-[120px] mb-4 text-sm font-medium resize-none text-slate-600 placeholder:text-slate-400"
                                placeholder="Describe the crash or malfunction in detail..."
                                value={newDrone.issue}
                                onChange={e => setNewDrone({...newDrone, issue: e.target.value})}
                             ></textarea>
                        </div>

                        {/* Visual Evidence Section */}
                        <div>
                             <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-bold text-slate-900">Visual Evidence</h3>
                                <span className="text-xs font-bold text-blue-600">Optional</span>
                             </div>
                             
                             <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {/* Add Photo Button */}
                                <label className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 transition group relative overflow-hidden">
                                    <div className="bg-blue-100 p-1.5 rounded-full mb-1 group-hover:bg-blue-200 transition">
                                        <Camera size={16} className="text-blue-600" />
                                    </div>
                                    <span className="text-[10px] font-bold text-blue-600">Add Photo</span>
                                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                                </label>

                                {/* Images List */}
                                {newDrone.images.map((img, idx) => (
                                    <div key={idx} className="flex-shrink-0 w-24 h-24 rounded-xl relative group overflow-hidden">
                                        <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => setNewDrone(prev => ({...prev, images: prev.images.filter((_, i) => i !== idx)}))}
                                            className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition backdrop-blur-sm"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                
                                {/* Mock image for demo if empty */}
                                {newDrone.images.length === 0 && (
                                   <div className="flex-shrink-0 w-24 h-24 rounded-xl relative overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&q=80&w=200" alt="Demo" className="w-full h-full object-cover opacity-80" />
                                   </div>
                                )}
                             </div>
                        </div>
                     </div>
                </div>
            )}

            {/* STEP 3: REVIEW & DIAGNOSIS */}
            {intakeStep === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Review & <span className="text-blue-600">Diagnosis</span></h2>
                    <p className="text-slate-500 text-sm mb-6">AI analysis and final confirmation.</p>

                    {/* Summary Card */}
                    <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
                        <div className="flex gap-4">
                             {newDrone.images.length > 0 ? (
                                <img src={newDrone.images[0]} className="w-16 h-16 rounded-lg object-cover bg-white" />
                             ) : (
                                <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center text-slate-300">
                                    <Plane size={24} />
                                </div>
                             )}
                             <div>
                                 <h3 className="font-bold text-slate-900 text-sm">{newDrone.manufacturer} {newDrone.model}</h3>
                                 <p className="text-xs text-slate-500 mb-1">SN: {newDrone.serial}</p>
                                 <p className="text-xs text-slate-600 line-clamp-2 italic">"{newDrone.issue}"</p>
                             </div>
                        </div>
                    </div>

                    {/* AI Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                             <h3 className="font-bold text-slate-900 text-sm">AI Diagnosis</h3>
                             {!aiDiagnosis && (
                                <button 
                                    onClick={runAiDiagnosis}
                                    disabled={isAnalyzing}
                                    className="text-xs font-bold text-purple-600 flex items-center gap-1 hover:bg-purple-50 px-2 py-1 rounded-lg transition"
                                >
                                    {isAnalyzing ? 'Analyzing...' : <>Run Analysis <Sparkles size={12} /></>}
                                </button>
                             )}
                        </div>

                        {aiDiagnosis ? (
                           <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-top-4">
                             <div className="flex items-start gap-3">
                               <div className="p-2 bg-white rounded-xl shadow-sm text-purple-600">
                                 <Sparkles size={18} />
                               </div>
                               <div>
                                 <h4 className="font-bold text-slate-900 text-sm">Diagnosis Complete</h4>
                                 <p className="text-sm text-slate-700 mt-2 font-medium">{aiDiagnosis.likelyIssue}</p>
                                 
                                 <div className="mt-4 space-y-2">
                                     <p className="text-xs font-bold text-purple-900 uppercase tracking-wide">Recommended Actions</p>
                                     <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                                         {aiDiagnosis.recommendedActions.map((action, i) => (
                                             <li key={i}>{action}</li>
                                         ))}
                                     </ul>
                                 </div>

                                 <div className="mt-4 flex gap-2">
                                    <span className="text-[10px] bg-white px-2 py-1 rounded-lg border border-purple-100 text-purple-700 font-bold uppercase tracking-wide">
                                        {aiDiagnosis.estimatedDifficulty} Difficulty
                                    </span>
                                 </div>
                               </div>
                             </div>
                           </div>
                        ) : (
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                                <Sparkles className="text-slate-300 mb-2" size={24} />
                                <p className="text-sm text-slate-500">Run AI diagnosis to get preliminary insights on the repair.</p>
                                <button onClick={runAiDiagnosis} className="mt-3 text-xs font-bold text-purple-600 hover:text-purple-700">Analyze Now</button>
                            </div>
                        )}
                    </div>

                    {/* Authorization & Signature Section */}
                    <div className="mt-8 space-y-6">
                        <h3 className="font-bold text-slate-900 text-lg">Authorization</h3>
                        
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center mt-0.5">
                                <input 
                                    type="checkbox" 
                                    checked={newDrone.authorized}
                                    onChange={(e) => setNewDrone({...newDrone, authorized: e.target.checked})}
                                    className="peer w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-blue-600 checked:border-blue-600 appearance-none transition cursor-pointer" 
                                />
                                <Check size={14} className="absolute text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition" />
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed select-none">
                                I have read and agree to the <span className="text-blue-600 font-bold">Terms of Service</span> and <span className="text-blue-600 font-bold">Privacy Policy</span>. I authorize the diagnosis and repair of the device listed above.
                            </p>
                        </label>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-slate-900 text-lg">Signature</h3>
                                {newDrone.signature && (
                                    <button 
                                        onClick={() => setNewDrone({...newDrone, signature: null})}
                                        className="text-[10px] font-bold text-blue-600 uppercase tracking-wide hover:text-blue-700"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            
                            {newDrone.signature ? (
                                <div className="w-full h-[120px] bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center relative overflow-hidden">
                                    <img src={newDrone.signature} alt="Signature" className="h-full object-contain" />
                                </div>
                            ) : (
                                <div className="w-full">
                                    <SignaturePad 
                                        onSave={(dataUrl) => setNewDrone({...newDrone, signature: dataUrl})}
                                        onClear={() => {}}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Button */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-50 md:absolute md:rounded-b-[2.5rem]">
                <button 
                    onClick={() => intakeStep < 3 ? setIntakeStep(s => s + 1) : handleRegisterDrone()}
                    disabled={intakeStep === 3 && (!newDrone.authorized || !newDrone.signature)}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 disabled:shadow-none transition-all transform active:scale-95 flex justify-center items-center gap-2"
                >
                    <span>{intakeStep === 3 ? 'Submit Registration' : 'Save & Continue'}</span>
                    <ArrowRight size={18} />
                </button>
                <div className="flex justify-center items-center gap-1.5 mt-3 text-[10px] text-slate-400">
                    <Lock size={10} />
                    <span>We promise not to spam you. Only repair updates.</span>
                </div>
            </div>
            
        </div>
    </div>
  );

  const renderAddParts = () => {
    if (!clientJob) return null;

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            {/* Header */}
            <header className="bg-white px-6 pt-8 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
                 <button onClick={() => setCurrentView('details')} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition">
                     <ArrowLeft size={20} className="text-slate-900" />
                 </button>
                 <h1 className="font-bold text-slate-900 text-base">Add Drone Parts</h1>
                 <div className="w-8"></div> {/* Spacer */}
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-6 pb-32 space-y-6">
                {/* Job Info Banner */}
                <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0">
                        <Wrench size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">REPAIRING</p>
                        <p className="font-bold text-slate-900 text-sm">
                            {clientJob.drone.manufacturer} {clientJob.drone.model} <span className="text-slate-400 font-normal">#{clientJob.id.replace('R-', '')}</span>
                        </p>
                    </div>
                </div>

                {/* Parts List */}
                {partsList.map((part, index) => (
                    <div key={part.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative animate-in fade-in slide-in-from-bottom-4">
                         <div className="flex justify-between items-center mb-6">
                             <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">{index + 1}</div>
                                 <h3 className="font-bold text-slate-900 text-sm">Component Details</h3>
                             </div>
                             {partsList.length > 1 && (
                                 <button onClick={() => handleRemovePart(part.id)} className="text-slate-300 hover:text-red-500 transition">
                                     <Trash2 size={18} />
                                 </button>
                             )}
                         </div>

                         {/* Category Toggle */}
                         <div className="mb-5">
                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Category</label>
                             <div className="flex gap-3">
                                 <button 
                                    onClick={() => handleUpdatePart(part.id, 'category', 'module')}
                                    className={`flex-1 py-3 border-2 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition ${part.category === 'module' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'}`}
                                 >
                                     <Puzzle size={16} /> Module
                                 </button>
                                 <button 
                                    onClick={() => handleUpdatePart(part.id, 'category', 'part')}
                                    className={`flex-1 py-3 border-2 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition ${part.category === 'part' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'}`}
                                 >
                                     <Cog size={16} /> Part
                                 </button>
                             </div>
                         </div>

                         {/* Name Input */}
                         <div className="mb-5">
                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Name</label>
                             <input 
                                type="text" 
                                value={part.name}
                                onChange={(e) => handleUpdatePart(part.id, 'name', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 placeholder:text-slate-400 transition"
                                placeholder="e.g. Gimbal Ribbon Cable"
                             />
                         </div>

                         {/* Part Number Input */}
                         <div>
                             <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Part Number</label>
                             <div className="relative">
                                <div className="absolute left-4 top-3.5 text-slate-400">
                                    <LayoutGrid size={18} /> 
                                </div>
                                <input 
                                    type="text" 
                                    value={part.partNumber}
                                    onChange={(e) => handleUpdatePart(part.id, 'partNumber', e.target.value)}
                                    className="w-full pl-11 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 placeholder:text-slate-400 transition"
                                    placeholder="e.g. M3-GIM-002"
                                />
                                <button className="absolute right-4 top-3.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wide">
                                    Scan
                                </button>
                             </div>
                         </div>
                    </div>
                ))}

                {/* Add Another Entry */}
                <button 
                    onClick={handleAddPart}
                    className="w-full py-8 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-2xl flex flex-col items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 transition group"
                >
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                        <Plus size={20} />
                    </div>
                    <span className="text-sm font-bold">Add Another Entry</span>
                </button>

            </div>

             {/* Footer Action */}
            <div className="bg-white p-6 border-t border-slate-100 absolute bottom-0 left-0 right-0 rounded-t-[2rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                <div className="flex items-start gap-3 mb-6">
                    <div className="relative flex items-center justify-center">
                        <input 
                            type="checkbox" 
                            checked={isWarrantyApplied}
                            onChange={(e) => setIsWarrantyApplied(e.target.checked)}
                            className="peer w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-blue-600 checked:border-blue-600 appearance-none transition cursor-pointer" 
                        />
                        <Check size={14} className="absolute text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-bold text-sm text-slate-900">Add Warranty</h4>
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded border border-green-200">Free</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">Apply standard 3-month protection plan to selected parts.</p>
                    </div>
                </div>

                <button 
                    onClick={handleSaveParts}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex justify-center items-center gap-2"
                >
                    Confirm & Save <Check size={18} />
                </button>
            </div>
        </div>
    )
  }

  const renderPartDetailModal = () => {
      if (!selectedPart) return null;
      
      return (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-start mb-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedPart.category === 'module' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                          {selectedPart.category === 'module' ? <Puzzle size={24} /> : <Cog size={24} />}
                      </div>
                      <button 
                        onClick={() => setSelectedPart(null)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
                      >
                          <X size={20} />
                      </button>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-1">{selectedPart.name}</h3>
                  <p className="text-sm text-slate-500 font-medium mb-6">PN: {selectedPart.partNumber}</p>

                  <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center py-3 border-b border-slate-50">
                          <span className="text-xs font-bold text-slate-400 uppercase">Category</span>
                          <span className="text-sm font-bold text-slate-900 capitalize">{selectedPart.category}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-slate-50">
                          <span className="text-xs font-bold text-slate-400 uppercase">Warranty</span>
                          <div className="flex items-center gap-1.5">
                              {selectedPart.warranty ? (
                                  <>
                                    <ShieldCheck size={14} className="text-green-500" />
                                    <span className="text-sm font-bold text-green-600">Active</span>
                                  </>
                              ) : (
                                  <span className="text-sm font-bold text-slate-400">None</span>
                              )}
                          </div>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-slate-50">
                          <span className="text-xs font-bold text-slate-400 uppercase">Status</span>
                          <span className="text-sm font-bold text-blue-600">Installed</span>
                      </div>
                  </div>

                  <button 
                    onClick={() => setSelectedPart(null)}
                    className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition"
                  >
                      Close Details
                  </button>
              </div>
          </div>
      );
  }

  const renderDroneDetailsModal = () => {
      if (!showDroneDetailsModal || !clientJob) return null;

      return (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white w-full h-full max-h-[600px] rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
                  <div className="flex justify-between items-start mb-4 shrink-0">
                      <div>
                          <h3 className="text-xl font-bold text-slate-900">Drone Details</h3>
                          <p className="text-sm text-slate-500">Full registration info</p>
                      </div>
                      <button 
                        onClick={() => setShowDroneDetailsModal(false)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
                      >
                          <X size={20} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                      {/* Images Gallery */}
                      <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Visual Evidence</h4>
                          <div className="grid grid-cols-2 gap-2">
                              {clientJob.images.map((img, idx) => (
                                  <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                                      <img src={img} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                                  </div>
                              ))}
                              {clientJob.images.length === 0 && (
                                  <div className="col-span-2 p-4 text-center text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                      No images uploaded
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Device Info */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Device Information</h4>
                          <div className="space-y-3">
                              <div className="flex justify-between">
                                  <span className="text-sm text-slate-500">Manufacturer</span>
                                  <span className="text-sm font-bold text-slate-900">{clientJob.drone.manufacturer}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-sm text-slate-500">Model</span>
                                  <span className="text-sm font-bold text-slate-900">{clientJob.drone.model}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-sm text-slate-500">Serial Number</span>
                                  <span className="text-sm font-bold text-slate-900">{clientJob.drone.serialNumber}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-sm text-slate-500">Received Date</span>
                                  <span className="text-sm font-bold text-slate-900">{clientJob.receivedDate}</span>
                              </div>
                          </div>
                      </div>

                      {/* Customer Info */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Client Details</h4>
                          <div className="space-y-3">
                              <div className="flex justify-between">
                                  <span className="text-sm text-slate-500">Name</span>
                                  <span className="text-sm font-bold text-slate-900">{clientJob.customerName}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-sm text-slate-500">Phone</span>
                                  <span className="text-sm font-bold text-slate-900">{clientJob.customerPhone}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-sm text-slate-500">Email</span>
                                  <span className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{clientJob.customerEmail}</span>
                              </div>
                              {clientJob.notificationPreferences && (
                                  <div className="pt-2 mt-2 border-t border-slate-200">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-2">Notification Preferences</span>
                                      <div className="flex gap-2">
                                          {clientJob.notificationPreferences.sms && (
                                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-100">SMS</span>
                                          )}
                                          {clientJob.notificationPreferences.whatsapp && (
                                              <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded border border-green-100">WhatsApp</span>
                                          )}
                                          {clientJob.notificationPreferences.email && (
                                              <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded border border-orange-100">Email</span>
                                          )}
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Issue Description */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Reported Issue</h4>
                          <p className="text-sm text-slate-700 leading-relaxed italic">"{clientJob.issueDescription}"</p>
                      </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 shrink-0">
                      <button 
                        onClick={() => setShowDroneDetailsModal(false)}
                        className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition"
                      >
                          Close
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  const renderJobDetails = () => {
    if (!clientJob) return null;

    const timelineSteps = [
      { id: 1, label: 'Request Received', date: clientJob.receivedDate, status: RepairStatus.RECEIVED },
      { id: 2, label: 'Diagnostics Complete', date: clientJob.timeline.find(t => t.status === RepairStatus.DIAGNOSING)?.date, status: RepairStatus.DIAGNOSING },
      { id: 3, label: 'Repair in Progress', date: clientJob.timeline.find(t => t.status === RepairStatus.IN_PROGRESS)?.date, status: RepairStatus.IN_PROGRESS, hasNote: true },
      { id: 4, label: 'Testing & Calibration', date: null, status: 'TESTING' }, // Mock visual step
      { id: 5, label: 'Ready for Pickup', date: clientJob.timeline.find(t => t.status === RepairStatus.READY)?.date, status: RepairStatus.READY },
    ];

    const getCurrentStepIndex = (status: RepairStatus) => {
        if (status === RepairStatus.COMPLETED || status === RepairStatus.READY) return 5;
        if (status === RepairStatus.IN_PROGRESS) return 3;
        if (status === RepairStatus.WAITING_PARTS) return 3; // Treat as part of repair phase
        if (status === RepairStatus.DIAGNOSING) return 2;
        return 1;
    };

    const currentStepIdx = getCurrentStepIndex(clientJob.status);
    
    const getNextStatusLabel = (status: RepairStatus) => {
      switch (status) {
          case RepairStatus.RECEIVED: return 'Start Diagnosis';
          case RepairStatus.DIAGNOSING: return 'Start Repair';
          case RepairStatus.WAITING_PARTS: return 'Resume Repair';
          case RepairStatus.IN_PROGRESS: return 'Mark Ready';
          case RepairStatus.READY: return 'Complete Job';
          default: return 'Advance Status';
      }
   };

    return (
      <div className="flex flex-col h-full bg-slate-50 relative">
        {/* Simple Header */}
        <header className="bg-white px-6 pt-8 pb-4 border-b border-slate-100 flex justify-between items-center sticky top-0 z-20">
             <button onClick={() => setCurrentView('list')} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition">
                 <ArrowLeft size={20} className="text-slate-900" />
             </button>
             <h1 className="font-bold text-slate-900">Repair Status</h1>
             <button className="p-2 -mr-2 hover:bg-slate-50 rounded-full transition text-slate-900">
                 <Share2 size={20} />
             </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 pb-32 space-y-6">
            
            {/* Top Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide mb-3 ${getStatusLabelStyle(clientJob.status)}`}>
                    {clientJob.status}
                </span>
                
                <div className="flex gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-bold text-slate-900 leading-tight">{clientJob.drone.manufacturer} {clientJob.drone.model}</h2>
                            {clientJob.isPaid && (
                                <div className="bg-emerald-100 text-emerald-600 p-1 rounded-full" title="Paid">
                                    <CircleDollarSign size={16} strokeWidth={3} />
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 font-medium mb-1">ID: #{clientJob.id.replace('R-', '')}</p>
                        <p className="text-xs text-slate-400 font-medium mb-1">Serial: {clientJob.drone.serialNumber}</p>
                        <p className="text-xs text-slate-400 font-medium mb-4">Client: {clientJob.customerName}</p>
                    </div>
                    <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                        <img src={clientJob.images[0]} className="w-full h-full object-cover" />
                    </div>
                </div>

                <button 
                    onClick={() => setShowDroneDetailsModal(true)}
                    className="w-full py-2.5 bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition"
                >
                    <Info size={14} className="text-slate-500" /> View More Details
                </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
                 <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                     <div className="flex items-center gap-2 text-slate-400 mb-1">
                         <Calendar size={14} />
                         <span className="text-[10px] font-bold uppercase tracking-wide">Est. Completion</span>
                     </div>
                     <p className="font-bold text-slate-900 text-sm">Oct 24, 2023</p>
                 </div>
                 <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                     <div className="flex items-center gap-2 text-slate-400 mb-1">
                         <DollarSign size={14} />
                         <span className="text-[10px] font-bold uppercase tracking-wide">Est. Cost</span>
                     </div>
                     <p className="font-bold text-slate-900 text-sm">${clientJob.estimatedCost.toFixed(2)}</p>
                 </div>
                 <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                     <div className="flex items-center gap-2 text-slate-400 mb-1">
                         <User size={14} />
                         <span className="text-[10px] font-bold uppercase tracking-wide">Technician</span>
                     </div>
                     <p className="font-bold text-slate-900 text-sm">{clientJob.technician || 'Unassigned'}</p>
                 </div>
                 <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                     <div className="flex items-center gap-2 text-slate-400 mb-1">
                         <FileText size={14} />
                         <span className="text-[10px] font-bold uppercase tracking-wide">Invoice</span>
                     </div>
                     <button className="font-bold text-slate-900 text-sm underline decoration-slate-300 underline-offset-2">View PDF</button>
                 </div>
            </div>

            {/* Timeline */}
            <div>
                 <div className="flex justify-between items-end mb-4 px-1">
                     <h3 className="font-bold text-slate-900">Current Progress</h3>
                     <span className="text-[10px] font-bold text-slate-400 uppercase">Step {Math.min(currentStepIdx, 5)} of 5</span>
                 </div>

                 <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative">
                     {/* Vertical Line */}
                     <div className="absolute left-[41px] top-8 bottom-8 w-0.5 bg-slate-100">
                         <div 
                           className="absolute top-0 w-full bg-blue-600 transition-all duration-1000" 
                           style={{ height: `${(Math.min(currentStepIdx - 1, 4) / 4) * 100}%` }}
                         ></div>
                     </div>

                     <div className="space-y-8 relative z-10">
                        {timelineSteps.map((step, idx) => {
                            const isCompleted = idx + 1 < currentStepIdx;
                            const isActive = idx + 1 === currentStepIdx;
                            
                            return (
                                <div key={step.id} className="flex gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                                        isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 
                                        isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 
                                        'bg-white border-slate-200 text-transparent'
                                    }`}>
                                        {(isCompleted || isActive) && <Check size={14} strokeWidth={3} />}
                                    </div>
                                    <div className="pt-1 flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className={`font-bold text-sm ${isActive || isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                                                {step.label} {isActive && <span className="inline-block w-2 h-2 rounded-full bg-blue-600 ml-1 align-middle animate-pulse"></span>}
                                            </h4>
                                        </div>
                                        {step.date && <p className="text-xs text-slate-400 mt-0.5">{step.date}</p>}
                                        {isActive && !step.date && <p className="text-xs text-slate-400 mt-0.5">Pending...</p>}
                                        
                                        {/* Technician Note for Active Step */}
                                        {step.hasNote && isActive && clientJob.technicianNotes[0] && (
                                            <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 flex gap-3">
                                                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                                                <p className="text-xs text-slate-600 leading-relaxed">
                                                    <span className="font-bold text-slate-700">Technician Note:</span> {clientJob.technicianNotes[0]}
                                                </p>
                                            </div>
                                        )}

                                        {/* Parts Tracking for In Progress Step */}
                                        {((isActive && step.status === RepairStatus.IN_PROGRESS) || step.status === RepairStatus.IN_PROGRESS) && clientJob.parts && clientJob.parts.length > 0 && (
                                            <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Package size={12} className="text-slate-400" />
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Installed Parts</p>
                                                </div>
                                                <div className="space-y-2">
                                                    {clientJob.parts.map(part => (
                                                        <div 
                                                            key={part.id} 
                                                            onClick={() => setSelectedPart(part)}
                                                            className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between group cursor-pointer hover:border-blue-400 hover:shadow-sm transition"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${part.category === 'module' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                                    {part.category === 'module' ? <Puzzle size={16} /> : <Cog size={16} />}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-700 group-hover:text-blue-700 transition">{part.name}</p>
                                                                    <p className="text-[10px] text-slate-400 uppercase">{part.partNumber}</p>
                                                                </div>
                                                            </div>
                                                            <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                     </div>
                 </div>
            </div>

            {/* Admin Section */}
            <div>
                 <h3 className="font-bold text-slate-900 mb-3 px-1">Admin</h3>
                 <div className="space-y-3 mb-24">
                     <button 
                        onClick={() => setCurrentView('addParts')}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition"
                     >
                         <Plus size={18} /> Add Drone Parts
                     </button>
                     
                     {clientJob.status !== RepairStatus.COMPLETED && (
                         <button 
                            onClick={() => {
                                setCurrentView('updateStatus');
                                setCostDraft(clientJob.estimatedCost.toString());
                            }}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 text-sm font-bold hover:bg-slate-800 transition shadow-xl shadow-slate-200"
                         >
                             Update Status <ArrowRight size={18} />
                         </button>
                     )}
                 </div>
            </div>
        </div>

        {/* Floating Action Bar */}
        <div className="absolute bottom-6 left-6 right-6 flex gap-3 z-30">
            <button 
              onClick={() => generateNotification(clientJob)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition active:scale-95"
            >
                <MessageCircle size={18} fill="currentColor" className="text-white/20" /> WhatsApp
            </button>
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition active:scale-95">
                <CreditCard size={18} /> Charge Client
            </button>
            <button className="w-14 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold shadow-lg flex items-center justify-center transition active:scale-95">
                <Phone size={20} />
            </button>
        </div>

        {/* Part Detail Modal Overlay */}
        {renderPartDetailModal()}
        {renderDroneDetailsModal()}

      </div>
    );
  }

  const renderUploadMediaList = () => (
    <div className="flex flex-col h-full bg-slate-50 relative">
        <header className="bg-white px-6 pt-8 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
             <button onClick={() => setCurrentView('hub')} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition">
                 <ArrowLeft size={20} className="text-slate-900" />
             </button>
             <h1 className="font-bold text-slate-900 text-base">Select Drone</h1>
             <div className="w-8"></div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide px-2 mb-2">Active Repairs</p>
            {jobs.map(job => (
                <button 
                    key={job.id}
                    onClick={() => { setSelectedJobId(job.id); setCurrentView('uploadMediaForm'); }}
                    className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-purple-200 transition active:scale-[0.98]"
                >
                    <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                        <img src={job.images[0]} alt="Drone" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-left">
                        <h3 className="font-bold text-slate-900 text-sm">{job.drone.manufacturer} {job.drone.model}</h3>
                        <p className="text-[10px] text-slate-400 font-medium">SN: {job.drone.serialNumber}</p>
                    </div>
                    <ChevronRight className="text-slate-300" size={16} />
                </button>
            ))}
        </div>
        {renderBottomNav()}
    </div>
  );

  const renderUploadMediaForm = () => {
    if (!clientJob) return null;

    return (
        <div className="flex flex-col h-full bg-white relative">
            <header className="px-6 pt-8 pb-4 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white z-10">
                 <button onClick={() => setCurrentView('uploadMediaList')} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition">
                     <ArrowLeft size={20} className="text-slate-900" />
                 </button>
                 <h1 className="font-bold text-slate-900 text-base">Add Media</h1>
                 <div className="w-8"></div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
                <div className="bg-purple-50 rounded-2xl p-4 flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shrink-0 border border-purple-100">
                        <img src={clientJob.images[0]} alt="Drone" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm">{clientJob.drone.manufacturer} {clientJob.drone.model}</h3>
                        <p className="text-xs text-purple-600 font-medium">Adding evidence for #{clientJob.id.replace('R-', '')}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-4">Current Gallery ({clientJob.images.length})</h4>
                        <div className="grid grid-cols-3 gap-3">
                            {clientJob.images.map((img, idx) => (
                                <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative group">
                                    <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                                    <button 
                                        onClick={() => setJobs(prev => prev.map(j => j.id === clientJob.id ? {...j, images: j.images.filter((_, i) => i !== idx)} : j))}
                                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition backdrop-blur-sm"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                            
                            {/* Add More Button */}
                            <label className="aspect-square rounded-xl border-2 border-dashed border-purple-200 bg-purple-50 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-100 transition group">
                                <Plus size={20} className="text-purple-600 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold text-purple-600 mt-1">Add</span>
                                <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleJobImageUpload(clientJob.id, e)} />
                            </label>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3 text-slate-500">
                            <Info size={18} />
                            <p className="text-xs leading-relaxed">
                                Photos are automatically synced to the client portal and repair history.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-50">
                <button 
                    onClick={() => setCurrentView('details')}
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg transition active:scale-95"
                >
                    View Repair Status
                </button>
            </div>
        </div>
    );
  };

  const renderNotifications = () => {
    // Generate some mock notifications based on active jobs
    const notifications = jobs.filter(j => j.status !== RepairStatus.COMPLETED).map(job => ({
        id: `notif-${job.id}`,
        jobId: job.id,
        title: `${job.drone.manufacturer} ${job.drone.model}`,
        message: job.status === RepairStatus.RECEIVED ? 'New repair request received' : `Status updated to ${job.status}`,
        time: 'Just now',
        type: job.status === RepairStatus.RECEIVED ? 'info' : 'update'
    }));

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            <header className="bg-white px-6 pt-8 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
                 <button onClick={() => setCurrentView('hub')} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition">
                     <ArrowLeft size={20} className="text-slate-900" />
                 </button>
                 <h1 className="font-bold text-slate-900 text-base">Notifications</h1>
                 <div className="w-8"></div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 space-y-3">
                {notifications.length > 0 ? (
                    notifications.map(notif => (
                        <button 
                            key={notif.id}
                            onClick={() => { setSelectedJobId(notif.jobId); setCurrentView('details'); }}
                            className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4 hover:border-blue-200 transition active:scale-[0.98]"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                notif.type === 'info' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                            }`}>
                                <Bell size={18} />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-slate-900 text-sm">{notif.title}</h3>
                                    <span className="text-[10px] text-slate-400 font-medium">{notif.time}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Bell size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium">No new notifications</p>
                    </div>
                )}
            </div>
            {renderBottomNav()}
        </div>
    );
  };

  const renderClientList = () => {
    // Group jobs by client to get unique clients
    const clients = Array.from(new Set(jobs.map(j => j.customerEmail))).map(email => {
        const job = jobs.find(j => j.customerEmail === email)!;
        return {
            name: job.customerName,
            email: job.customerEmail,
            phone: job.customerPhone,
            repairCount: jobs.filter(j => j.customerEmail === email).length
        };
    });

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            <header className="bg-white px-6 pt-8 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
                 <button onClick={() => setCurrentView('hub')} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition">
                     <ArrowLeft size={20} className="text-slate-900" />
                 </button>
                 <h1 className="font-bold text-slate-900 text-base">Client List</h1>
                 <div className="w-8"></div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 space-y-3">
                {clients.map(client => (
                    <button 
                        key={client.email}
                        onClick={() => { setSelectedClientId(client.email); setCurrentView('clientProfile'); }}
                        className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-blue-200 transition active:scale-[0.98]"
                    >
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                            <User size={24} />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="font-bold text-slate-900 text-sm">{client.name}</h3>
                            <p className="text-[10px] text-slate-400 font-medium">{client.email}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-blue-600">{client.repairCount}</p>
                            <p className="text-[8px] text-slate-400 uppercase font-bold">Repairs</p>
                        </div>
                        <ChevronRight className="text-slate-300" size={16} />
                    </button>
                ))}
            </div>
            {renderBottomNav()}
        </div>
    );
  };

  const renderClientProfile = () => {
    if (!selectedClientId) return null;
    const clientJobs = jobs.filter(j => j.customerEmail === selectedClientId);
    const client = clientJobs[0];
    const activeRepairs = clientJobs.filter(j => j.status !== RepairStatus.COMPLETED && j.status !== RepairStatus.READY).length;

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            <header className="bg-white px-6 pt-8 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
                 <button onClick={() => setCurrentView('clientList')} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition">
                     <ArrowLeft size={20} className="text-slate-900" />
                 </button>
                 <h1 className="font-bold text-slate-900 text-base">Client Profile</h1>
                 <div className="w-8"></div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-6">
                {/* Profile Header Card */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 relative">
                        <User size={48} />
                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white">
                            <Check size={16} strokeWidth={3} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">{client.customerName}</h2>
                    <p className="text-xs text-slate-400 font-medium mt-1">SkyHigh Aerial Solutions</p>

                    <div className="w-full space-y-3 mt-8">
                        <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                                <Mail size={18} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Email Address</p>
                                <p className="text-xs font-bold text-slate-900">{client.customerEmail}</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                                <Phone size={18} />
                            </div>
                            <div className="text-left flex-1">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Phone</p>
                                <p className="text-xs font-bold text-slate-900">{client.customerPhone}</p>
                            </div>
                            <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                                <MessageCircle size={14} fill="currentColor" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between w-full mt-8 px-2">
                        <div className="text-center">
                            <p className="text-xl font-bold text-slate-900">{clientJobs.length}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Total Repairs</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-bold text-slate-900">{activeRepairs}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Active</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-bold text-slate-900">4.9</p>
                            <p className="text-[10px] text-slate-400 font-medium">Rating</p>
                        </div>
                    </div>
                </div>

                {/* Repair History */}
                <div>
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h3 className="font-bold text-slate-900">Repair History</h3>
                        <button onClick={() => setCurrentView('list')} className="text-xs font-bold text-blue-600 hover:text-blue-700">View All</button>
                    </div>
                    <div className="space-y-3">
                        {clientJobs.map(job => (
                            <button 
                                key={job.id}
                                onClick={() => { setSelectedJobId(job.id); setCurrentView('details'); }}
                                className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition active:scale-[0.98] ${
                                    job.status === RepairStatus.IN_PROGRESS ? 'bg-blue-50 border-blue-100' : 
                                    job.status === RepairStatus.DIAGNOSING ? 'bg-orange-50 border-orange-100' : 
                                    'bg-white border-slate-100 shadow-sm'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    job.status === RepairStatus.IN_PROGRESS ? 'bg-blue-600 text-white' : 
                                    job.status === RepairStatus.DIAGNOSING ? 'bg-orange-500 text-white' : 
                                    'bg-slate-100 text-slate-500'
                                }`}>
                                    {job.status === RepairStatus.COMPLETED || job.status === RepairStatus.READY ? <Check size={18} strokeWidth={3} /> : <Wrench size={18} />}
                                </div>
                                <div className="flex-1 text-left">
                                    <h4 className="font-bold text-slate-900 text-sm">{job.drone.manufacturer} {job.drone.model}</h4>
                                    <p className="text-[10px] text-slate-400 font-medium">{job.receivedDate} • <span className={
                                        job.status === RepairStatus.IN_PROGRESS ? 'text-blue-600' : 
                                        job.status === RepairStatus.DIAGNOSING ? 'text-orange-600' : 
                                        'text-emerald-600'
                                    }>{job.status}</span></p>
                                </div>
                                <ChevronRight className="text-slate-300" size={16} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {renderBottomNav()}
        </div>
    );
  };

  const renderProfile = () => (
    <div className="flex flex-col h-full bg-white relative">
      <header className="px-6 pt-8 pb-4 flex justify-between items-center sticky top-0 bg-white z-10">
         <button onClick={() => { setCurrentView('hub'); setIsEditingProfile(false); }} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition">
             <ArrowLeft size={20} className="text-slate-900" />
         </button>
         <h1 className="font-bold text-slate-900 text-base">My Profile</h1>
         <button 
            onClick={() => {
                if (isEditingProfile) {
                    saveProfile();
                } else {
                    setProfileDraft(userProfile);
                    setIsEditingProfile(true);
                }
            }}
            className={`p-2 -mr-2 transition font-bold text-sm ${isEditingProfile ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
         >
             {isEditingProfile ? 'Save' : <Settings size={20} />}
         </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-24">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
              <div className="w-28 h-28 rounded-full p-1 border-2 border-dashed border-blue-200 mb-4 relative group">
                  <img src={isEditingProfile ? profileDraft.avatar : userProfile.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  {isEditingProfile && (
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition cursor-pointer">
                          <Camera size={16} />
                          <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                      </label>
                  )}
              </div>
              
              {isEditingProfile ? (
                  <input 
                    type="text" 
                    value={profileDraft.name}
                    onChange={(e) => setProfileDraft({...profileDraft, name: e.target.value})}
                    className="text-2xl font-bold text-slate-900 text-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 mb-1 w-full max-w-[200px]"
                  />
              ) : (
                  <h2 className="text-2xl font-bold text-slate-900">{userProfile.name}</h2>
              )}
              
              <p className="text-sm text-blue-600 font-medium">{userProfile.role}</p>
          </div>

          {/* Info Cards */}
          <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Contact Information</label>
                  <div className="space-y-3 mt-3">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm">
                              <Mail size={16} />
                          </div>
                          <div className="flex-1">
                              <p className="text-xs text-slate-400">Email Address</p>
                              {isEditingProfile ? (
                                  <input 
                                    type="email" 
                                    value={profileDraft.email}
                                    onChange={(e) => setProfileDraft({...profileDraft, email: e.target.value})}
                                    className="text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded px-2 py-1 w-full"
                                  />
                              ) : (
                                  <p className="text-sm font-bold text-slate-900">{userProfile.email}</p>
                              )}
                          </div>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm">
                              <Phone size={16} />
                          </div>
                          <div className="flex-1">
                              <p className="text-xs text-slate-400">Phone Number</p>
                              {isEditingProfile ? (
                                  <input 
                                    type="tel" 
                                    value={profileDraft.phone}
                                    onChange={(e) => setProfileDraft({...profileDraft, phone: e.target.value})}
                                    className="text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded px-2 py-1 w-full"
                                  />
                              ) : (
                                  <p className="text-sm font-bold text-slate-900">{userProfile.phone}</p>
                              )}
                          </div>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm">
                              <Plane size={16} />
                          </div>
                          <div className="flex-1">
                              <p className="text-xs text-slate-400">Location</p>
                              {isEditingProfile ? (
                                  <input 
                                    type="text" 
                                    value={profileDraft.location}
                                    onChange={(e) => setProfileDraft({...profileDraft, location: e.target.value})}
                                    className="text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded px-2 py-1 w-full"
                                  />
                              ) : (
                                  <p className="text-sm font-bold text-slate-900">{userProfile.location}</p>
                              )}
                          </div>
                      </div>
                  </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Performance</label>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="bg-white p-3 rounded-xl shadow-sm">
                          <p className="text-2xl font-bold text-slate-900">124</p>
                          <p className="text-[10px] text-slate-500 font-medium">Repairs Completed</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl shadow-sm">
                          <p className="text-2xl font-bold text-emerald-500">4.9</p>
                          <p className="text-[10px] text-slate-500 font-medium">Average Rating</p>
                      </div>
                  </div>
              </div>
          </div>
          
          {isEditingProfile ? (
              <button 
                onClick={cancelEditProfile}
                className="w-full mt-6 py-3.5 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition flex items-center justify-center gap-2"
              >
                  Cancel Changes
              </button>
          ) : (
              <button className="w-full mt-6 py-3.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-2">
                  <LogOut size={18} /> Sign Out
              </button>
          )}
      </div>

      {renderBottomNav()}
    </div>
  );

  // --- APP SHELL (Desktop + Mobile Wrapper) ---
  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center font-sans antialiased text-slate-900 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
      {/* Mobile Shell Container - matches the "App" look from the image */}
      <div className="w-full h-[100dvh] md:h-[850px] md:max-w-[420px] bg-white md:rounded-[2.5rem] shadow-2xl overflow-hidden relative border-[8px] border-white ring-1 ring-slate-900/5">
        
        {currentView === 'hub' && renderHub()}
        {currentView === 'list' && renderJobList()}
        {currentView === 'intake' && renderIntake()}
        {currentView === 'details' && renderJobDetails()}
        {currentView === 'addParts' && renderAddParts()}
        {currentView === 'updateStatus' && renderUpdateStatus()}
        {currentView === 'profile' && renderProfile()}
        {currentView === 'clientList' && renderClientList()}
        {currentView === 'clientProfile' && renderClientProfile()}
        {currentView === 'uploadMediaList' && renderUploadMediaList()}
        {currentView === 'uploadMediaForm' && renderUploadMediaForm()}
        {currentView === 'notifications' && renderNotifications()}
        {currentView === 'settings' && <SettingsView onBack={() => setCurrentView('hub')} />}
        
      </div>
    </div>
  );
}