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
  Activity, PieChart, BarChart2
} from 'lucide-react';
import { auth, db, firebaseEnabled } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  runTransaction,
  getDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';


/**
 * <!-- Chosen Palette: Slate (Neutrals) + Dynamic Primary Color -->
 * <!-- Updates:
 * - PORTFOLIO RESTRUCTURED: Changed from filter tabs to categorized sections.
 * Each category now displays as a large header followed by its specific image grid.
 * -->
 */

// --- DATOS INICIALES ---


// --- HORARIOS DE TRABAJO (POR PROFESIONAL) ---
// Estructura:
// schedule: { mon:{enabled,start,end}, tue:{...}, ... }  (horario en formato 'HH:MM')
const WEEK_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const WEEK_LABELS = { sun: 'Dom', mon: 'Lun', tue: 'Mar', wed: 'Mié', thu: 'Jue', fri: 'Vie', sat: 'Sáb' };

const makeDefaultSchedule = () => ({
  mon: { enabled: true, start: '09:00', end: '20:00' },
  tue: { enabled: true, start: '09:00', end: '20:00' },
  wed: { enabled: true, start: '09:00', end: '20:00' },
  thu: { enabled: true, start: '09:00', end: '20:00' },
  fri: { enabled: true, start: '09:00', end: '20:00' },
  sat: { enabled: true, start: '09:00', end: '20:00' },
  sun: { enabled: false, start: '09:00', end: '20:00' },
});

const ensureStaffSchedule = (staffObj) => {
  const base = staffObj || {};
  const schedule = base.schedule && typeof base.schedule === 'object' ? base.schedule : makeDefaultSchedule();
  // Normaliza keys y valores
  const normalized = { ...makeDefaultSchedule(), ...schedule };
  WEEK_KEYS.forEach((k) => {
    if (!normalized[k]) normalized[k] = makeDefaultSchedule()[k];
    if (typeof normalized[k].enabled !== 'boolean') normalized[k].enabled = !!normalized[k].enabled;
    if (!normalized[k].start) normalized[k].start = '09:00';
    if (!normalized[k].end) normalized[k].end = '20:00';
  });

  return { ...base, schedule: normalized };
};

const dateToWeekKey = (dateStr) => {
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    return WEEK_KEYS[d.getDay()];
  } catch {
    return 'mon';
  }
};

const timeToMinutes = (t) => {
  const [h, m] = (t || '00:00').split(':').map((x) => parseInt(x, 10));
  return (h * 60) + (m || 0);
};

const minutesToTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

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
  { id: 1, name: "Juan Pérez", role: "Master Barber", image: "https://images.unsplash.com/photo-1581803118522-7b72a50f7e9f?q=80&w=200&auto=format&fit=crop", pin: "1111", schedule: makeDefaultSchedule() },
  { id: 2, name: "Ana Gomez", role: "Estilista Senior", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop", pin: "2222", schedule: makeDefaultSchedule() },
  { id: 3, name: "Carlos Ruiz", role: "Barbero", image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200&auto=format&fit=crop", pin: "3333", schedule: makeDefaultSchedule() }
];


const INITIAL_PRODUCTS = [
  { id: 1, product: "Cera Mate Strong", price: 2500, stock: 15, unit: "unidades", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=500" },
  { id: 2, product: "Shampoo Premium 5L", price: 8000, stock: 2, unit: "bidones", image: "https://images.unsplash.com/photo-1556228720-1957be83f360?q=80&w=500" },
  { id: 3, product: "Navajas Pro", price: 1200, stock: 150, unit: "cajas", image: "https://images.unsplash.com/photo-1599351431202-6e0000a94376?q=80&w=500" },
  { id: 4, product: "Aceite para Barba", price: 3200, stock: 8, unit: "unidades", image: "https://images.unsplash.com/photo-1626898748301-49999a4c7f07?q=80&w=500" },
];

const INITIAL_REVIEWS = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  user: i % 2 === 0 ? `Cliente ${i + 1}` : `Usuario ${i + 1}`,
  rating: 5,
  comment: i % 2 === 0 
    ? "Excelente servicio, muy puntuales y el lugar impecable. Volveré sin duda."
    : "Me encantó el corte, exactamente lo que pedía. Muy recomendado el staff.",
  image: i === 0 ? "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=200" : "" 
}));

