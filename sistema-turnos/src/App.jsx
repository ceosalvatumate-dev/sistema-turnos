import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Menu, X, MapPin, Mail, Facebook, Instagram, Twitter, 
  Scissors, Calendar, Clock, ChevronRight, User, 
  LayoutDashboard, CheckCircle, ChevronLeft, Phone, 
  User as UserIcon, TrendingUp, DollarSign, Users, 
  CalendarRange, Filter, LogOut, Package, Star, 
  Settings, CreditCard, MessageCircle, Lock, AlertTriangle,
  Smartphone, Share2, Download, Image as ImageIcon,
  Edit2, Trash2, PlusCircle, Save, BarChart, Camera, Upload, 
  Link as LinkIcon, ShoppingBag, Tag, FileSpreadsheet, XCircle,
  Activity, PieChart, BarChart2, Briefcase, CheckSquare, Ban,
  Save as SaveIcon, RefreshCw
} from 'lucide-react';
import { auth, db, firebaseEnabled } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  doc, setDoc, onSnapshot, updateDoc,
  collection, addDoc, query, orderBy, serverTimestamp
} from 'firebase/firestore';

/**
 * --- ERROR BOUNDARY (EL PARACAÍDAS) ---
 * Esto evita que la pantalla se ponga blanca si hay un error de datos.
 */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("APP CRASHED:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-8 text-center font-sans">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4"/>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Algo salió mal</h1>
            <p className="text-slate-600 mb-6">Se detectó un dato corrupto en la aplicación. No te preocupes, podemos intentar recuperarlo.</p>
            <div className="bg-slate-100 p-4 rounded text-left text-xs font-mono mb-6 overflow-auto max-h-32">
                {this.state.error?.toString()}
            </div>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition w-full">
              Borrar Caché y Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- DATOS INICIALES (CLEAN STATE) ---

const DEFAULT_SCHEDULE = { start: "09:00", end: "20:00", days: [1,2,3,4,5,6] };

const INITIAL_CONFIG = {
  businessName: "Barbería Premium",
  logoUrl: "", 
  primaryColor: "blue", 
  currency: "$",
  socialInstagram: "https://instagram.com",
  socialFacebook: "https://facebook.com",
  socialWhatsapp: "5491112345678"
};

const INITIAL_STAFF = [
  { id: 1, name: "Juan Pérez", role: "Master Barber", image: "https://images.unsplash.com/photo-1581803118522-7b72a50f7e9f?q=80&w=200&auto=format&fit=crop", schedule: DEFAULT_SCHEDULE },
  { id: 2, name: "Ana Gomez", role: "Estilista Senior", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop", schedule: { start: "10:00", end: "18:00", days: [2,3,4,5,6] } },
  { id: 3, name: "Carlos Ruiz", role: "Barbero", image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200&auto=format&fit=crop", schedule: { start: "14:00", end: "22:00", days: [4,5,6] } }
];

const INITIAL_PRODUCTS = [
  { id: 1, product: "Cera Mate Strong", price: 2500, stock: 15, unit: "unidades", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=500" },
  { id: 2, product: "Shampoo Premium 5L", price: 8000, stock: 2, unit: "bidones", image: "https://images.unsplash.com/photo-1556228720-1957be83f360?q=80&w=500" },
  { id: 3, product: "Navajas Pro", price: 1200, stock: 150, unit: "cajas", image: "https://images.unsplash.com/photo-1599351431202-6e0000a94376?q=80&w=500" },
];

const INITIAL_REVIEWS = Array.from({ length: 4 }, (_, i) => ({ id: i + 1, user: `Cliente ${i + 1}`, rating: 5, comment: "Excelente servicio, muy puntuales.", image: "" }));

const INITIAL_SERVICES = [
  { id: 1, title: "Corte de cabello", category: ["Hombre", "Barbería"], price: 1500, duration: 45, image: "https://images.unsplash.com/photo-1599351431202-6e0000a94376?q=80&w=800&auto=format&fit=crop", description: "Cortes modernos y clásicos." },
  { id: 2, title: "Barbería Clásica", category: ["Barbería", "Hombre"], price: 1200, duration: 30, image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=800&auto=format&fit=crop", description: "Afeitado tradicional." },
  { id: 4, title: "Corte de Dama", category: ["Mujer", "Estilismo"], price: 1300, duration: 60, image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=800&auto=format&fit=crop", description: "Corte estilizado." },
  { id: 5, title: "Nail Art", category: ["Mujer", "Belleza"], price: 1300, duration: 90, image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800&auto=format&fit=crop", description: "Esculpidas y semipermanentes." },
];

const INITIAL_PORTFOLIO_CATS = ["Cortes Hombre", "Barbería", "Cortes Dama", "Uñas"];
const INITIAL_PORTFOLIO = [
  { id: 1, image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=800", category: "Barbería", title: "Fade & Beard" },
  { id: 2, image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800", category: "Uñas", title: "Nail Art" },
];

const CATEGORIES = ["Todos", "Hombre", "Mujer", "Barbería", "Estilismo", "Belleza"];

const getNextDays = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      dateObj: d,
      dayName: d.toLocaleDateString('es-ES', { weekday: 'short' }),
      dayNumber: d.getDate(),
      fullDate: d.toISOString().split('T')[0],
      dayOfWeek: d.getDay() // 0-6
    });
  }
  return days;
};

const exportToCSV = (data, filename) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(obj => Object.values(obj).join(","));
  const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- COMPONENTE PRINCIPAL ---
function MainApp() {
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [staffData, setStaffData] = useState(INITIAL_STAFF);
  const [servicesData, setServicesData] = useState(INITIAL_SERVICES);
  const [reviewsData, setReviewsData] = useState(INITIAL_REVIEWS);
  const [portfolioData, setPortfolioData] = useState(INITIAL_PORTFOLIO);
  const [productsData, setProductsData] = useState(INITIAL_PRODUCTS);
  const [portfolioCategories, setPortfolioCategories] = useState(INITIAL_PORTFOLIO_CATS); 

  const [view, setView] = useState('landing');
  const [dashboardView, setDashboardView] = useState('overview');
  const [activeCategory, setActiveCategory] = useState("Todos");
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [step, setStep] = useState(1); 
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null); 
  const [clientData, setClientData] = useState({ name: '', phone: '' });

  const [appointments, setAppointments] = useState([]);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginMode, setLoginMode] = useState('admin');
  const [loginError, setLoginError] = useState('');
  const [newCatName, setNewCatName] = useState(""); 
  
  const [currentStaffUser, setCurrentStaffUser] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const reviewsRef = useRef(null);
  const SHOP_ID = 'default';

  const [fbUser, setFbUser] = useState(null);
  const isAdmin = !!fbUser;

  const lastRemoteRef = useRef('');

  useEffect(() => {
    if (!firebaseEnabled) { setDataLoaded(true); return; }
    return onAuthStateChanged(auth, (user) => setFbUser(user));
  }, []);

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setIsMenuOpen(false); 
    if (targetId === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        const element = document.getElementById(targetId);
        if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll(); 
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (firebaseEnabled) return;
    try {
      const savedApps = localStorage.getItem('appointments'); if (savedApps) setAppointments(JSON.parse(savedApps));
      const savedConfig = localStorage.getItem('appConfig'); if (savedConfig) setConfig(JSON.parse(savedConfig));
      const savedStaff = localStorage.getItem('appStaff'); if (savedStaff) setStaffData(JSON.parse(savedStaff));
      const savedServices = localStorage.getItem('appServices'); if (savedServices) setServicesData(JSON.parse(savedServices));
    } catch(e) { console.error("Error cargando local storage", e); }
  }, []);

  // --- SINCRONIZACIÓN Y LECTURA ---
  useEffect(() => {
    if (!firebaseEnabled) return;

    const shopRef = doc(db, 'shops', SHOP_ID);

    return onSnapshot(shopRef, async (snap) => {
      // 1. Si no existe, crear inicial.
      if (!snap.exists()) {
        if (isAdmin) {
          const payload = { config, staffData, servicesData, reviewsData, portfolioData, productsData, portfolioCategories };
          await setDoc(shopRef, payload, { merge: true });
          lastRemoteRef.current = JSON.stringify(payload);
          setDataLoaded(true);
        }
        return;
      }

      // 2. Leer datos
      const data = snap.data();
      
      // 3. SANITIZACIÓN ROBUSTA: Si faltan campos críticos, usar defaults para evitar pantalla blanca.
      const sanitizedStaff = (data.staffData || staffData).map(s => ({
        ...s,
        schedule: (s.schedule && s.schedule.start && s.schedule.end) ? s.schedule : DEFAULT_SCHEDULE
      }));

      const payload = {
        config: data.config ?? config,
        staffData: sanitizedStaff,
        servicesData: data.servicesData ?? servicesData,
        reviewsData: data.reviewsData ?? reviewsData,
        portfolioData: data.portfolioData ?? portfolioData,
        productsData: data.productsData ?? productsData,
        portfolioCategories: data.portfolioCategories ?? portfolioCategories,
      };

      if (isSaving) return;

      lastRemoteRef.current = JSON.stringify(payload);

      setConfig(payload.config);
      setStaffData(payload.staffData);
      setServicesData(payload.servicesData);
      setReviewsData(payload.reviewsData);
      setPortfolioData(payload.portfolioData);
      setProductsData(payload.productsData);
      setPortfolioCategories(payload.portfolioCategories);
      setDataLoaded(true);
    });
  }, [isAdmin, isSaving]); 

  // Listener de Citas (Público)
  useEffect(() => {
    if (!firebaseEnabled) return;
    const appsRef = collection(db, 'shops', SHOP_ID, 'appointments');
    const q = query(appsRef, orderBy('createdAtTS', 'desc'));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => {
        const { createdAtTS, ...rest } = d.data();
        return { id: d.id, ...rest };
      });
      setAppointments(list);
    });
  }, []);

  // --- GUARDADO MANUAL ---
  const handleManualSave = async () => {
      if (!firebaseEnabled || !isAdmin) return;
      setIsSaving(true);
      try {
        const payload = { config, staffData, servicesData, reviewsData, portfolioData, productsData, portfolioCategories };
        await setDoc(doc(db, 'shops', SHOP_ID), payload, { merge: true });
        await new Promise(r => setTimeout(r, 500));
        alert("✅ Cambios guardados en la nube");
      } catch (error) {
          console.error(error);
          alert("❌ Error al guardar. Verifica tu conexión.");
      } finally {
          setIsSaving(false);
      }
  };

  // --- FUNCIÓN DE RESETEO (SOLUCIÓN AL PROBLEMA DE PANTALLA BLANCA) ---
  const handleFactoryReset = async () => {
      if (!confirm("⚠️ ¿ESTÁS SEGURO?\n\nEsto borrará TODA la configuración actual (staff, servicios, productos) y restaurará los valores de fábrica. Úsalo si la app está fallando.\n\nNo borrará las citas.")) return;
      
      setIsSaving(true);
      try {
          // Forzar escritura de los valores INITIAL_...
          const payload = {
            config: INITIAL_CONFIG,
            staffData: INITIAL_STAFF,
            servicesData: INITIAL_SERVICES,
            reviewsData: INITIAL_REVIEWS,
            portfolioData: INITIAL_PORTFOLIO,
            productsData: INITIAL_PRODUCTS,
            portfolioCategories: INITIAL_PORTFOLIO_CATS
          };
          
          if (firebaseEnabled) {
              await setDoc(doc(db, 'shops', SHOP_ID), payload); // Sobrescribir (sin merge)
          } else {
              localStorage.clear();
          }
          
          alert("♻️ Base de datos restaurada. La página se recargará.");
          window.location.reload();
      } catch (e) {
          alert("Error al restaurar: " + e.message);
          setIsSaving(false);
      }
  };

  const getColorClass = (type) => {
    const safeColor = config?.primaryColor || 'blue';
    const colors = {
      blue: { bg: 'bg-blue-600', text: 'text-blue-600', hover: 'hover:bg-blue-700', light: 'bg-blue-50', border: 'border-blue-600', ring: 'focus:ring-blue-500', shadow: 'shadow-blue-500/20', bar: 'bg-blue-500' },
      indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', hover: 'hover:bg-indigo-700', light: 'bg-indigo-50', border: 'border-indigo-600', ring: 'focus:ring-indigo-500', shadow: 'shadow-indigo-500/20', bar: 'bg-indigo-500' },
      purple: { bg: 'bg-purple-600', text: 'text-purple-600', hover: 'hover:bg-purple-700', light: 'bg-purple-50', border: 'border-purple-600', ring: 'focus:ring-purple-500', shadow: 'shadow-purple-500/20', bar: 'bg-purple-500' },
      rose: { bg: 'bg-rose-600', text: 'text-rose-600', hover: 'hover:bg-rose-700', light: 'bg-rose-50', border: 'border-rose-600', ring: 'focus:ring-rose-500', shadow: 'shadow-rose-500/20', bar: 'bg-rose-500' },
      slate: { bg: 'bg-slate-800', text: 'text-slate-800', hover: 'hover:bg-slate-900', light: 'bg-slate-100', border: 'border-slate-800', ring: 'focus:ring-slate-500', shadow: 'shadow-slate-500/20', bar: 'bg-slate-700' },
    };
    return colors[safeColor] || colors['blue'];
  };

  const activeAppointments = useMemo(() => appointments.filter(a => a.status !== 'Cancelado'), [appointments]);

  const dashboardStats = useMemo(() => {
    try {
        const today = new Date();
        const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const todayStr = today.toISOString().split('T')[0];
        
        const totalRevenue = activeAppointments.reduce((sum, app) => sum + (app.price || 0), 0);
        const todayRevenue = activeAppointments.filter(app => app.date === todayStr).reduce((sum, app) => sum + (app.price || 0), 0);
        const weeklyRevenue = activeAppointments.filter(app => { const appDate = new Date(app.date); return appDate >= startOfWeek && appDate <= today; }).reduce((sum, app) => sum + (app.price || 0), 0);
        const monthlyRevenue = activeAppointments.filter(app => { const appDate = new Date(app.date); return appDate >= startOfMonth && appDate <= today; }).reduce((sum, app) => sum + (app.price || 0), 0);
        const dailyAppointments = activeAppointments.filter(app => app.date === todayStr).length;

        const staffPerformance = staffData.map(staff => {
            const staffApps = activeAppointments.filter(a => a.staffId === staff.id);
            return { ...staff, count: staffApps.length, revenue: staffApps.reduce((sum, a) => sum + (a.price || 0), 0) };
        }).sort((a, b) => b.count - a.count);

        const salesComparison = [
            { label: 'Mes Anterior', value: monthlyRevenue * 0.85, color: 'bg-slate-300' },
            { label: 'Mes Actual', value: monthlyRevenue, color: getColorClass('bar') },
            { label: 'Mejor Mes', value: Math.max(monthlyRevenue * 1.2, 50000), color: 'bg-emerald-500' }
        ];

        const serviceCounts = {};
        activeAppointments.forEach(app => { if(app.serviceTitle) serviceCounts[app.serviceTitle] = (serviceCounts[app.serviceTitle] || 0) + 1; });
        const topServices = Object.entries(serviceCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
        
        const hoursMap = {};
        activeAppointments.forEach(app => { const hour = app.time ? app.time.split(':')[0] : '09'; hoursMap[hour] = (hoursMap[hour] || 0) + 1; });
        const busyHours = Object.entries(hoursMap).map(([hour, count]) => ({ hour: `${hour}:00`, count })).sort((a, b) => b.hour.localeCompare(a.hour));

        const futureApps = activeAppointments.filter(app => app.date && app.time && new Date(app.date + 'T' + app.time) > new Date()).sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
        
        return { totalRevenue, todayRevenue, weeklyRevenue, monthlyRevenue, totalAppointments: activeAppointments.length, dailyAppointments, staffPerformance, salesComparison, topServices, busyHours, nextApp: futureApps[0] || null };
    } catch (e) {
        console.error("Stats Error:", e);
        return { totalRevenue:0, todayRevenue:0, weeklyRevenue:0, monthlyRevenue:0, totalAppointments:0, dailyAppointments:0, staffPerformance:[], salesComparison:[], topServices:[], busyHours:[], nextApp:null };
    }
  }, [activeAppointments, staffData, config.primaryColor]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loginMode === 'staff') {
        const staffMember = staffData.find(s => s.name.toLowerCase() === loginData.email.toLowerCase() || s.name === loginData.email);
        if (staffMember) {
            setCurrentStaffUser(staffMember);
            setView('staff-view');
            setLoginError('');
        } else {
            setLoginError('Profesional no encontrado. Ingresa tu nombre exacto.');
        }
        return;
    }
    if (!firebaseEnabled) {
      if (loginData.email === 'admin@sistema.com' && loginData.password === 'admin123') { setView('dashboard'); setLoginError(''); } 
      else { setLoginError('Credenciales incorrectas'); }
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
      setLoginError('');
      setView('dashboard');
    } catch (err) { setLoginError('Credenciales incorrectas'); }
  };

  const handleLogout = async () => {
    try { if (firebaseEnabled && view === 'dashboard') await signOut(auth); } finally { setView('landing'); setCurrentStaffUser(null); }
  };

  const isSlotAvailable = (staffId, date, time) => {
      return !appointments.some(app => app.staffId === staffId && app.date === date && app.time === time && app.status !== 'Cancelado');
  };

  const getStaffSlots = (staff, dateObj) => {
      if (!staff || !dateObj) return [];
      
      const schedule = (staff.schedule && staff.schedule.start) ? staff.schedule : DEFAULT_SCHEDULE;

      if (!schedule.days || !schedule.days.includes(dateObj.dayOfWeek)) return [];
      if (!schedule.start || !schedule.end) return [];

      try {
          const slots = [];
          let [startH, startM] = schedule.start.split(':').map(Number);
          const [endH, endM] = schedule.end.split(':').map(Number);
          
          const current = new Date(); current.setHours(startH, startM, 0, 0);
          const end = new Date(); end.setHours(endH, endM, 0, 0);

          while(current < end) {
              const h = current.getHours();
              const m = current.getMinutes();
              const timeString = `${h < 10 ? '0'+h : h}:${m < 10 ? '0'+m : m}`;
              slots.push(timeString);
              current.setMinutes(current.getMinutes() + 30);
          }
          return slots;
      } catch (e) {
          console.error("Slots Error", e);
          return [];
      }
  };

  const openBooking = (service) => { setSelectedService(service); setStep(1); setSelectedStaff(null); setSelectedDate(null); setSelectedTime(null); setPaymentMethod(null); setBookingModalOpen(true); };

  const handleBookingSubmit = async () => {
    let finalPrice = selectedService.price;
    if (paymentMethod === 'mp') finalPrice = selectedService.price * 0.95;
    const newAppointment = {
      serviceId: selectedService.id,
      serviceTitle: selectedService.title,
      staffId: selectedStaff.id,
      staffName: selectedStaff.name,
      price: finalPrice,
      originalPrice: selectedService.price,
      date: selectedDate,
      time: selectedTime,
      clientName: clientData.name,
      clientPhone: clientData.phone,
      paymentMethod,
      status: 'Confirmado',
      createdAt: new Date().toISOString(),
    };
    try {
      if (firebaseEnabled) {
        await addDoc(collection(db, 'shops', SHOP_ID, 'appointments'), { ...newAppointment, createdAtTS: serverTimestamp() });
      } else {
        setAppointments((prev) => [...prev, { id: Date.now(), ...newAppointment }]);
      }
    } catch (err) {
      setAppointments((prev) => [...prev, { id: Date.now(), ...newAppointment }]);
    }
    setStep(5);
  };

  const updateAppointmentStatus = async (appId, newStatus) => {
    if(firebaseEnabled) {
        const appRef = doc(db, 'shops', SHOP_ID, 'appointments', appId);
        await updateDoc(appRef, { status: newStatus });
    } else {
        setAppointments(prev => prev.map(a => a.id === appId ? {...a, status: newStatus} : a));
    }
  };

  const handleWhatsAppConfirm = () => {
    const message = `Hola! Soy ${clientData.name}. Quiero confirmar mi turno para ${selectedService.title} con ${selectedStaff.name} el día ${selectedDate} a las ${selectedTime}. Precio: $${paymentMethod === 'mp' ? selectedService.price * 0.95 : selectedService.price}.`;
    const whatsappUrl = `https://wa.me/${config.socialWhatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleWhatsAppOrder = (product) => {
      let message = `Hola! Quisiera comprar: ${product.product}.`;
      if (dashboardStats.nextApp) { message += ` Lo retiro en mi cita del ${dashboardStats.nextApp.date} a las ${dashboardStats.nextApp.time}.`; } 
      else { message += ` ¿Tienen stock?`; }
      const whatsappUrl = `https://wa.me/${config.socialWhatsapp}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
  }

  const handleUpdateConfig = (newSettings) => { setConfig({...config, ...newSettings}); }
  const handleAddStaff = () => { setStaffData([...staffData, { id: Date.now(), name: "Nuevo Personal", role: "Estilista", image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200", schedule: DEFAULT_SCHEDULE }]); }
  const handleUpdateStaff = (id, field, value) => { setStaffData(staffData.map(s => s.id === id ? { ...s, [field]: value } : s)); }
  const handleAddService = () => { setServicesData([...servicesData, { id: Date.now(), title: "Nuevo Servicio", category: ["General"], price: 0, duration: 30, image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=200", description: "Descripción del servicio" }]); }
  const handleDeleteService = (id) => { setServicesData(servicesData.filter(s => s.id !== id)); }
  const handleUpdateService = (id, field, value) => { setServicesData(servicesData.map(s => s.id === id ? { ...s, [field]: value } : s)); }
  const handleAddReview = () => { setReviewsData([{ id: Date.now(), user: "Cliente Nuevo", rating: 5, comment: "Comentario...", image: "" }, ...reviewsData]); }
  const handleDeleteReview = (id) => { setReviewsData(reviewsData.filter(r => r.id !== id)); }
  const handleUpdateReview = (id, field, value) => { setReviewsData(reviewsData.map(r => r.id === id ? { ...r, [field]: value } : r)); }
  const handleAddPortfolio = () => { setPortfolioData([{ id: Date.now(), image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=800", category: portfolioCategories[0], title: "Nuevo Trabajo" }, ...portfolioData]); }
  const handleDeletePortfolio = (id) => { setPortfolioData(portfolioData.filter(p => p.id !== id)); }
  const handleUpdatePortfolio = (id, field, value) => { setPortfolioData(portfolioData.map(p => p.id === id ? { ...p, [field]: value } : p)); }
  const handleAddCategory = () => { if(newCatName && !portfolioCategories.includes(newCatName)) { setPortfolioCategories([...portfolioCategories, newCatName]); setNewCatName(""); } }
  const handleDeleteCategory = (cat) => { setPortfolioCategories(portfolioCategories.filter(c => c !== cat)); }
  const handleAddProduct = () => { const newProduct = { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), product: "Nuevo Producto", price: 0, stock: 0, unit: "unidades", image: "https://images.unsplash.com/photo-1599351431202-6e0000a94376?q=80&w=500" }; setProductsData(prev => [newProduct, ...prev]); }
  const handleDeleteProduct = (id) => { setProductsData(prev => prev.filter(p => p.id !== id)); }
  const handleUpdateProduct = (id, field, value) => { setProductsData(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p)); }

  const filteredServices = activeCategory === "Todos" ? servicesData : servicesData.filter(service => service.category.includes(activeCategory));
  const weekDays = getNextDays();

  // LOGIN VIEW
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-2 ${getColorClass('bg')}`}></div>
          <div className="text-center mb-8">
            <div className={`w-16 h-16 ${getColorClass('bg')} rounded-xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg`}><Lock size={32} /></div>
            <h2 className="text-2xl font-bold text-slate-800">Acceso al Sistema</h2><p className="text-slate-500 text-sm">Selecciona tu rol para continuar</p>
          </div>
          <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
              <button onClick={() => setLoginMode('admin')} className={`flex-1 py-2 text-sm font-bold rounded-md transition ${loginMode === 'admin' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Dueño</button>
              <button onClick={() => setLoginMode('staff')} className={`flex-1 py-2 text-sm font-bold rounded-md transition ${loginMode === 'staff' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Profesional</button>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {loginMode === 'admin' ? (
                <>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Email</label><input type="email" value={loginData.email} onChange={(e) => setLoginData({...loginData, email: e.target.value})} className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 ${getColorClass('ring')}`} placeholder="admin@sistema.com" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Contraseña</label><input type="password" value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 ${getColorClass('ring')}`} placeholder="••••••••" /></div>
                </>
            ) : (
                <div><label className="block text-sm font-bold text-slate-700 mb-1">Nombre Completo</label><input type="text" value={loginData.email} onChange={(e) => setLoginData({...loginData, email: e.target.value})} className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 ${getColorClass('ring')}`} placeholder="Ej: Juan Pérez" /></div>
            )}
            {loginError && <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-3 rounded-lg flex items-center justify-center gap-2"><AlertTriangle size={14}/> {loginError}</p>}
            <button type="submit" className={`w-full ${getColorClass('bg')} text-white py-3 rounded-lg font-bold hover:opacity-90 transition shadow-lg`}>Ingresar</button>
            <button type="button" onClick={() => setView('landing')} className="w-full text-slate-500 text-sm font-medium py-2 hover:text-slate-800 transition">← Volver a la web</button>
          </form>
        </div>
      </div>
    );
  }

  // STAFF VIEW
  if (view === 'staff-view' && currentStaffUser) {
      const todayStr = new Date().toISOString().split('T')[0];
      const myAppointments = appointments.filter(a => a.staffId === currentStaffUser.id && a.date === todayStr && a.status !== 'Cancelado').sort((a,b) => a.time.localeCompare(b.time));
      return (
        <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <img src={currentStaffUser.image} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100"/>
                        <div><h2 className="text-xl font-bold text-slate-800">Hola, {currentStaffUser.name.split(' ')[0]}</h2><p className="text-sm text-slate-500">Tu agenda de hoy: {todayStr}</p></div>
                    </div>
                    <button onClick={handleLogout} className="text-red-400 hover:bg-red-50 p-2 rounded-lg"><LogOut size={20}/></button>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 bg-slate-100 border-b border-slate-200 font-bold text-slate-700 flex justify-between"><span>Citas ({myAppointments.length})</span><span className="text-xs font-normal bg-white px-2 py-1 rounded border">Vista Profesional</span></div>
                    {myAppointments.length === 0 ? (<div className="p-8 text-center text-slate-400">No tienes citas programadas para hoy.</div>) : (
                        <div className="divide-y divide-slate-100">{myAppointments.map(app => (
                                <div key={app.id} className="p-4 flex gap-4 items-start">
                                    <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg font-bold text-lg min-w-[80px] text-center">{app.time}</div>
                                    <div className="flex-1"><h4 className="font-bold text-slate-800">{app.serviceTitle}</h4><p className="text-sm text-slate-500">{app.clientName} • {app.clientPhone}</p>
                                        <div className="mt-2 flex gap-2">
                                            {app.status !== 'Completado' && <button onClick={() => updateAppointmentStatus(app.id, 'Completado')} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold hover:bg-green-200">Marcar Asistió</button>}
                                            <button onClick={() => updateAppointmentStatus(app.id, 'Cancelado')} className="text-xs bg-red-50 text-red-500 px-3 py-1 rounded-full font-bold hover:bg-red-100">Cancelar</button>
                                        </div>
                                    </div><div className="font-bold text-slate-400">$ {app.price}</div>
                                </div>
                            ))}</div>
                    )}
                </div>
            </div>
        </div>
      );
  }

  // ADMIN DASHBOARD
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
        <div className="w-20 md:w-64 bg-slate-900 text-white flex flex-col shrink-0 transition-all duration-300">
          <div className="p-4 md:p-6 flex items-center gap-3 border-b border-slate-800 h-20">
            {config.logoUrl ? (<img src={config.logoUrl} alt="Logo" className="w-8 h-8 object-contain bg-white rounded-md"/>) : (<div className={`${getColorClass('bg')} p-2 rounded-lg shrink-0 text-white shadow-lg shadow-black/20`}><Scissors size={20}/></div>)}
            <span className="font-bold text-lg hidden md:block truncate">{config.businessName}</span>
          </div>
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-2 hidden md:block">Gestión</p>
            <button onClick={() => setDashboardView('overview')} className={`w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-sm font-medium transition-all ${dashboardView === 'overview' ? `${getColorClass('bg')} text-white shadow-lg` : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard size={20} /> <span className="hidden md:block">Inicio</span></button>
            <button onClick={() => setDashboardView('clients')} className={`w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-sm font-medium transition-all ${dashboardView === 'clients' ? `${getColorClass('bg')} text-white shadow-lg` : 'text-slate-400 hover:bg-slate-800'}`}><Users size={20} /> <span className="hidden md:block">Clientes</span></button>
            <button onClick={() => setDashboardView('store')} className={`w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-sm font-medium transition-all ${dashboardView === 'store' ? `${getColorClass('bg')} text-white shadow-lg` : 'text-slate-400 hover:bg-slate-800'}`}><ShoppingBag size={20} /> <span className="hidden md:block">Tienda</span></button>
            <button onClick={() => setDashboardView('portfolio')} className={`w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-sm font-medium transition-all ${dashboardView === 'portfolio' ? `${getColorClass('bg')} text-white shadow-lg` : 'text-slate-400 hover:bg-slate-800'}`}><Camera size={20} /> <span className="hidden md:block">Portafolio</span></button>
             <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-2 mt-6 hidden md:block">Sistema</p>
             <button onClick={() => setDashboardView('settings')} className={`w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-sm font-medium transition-all ${dashboardView === 'settings' ? `${getColorClass('bg')} text-white shadow-lg` : 'text-slate-400 hover:bg-slate-800'}`}><Settings size={20} /> <span className="hidden md:block">Configuración</span></button>
          </nav>
          <div className="p-4 border-t border-slate-800"><button onClick={handleLogout} className="w-full flex items-center gap-3 text-sm text-red-400 hover:text-red-300 transition p-2 rounded-lg hover:bg-slate-800/50"><LogOut size={18} /> <span className="hidden md:block">Cerrar Sesión</span></button></div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
               <h2 className="text-2xl font-bold text-slate-800">
                {dashboardView === 'overview' && 'Panel de Control'}
                {dashboardView === 'clients' && 'Base de Clientes'}
                {dashboardView === 'store' && 'Gestión de Tienda & Stock'}
                {dashboardView === 'settings' && 'Personalización'}
                {dashboardView === 'portfolio' && 'Gestión de Portafolio'}
              </h2>
              <p className="text-sm text-slate-500">Bienvenido al sistema de administración.</p>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={handleManualSave} disabled={isSaving} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition shadow-md ${isSaving ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                 <SaveIcon size={18} className={isSaving ? 'animate-spin' : ''} />{isSaving ? 'Guardando...' : 'Guardar Cambios'}
               </button>
               {!dataLoaded && firebaseEnabled ? (<div className="text-orange-500 text-xs font-bold animate-pulse">Sincronizando...</div>) : (<div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-emerald-200"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online</div>)}
               <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm"><UserIcon className="text-slate-500" size={20}/></div>
            </div>
          </header>

          {/* DASHBOARD CONTENT */}
          {dashboardView === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><p className="text-slate-500 text-xs font-bold uppercase mb-2">Caja Diaria</p><h3 className="text-2xl font-bold text-slate-900">$ {dashboardStats.todayRevenue.toLocaleString()}</h3></div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><p className="text-slate-500 text-xs font-bold uppercase mb-2">Caja Semanal</p><h3 className={`text-2xl font-bold ${getColorClass('text')}`}>$ {dashboardStats.weeklyRevenue.toLocaleString()}</h3></div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><p className="text-slate-500 text-xs font-bold uppercase mb-2">Caja Mensual</p><h3 className={`text-2xl font-bold text-slate-900`}>$ {dashboardStats.monthlyRevenue.toLocaleString()}</h3></div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><p className="text-slate-500 text-xs font-bold uppercase mb-2">Citas Hoy</p><h3 className={`text-2xl font-bold ${getColorClass('text')}`}>{dashboardStats.dailyAppointments}</h3></div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Calendar size={18} className="text-blue-500"/> Agenda del Día ({new Date().toLocaleDateString()})</h3>
                  <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Hora</th><th className="p-3">Cliente</th><th className="p-3">Servicio</th><th className="p-3">Staff</th><th className="p-3">Estado</th><th className="p-3">Acciones</th></tr></thead>
                          <tbody className="divide-y divide-slate-100">
                            {appointments.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status !== 'Cancelado').sort((a,b) => a.time.localeCompare(b.time)).map(app => (
                                <tr key={app.id}>
                                    <td className="p-3 font-bold text-slate-700">{app.time}</td>
                                    <td className="p-3">{app.clientName}</td>
                                    <td className="p-3 text-slate-500">{app.serviceTitle}</td>
                                    <td className="p-3 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden"><img src={staffData.find(s=>s.id === app.staffId)?.image} className="w-full h-full object-cover"/></div>{app.staffName}</td>
                                    <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${app.status === 'Confirmado' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{app.status}</span></td>
                                    <td className="p-3 flex gap-2">
                                        <button onClick={() => updateAppointmentStatus(app.id, 'Completado')} title="Confirmar Asistencia" className="p-1 text-green-600 hover:bg-green-50 rounded"><CheckSquare size={18}/></button>
                                        <button onClick={() => updateAppointmentStatus(app.id, 'Cancelado')} title="Cancelar Cita" className="p-1 text-red-600 hover:bg-red-50 rounded"><XCircle size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                            {appointments.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status !== 'Cancelado').length === 0 && (<tr><td colSpan="6" className="p-6 text-center text-slate-400">No hay más citas activas para hoy.</td></tr>)}
                          </tbody></table></div>
              </div>
            </div>
          )}

          {dashboardView === 'store' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-slate-800">Productos en Venta & Stock</h3><button onClick={handleAddProduct} className={`text-sm ${getColorClass('text')} font-bold flex items-center gap-2 px-4 py-2 rounded-lg border border-current hover:bg-slate-50`}><PlusCircle size={16}/> Nuevo Producto</button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {productsData.map(item => (
                            <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden flex flex-col bg-white">
                                <div className="h-40 relative group">
                                    <img src={item.image} alt={item.product} className="w-full h-full object-cover"/>
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><div className="bg-white p-2 rounded-lg shadow-sm w-3/4 space-y-2"><input type="text" value={item.image} onChange={(e) => handleUpdateProduct(item.id, 'image', e.target.value)} className="w-full text-xs p-1 border rounded outline-none" placeholder="URL Imagen"/></div></div>
                                </div>
                                <div className="p-4 space-y-3 flex-1">
                                    <div><label className="text-[10px] uppercase font-bold text-slate-400">Producto</label><input type="text" value={item.product} onChange={(e) => handleUpdateProduct(item.id, 'product', e.target.value)} className="w-full font-bold text-slate-800 border-b border-transparent focus:border-slate-300 outline-none"/></div>
                                    <div className="flex gap-2"><div className="flex-1"><label className="text-[10px] uppercase font-bold text-slate-400">Precio</label><div className="flex items-center"><span className="text-sm font-bold text-slate-500 mr-1">$</span><input type="number" value={item.price} onChange={(e) => handleUpdateProduct(item.id, 'price', parseInt(e.target.value))} className="w-full font-medium text-slate-800 border rounded px-1"/></div></div>
                                    <div className="flex-1"><label className="text-[10px] uppercase font-bold text-slate-400">Stock</label><div className="flex items-center"><input type="number" value={item.stock} onChange={(e) => handleUpdateProduct(item.id, 'stock', parseInt(e.target.value))} className={`w-full font-medium border rounded px-1 ${item.stock < 5 ? 'text-red-500 border-red-200' : 'text-slate-800'}`}/></div></div></div>
                                </div>
                                <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{item.stock > 0 ? 'Disponible' : 'Agotado'}</span><button onClick={(e) => { e.preventDefault(); handleDeleteProduct(item.id); }} className="text-slate-400 hover:text-red-500 p-2 transition"><Trash2 size={18}/></button></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          )}

          {dashboardView === 'portfolio' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <h4 className="font-bold text-slate-800 mb-2 text-sm">Gestionar Categorías</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {portfolioCategories.map(cat => (<span key={cat} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium flex items-center gap-1">{cat}<button onClick={() => handleDeleteCategory(cat)} className="text-slate-400 hover:text-red-500"><X size={12}/></button></span>))}
                        </div>
                        <div className="flex gap-2"><input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Nueva categoría" className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none"/><button onClick={handleAddCategory} className={`px-3 py-1.5 ${getColorClass('bg')} text-white rounded-lg text-xs font-bold`}>Crear</button></div>
                    </div>
                    <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-slate-800">Galería</h3><button onClick={handleAddPortfolio} className={`text-sm ${getColorClass('text')} font-bold flex items-center gap-2 px-4 py-2 rounded-lg border border-current hover:bg-slate-50`}><PlusCircle size={16}/> Agregar Foto</button></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {portfolioData.map(item => (
                            <div key={item.id} className="group relative rounded-xl overflow-hidden aspect-square border border-slate-200">
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover"/>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-3">
                                    <button onClick={() => handleDeletePortfolio(item.id)} className="self-end text-white hover:text-red-400"><Trash2 size={18}/></button>
                                    <div className="space-y-2"><input type="text" value={item.title} onChange={(e) => handleUpdatePortfolio(item.id, 'title', e.target.value)} className="w-full bg-transparent border-b border-white/50 text-white text-xs font-bold outline-none" placeholder="Título"/><input type="text" value={item.image} onChange={(e) => handleUpdatePortfolio(item.id, 'image', e.target.value)} className="w-full bg-transparent border-b border-white/50 text-white text-[10px] outline-none" placeholder="URL Imagen"/></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          )}

          {dashboardView === 'settings' && (
            <div className="max-w-4xl animate-in fade-in duration-300 space-y-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-4 mb-4">Identidad y Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Negocio</label><input type="text" value={config.businessName} onChange={(e) => handleUpdateConfig({businessName: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-slate-400 font-medium text-slate-900" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Logo URL</label><div className="flex gap-2"><input type="text" value={config.logoUrl} onChange={(e) => handleUpdateConfig({logoUrl: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-slate-400 font-medium text-slate-900" placeholder="https://..." /><div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 overflow-hidden">{config.logoUrl ? <img src={config.logoUrl} className="w-full h-full object-cover"/> : <ImageIcon className="text-slate-400"/>}</div></div></div>
                </div>
                <div className="pt-4"><label className="block text-sm font-bold text-slate-700 mb-3">Color de Marca</label><div className="flex flex-wrap gap-4">{[{ id: 'blue', color: 'bg-blue-600' }, { id: 'indigo', color: 'bg-indigo-600' }, { id: 'purple', color: 'bg-purple-600' }, { id: 'rose', color: 'bg-rose-600' }, { id: 'slate', color: 'bg-slate-800' }].map(theme => (<button key={theme.id} onClick={() => handleUpdateConfig({primaryColor: theme.id})} className={`w-12 h-12 rounded-full border-4 transition-all ${config.primaryColor === theme.id ? 'border-slate-800 scale-110 shadow-lg' : 'border-transparent'}`}><div className={`w-full h-full rounded-full ${theme.color}`}></div></button>))}</div></div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                <div className="flex justify-between items-center border-b pb-4 mb-4"><h3 className="text-lg font-bold text-slate-800">Profesionales</h3><button onClick={handleAddStaff} className={`text-sm ${getColorClass('text')} font-bold flex items-center gap-1`}><PlusCircle size={16}/> Agregar</button></div>
                <div className="grid gap-4">{staffData.map(staff => (
                    <div key={staff.id} className="flex flex-col gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="relative group w-16 h-16 shrink-0"><img src={staff.image} className="w-full h-full rounded-full object-cover"/><div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><Upload size={16} className="text-white"/></div></div>
                            <div className="flex-1 w-full space-y-2"><input type="text" value={staff.name} onChange={(e) => handleUpdateStaff(staff.id, 'name', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-slate-300 outline-none font-bold text-slate-800" placeholder="Nombre"/><input type="text" value={staff.role} onChange={(e) => handleUpdateStaff(staff.id, 'role', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-slate-300 outline-none text-sm text-slate-500" placeholder="Rol"/><input type="text" value={staff.image} onChange={(e) => handleUpdateStaff(staff.id, 'image', e.target.value)} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-400 outline-none focus:border-slate-400" placeholder="URL Foto de Perfil"/></div>
                            <button onClick={() => { setStaffData(staffData.filter(s => s.id !== staff.id)) }} className="text-slate-400 hover:text-red-500"><Trash2 size={18}/></button>
                        </div>
                        <div className="border-t border-slate-200 pt-2 flex flex-wrap gap-4 text-sm items-center">
                            <span className="font-bold text-slate-500 text-xs uppercase">Horario:</span>
                            <div className="flex items-center gap-1"><span className="text-xs">De</span><input type="time" value={staff.schedule?.start || "09:00"} onChange={(e) => handleUpdateStaff(staff.id, 'schedule', {...(staff.schedule||DEFAULT_SCHEDULE), start: e.target.value})} className="border rounded px-1 text-xs bg-white"/></div>
                            <div className="flex items-center gap-1"><span className="text-xs">A</span><input type="time" value={staff.schedule?.end || "18:00"} onChange={(e) => handleUpdateStaff(staff.id, 'schedule', {...(staff.schedule||DEFAULT_SCHEDULE), end: e.target.value})} className="border rounded px-1 text-xs bg-white"/></div>
                            <div className="flex gap-1">{[1,2,3,4,5,6,0].map(d => (<button key={d} onClick={() => { const days = staff.schedule?.days || []; handleUpdateStaff(staff.id, 'schedule', {...(staff.schedule||DEFAULT_SCHEDULE), days: days.includes(d) ? days.filter(day => day !== d) : [...days, d]}); }} className={`w-6 h-6 text-[10px] rounded flex items-center justify-center font-bold ${staff.schedule?.days?.includes(d) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>{['D','L','M','M','J','V','S'][d]}</button>))}</div>
                        </div>
                    </div>
                ))}</div>
              </div>

              {/* DANGER ZONE (RESET DATABASE) */}
              <div className="bg-red-50 p-8 rounded-2xl shadow-sm border border-red-100 space-y-4">
                  <h3 className="text-lg font-bold text-red-800 flex items-center gap-2"><AlertTriangle/> Zona de Peligro</h3>
                  <p className="text-sm text-red-600">Si la aplicación está fallando o se pone en blanco, usa este botón para restaurar la configuración original. No borrará las citas guardadas.</p>
                  <button onClick={handleFactoryReset} className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition w-full flex justify-center items-center gap-2 shadow-lg"><RefreshCw size={20}/> RESTAURAR BASE DE DATOS</button>
              </div>

            </div>
          )}

          {/* Reuse Clients View */}
          {dashboardView === 'clients' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-700">Base de Clientes</h3>
                  <button onClick={() => exportToCSV(clientsData, 'clientes_base_datos')} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition shadow-sm"><FileSpreadsheet size={16} /> Exportar Excel/CSV</button>
              </div>
              <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500 font-semibold"><tr><th className="p-4 pl-6">Cliente</th><th className="p-4">Nivel</th><th className="p-4">Visitas</th><th className="p-4">Total Gastado</th><th className="p-4">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{clientsData.map((client, idx) => (<tr key={idx} className="hover:bg-slate-50/50 transition"><td className="p-4 pl-6 font-bold text-slate-800">{client.name}<br/><span className="text-slate-400 text-xs font-normal">{client.phone}</span></td><td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${client.label === 'VIP' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{client.label}</span></td><td className="p-4">{client.visits}</td><td className="p-4 font-bold text-emerald-600">$ {client.spent.toLocaleString()}</td><td className="p-4"><button className="text-slate-400 hover:text-blue-600"><ChevronRight size={18}/></button></td></tr>))}</tbody></table>
            </div>
          )}

        </div>
      </div>
    );
  }

  // --- LANDING PAGE ---
  return (
    <div className={`font-sans text-slate-700 bg-slate-50/50 min-h-screen flex flex-col`}>
      <nav className={`fixed w-full z-40 transition-all duration-300 ${scrolled ? 'bg-white shadow-lg py-3' : 'bg-black/20 backdrop-blur-sm py-5'}`}>
        <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {config.logoUrl ? <img src={config.logoUrl} alt="Logo" className="w-10 h-10 object-contain bg-white rounded-lg shadow-sm"/> : <div className={`p-2 rounded-lg transition-colors ${scrolled ? `${getColorClass('bg')} text-white` : `bg-white ${getColorClass('text')}`}`}><Scissors size={22} strokeWidth={2.5} /></div>}
            <div className="flex flex-col"><span className={`text-xl font-bold leading-none tracking-tight ${scrolled ? 'text-slate-900' : 'text-white'}`}>{config.businessName}</span><span className={`text-[10px] uppercase font-bold tracking-widest ${scrolled ? getColorClass('text') : 'text-blue-200'}`}>Reserva Online</span></div>
          </div>
          <div className="hidden md:flex items-center gap-8"><a href="#" onClick={(e) => handleNavClick(e, 'top')} className={`text-sm font-semibold hover:opacity-80 transition ${scrolled ? 'text-slate-600' : 'text-white/90'}`}>Inicio</a><a href="#servicios" onClick={(e) => handleNavClick(e, 'servicios')} className={`text-sm font-semibold hover:opacity-80 transition ${scrolled ? 'text-slate-600' : 'text-white/90'}`}>Servicios</a><a href="#store" onClick={(e) => handleNavClick(e, 'store')} className={`text-sm font-semibold hover:opacity-80 transition ${scrolled ? 'text-slate-600' : 'text-white/90'}`}>Tienda</a><button onClick={() => setView('login')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition shadow-md hover:shadow-lg ${scrolled ? `${getColorClass('bg')} text-white` : 'bg-white text-slate-900'}`}><User size={16} /> Soy Staff</button></div>
          <button className={`md:hidden p-2 rounded-md ${scrolled ? 'text-slate-800' : 'text-white'}`} onClick={() => setIsMenuOpen(!isMenuOpen)}><Menu size={28} /></button>
        </div>
        {isMenuOpen && (<div className="md:hidden absolute top-full left-0 w-full bg-white shadow-xl border-t border-gray-100 flex flex-col p-4 animate-in slide-in-from-top-5 z-50"><a href="#" className="text-slate-600 font-semibold p-3 hover:bg-slate-50 rounded-lg">Inicio</a><button onClick={() => { setView('login'); setIsMenuOpen(false); }} className={`mt-2 ${getColorClass('bg')} text-white px-4 py-3 rounded-lg text-sm font-bold w-full shadow-lg`}>Acceso Staff</button></div>)}
      </nav>

      <header id="top" className="relative pt-40 pb-24 md:pt-52 md:pb-40 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0"><img src="https://i.postimg.cc/FzcxP9qW/782cafe1-5812-40e3-9862-2b27b89dd969.png" alt="Barber" className="w-full h-full object-cover opacity-90" /><div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/30 to-blue-900/3"></div></div>
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center md:text-left">
          <div className="max-w-3xl"><h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-[1.1]">Tu estilo, <br/><span className={config.primaryColor === 'blue' ? 'text-blue-400' : 'text-white'}>tu momento.</span></h1><p className="text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl font-light">La experiencia premium que mereces. Reserva tu cita con los mejores profesionales en segundos.</p><div className="flex flex-col sm:flex-row gap-4"><a href="#servicios" onClick={(e) => handleNavClick(e, 'servicios')} className={`${getColorClass('bg')} text-white px-8 py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-3 hover:scale-105 active:scale-95`}><Calendar size={20} /> Reservar Ahora</a></div></div>
        </div>
      </header>

      <section id="servicios" className="py-24 bg-slate-50/50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16"><h2 className="text-4xl font-extrabold text-slate-900 mb-4">Nuestros Servicios</h2><div className={`w-20 h-1.5 ${getColorClass('bg')} mx-auto rounded-full mb-6`}></div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service) => (
              <div key={service.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-slate-100 flex flex-col h-full">
                <div className="h-64 overflow-hidden relative"><img src={service.image} alt={service.title} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700 ease-out" /><div className={`absolute bottom-4 right-4 ${getColorClass('bg')} text-white px-4 py-2 rounded-xl font-bold shadow-lg`}>$ {service.price.toLocaleString('es-AR')}</div></div>
                <div className="p-8 flex-grow flex flex-col"><h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3><p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3">{service.description}</p><div className="mt-auto"><button onClick={() => openBooking(service)} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10">Reservar Turno <ChevronRight size={18} /></button></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50"><div><h3 className="font-bold text-lg text-slate-900">Reservar Turno</h3><p className="text-xs text-slate-500">Paso {step} de 5</p></div><button onClick={() => setBookingModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500"><X size={20} /></button></div>
            <div className="p-6 overflow-y-auto">
              {step === 1 && (<div className="animate-in slide-in-from-right duration-300"><h4 className="font-bold text-slate-800 mb-4">Elige un Profesional</h4><div className="grid gap-4">{staffData.map(staff => (<button key={staff.id} onClick={() => setSelectedStaff(staff)} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group ${selectedStaff?.id === staff.id ? `border-${config.primaryColor}-600 bg-${config.primaryColor}-50` : 'border-slate-100 hover:border-slate-300'}`}><img src={staff.image} alt={staff.name} className="w-14 h-14 rounded-full object-cover group-hover:scale-105 transition" /><div><p className="font-bold text-slate-900">{staff.name}</p><p className="text-xs text-slate-500 font-medium">{staff.role}</p></div>{selectedStaff?.id === staff.id && <div className={`ml-auto ${getColorClass('bg')} text-white p-1 rounded-full`}><CheckCircle size={16} /></div>}</button>))}</div></div>)}
              {step === 2 && (<div className="space-y-6 animate-in slide-in-from-right duration-300"><div><label className="block text-sm font-bold text-slate-700 mb-3">Día</label><div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">{weekDays.map((day, idx) => {
                  const hasSlots = getStaffSlots(selectedStaff, day).length > 0;
                  return (<button key={idx} disabled={!hasSlots} onClick={() => setSelectedDate(day.fullDate)} className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${selectedDate === day.fullDate ? `border-${config.primaryColor}-600 bg-${config.primaryColor}-50 text-${config.primaryColor}-700 shadow-md scale-105` : !hasSlots ? 'bg-slate-50 border-slate-50 opacity-50 cursor-not-allowed' : 'border-slate-100 text-slate-500 hover:border-slate-300'}`}><span className="text-xs font-bold uppercase">{day.dayName}</span><span className="text-2xl font-bold">{day.dayNumber}</span></button>);
              })}</div></div>{selectedDate && (<div className="animate-in fade-in slide-in-from-bottom-2 duration-300"><label className="block text-sm font-bold text-slate-700 mb-3">Horario con {selectedStaff.name.split(' ')[0]}</label><div className="grid grid-cols-4 gap-3">{getStaffSlots(selectedStaff, weekDays.find(d=>d.fullDate===selectedDate)).map((time) => {
                  const available = isSlotAvailable(selectedStaff.id, selectedDate, time);
                  return (<button key={time} disabled={!available} onClick={() => setSelectedTime(time)} className={`py-2 rounded-lg text-sm font-semibold transition-all ${selectedTime === time ? `${getColorClass('bg')} text-white shadow-md transform scale-105` : !available ? 'bg-red-50 text-red-300 cursor-not-allowed line-through' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{time}</button>);
              })}</div></div>)}</div>)}
              {step === 3 && (<div className="space-y-4 animate-in slide-in-from-right duration-300"><div className="space-y-3"><label className="font-bold text-slate-700">Nombre</label><input type="text" value={clientData.name} onChange={(e) => setClientData({...clientData, name: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-400 transition" placeholder="Ej: Juan Pérez"/></div><div className="space-y-3"><label className="font-bold text-slate-700">WhatsApp</label><input type="tel" value={clientData.phone} onChange={(e) => setClientData({...clientData, phone: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-400 transition" placeholder="Ej: 11 1234 5678"/></div></div>)}
              {step === 4 && (<div className="space-y-4 animate-in slide-in-from-right duration-300"><h4 className="font-bold text-slate-800 mb-2">Método de Pago</h4><button onClick={() => setPaymentMethod('mp')} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${paymentMethod === 'mp' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><CreditCard size={20}/></div><div className="text-left"><p className="font-bold text-slate-800">Mercado Pago / Tarjeta</p><p className="text-xs text-green-600 font-bold">¡Ahorras 5% pagando ahora!</p></div></div><div className="text-right"><p className="text-xs text-slate-400 line-through">${selectedService.price}</p><p className="font-bold text-blue-600">${selectedService.price * 0.95}</p></div></button><button onClick={() => setPaymentMethod('cash')} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}><div className="flex items-center gap-3"><div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600"><DollarSign size={20}/></div><div className="text-left"><p className="font-bold text-slate-800">Efectivo en el local</p><p className="text-xs text-slate-500">Pagas el total al asistir</p></div></div><p className="font-bold text-slate-700">${selectedService.price}</p></button></div>)}
              {step === 5 && (<div className="text-center py-8 animate-in zoom-in duration-300"><div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100"><CheckCircle size={48} /></div><h3 className="text-2xl font-bold text-slate-900 mb-2">¡Turno Confirmado!</h3><div className="bg-slate-50 p-6 rounded-2xl text-left space-y-3 mb-6 border border-slate-100 shadow-sm relative overflow-hidden"><div className={`absolute top-0 left-0 w-1 h-full ${getColorClass('bg')}`}></div><div className="flex justify-between items-center"><span className="text-slate-500 text-sm">Profesional</span><span className="font-bold text-slate-900 flex items-center gap-2">{selectedStaff.name}</span></div><div className="flex justify-between"><span className="text-slate-500 text-sm">Fecha</span><span className="font-bold text-slate-900">{selectedDate} - {selectedTime} hs</span></div><div className="flex justify-between border-t border-slate-200 pt-3 mt-2"><span className="font-bold text-slate-900">Total {paymentMethod === 'mp' ? '(con dcto.)' : ''}</span><span className={`font-bold ${getColorClass('text')}`}>$ {paymentMethod === 'mp' ? selectedService.price * 0.95 : selectedService.price}</span></div></div>
              <button onClick={handleWhatsAppConfirm} className="w-full bg-green-500 text-white py-3.5 rounded-xl font-bold hover:bg-green-600 transition shadow-lg flex items-center justify-center gap-2 mb-3"><MessageCircle size={20} /> Recibir confirmación en WhatsApp</button>
              <button onClick={() => setBookingModalOpen(false)} className="w-full bg-slate-200 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-300 transition">Cerrar</button></div>)}
            </div>
            {step < 5 && (<div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">{step > 1 && <button onClick={() => setStep(step - 1)} className="px-6 py-3.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-white transition">Atrás</button>}{step === 1 && <button disabled={!selectedStaff} onClick={() => setStep(2)} className={`flex-1 ${getColorClass('bg')} disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition flex justify-center items-center gap-2 shadow-lg`}>Siguiente <ChevronRight size={18}/></button>}{step === 2 && <button disabled={!selectedDate || !selectedTime} onClick={() => setStep(3)} className={`flex-1 ${getColorClass('bg')} disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition flex justify-center items-center gap-2 shadow-lg`}>Siguiente <ChevronRight size={18}/></button>}{step === 3 && <button disabled={!clientData.name || !clientData.phone} onClick={() => setStep(4)} className={`flex-1 ${getColorClass('bg')} disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition flex justify-center items-center gap-2 shadow-lg`}>Ir al Pago <ChevronRight size={18}/></button>}{step === 4 && <button disabled={!paymentMethod} onClick={handleBookingSubmit} className={`flex-1 ${getColorClass('bg')} disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition flex justify-center items-center gap-2 shadow-lg`}>Confirmar Reserva <CheckCircle size={18}/></button>}</div>)}
          </div>
        </div>
      )}

      <footer id="contacto" className="bg-slate-900 text-slate-400 py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-sm">
            <div><div className="flex items-center gap-2 text-white mb-4"><div className={`${getColorClass('bg')} p-1.5 rounded-lg`}><Scissors size={18}/></div><span className="font-bold text-lg">{config.businessName}</span></div><p>Solución integral para gestión de citas.</p></div>
            <div><h4 className="text-white font-bold mb-4">Contacto</h4><ul className="space-y-2"><li className="flex items-center gap-2"><MapPin size={16}/> Salta, Argentina</li><li className="flex items-center gap-2"><Mail size={16}/> contacto@sistema.com</li></ul></div>
            <div>
                <h4 className="text-white font-bold mb-4">Síguenos</h4>
                <div className="flex gap-3">
                    {config.socialInstagram && <a href={config.socialInstagram} target="_blank" rel="noreferrer" className="bg-slate-800 p-2 rounded-lg hover:bg-pink-600 hover:text-white transition"><Instagram size={18}/></a>}
                    {config.socialFacebook && <a href={config.socialFacebook} target="_blank" rel="noreferrer" className="bg-slate-800 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition"><Facebook size={18}/></a>}
                    {config.socialWhatsapp && <a href={`https://wa.me/${config.socialWhatsapp}`} target="_blank" rel="noreferrer" className="bg-slate-800 p-2 rounded-lg hover:bg-green-600 hover:text-white transition"><MessageCircle size={18}/></a>}
                </div>
            </div>
            <div><button onClick={() => setView('login')} className="bg-slate-800 text-white w-full py-3 rounded-lg font-bold border border-slate-700 hover:border-slate-500 transition">Acceso Admin / Staff</button></div>
          </div>
          <p className="text-center text-xs text-slate-600 border-t border-slate-800 pt-8">© 2024 Sistema de Turnos.</p>
        </div>
      </footer>
    </div>
  );
}

// WRAPPER FINAL CON ERROR BOUNDARY
export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