const INITIAL_SERVICES = [
  { id: 1, title: "Corte de cabello", category: ["Hombre", "Barbería"], price: 1500, duration: 45, image: "https://images.unsplash.com/photo-1599351431202-6e0000a94376?q=80&w=800&auto=format&fit=crop", description: "Cortes modernos y clásicos, degradados (fade), incluye lavado." },
  { id: 2, title: "Barbería Clásica", category: ["Barbería", "Hombre"], price: 1200, duration: 30, image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=800&auto=format&fit=crop", description: "Ritual de afeitado tradicional con toalla caliente." },
  { id: 3, title: "Perfilado de barba", category: ["Hombre", "Barbería"], price: 1400, duration: 30, image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop", description: "Diseño detallado de barba según la forma de tu rostro." },
  { id: 4, title: "Corte de Dama", category: ["Mujer", "Estilismo"], price: 1300, duration: 60, image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=800&auto=format&fit=crop", description: "Corte estilizado según tendencias." },
  { id: 6, title: "Alisado Keratina", category: ["Mujer", "Estilismo"], price: 4500, duration: 120, image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=800&auto=format&fit=crop", description: "Tratamiento alisante progresivo sin formol." },
  { id: 9, title: "Color y Tinte", category: ["Mujer", "Estilismo"], price: 3500, duration: 150, image: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&auto=format&fit=crop", description: "Renovación de color, balayage o mechas." },
  { id: 5, title: "Nail Art", category: ["Mujer", "Belleza"], price: 1300, duration: 90, image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800&auto=format&fit=crop", description: "Esculpidas y semipermanentes." },
  { id: 7, title: "Manicure Spa", category: ["Mujer", "Belleza"], price: 2000, duration: 60, image: "https://images.unsplash.com/photo-1610992015732-2449b76344bc?q=80&w=800&auto=format&fit=crop", description: "Limpieza profunda de cutículas y masajes." },
];

const INITIAL_PORTFOLIO_CATS = ["Cortes Hombre", "Barbería", "Cortes Dama", "Uñas", "Tintes", "Peinados"];

const INITIAL_PORTFOLIO = [
  { id: 1, image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=800", category: "Peinados", title: "Alisado Espejo" },
  { id: 2, image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=800", category: "Barbería", title: "Fade & Beard" },
  { id: 3, image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800", category: "Uñas", title: "Nail Art Verano" },
  { id: 4, image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800", category: "Barbería", title: "Perfilado Clásico" },
  { id: 5, image: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?q=80&w=800", category: "Cortes Dama", title: "Corte Bob" },
  { id: 6, image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=800", category: "Cortes Hombre", title: "Degradado Alto" },
];

const CATEGORIES = ["Todos", "Hombre", "Mujer", "Barbería", "Estilismo", "Belleza"];

const TIME_SLOTS = [];
for (let hour = 9; hour < 20; hour++) {
  TIME_SLOTS.push(`${hour < 10 ? '0' + hour : hour}:00`);
  TIME_SLOTS.push(`${hour < 10 ? '0' + hour : hour}:30`);
}
TIME_SLOTS.push("20:00");

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
      fullDate: d.toISOString().split('T')[0]
    });
  }
  return days;
};

// --- HELPER DE EXPORTACIÓN ---
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
export default function App() {
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [staffData, setStaffData] = useState(INITIAL_STAFF.map(ensureStaffSchedule));
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
  const [bookingError, setBookingError] = useState('');
  const [busySlots, setBusySlots] = useState(new Set());
  const [selectedStaffIdForAgenda, setSelectedStaffIdForAgenda] = useState('all');
  const [agendaDate, setAgendaDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expandedStaffId, setExpandedStaffId] = useState(null);
  const [staffLoginData, setStaffLoginData] = useState({ staffId: '', pin: '' });
  const [staffUser, setStaffUser] = useState(null);
  const [staffLoginError, setStaffLoginError] = useState('');
  const [staffAppointments, setStaffAppointments] = useState([]);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [newCatName, setNewCatName] = useState(""); 

  const reviewsRef = useRef(null);
  const SHOP_ID = 'default';

  const [fbUser, setFbUser] = useState(null);
  const isAdmin = !!fbUser;

  // Evita loop: snapshot -> setState -> save -> snapshot
  const lastRemoteRef = useRef('');
  const shopHydratedRef = useRef(false);
  const busyMigratedRef = useRef(false);

  useEffect(() => {
    if (!firebaseEnabled) return;
    return onAuthStateChanged(auth, (user) => setFbUser(user));
  }, []);


  // --- SCROLL SUAVE ---
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

  // ✅ FIX 1: Scroll listener SIEMPRE (con o sin Firebase)
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll(); // inicializa al cargar
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ FIX 2: Cargar localStorage SOLO si Firebase NO está activo
  useEffect(() => {
    if (firebaseEnabled) return;

    const savedApps = localStorage.getItem('appointments'); if (savedApps) setAppointments(JSON.parse(savedApps));
    const savedConfig = localStorage.getItem('appConfig'); if (savedConfig) setConfig(JSON.parse(savedConfig));
    const savedStaff = localStorage.getItem('appStaff'); if (savedStaff) setStaffData(JSON.parse(savedStaff));
    const savedServices = localStorage.getItem('appServices'); if (savedServices) setServicesData(JSON.parse(savedServices));
    const savedReviews = localStorage.getItem('appReviews'); if (savedReviews) setReviewsData(JSON.parse(savedReviews));
    const savedPortfolio = localStorage.getItem('appPortfolio'); if (savedPortfolio) setPortfolioData(JSON.parse(savedPortfolio));
    const savedProducts = localStorage.getItem('appProducts'); if (savedProducts) setProductsData(JSON.parse(savedProducts));
    const savedPortCats = localStorage.getItem('appPortfolioCats'); if (savedPortCats) setPortfolioCategories(JSON.parse(savedPortCats));
  }, []);

  useEffect(() => {
    if (!firebaseEnabled) return;

    const shopRef = doc(db, 'shops', SHOP_ID);

    return onSnapshot(shopRef, async (snap) => {
      shopHydratedRef.current = true;

      // Si no existe el doc aún, lo crea el admin automáticamente
      if (!snap.exists()) {
        if (isAdmin) {
          const payload = {
            config,
            staffData,
            servicesData,
            reviewsData,
            portfolioData,
            productsData,
            portfolioCategories,
          };
          await setDoc(shopRef, payload, { merge: true });
          lastRemoteRef.current = JSON.stringify(payload);
        }
        return;
      }

      const data = snap.data();

      const payload = {
        config: data.config ?? config,
        staffData: (data.staffData ? data.staffData.map(ensureStaffSchedule) : staffData.map(ensureStaffSchedule)),
        servicesData: data.servicesData ?? servicesData,
        reviewsData: data.reviewsData ?? reviewsData,
        portfolioData: data.portfolioData ?? portfolioData,
        productsData: data.productsData ?? productsData,
        portfolioCategories: data.portfolioCategories ?? portfolioCategories,
      };

      lastRemoteRef.current = JSON.stringify({
        config: payload.config,
        staffData: payload.staffData,
        servicesData: payload.servicesData,
        reviewsData: payload.reviewsData,
        portfolioData: payload.portfolioData,
        productsData: payload.productsData,
        portfolioCategories: payload.portfolioCategories,
      });

      setConfig(payload.config);
      setStaffData(payload.staffData);
      setServicesData(payload.servicesData);
      setReviewsData(payload.reviewsData);
      setPortfolioData(payload.portfolioData);
      setProductsData(payload.productsData);
      setPortfolioCategories(payload.portfolioCategories);
    });
  }, [isAdmin]);

  useEffect(() => {
    if (!firebaseEnabled || !isAdmin) return;

    // Evita sobrescribir el doc remoto con valores iniciales antes de hidratar desde Firestore
    if (!shopHydratedRef.current) return;

    const appsRef = collection(db, 'shops', SHOP_ID, 'appointments');
    const q = query(appsRef, orderBy('createdAtTS', 'desc'));

    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => {
        const { createdAtTS, ...rest } = d.data();
        return { id: d.id, ...rest };
      });
      setAppointments(list);

        // Migra/crea busy docs una sola vez (para bloquear horarios de citas existentes)
        if (!busyMigratedRef.current) {
          busyMigratedRef.current = true;
          syncBusyDocsFromAppointments(list).catch(() => {});
        }
    });
  }, [isAdmin]);


// Citas para profesionales (solo su agenda). Mantiene privacidad: se filtra localmente por staffId.
useEffect(() => {
  if (!firebaseEnabled || !staffUser) return;

  const appsRef = collection(db, 'shops', SHOP_ID, 'appointments');
  const q = query(appsRef, orderBy('createdAtTS', 'desc'));

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => {
      const { createdAtTS, ...rest } = d.data();
      return { id: d.id, ...rest };
    });
    setStaffAppointments(list);
  });
}, [staffUser?.id]);
  useEffect(() => {
    if (!firebaseEnabled || !isAdmin) return;

    // Evita sobrescribir el doc remoto con valores iniciales antes de hidratar desde Firestore
    if (!shopHydratedRef.current) return;

    const payload = {
      config,
      staffData,
      servicesData,
      reviewsData,
      portfolioData,
      productsData,
      portfolioCategories,
    };

    const next = JSON.stringify(payload);
    if (lastRemoteRef.current === next) return;

    const shopRef = doc(db, 'shops', SHOP_ID);

    const t = setTimeout(async () => {
      await setDoc(shopRef, payload, { merge: true });
      lastRemoteRef.current = next;
    }, 600);

    return () => clearTimeout(t);
  }, [isAdmin, config, staffData, servicesData, reviewsData, portfolioData, productsData, portfolioCategories]);


  // ✅ FIX 3: Guardar localStorage SOLO si Firebase NO está activo
  useEffect(() => { 
    if (firebaseEnabled) return;
    localStorage.setItem('appointments', JSON.stringify(appointments)); 
  }, [appointments]);

  useEffect(() => { 
    if (firebaseEnabled) return;
    localStorage.setItem('appConfig', JSON.stringify(config)); 
  }, [config]);

  useEffect(() => { 
    if (firebaseEnabled) return;
    localStorage.setItem('appStaff', JSON.stringify(staffData)); 
  }, [staffData]);

  useEffect(() => { 
    if (firebaseEnabled) return;
    localStorage.setItem('appServices', JSON.stringify(servicesData)); 
  }, [servicesData]);

  useEffect(() => { 
    if (firebaseEnabled) return;
    localStorage.setItem('appReviews', JSON.stringify(reviewsData)); 
  }, [reviewsData]);

  useEffect(() => { 
    if (firebaseEnabled) return;
    localStorage.setItem('appPortfolio', JSON.stringify(portfolioData)); 
  }, [portfolioData]);

  useEffect(() => { 
    if (firebaseEnabled) return;
    localStorage.setItem('appProducts', JSON.stringify(productsData)); 
  }, [productsData]);

  useEffect(() => { 
    if (firebaseEnabled) return;
    localStorage.setItem('appPortfolioCats', JSON.stringify(portfolioCategories)); 
  }, [portfolioCategories]);

  const getColorClass = (type) => {
    const colors = {
      blue: { bg: 'bg-blue-600', text: 'text-blue-600', hover: 'hover:bg-blue-700', light: 'bg-blue-50', border: 'border-blue-600', ring: 'focus:ring-blue-500', shadow: 'shadow-blue-500/20', bar: 'bg-blue-500' },
      indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', hover: 'hover:bg-indigo-700', light: 'bg-indigo-50', border: 'border-indigo-600', ring: 'focus:ring-indigo-500', shadow: 'shadow-indigo-500/20', bar: 'bg-indigo-500' },
      purple: { bg: 'bg-purple-600', text: 'text-purple-600', hover: 'hover:bg-purple-700', light: 'bg-purple-50', border: 'border-purple-600', ring: 'focus:ring-purple-500', shadow: 'shadow-purple-500/20', bar: 'bg-purple-500' },
      rose: { bg: 'bg-rose-600', text: 'text-rose-600', hover: 'hover:bg-rose-700', light: 'bg-rose-50', border: 'border-rose-600', ring: 'focus:ring-rose-500', shadow: 'shadow-rose-500/20', bar: 'bg-rose-500' },
      slate: { bg: 'bg-slate-800', text: 'text-slate-800', hover: 'hover:bg-slate-900', light: 'bg-slate-100', border: 'border-slate-800', ring: 'focus:ring-slate-500', shadow: 'shadow-slate-500/20', bar: 'bg-slate-700' },
    };
    return colors[config.primaryColor][type];
  };

  const clientsData = useMemo(() => {
    const clientsMap = {};
    const sortedAppointments = [...appointments].sort((a, b) => new Date(a.date) - new Date(b.date));
    sortedAppointments.forEach(app => {
      const phone = app.clientPhone;
      if (!clientsMap[phone]) clientsMap[phone] = { name: app.clientName, phone: app.clientPhone, visits: 0, spent: 0, firstVisit: app.date, lastVisit: app.date, label: 'Nuevo' };
      clientsMap[phone].visits += 1;
      clientsMap[phone].spent += app.price;
      clientsMap[phone].lastVisit = app.date;
    });
    return Object.values(clientsMap).map(client => {
      if (client.visits > 5) client.label = 'VIP'; else if (client.visits > 2) client.label = 'Frecuente';
      return client;
    });
  }, [appointments]);

  const dashboardStats = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const todayStr = today.toISOString().split('T')[0];
    
    const totalRevenue = appointments.reduce((sum, app) => sum + app.price, 0);
    const todayRevenue = appointments.filter(app => app.date === todayStr).reduce((sum, app) => sum + app.price, 0);
    const weeklyRevenue = appointments.filter(app => { const appDate = new Date(app.date); return appDate >= startOfWeek && appDate <= today; }).reduce((sum, app) => sum + app.price, 0);
    const monthlyRevenue = appointments.filter(app => { const appDate = new Date(app.date); return appDate >= startOfMonth && appDate <= today; }).reduce((sum, app) => sum + app.price, 0);
    const dailyAppointments = appointments.filter(app => app.date === todayStr).length;
    const weeklyAppointments = appointments.filter(app => { const appDate = new Date(app.date); return appDate >= startOfWeek && appDate <= today; }).length;
    const monthlyAppointments = appointments.filter(app => { const appDate = new Date(app.date); return appDate >= startOfMonth && appDate <= today; }).length;

    const staffDailyCounts = {};
    staffData.forEach(s => staffDailyCounts[s.name] = 0);
    appointments.filter(app => app.date === todayStr).forEach(app => { if (staffDailyCounts[app.staffName] !== undefined) staffDailyCounts[app.staffName]++; else staffDailyCounts[app.staffName] = 1; });
    const staffPerformance = staffData.map(staff => {
        const staffApps = appointments.filter(a => a.staffId === staff.id);
        const count = staffApps.length;
        const revenue = staffApps.reduce((sum, a) => sum + a.price, 0);
        return { ...staff, count, revenue };
    }).sort((a, b) => b.count - a.count);

    const salesComparison = [
        { label: 'Mes Anterior', value: monthlyRevenue * 0.85, color: 'bg-slate-300' },
        { label: 'Mes Actual', value: monthlyRevenue, color: getColorClass('bar') },
        { label: 'Mejor Mes', value: Math.max(monthlyRevenue * 1.2, 50000), color: 'bg-emerald-500' }
    ];

    const serviceCounts = {};
    appointments.forEach(app => { serviceCounts[app.serviceTitle] = (serviceCounts[app.serviceTitle] || 0) + 1; });
    const topServices = Object.entries(serviceCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    
    const hoursMap = {};
    appointments.forEach(app => { const hour = app.time ? app.time.split(':')[0] : '09'; hoursMap[hour] = (hoursMap[hour] || 0) + 1; });
    const busyHours = Object.entries(hoursMap).map(([hour, count]) => ({ hour: `${hour}:00`, count })).sort((a, b) => b.hour.localeCompare(a.hour));

    const futureApps = appointments.filter(app => new Date(app.date + 'T' + app.time) > new Date()).sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
    
    return { totalRevenue, todayRevenue, weeklyRevenue, monthlyRevenue, totalAppointments: appointments.length, dailyAppointments, weeklyAppointments, monthlyAppointments, staffDailyCounts, staffPerformance, salesComparison, topServices, busyHours, nextApp: futureApps[0] || null };
  }, [appointments, staffData, config.primaryColor]);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Fallback: si Firebase no está configurado, conserva tu login actual
    if (!firebaseEnabled) {
      if (loginData.email === 'admin@sistema.com' && loginData.password === 'admin123') {
        setView('dashboard');
        setLoginError('');
      } else {
        setLoginError('Credenciales incorrectas (Prueba: admin@sistema.com / admin123)');
      }
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
      setLoginError('');
      setView('dashboard');
    } catch (err) {
      setLoginError('Credenciales incorrectas');
    }
  };

  const handleLogout = async () => {
    try {
      if (firebaseEnabled) await signOut(auth);
    } finally {
      setView('landing');
    }
  };


const handleCancelAppointment = async (app) => {
  try {
    if (!firebaseEnabled) {
      setAppointments((prev) => prev.map((x) => (x.id === app.id ? { ...x, status: 'Cancelado' } : x)));
      return;
    }

    const appRef = doc(db, 'shops', SHOP_ID, 'appointments', app.id);
    const busyId = `${app.staffId}_${app.date}`;
    const busyRef = doc(db, 'shops', SHOP_ID, 'busy', busyId);

    await runTransaction(db, async (tx) => {
      const busySnap = await tx.get(busyRef);
      const busyData = busySnap.exists() ? busySnap.data() : {};
      const slots = { ...(busyData.slots || {}) };

      // Marcar slot como cancelado (libera el horario)
      slots[app.time] = {
        ...(slots[app.time] || {}),
        status: 'Cancelado',
        appointmentId: app.id,
        staffId: app.staffId,
        date: app.date,
        time: app.time,
        canceledAtTS: serverTimestamp(),
        updatedAtTS: serverTimestamp(),
      };

      tx.set(busyRef, { slots, updatedAtTS: serverTimestamp() }, { merge: true });
      tx.update(appRef, { status: 'Cancelado', updatedAtTS: serverTimestamp() });
    });
  } catch (e) {
    // En caso de error, al menos cambia el estado local
    setAppointments((prev) => prev.map((x) => (x.id === app.id ? { ...x, status: 'Cancelado' } : x)));
  }
};

const handleMarkAttended = async (app) => {
  try {
    if (!firebaseEnabled) {
      setAppointments((prev) => prev.map((x) => (x.id === app.id ? { ...x, status: 'Asistió' } : x)));
      return;
    }

    const appRef = doc(db, 'shops', SHOP_ID, 'appointments', app.id);
    await updateDoc(appRef, { status: 'Asistió', updatedAtTS: serverTimestamp() });
  } catch (e) {
    setAppointments((prev) => prev.map((x) => (x.id === app.id ? { ...x, status: 'Asistió' } : x)));
  }
};

const handleReconfirmAppointment = async (app) => {
  try {
    if (!firebaseEnabled) {
      setAppointments((prev) => prev.map((x) => (x.id === app.id ? { ...x, status: 'Confirmado' } : x)));
      return;
    }
    const appRef = doc(db, 'shops', SHOP_ID, 'appointments', app.id);
    await updateDoc(appRef, { status: 'Confirmado', updatedAtTS: serverTimestamp() });
  } catch (e) {
    setAppointments((prev) => prev.map((x) => (x.id === app.id ? { ...x, status: 'Confirmado' } : x)));
  }
};

const handleProductOrderWhatsApp = (product) => {
  const message = `Hola! Quiero pedir: ${product.product} (Precio: $${product.price}).\n\nQuisiera recogerlo en mi próxima cita. ¿Me confirmas disponibilidad?`;
  const whatsappUrl = `https://wa.me/${config.socialWhatsapp}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};


const syncBusyDocsFromAppointments = async (list) => {
  if (!firebaseEnabled) return;
  if (!Array.isArray(list) || list.length === 0) return;

  // Solo sincroniza citas NO canceladas
  const active = list.filter((a) => (a.status || 'Confirmado') !== 'Cancelado');
  if (active.length === 0) return;

  const grouped = {};
  active.forEach((a) => {
    const key = `${a.staffId}_${a.date}`;
    if (!grouped[key]) grouped[key] = { staffId: a.staffId, date: a.date, slots: {} };
    grouped[key].slots[a.time] = {
      status: a.status || 'Confirmado',
      appointmentId: a.id,
      staffId: a.staffId,
      date: a.date,
      time: a.time,
      updatedAtTS: serverTimestamp(),
    };
  });

  const batch = writeBatch(db);
  Object.entries(grouped).forEach(([key, val]) => {
    const ref = doc(db, 'shops', SHOP_ID, 'busy', key);
    batch.set(
      ref,
      {
        staffId: val.staffId,
        date: val.date,
        slots: val.slots,
        updatedAtTS: serverTimestamp(),
      },
      { merge: true }
    );
  });

  await batch.commit();
};
  const openBooking = (service) => { setSelectedService(service); setStep(1); setSelectedStaff(null); setSelectedDate(null); setSelectedTime(null); setPaymentMethod(null); setBookingModalOpen(true); };


// --- BUSY SLOTS (PARA BLOQUEAR HORARIOS EN BOOKING, SIN LEER TODAS LAS CITAS) ---
useEffect(() => {
  setBookingError('');
  setBusySlots(new Set());
  if (!firebaseEnabled) return;
  if (!selectedStaff || !selectedDate) return;

  const busyId = `${selectedStaff.id}_${selectedDate}`;
  const busyRef = doc(db, 'shops', SHOP_ID, 'busy', busyId);

  return onSnapshot(busyRef, (snap) => {
    const slotsObj = snap.exists() ? (snap.data().slots || {}) : {};
    const taken = new Set(
      Object.entries(slotsObj)
        .filter(([, v]) => (v?.status || 'Confirmado') !== 'Cancelado')
        .map(([k]) => k)
    );
    setBusySlots(taken);
  });
}, [selectedStaff?.id, selectedDate]);

// Reset de hora si cambias profesional / día
useEffect(() => {
  setSelectedTime(null);
}, [selectedStaff?.id, selectedDate]);
  
const handleBookingSubmit = async () => {
  setBookingError('');

  let finalPrice = selectedService.price;
  if (paymentMethod === 'mp') finalPrice = selectedService.price * 0.95;

  const serviceMins = selectedService?.duration ? parseInt(selectedService.duration, 10) : 30;

  const newAppointment = {
    serviceId: selectedService.id,
    serviceTitle: selectedService.title,
    serviceDuration: serviceMins,
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

  // Validación UI extra (por si alguien manipuló el front)
  if (isTimeDisabled(selectedTime)) {
    setBookingError('Ese horario ya no está disponible. Elige otro por favor.');
    setStep(2);
    return;
  }

  try {
    if (firebaseEnabled) {
      // Transacción: bloquea horario + crea cita (evita dobles reservas simultáneas)
      const appsCol = collection(db, 'shops', SHOP_ID, 'appointments');
      const newRef = doc(appsCol);
      const busyId = `${selectedStaff.id}_${selectedDate}`;
      const busyRef = doc(db, 'shops', SHOP_ID, 'busy', busyId);

      await runTransaction(db, async (tx) => {
        const busySnap = await tx.get(busyRef);
        const busyData = busySnap.exists() ? busySnap.data() : {};
        const slots = { ...(busyData.slots || {}) };

        const existing = slots[selectedTime];
        const existingStatus = existing?.status || null;

        // Si ya existe y NO está cancelado => está tomado
        if (existing && existingStatus !== 'Cancelado') {
          throw new Error('SLOT_TAKEN');
        }

        slots[selectedTime] = {
          status: 'Confirmado',
          appointmentId: newRef.id,
          staffId: selectedStaff.id,
          date: selectedDate,
          time: selectedTime,
          updatedAtTS: serverTimestamp(),
        };

        tx.set(
          busyRef,
          {
            staffId: selectedStaff.id,
            date: selectedDate,
            slots,
            updatedAtTS: serverTimestamp(),
          },
          { merge: true }
        );

        tx.set(newRef, {
          ...newAppointment,
          createdAtTS: serverTimestamp(),
          updatedAtTS: serverTimestamp(),
        });
      });
    } else {
      // fallback local si Firebase no está activo
      setAppointments((prev) => [...prev, { id: Date.now(), ...newAppointment }]);
    }

    setStep(5);
  } catch (err) {
    if (String(err?.message || '').includes('SLOT_TAKEN')) {
      setBookingError('Ese horario ya fue tomado. Elige otro por favor.');
      setStep(2);
      return;
    }

    // fallback local si falló Firebase por cualquier razón
    setAppointments((prev) => [...prev, { id: Date.now(), ...newAppointment }]);
    setStep(5);
  }
};

const isTimeDisabled = (timeStr) => {
  if (!selectedStaff || !selectedDate) return true;

  // 1) Validar horario laboral del profesional
  const day = getStaffDaySchedule(selectedStaff, selectedDate);
  if (!day.enabled) return true;

  const serviceMins = selectedService?.duration ? parseInt(selectedService.duration, 10) : 30;
  const t0 = timeToMinutes(timeStr);
  const start = timeToMinutes(day.start);
  const end = timeToMinutes(day.end);

  // Debe iniciar dentro del rango y terminar antes o igual al fin
  if (t0 < start) return true;
  if (t0 + serviceMins > end) return true;

  // 2) Bloqueo por cita existente (busySlots de Firestore)
  if (busySlots?.has(timeStr)) return true;

  return false;
};

  // Auto-limpia la hora si se vuelve no disponible (por ejemplo, otra persona reservó antes)
  useEffect(() => {
    if (!selectedTime) return;
    try {
      if (isTimeDisabled(selectedTime)) setSelectedTime(null);
    } catch {
      // ignore
    }
  }, [busySlots, selectedStaff?.id, selectedDate, selectedService?.id]);


  // --- VIEW: LOGIN ---
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-2 ${getColorClass('bg')}`}></div>
          <div className="text-center mb-8">
            <div className={`w-16 h-16 ${getColorClass('bg')} rounded-xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg`}><Lock size={32} /></div>
            <h2 className="text-2xl font-bold text-slate-800">Panel Propietario</h2><p className="text-slate-500 text-sm">Acceso seguro a gestión</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="block text-sm font-bold text-slate-700 mb-1">Email</label><input type="email" value={loginData.email} onChange={(e) => setLoginData({...loginData, email: e.target.value})} className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 ${getColorClass('ring')}`} placeholder="admin@sistema.com" /></div>
            <div><label className="block text-sm font-bold text-slate-700 mb-1">Contraseña</label><input type="password" value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 ${getColorClass('ring')}`} placeholder="••••••••" /></div>
            {loginError && <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-3 rounded-lg flex items-center justify-center gap-2"><AlertTriangle size={14}/> {loginError}</p>}
            <button type="submit" className={`w-full ${getColorClass('bg')} text-white py-3 rounded-lg font-bold hover:opacity-90 transition shadow-lg`}>Ingresar</button>
            <button type="button" onClick={() => setView('landing')} className="w-full text-slate-500 text-sm font-medium py-2 hover:text-slate-800 transition">← Volver a la web</button>
          </form>
        </div>
      </div>
    );
  }

  // --- VIEW: DASHBOARD ---
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
        {/* Sidebar */}
        <div className="w-20 md:w-64 bg-slate-900 text-white flex flex-col shrink-0 transition-all duration-300">
          <div className="p-4 md:p-6 flex items-center gap-3 border-b border-slate-800 h-20">
            {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="w-8 h-8 object-contain bg-white rounded-md"/>
            ) : (
                <div className={`${getColorClass('bg')} p-2 rounded-lg shrink-0 text-white shadow-lg shadow-black/20`}><Scissors size={20}/></div>
            )}
            <span className="font-bold text-lg hidden md:block truncate">{config.businessName}</span>
          </div>
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-2 hidden md:block">Gestión</p>
            <button onClick={() => setDashboardView('overview')} className={`w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-sm font-medium transition-all ${dashboardView === 'overview' ? `${getColorClass('bg')} text-white shadow-lg` : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard size={20} /> <span className="hidden md:block">Inicio</span></button>
            <button onClick={() => setDashboardView('agenda')} className={`w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-sm font-medium transition-all ${dashboardView === 'agenda' ? `${getColorClass('bg')} text-white shadow-lg` : 'text-slate-400 hover:bg-slate-800'}`}><CalendarRange size={20} /> <span className="hidden md:block">Agenda</span></button>
            <button onClick={() => setDashboardView('clients')} className={`w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-sm font-medium transition-all ${dashboardView === 'clients' ? `${getColorClass('bg')} text-white shadow-lg` : 'text-slate-400 hover:bg-slate-800'}`}><Users size={20} /> <span className="hidden md:block">Clientes</span></button>
            <button onClick={() => setDashboardView('store')} className={`w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-sm font-medium transition-all ${dashboardView === 'store' ? `${getColorClass('bg')} text-white shadow-lg` : 'text-slate-400 hover:bg-slate-800'}`}><ShoppingBag size={20} /> <span className="hidden md:block">Tienda / Stock</span></button>
            <button onClick={() => setDashboardView('portfolio')} className={`w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-sm font-medium transition-all ${dashboardView === 'portfolio' ? `${getColorClass('bg')} text-white shadow-lg` : 'text-slate-400 hover:bg-slate-800'}`}><Camera size={20} /> <span className="hidden md:block">Portafolio</span></button>
             <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-2 mt-6 hidden md:block">Sistema</p>
             <button onClick={() => setDashboardView('settings')} className={`w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-sm font-medium transition-all ${dashboardView === 'settings' ? `${getColorClass('bg')} text-white shadow-lg` : 'text-slate-400 hover:bg-slate-800'}`}><Settings size={20} /> <span className="hidden md:block">Configuración</span></button>
          </nav>
          <div className="p-4 border-t border-slate-800">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 text-sm text-red-400 hover:text-red-300 transition p-2 rounded-lg hover:bg-slate-800/50"><LogOut size={18} /> <span className="hidden md:block">Cerrar Sesión</span></button>
          </div>
        </div>

        {/* Content */}
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
               <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-emerald-200"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online</div>
               <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm"><UserIcon className="text-slate-500" size={20}/></div>
            </div>
          </header>

          {/* DASHBOARD SECTIONS */}
          {dashboardView === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden"><div className={`absolute top-0 right-0 p-4 opacity-10 ${getColorClass('text')}`}><DollarSign size={40}/></div><p className="text-slate-500 text-xs font-bold uppercase mb-2">Caja Diaria</p><h3 className="text-2xl font-bold text-slate-900">$ {dashboardStats.todayRevenue.toLocaleString()}</h3></div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden"><div className={`absolute top-0 right-0 p-4 opacity-10 ${getColorClass('text')}`}><DollarSign size={40}/></div><p className="text-slate-500 text-xs font-bold uppercase mb-2">Caja Semanal</p><h3 className={`text-2xl font-bold ${getColorClass('text')}`}>$ {dashboardStats.weeklyRevenue.toLocaleString()}</h3></div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden"><div className={`absolute top-0 right-0 p-4 opacity-10 ${getColorClass('text')}`}><DollarSign size={40}/></div><p className="text-slate-500 text-xs font-bold uppercase mb-2">Caja Mensual</p><h3 className={`text-2xl font-bold text-slate-900`}>$ {dashboardStats.monthlyRevenue.toLocaleString()}</h3></div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden"><div className={`absolute top-0 right-0 p-4 opacity-10 ${getColorClass('text')}`}><Calendar size={40}/></div><p className="text-slate-500 text-xs font-bold uppercase mb-2">Citas Hoy</p><h3 className={`text-2xl font-bold ${getColorClass('text')}`}>{dashboardStats.dailyAppointments}</h3></div>
              </div>

              {/* NEW CHARTS GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart2 size={18} className="text-blue-500"/> Rendimiento del Equipo</h3>
                      <div className="space-y-5">{dashboardStats.staffPerformance.map(staff => (<div key={staff.id}><div className="flex justify-between text-sm mb-1"><span className="font-bold text-slate-700">{staff.name}</span><span className="text-slate-500">{staff.count} citas - $ {staff.revenue.toLocaleString()}</span></div><div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div className={`h-2.5 rounded-full ${getColorClass('bg')}`} style={{ width: `${(staff.count / (dashboardStats.totalAppointments || 1)) * 100}%` }}></div></div></div>))}</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                      <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><TrendingUp size={18} className="text-green-500"/> Comparativa de Ventas</h3>
                      <div className="flex items-end justify-around flex-1 h-40 pb-2">{dashboardStats.salesComparison.map((item, idx) => (<div key={idx} className="flex flex-col items-center gap-2 group w-1/3"><div className="text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">$ {item.value.toLocaleString()}</div><div className={`w-12 rounded-t-xl transition-all duration-500 hover:opacity-80 ${item.color}`} style={{ height: `${(item.value / (Math.max(...dashboardStats.salesComparison.map(i=>i.value)) || 1)) * 100}%` }}></div><span className="text-xs font-medium text-slate-500">{item.label}</span></div>))}</div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Star size={18} className="text-yellow-400"/> Servicios Top</h3>
                      <div className="space-y-4">{dashboardStats.topServices.map((svc, i) => (<div key={i} className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">{i+1}</div><div className="flex-1"><div className="flex justify-between text-xs mb-1"><span className="font-medium text-slate-700">{svc.name}</span><span className="text-slate-400">{svc.count}</span></div><div className="w-full bg-slate-50 rounded-full h-1.5"><div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${(svc.count / (dashboardStats.topServices[0].count || 1)) * 100}%` }}></div></div></div></div>))}</div>
                   </div>
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock size={18} className="text-purple-500"/> Horas Pico</h3>
                      <div className="flex items-end gap-1 h-32 overflow-x-auto pb-2">{dashboardStats.busyHours.map((h, i) => (<div key={i} className="flex flex-col items-center flex-1 min-w-[30px]"><div className="w-full bg-purple-100 rounded-t hover:bg-purple-200 transition-colors relative group" style={{ height: `${(h.count / (Math.max(...dashboardStats.busyHours.map(x=>x.count)) || 1)) * 100}%` }}><div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1 rounded opacity-0 group-hover:opacity-100">{h.count}</div></div><span className="text-[10px] text-slate-400 mt-1">{h.hour.split(':')[0]}</span></div>))}</div>
                   </div>
              </div>
            </div>
          )}

          {/* STORE MANAGEMENT */}
          {dashboardView === 'store' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Productos en Venta & Stock</h3>
                        <button onClick={handleAddProduct} className={`text-sm ${getColorClass('text')} font-bold flex items-center gap-2 px-4 py-2 rounded-lg border border-current hover:bg-slate-50`}><PlusCircle size={16}/> Nuevo Producto</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {productsData.map(item => (
                            <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden flex flex-col bg-white">
                                <div className="h-40 relative group">
                                    <img src={item.image} alt={item.product} className="w-full h-full object-cover"/>
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <div className="bg-white p-2 rounded-lg shadow-sm w-3/4 space-y-2">
                                            <input type="text" value={item.image} onChange={(e) => handleUpdateProduct(item.id, 'image', e.target.value)} className="w-full text-xs p-1 border rounded outline-none" placeholder="URL Imagen"/>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3 flex-1">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400">Producto</label>
                                        <input type="text" value={item.product} onChange={(e) => handleUpdateProduct(item.id, 'product', e.target.value)} className="w-full font-bold text-slate-800 border-b border-transparent focus:border-slate-300 outline-none"/>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-[10px] uppercase font-bold text-slate-400">Precio</label>
                                            <div className="flex items-center"><span className="text-sm font-bold text-slate-500 mr-1">$</span><input type="number" value={item.price} onChange={(e) => handleUpdateProduct(item.id, 'price', parseInt(e.target.value))} className="w-full font-medium text-slate-800 border rounded px-1"/></div>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] uppercase font-bold text-slate-400">Stock</label>
                                            <div className="flex items-center"><input type="number" value={item.stock} onChange={(e) => handleUpdateProduct(item.id, 'stock', parseInt(e.target.value))} className={`w-full font-medium border rounded px-1 ${item.stock < 5 ? 'text-red-500 border-red-200' : 'text-slate-800'}`}/></div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-400">Unidad</label>
                                        <input type="text" value={item.unit} onChange={(e) => handleUpdateProduct(item.id, 'unit', e.target.value)} className="w-full text-xs text-slate-500 border-b border-transparent focus:border-slate-300 outline-none"/>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{item.stock > 0 ? 'Disponible' : 'Agotado'}</span>
                                    {/* FIX: Button logic for deletion */}
                                    <button 
                                      type="button"
                                      onClick={(e) => { e.preventDefault(); handleDeleteProduct(item.id); }} 
                                      className="text-slate-400 hover:text-red-500 p-2 transition"
                                    >
                                      <Trash2 size={18}/>
                                    </button>
                                </div>
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
                        <h4 className="font-bold text-slate-800 mb-2 text-sm">Gestionar Categorías del Portafolio</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {portfolioCategories.map(cat => (
                                <span key={cat} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium flex items-center gap-1">
                                    {cat} 
                                    <button onClick={() => handleDeleteCategory(cat)} className="text-slate-400 hover:text-red-500"><X size={12}/></button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Nueva categoría (ej: Uñas)" className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none"/>
                            <button onClick={handleAddCategory} className={`px-3 py-1.5 ${getColorClass('bg')} text-white rounded-lg text-xs font-bold`}>Crear</button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Galería de Trabajos</h3>
                        <button onClick={handleAddPortfolio} className={`text-sm ${getColorClass('text')} font-bold flex items-center gap-2 px-4 py-2 rounded-lg border border-current hover:bg-slate-50`}><PlusCircle size={16}/> Agregar Foto</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {portfolioData.map(item => (
                            <div key={item.id} className="group relative rounded-xl overflow-hidden aspect-square border border-slate-200">
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover"/>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-3">
                                    <button onClick={() => handleDeletePortfolio(item.id)} className="self-end text-white hover:text-red-400"><Trash2 size={18}/></button>
                                    <div className="space-y-2">
                                        <input type="text" value={item.title} onChange={(e) => handleUpdatePortfolio(item.id, 'title', e.target.value)} className="w-full bg-transparent border-b border-white/50 text-white text-xs font-bold outline-none placeholder-white/70" placeholder="Título"/>
                                        <select value={item.category} onChange={(e) => handleUpdatePortfolio(item.id, 'category', e.target.value)} className="w-full bg-transparent border-b border-white/50 text-white text-[10px] outline-none">
                                            {portfolioCategories.map(cat => <option key={cat} value={cat} className="text-black">{cat}</option>)}
                                        </select>
                                        <input type="text" value={item.image} onChange={(e) => handleUpdatePortfolio(item.id, 'image', e.target.value)} className="w-full bg-transparent border-b border-white/50 text-white text-[10px] outline-none placeholder-white/70" placeholder="URL Imagen"/>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          )}

          {dashboardView === 'settings' && (
            <div className="max-w-4xl animate-in fade-in duration-300 space-y-8">
              {/* Branding & Social Media */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-4 mb-4">Identidad y Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Negocio</label><input type="text" value={config.businessName} onChange={(e) => handleUpdateConfig({businessName: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-slate-400 font-medium text-slate-900" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Logo URL</label><div className="flex gap-2"><input type="text" value={config.logoUrl} onChange={(e) => handleUpdateConfig({logoUrl: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-slate-400 font-medium text-slate-900" placeholder="https://..." /><div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 overflow-hidden">{config.logoUrl ? <img src={config.logoUrl} className="w-full h-full object-cover"/> : <ImageIcon className="text-slate-400"/>}</div></div></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Instagram size={14}/> Instagram URL</label><input type="text" value={config.socialInstagram} onChange={(e) => handleUpdateConfig({socialInstagram: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="https://instagram.com/..." /></div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Facebook size={14}/> Facebook URL</label><input type="text" value={config.socialFacebook} onChange={(e) => handleUpdateConfig({socialFacebook: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="https://facebook.com/..." /></div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><MessageCircle size={14}/> WhatsApp (Número)</label><input type="text" value={config.socialWhatsapp} onChange={(e) => handleUpdateConfig({socialWhatsapp: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="54911..." /></div>
                </div>
                <div className="pt-4"><label className="block text-sm font-bold text-slate-700 mb-3">Color de Marca</label><div className="flex flex-wrap gap-4">{[{ id: 'blue', color: 'bg-blue-600' }, { id: 'indigo', color: 'bg-indigo-600' }, { id: 'purple', color: 'bg-purple-600' }, { id: 'rose', color: 'bg-rose-600' }, { id: 'slate', color: 'bg-slate-800' }].map(theme => (<button key={theme.id} onClick={() => handleUpdateConfig({primaryColor: theme.id})} className={`w-12 h-12 rounded-full border-4 transition-all ${config.primaryColor === theme.id ? 'border-slate-800 scale-110 shadow-lg' : 'border-transparent'}`}><div className={`w-full h-full rounded-full ${theme.color}`}></div></button>))}</div></div>
              </div>

              {/* Staff Management */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                <div className="flex justify-between items-center border-b pb-4 mb-4"><h3 className="text-lg font-bold text-slate-800">Profesionales</h3><button onClick={handleAddStaff} className={`text-sm ${getColorClass('text')} font-bold flex items-center gap-1`}><PlusCircle size={16}/> Agregar</button></div>
                <div className="grid gap-4">{staffData.map(staff => (<div key={staff.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/50"><div className="relative group w-16 h-16 shrink-0"><img src={staff.image} className="w-full h-full rounded-full object-cover"/><div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><Upload size={16} className="text-white"/></div></div><div className="flex-1 w-full space-y-2"><input type="text" value={staff.name} onChange={(e) => handleUpdateStaff(staff.id, 'name', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-slate-300 outline-none font-bold text-slate-800" placeholder="Nombre"/><input type="text" value={staff.role} onChange={(e) => handleUpdateStaff(staff.id, 'role', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-slate-300 outline-none text-sm text-slate-500" placeholder="Rol"/><input type="text" value={staff.image} onChange={(e) => handleUpdateStaff(staff.id, 'image', e.target.value)} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-400 outline-none focus:border-slate-400" placeholder="URL Foto de Perfil"/></div>
                          <div className="w-full sm:w-48 space-y-2">
                            <label className="text-[10px] uppercase font-bold text-slate-400">PIN Profesional</label>
                            <input
                              type="text"
                              value={staff.pin || ''}
                              onChange={(e) => handleUpdateStaff(staff.id, 'pin', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 outline-none focus:border-slate-400"
                              placeholder="Ej: 1234"
                            />
                            <button
                              type="button"
                              onClick={() => setExpandedStaffId(expandedStaffId === staff.id ? null : staff.id)}
                              className="w-full text-xs font-bold text-slate-600 border border-slate-200 rounded px-2 py-1 hover:bg-white transition"
                            >
                              {expandedStaffId === staff.id ? 'Ocultar horarios' : 'Editar horarios'}
                            </button>
                          </div>
                          <button onClick={() => { setStaffData(staffData.filter(s => s.id !== staff.id)) }} className="text-slate-400 hover:text-red-500"><Trash2 size={18}/></button>
                        </div>
                        {expandedStaffId === staff.id && (
                          <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4">
                            <p className="text-xs text-slate-500 mb-3"><span className="font-bold text-slate-700">Horarios de trabajo</span> (se guardan automáticamente)</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {WEEK_KEYS.map((k) => (
                                <div key={k} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={ensureStaffSchedule(staff).schedule[k].enabled}
                                      onChange={(e) => {
                                        const nextSchedule = { ...ensureStaffSchedule(staff).schedule, [k]: { ...ensureStaffSchedule(staff).schedule[k], enabled: e.target.checked } };
                                        handleUpdateStaff(staff.id, 'schedule', nextSchedule);
                                      }}
                                    />
                                    <span className="text-sm font-bold text-slate-700">{WEEK_LABELS[k]}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={ensureStaffSchedule(staff).schedule[k].start}
                                      onChange={(e) => {
                                        const nextSchedule = { ...ensureStaffSchedule(staff).schedule, [k]: { ...ensureStaffSchedule(staff).schedule[k], start: e.target.value } };
                                        handleUpdateStaff(staff.id, 'schedule', nextSchedule);
                                      }}
                                      className="px-2 py-1 border border-slate-200 rounded text-xs bg-white"
                                    >
                                      {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <span className="text-xs text-slate-400">a</span>
                                    <select
                                      value={ensureStaffSchedule(staff).schedule[k].end}
                                      onChange={(e) => {
                                        const nextSchedule = { ...ensureStaffSchedule(staff).schedule, [k]: { ...ensureStaffSchedule(staff).schedule[k], end: e.target.value } };
                                        handleUpdateStaff(staff.id, 'schedule', nextSchedule);
                                      }}
                                      className="px-2 py-1 border border-slate-200 rounded text-xs bg-white"
                                    >
                                      {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>))}</div>
              </div>

              {/* Review Management */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                <div className="flex justify-between items-center border-b pb-4 mb-4"><h3 className="text-lg font-bold text-slate-800">Gestionar Reseñas</h3><button onClick={handleAddReview} className={`text-sm ${getColorClass('text')} font-bold flex items-center gap-1`}><PlusCircle size={16}/> Agregar</button></div>
                <div className="grid gap-4 max-h-96 overflow-y-auto pr-2">{reviewsData.map(review => (<div key={review.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 space-y-3"><div className="flex justify-between items-start"><div className="flex-1 space-y-2"><div className="flex items-center gap-2"><input type="text" value={review.user} onChange={(e) => handleUpdateReview(review.id, 'user', e.target.value)} className="bg-transparent font-bold text-slate-800 border-b border-transparent focus:border-slate-300 outline-none w-32"/><div className="flex text-yellow-400">{[...Array(5)].map((_, i) => (<Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className="cursor-pointer" onClick={() => handleUpdateReview(review.id, 'rating', i + 1)} />))}</div></div><textarea value={review.comment} onChange={(e) => handleUpdateReview(review.id, 'comment', e.target.value)} className="w-full bg-white border border-slate-200 rounded p-2 text-sm text-slate-600 outline-none focus:border-slate-400" rows={2} /></div><button onClick={() => handleDeleteReview(review.id)} className="text-slate-400 hover:text-red-500 ml-2"><Trash2 size={18}/></button></div></div>))}</div>
              </div>

              {/* Services Management */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                <div className="flex justify-between items-center border-b pb-4 mb-4"><h3 className="text-lg font-bold text-slate-800">Gestión de Servicios</h3><button onClick={handleAddService} className={`text-sm ${getColorClass('text')} font-bold flex items-center gap-1`}><PlusCircle size={16}/> Agregar Servicio</button></div>
                <div className="grid gap-4">{servicesData.map(service => (<div key={service.id} className="flex flex-col md:flex-row md:items-start gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/50"><div className="flex-1 space-y-2"><label className="text-[10px] uppercase font-bold text-slate-400">Nombre</label><input type="text" value={service.title} onChange={(e) => handleUpdateService(service.id, 'title', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-slate-300 outline-none font-bold text-slate-800"/><label className="text-[10px] uppercase font-bold text-slate-400">URL Imagen</label><input type="text" value={service.image} onChange={(e) => handleUpdateService(service.id, 'image', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-slate-300 outline-none text-xs text-slate-500"/></div><div className="flex gap-4"><div className="flex flex-col"><label className="text-[10px] uppercase font-bold text-slate-400">Precio ($)</label><input type="number" value={service.price} onChange={(e) => handleUpdateService(service.id, 'price', parseInt(e.target.value))} className="w-24 bg-white border border-slate-200 rounded px-2 py-1 text-sm font-bold"/></div><div className="flex flex-col"><label className="text-[10px] uppercase font-bold text-slate-400">Minutos</label><input type="number" value={service.duration} onChange={(e) => handleUpdateService(service.id, 'duration', parseInt(e.target.value))} className="w-20 bg-white border border-slate-200 rounded px-2 py-1 text-sm"/></div><button onClick={() => handleDeleteService(service.id)} className="text-slate-400 hover:text-red-500 mt-4"><Trash2 size={18}/></button></div></div>))}</div>
              </div>

            </div>
          )}

          {/* Reuse Clients View */}
          

{/* AGENDA / CITAS (ADMIN) */}
{dashboardView === 'agenda' && (
  <div className="space-y-6 animate-in fade-in duration-300">
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Agenda y Gestión de Citas</h3>
          <p className="text-sm text-slate-500">Cancela, confirma asistencia y revisa el día por profesional.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Fecha</label>
            <input
              type="date"
              value={agendaDate}
              onChange={(e) => setAgendaDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Profesional</label>
            <select
              value={selectedStaffIdForAgenda}
              onChange={(e) => setSelectedStaffIdForAgenda(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="all">Todos</option>
              {staffData.map((s) => (
                <option key={s.id} value={String(s.id)}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-semibold">
            <tr>
              <th className="p-4">Hora</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Servicio</th>
              <th className="p-4">Profesional</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {appointments
              .filter((a) => a.date === agendaDate)
              .filter((a) => selectedStaffIdForAgenda === 'all' ? true : String(a.staffId) === String(selectedStaffIdForAgenda))
              .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
              .map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-4 font-bold text-slate-800">{app.time}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{app.clientName}</div>
                    <div className="text-xs text-slate-400">{app.clientPhone}</div>
                  </td>
                  <td className="p-4">{app.serviceTitle}</td>
                  <td className="p-4">{app.staffName}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      app.status === 'Cancelado' ? 'bg-red-100 text-red-700' :
                      app.status === 'Asistió' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {app.status || 'Confirmado'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {app.status !== 'Asistió' && app.status !== 'Cancelado' && (
                        <button
                          onClick={() => handleMarkAttended(app)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1"
                        >
                          <CheckCircle size={14}/> Asistió
                        </button>
                      )}
                      {app.status === 'Cancelado' && (
                        <button
                          onClick={() => handleReconfirmAppointment(app)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition"
                        >
                          Reactivar
                        </button>
                      )}
                      {app.status !== 'Cancelado' && (
                        <button
                          onClick={() => handleCancelAppointment(app)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition flex items-center gap-1"
                        >
                          <XCircle size={14}/> Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            {appointments
              .filter((a) => a.date === agendaDate)
              .filter((a) => selectedStaffIdForAgenda === 'all' ? true : String(a.staffId) === String(selectedStaffIdForAgenda))
              .length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No hay citas para esta fecha.</td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

{dashboardView === 'clients' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-700">Base de Clientes</h3>
                  <button onClick={() => exportToCSV(clientsData, 'clientes_base_datos')} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition shadow-sm">
                      <FileSpreadsheet size={16} /> Exportar Excel/CSV
                  </button>
              </div>
              <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500 font-semibold"><tr><th className="p-4 pl-6">Cliente</th><th className="p-4">Nivel</th><th className="p-4">Visitas</th><th className="p-4">Total Gastado</th><th className="p-4">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{clientsData.map((client, idx) => (<tr key={idx} className="hover:bg-slate-50/50 transition"><td className="p-4 pl-6 font-bold text-slate-800">{client.name}<br/><span className="text-slate-400 text-xs font-normal">{client.phone}</span></td><td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${client.label === 'VIP' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{client.label}</span></td><td className="p-4">{client.visits}</td><td className="p-4 font-bold text-emerald-600">$ {client.spent.toLocaleString()}</td><td className="p-4"><button className="text-slate-400 hover:text-blue-600"><ChevronRight size={18}/></button></td></tr>))}</tbody></table>
            </div>
          )}

        </div>
      </div>
    );
  }

  

// --- VIEW: LOGIN PROFESIONAL ---
if (view === 'staff_login') {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-2 ${getColorClass('bg')}`}></div>
        <div className="text-center mb-8">
          <div className={`w-16 h-16 ${getColorClass('bg')} rounded-xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg`}><User size={32} /></div>
          <h2 className="text-2xl font-bold text-slate-800">Acceso Profesional</h2>
          <p className="text-slate-500 text-sm">Revisa tu agenda y confirma o cancela citas.</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStaffLoginError('');

            const staff = staffData.find((s) => String(s.id) === String(staffLoginData.staffId));
            if (!staff) {
              setStaffLoginError('Selecciona un profesional.');
              return;
            }
            if ((staff.pin || '') !== (staffLoginData.pin || '')) {
              setStaffLoginError('PIN incorrecto.');
              return;
            }
            setStaffUser(staff);
            setView('staff_dashboard');
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Profesional</label>
            <select
              value={staffLoginData.staffId}
              onChange={(e) => setStaffLoginData({ ...staffLoginData, staffId: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="">Selecciona…</option>
              {staffData.map((s) => (
                <option key={s.id} value={String(s.id)}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">PIN</label>
            <input
              type="password"
              value={staffLoginData.pin}
              onChange={(e) => setStaffLoginData({ ...staffLoginData, pin: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="••••"
            />
          </div>

          {staffLoginError && (
            <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-3 rounded-lg flex items-center justify-center gap-2">
              <AlertTriangle size={14}/> {staffLoginError}
            </p>
          )}

          <button type="submit" className={`w-full ${getColorClass('bg')} text-white py-3 rounded-lg font-bold hover:opacity-90 transition shadow-lg`}>
            Ingresar
          </button>
          <button type="button" onClick={() => setView('landing')} className="w-full text-slate-500 text-sm font-medium py-2 hover:text-slate-800 transition">
            ← Volver a la web
          </button>
        </form>
      </div>
    </div>
  );
}

// --- VIEW: DASHBOARD PROFESIONAL ---
if (view === 'staff_dashboard') {
  const todayStr = new Date().toISOString().split('T')[0];
  const todays = staffAppointments
    .filter((a) => a.date === todayStr)
    .filter((a) => String(a.staffId) === String(staffUser?.id))
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Agenda de {staffUser?.name}</h2>
            <p className="text-sm text-slate-500">Citas de hoy: {todayStr}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setStaffUser(null); setStaffLoginData({ staffId: '', pin: '' }); setView('landing'); }}
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition"
            >
              Salir
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-700">Citas del día</h3>
            <span className="text-xs text-slate-400">{todays.length} citas</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-slate-500 font-semibold">
                <tr>
                  <th className="p-4">Hora</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Servicio</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todays.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 font-bold text-slate-800">{app.time}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{app.clientName}</div>
                      <div className="text-xs text-slate-400">{app.clientPhone}</div>
                    </td>
                    <td className="p-4">{app.serviceTitle}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        app.status === 'Cancelado' ? 'bg-red-100 text-red-700' :
                        app.status === 'Asistió' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {app.status || 'Confirmado'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {app.status !== 'Asistió' && app.status !== 'Cancelado' && (
                          <button
                            onClick={() => handleMarkAttended(app)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1"
                          >
                            <CheckCircle size={14}/> Asistió
                          </button>
                        )}
                        {app.status !== 'Cancelado' && (
                          <button
                            onClick={() => handleCancelAppointment(app)}
                            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition flex items-center gap-1"
                          >
                            <XCircle size={14}/> Cancelar
                          </button>
                        )}
                        {app.status === 'Cancelado' && (
                          <button
                            onClick={() => handleReconfirmAppointment(app)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition"
                          >
                            Reactivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {todays.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">No tienes citas hoy.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-4">Tip: si necesitas cambiar tu PIN u horarios, pídelo al dueño en el panel.</p>
      </div>
    </div>
  );
}

// --- VIEW: LANDING PAGE (CLIENTE) ---
  return (
    <div className={`font-sans text-slate-700 bg-slate-50/50 min-h-screen flex flex-col`}>
      <nav className={`fixed w-full z-40 transition-all duration-300 ${scrolled ? 'bg-white shadow-lg py-3' : 'bg-black/20 backdrop-blur-sm py-5'}`}>
        <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {config.logoUrl ? <img src={config.logoUrl} alt="Logo" className="w-10 h-10 object-contain bg-white rounded-lg shadow-sm"/> : <div className={`p-2 rounded-lg transition-colors ${scrolled ? `${getColorClass('bg')} text-white` : `bg-white ${getColorClass('text')}`}`}><Scissors size={22} strokeWidth={2.5} /></div>}
            <div className="flex flex-col"><span className={`text-xl font-bold leading-none tracking-tight ${scrolled ? 'text-slate-900' : 'text-white'}`}>{config.businessName}</span><span className={`text-[10px] uppercase font-bold tracking-widest ${scrolled ? getColorClass('text') : 'text-blue-200'}`}>Reserva Online</span></div>
          </div>
          <div className="hidden md:flex items-center gap-8"><a href="#" onClick={(e) => handleNavClick(e, 'top')} className={`text-sm font-semibold hover:opacity-80 transition ${scrolled ? 'text-slate-600' : 'text-white/90'}`}>Inicio</a><a href="#servicios" onClick={(e) => handleNavClick(e, 'servicios')} className={`text-sm font-semibold hover:opacity-80 transition ${scrolled ? 'text-slate-600' : 'text-white/90'}`}>Servicios</a><a href="#store" onClick={(e) => handleNavClick(e, 'store')} className={`text-sm font-semibold hover:opacity-80 transition ${scrolled ? 'text-slate-600' : 'text-white/90'}`}>Tienda</a><a href="#portfolio" onClick={(e) => handleNavClick(e, 'portfolio')} className={`text-sm font-semibold hover:opacity-80 transition ${scrolled ? 'text-slate-600' : 'text-white/90'}`}>Portafolio</a><a href="#reviews" onClick={(e) => handleNavClick(e, 'reviews')} className={`text-sm font-semibold hover:opacity-80 transition ${scrolled ? 'text-slate-600' : 'text-white/90'}`}>Reseñas</a><button onClick={() => setView('staff_login')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition shadow-md hover:shadow-lg ${scrolled ? 'bg-white text-slate-900' : 'bg-white/90 text-slate-900'}`}><User size={16} /> Soy Profesional</button>
          <button onClick={() => setView('login')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition shadow-md hover:shadow-lg ${scrolled ? `${getColorClass('bg')} text-white` : 'bg-white text-slate-900'}`}><User size={16} /> Soy Dueño</button></div>
          <button className={`md:hidden p-2 rounded-md ${scrolled ? 'text-slate-800' : 'text-white'}`} onClick={() => setIsMenuOpen(!isMenuOpen)}><Menu size={28} /></button>
        </div>
        {/* Mobile Menu Dropdown Restored */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-xl border-t border-gray-100 flex flex-col p-4 animate-in slide-in-from-top-5 z-50">
            <a href="#" onClick={(e) => handleNavClick(e, 'top')} className="text-slate-600 font-semibold p-3 hover:bg-slate-50 rounded-lg">Inicio</a>
            <a href="#servicios" onClick={(e) => handleNavClick(e, 'servicios')} className="text-slate-600 font-semibold p-3 hover:bg-slate-50 rounded-lg">Servicios</a>
            <a href="#store" onClick={(e) => handleNavClick(e, 'store')} className="text-slate-600 font-semibold p-3 hover:bg-slate-50 rounded-lg">Tienda</a>
            <a href="#portfolio" onClick={(e) => handleNavClick(e, 'portfolio')} className="text-slate-600 font-semibold p-3 hover:bg-slate-50 rounded-lg">Portafolio</a>
            <a href="#reviews" onClick={(e) => handleNavClick(e, 'reviews')} className="text-slate-600 font-semibold p-3 hover:bg-slate-50 rounded-lg">Reseñas</a>
            <button onClick={() => { setView('login'); setIsMenuOpen(false); }} className={`mt-2 ${getColorClass('bg')} text-white px-4 py-3 rounded-lg text-sm font-bold w-full shadow-lg`}>Acceso Dueño</button>
          </div>
        )}
      </nav>

      <header id="top" className="relative pt-40 pb-24 md:pt-52 md:pb-40 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0"><img src="https://i.postimg.cc/FzcxP9qW/782cafe1-5812-40e3-9862-2b27b89dd969.png" alt="Barber" className="w-full h-full object-cover opacity-90" /><div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/30 to-blue-900/3"></div></div>
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center md:text-left">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-[1.1]">Tu estilo, <br/><span className={config.primaryColor === 'blue' ? 'text-blue-400' : config.primaryColor === 'indigo' ? 'text-indigo-400' : config.primaryColor === 'purple' ? 'text-purple-400' : 'text-rose-400'}>tu momento.</span></h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl font-light">La experiencia premium que mereces. Reserva tu cita con los mejores profesionales en segundos.</p>
            <div className="flex flex-col sm:flex-row gap-4"><a href="#servicios" onClick={(e) => handleNavClick(e, 'servicios')} className={`${getColorClass('bg')} text-white px-8 py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-3 hover:scale-105 active:scale-95`}><Calendar size={20} /> Reservar Ahora</a></div>
          </div>
        </div>
      </header>

      <section id="servicios" className="py-24 bg-slate-50/50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16"><h2 className="text-4xl font-extrabold text-slate-900 mb-4">Nuestros Servicios</h2><div className={`w-20 h-1.5 ${getColorClass('bg')} mx-auto rounded-full mb-6`}></div></div>
          <div className="flex flex-wrap justify-center gap-3 mb-16 sticky top-20 z-30 bg-slate-50/95 py-4 backdrop-blur-sm transition-all rounded-full px-4 max-w-fit mx-auto shadow-sm border border-slate-100">{CATEGORIES.map((cat) => (<button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${activeCategory === cat ? 'bg-slate-900 text-white shadow-lg transform scale-105' : 'bg-white text-slate-500 hover:bg-slate-100'}`}>{cat}</button>))}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service) => (
              <div key={service.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-slate-100 flex flex-col h-full">
                <div className="h-64 overflow-hidden relative"><div className="absolute top-4 left-4 flex gap-2 z-10">{service.category.slice(0, 2).map((cat, idx) => (<span key={idx} className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-900 shadow-sm">{cat}</span>))}</div><img src={service.image} alt={service.title} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700 ease-out" /><div className={`absolute bottom-4 right-4 ${getColorClass('bg')} text-white px-4 py-2 rounded-xl font-bold shadow-lg`}>$ {service.price.toLocaleString('es-AR')}</div></div>
                <div className="p-8 flex-grow flex flex-col"><h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3><p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3">{service.description}</p><div className="mt-auto"><button onClick={() => openBooking(service)} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10">Reservar Turno <ChevronRight size={18} /></button></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STORE SECTION (PUBLIC) */}
      <section id="store" className="py-24 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Nuestra Tienda</h2>
                <p className="text-slate-500">Lleva la calidad profesional a tu casa</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {productsData.map(item => (
                    <div key={item.id} className="group flex flex-col h-full bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                        <div className="h-64 overflow-hidden relative">
                            <img src={item.image} alt={item.product} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500"/>
                            {item.stock === 0 && <div className="absolute inset-0 bg-white/70 flex items-center justify-center font-bold text-slate-800">AGOTADO</div>}
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <h3 className="font-bold text-slate-900 mb-1">{item.product}</h3>
                            <p className="text-xs text-slate-400 mb-4">{item.unit}</p>
                            <div className="mt-auto flex items-center justify-between">
                                <span className="font-bold text-lg text-slate-900">$ {item.price.toLocaleString()}</span>
                                <button
                                  type="button"
                                  onClick={() => item.stock > 0 && handleProductOrderWhatsApp(item)}
                                  className={`p-2 rounded-full ${item.stock > 0 ? `${getColorClass('bg')} text-white hover:opacity-90` : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                                >
                                    <ShoppingBag size={18}/>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* PORTFOLIO SECTION (PUBLIC - CATEGORIZED BY SECTIONS) */}
      <section id="portfolio" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-4 md:px-8">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Nuestro Trabajo</h2>
                <p className="text-slate-500">Resultados reales de clientes felices</p>
            </div>
            
            <div className="space-y-16">
                {portfolioCategories.map((category) => {
                    const categoryItems = portfolioData.filter(item => item.category === category);
                    
                    if (categoryItems.length === 0) return null;

                    return (
                        <div key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center gap-4 mb-8">
                                <h3 className="text-2xl md:text-3xl font-bold text-slate-800 uppercase tracking-tight">{category}</h3>
                                <div className="h-px bg-slate-200 flex-grow"></div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                {categoryItems.map(item => (
                                    <div key={item.id} className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300">
                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700"/>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-6">
                                            <p className="text-white font-bold text-lg">{item.title}</p>
                                            <p className="text-white/80 text-sm">{item.category}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </section>

      <section id="reviews" className="py-24 bg-white border-t border-slate-100 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12"><h2 className="text-3xl font-bold text-slate-900 mb-2">Lo que dicen nuestros clientes</h2><div className="flex justify-center gap-1 text-yellow-400">{[1,2,3,4,5].map(i => <Star key={i} fill="currentColor" size={20}/>)}</div></div>
          <div className="relative"><div ref={reviewsRef} className="flex gap-6 overflow-x-auto pb-8 px-4 snap-x snap-mandatory no-scrollbar" style={{ scrollBehavior: 'smooth' }}>{reviewsData.map(review => (
            <div key={review.id} className="min-w-[300px] md:min-w-[400px] bg-slate-50 p-8 rounded-2xl border border-slate-100 shadow-sm snap-center flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-1 text-yellow-400">{[...Array(review.rating)].map((_, i) => <Star key={i} fill="currentColor" size={16}/>)}</div>
                    {/* Customer Photo in Review */}
                    {review.image && <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm"><img src={review.image} className="w-full h-full object-cover"/></div>}
                </div>
                <p className="text-slate-600 italic mb-6 leading-relaxed flex-grow">"{review.comment}"</p>
                <div className="flex items-center gap-3 mt-auto"><div className={`w-10 h-10 rounded-full ${getColorClass('bg')} text-white flex items-center justify-center font-bold`}>{review.user.charAt(0)}</div><p className="font-bold text-slate-900">{review.user}</p></div>
            </div>
          ))}</div><div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-white to-transparent pointer-events-none md:block hidden"></div><div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-white to-transparent pointer-events-none md:block hidden"></div></div>
        </div>
      </section>

      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50"><div><h3 className="font-bold text-lg text-slate-900">Reservar Turno</h3><p className="text-xs text-slate-500">Paso {step} de 5</p></div><button onClick={() => setBookingModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500"><X size={20} /></button></div>
            <div className="p-6 overflow-y-auto">
              {bookingError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold flex items-center gap-2">
                  <AlertTriangle size={16} /> {bookingError}
                </div>
              )}
              {step === 1 && (<div className="animate-in slide-in-from-right duration-300"><h4 className="font-bold text-slate-800 mb-4">Elige un Profesional</h4><div className="grid gap-4">{staffData.map(staff => (<button key={staff.id} onClick={() => setSelectedStaff(staff)} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group ${selectedStaff?.id === staff.id ? `border-${config.primaryColor}-600 bg-${config.primaryColor}-50` : 'border-slate-100 hover:border-slate-300'}`}><img src={staff.image} alt={staff.name} className="w-14 h-14 rounded-full object-cover group-hover:scale-105 transition" /><div><p className="font-bold text-slate-900">{staff.name}</p><p className="text-xs text-slate-500 font-medium">{staff.role}</p></div>{selectedStaff?.id === staff.id && <div className={`ml-auto ${getColorClass('bg')} text-white p-1 rounded-full`}><CheckCircle size={16} /></div>}</button>))}</div></div>)}
              {step === 2 && (<div className="space-y-6 animate-in slide-in-from-right duration-300"><div><label className="block text-sm font-bold text-slate-700 mb-3">Día</label><div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">{weekDays.map((day, idx) => (<button key={idx} onClick={() => setSelectedDate(day.fullDate)} className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${selectedDate === day.fullDate ? `border-${config.primaryColor}-600 bg-${config.primaryColor}-50 text-${config.primaryColor}-700 shadow-md scale-105` : 'border-slate-100 text-slate-500 hover:border-slate-300'}`}><span className="text-xs font-bold uppercase">{day.dayName}</span><span className="text-2xl font-bold">{day.dayNumber}</span></button>))}</div></div>{selectedDate && (<div className="animate-in fade-in slide-in-from-bottom-2 duration-300"><label className="block text-sm font-bold text-slate-700 mb-3">Horario con {selectedStaff.name.split(' ')[0]}</label><div className="grid grid-cols-4 gap-3">{TIME_SLOTS.map((time) => {
                  const disabled = isTimeDisabled(time);
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && setSelectedTime(time)}
                      className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                        disabled
                          ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                          : selectedTime === time
                            ? `${getColorClass('bg')} text-white shadow-md transform scale-105`
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}</div></div>)}</div>)}
              {step === 3 && (<div className="space-y-4 animate-in slide-in-from-right duration-300"><div className="space-y-3"><label className="font-bold text-slate-700">Nombre</label><input type="text" value={clientData.name} onChange={(e) => setClientData({...clientData, name: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-400 transition" placeholder="Ej: Juan Pérez"/></div><div className="space-y-3"><label className="font-bold text-slate-700">WhatsApp</label><input type="tel" value={clientData.phone} onChange={(e) => setClientData({...clientData, phone: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-400 transition" placeholder="Ej: 11 1234 5678"/></div></div>)}
              {step === 4 && (<div className="space-y-4 animate-in slide-in-from-right duration-300"><h4 className="font-bold text-slate-800 mb-2">Método de Pago</h4><button onClick={() => setPaymentMethod('mp')} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${paymentMethod === 'mp' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><CreditCard size={20}/></div><div className="text-left"><p className="font-bold text-slate-800">Mercado Pago / Tarjeta</p><p className="text-xs text-green-600 font-bold">¡Ahorras 5% pagando ahora!</p></div></div><div className="text-right"><p className="text-xs text-slate-400 line-through">${selectedService.price}</p><p className="font-bold text-blue-600">${selectedService.price * 0.95}</p></div></button><button onClick={() => setPaymentMethod('cash')} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}><div className="flex items-center gap-3"><div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600"><DollarSign size={20}/></div><div className="text-left"><p className="font-bold text-slate-800">Efectivo en el local</p><p className="text-xs text-slate-500">Pagas el total al asistir</p></div></div><p className="font-bold text-slate-700">${selectedService.price}</p></button></div>)}
              {step === 5 && (<div className="text-center py-8 animate-in zoom-in duration-300"><div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100"><CheckCircle size={48} /></div><h3 className="text-2xl font-bold text-slate-900 mb-2">¡Turno Confirmado!</h3><div className="bg-slate-50 p-6 rounded-2xl text-left space-y-3 mb-6 border border-slate-100 shadow-sm relative overflow-hidden"><div className={`absolute top-0 left-0 w-1 h-full ${getColorClass('bg')}`}></div><div className="flex justify-between items-center"><span className="text-slate-500 text-sm">Profesional</span><span className="font-bold text-slate-900 flex items-center gap-2">{selectedStaff.name}</span></div><div className="flex justify-between"><span className="text-slate-500 text-sm">Fecha</span><span className="font-bold text-slate-900">{selectedDate} - {selectedTime} hs</span></div><div className="flex justify-between border-t border-slate-200 pt-3 mt-2"><span className="font-bold text-slate-900">Total {paymentMethod === 'mp' ? '(con dcto.)' : ''}</span><span className={`font-bold ${getColorClass('text')}`}>$ {paymentMethod === 'mp' ? selectedService.price * 0.95 : selectedService.price}</span></div></div>
              
              {/* WhatsApp Confirmation Button */}
              <button onClick={handleWhatsAppConfirm} className="w-full bg-green-500 text-white py-3.5 rounded-xl font-bold hover:bg-green-600 transition shadow-lg flex items-center justify-center gap-2 mb-3">
                  <MessageCircle size={20} /> Recibir confirmación en WhatsApp
              </button>
              
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
            
            {/* Redes Sociales Dinámicas */}
            <div>
                <h4 className="text-white font-bold mb-4">Síguenos</h4>
                <div className="flex gap-3">
                    {config.socialInstagram && <a href={config.socialInstagram} target="_blank" rel="noreferrer" className="bg-slate-800 p-2 rounded-lg hover:bg-pink-600 hover:text-white transition"><Instagram size={18}/></a>}
                    {config.socialFacebook && <a href={config.socialFacebook} target="_blank" rel="noreferrer" className="bg-slate-800 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition"><Facebook size={18}/></a>}
                    {config.socialWhatsapp && <a href={`https://wa.me/${config.socialWhatsapp}`} target="_blank" rel="noreferrer" className="bg-slate-800 p-2 rounded-lg hover:bg-green-600 hover:text-white transition"><MessageCircle size={18}/></a>}
                </div>
            </div>

            <div><button onClick={() => setView('login')} className="bg-slate-800 text-white w-full py-3 rounded-lg font-bold border border-slate-700 hover:border-slate-500 transition">Acceso Admin</button></div>
          </div>
          <p className="text-center text-xs text-slate-600 border-t border-slate-800 pt-8">© 2024 Sistema de Turnos.</p>
        </div>
      </footer>
    </div>
  );
}
