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

/**
 * <!-- Chosen Palette: Slate (Neutrals) + Dynamic Primary Color -->
 * <!-- Updates:
 * - PORTFOLIO RESTRUCTURED: Changed from filter tabs to categorized sections.
 * Each category now displays as a large header followed by its specific image grid.
 * -->
 */

// --- DATOS INICIALES ---

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
  { id: 1, name: "Juan Pérez", role: "Master Barber", image: "https://images.unsplash.com/photo-1581803118522-7b72a50f7e9f?q=80&w=200&auto=format&fit=crop" },
  { id: 2, name: "Ana Gomez", role: "Estilista Senior", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" },
  { id: 3, name: "Carlos Ruiz", role: "Barbero", image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200&auto=format&fit=crop" }
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
  const [loginError, setLoginError] = useState('');
  const [newCatName, setNewCatName] = useState(""); 

  const reviewsRef = useRef(null);

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

  useEffect(() => {
    const savedApps = localStorage.getItem('appointments'); if (savedApps) setAppointments(JSON.parse(savedApps));
    const savedConfig = localStorage.getItem('appConfig'); if (savedConfig) setConfig(JSON.parse(savedConfig));
    const savedStaff = localStorage.getItem('appStaff'); if (savedStaff) setStaffData(JSON.parse(savedStaff));
    const savedServices = localStorage.getItem('appServices'); if (savedServices) setServicesData(JSON.parse(savedServices));
    const savedReviews = localStorage.getItem('appReviews'); if (savedReviews) setReviewsData(JSON.parse(savedReviews));
    const savedPortfolio = localStorage.getItem('appPortfolio'); if (savedPortfolio) setPortfolioData(JSON.parse(savedPortfolio));
    const savedProducts = localStorage.getItem('appProducts'); if (savedProducts) setProductsData(JSON.parse(savedProducts));
    const savedPortCats = localStorage.getItem('appPortfolioCats'); if (savedPortCats) setPortfolioCategories(JSON.parse(savedPortCats));

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { localStorage.setItem('appointments', JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { localStorage.setItem('appConfig', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('appStaff', JSON.stringify(staffData)); }, [staffData]);
  useEffect(() => { localStorage.setItem('appServices', JSON.stringify(servicesData)); }, [servicesData]);
  useEffect(() => { localStorage.setItem('appReviews', JSON.stringify(reviewsData)); }, [reviewsData]);
  useEffect(() => { localStorage.setItem('appPortfolio', JSON.stringify(portfolioData)); }, [portfolioData]);
  useEffect(() => { localStorage.setItem('appProducts', JSON.stringify(productsData)); }, [productsData]);
  useEffect(() => { localStorage.setItem('appPortfolioCats', JSON.stringify(portfolioCategories)); }, [portfolioCategories]);

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

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginData.email === 'admin@sistema.com' && loginData.password === 'admin123') { setView('dashboard'); setLoginError(''); } else { setLoginError('Credenciales incorrectas (Prueba: admin@sistema.com / admin123)'); }
  };

  const openBooking = (service) => { setSelectedService(service); setStep(1); setSelectedStaff(null); setSelectedDate(null); setSelectedTime(null); setPaymentMethod(null); setBookingModalOpen(true); };

  const handleBookingSubmit = () => {
    let finalPrice = selectedService.price;
    if (paymentMethod === 'mp') finalPrice = selectedService.price * 0.95;
    const newAppointment = { id: Date.now(), serviceId: selectedService.id, serviceTitle: selectedService.title, staffId: selectedStaff.id, staffName: selectedStaff.name, price: finalPrice, originalPrice: selectedService.price, date: selectedDate, time: selectedTime, clientName: clientData.name, clientPhone: clientData.phone, paymentMethod, status: 'Confirmado', createdAt: new Date().toISOString() };
    setAppointments([...appointments, newAppointment]); setStep(5);
  };

  const handleWhatsAppConfirm = () => {
    const message = `Hola! Soy ${clientData.name}. Quiero confirmar mi turno para ${selectedService.title} con ${selectedStaff.name} el día ${selectedDate} a las ${selectedTime}. Precio: $${paymentMethod === 'mp' ? selectedService.price * 0.95 : selectedService.price}.`;
    const whatsappUrl = `https://wa.me/${config.socialWhatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleUpdateConfig = (newSettings) => { setConfig({...config, ...newSettings}); }
  const handleAddStaff = () => { setStaffData([...staffData, { id: Date.now(), name: "Nuevo Personal", role: "Estilista", image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200" }]); }
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

  const handleAddProduct = () => { 
    const newProduct = { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), product: "Nuevo Producto", price: 0, stock: 0, unit: "unidades", image: "https://images.unsplash.com/photo-1599351431202-6e0000a94376?q=80&w=500" };
    setProductsData(prev => [newProduct, ...prev]); 
  }
  const handleDeleteProduct = (id) => { setProductsData(prev => prev.filter(p => p.id !== id)); }
  const handleUpdateProduct = (id, field, value) => { setProductsData(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p)); }

  const filteredServices = activeCategory === "Todos" ? servicesData : servicesData.filter(service => service.category.includes(activeCategory));
  const weekDays = getNextDays();

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
            <button onClick={() => setDashboardView('clients')} className={`w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-sm font-medium transition-all ${dashboardView === 'clients' ? `${getColorClass('bg')} text-white shadow-lg` : 'text-slate-400 hover:bg-slate-800'}`}><Users size={20} /> <span className="hidden md:block">Clientes</span></button>
            <button onClick={() => setDashboardView('store')} className={`w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-sm font-medium transition-all ${dashboardView === 'store' ? `${getColorClass('bg')} text-white shadow-lg` : 'text-slate-400 hover:bg-slate-800'}`}><ShoppingBag size={20} /> <span className="hidden md:block">Tienda / Stock</span></button>
            <button onClick={() => setDashboardView('portfolio')} className={`w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-sm font-medium transition-all ${dashboardView === 'portfolio' ? `${getColorClass('bg')} text-white shadow-lg` : 'text-slate-400 hover:bg-slate-800'}`}><Camera size={20} /> <span className="hidden md:block">Portafolio</span></button>
             <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-2 mt-6 hidden md:block">Sistema</p>
             <button onClick={() => setDashboardView('settings')} className={`w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-sm font-medium transition-all ${dashboardView === 'settings' ? `${getColorClass('bg')} text-white shadow-lg` : 'text-slate-400 hover:bg-slate-800'}`}><Settings size={20} /> <span className="hidden md:block">Configuración</span></button>
          </nav>
          <div className="p-4 border-t border-slate-800">
            <button onClick={() => setView('landing')} className="w-full flex items-center gap-3 text-sm text-red-400 hover:text-red-300 transition p-2 rounded-lg hover:bg-slate-800/50"><LogOut size={18} /> <span className="hidden md:block">Cerrar Sesión</span></button>
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
                <div className="grid gap-4">{staffData.map(staff => (<div key={staff.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/50"><div className="relative group w-16 h-16 shrink-0"><img src={staff.image} className="w-full h-full rounded-full object-cover"/><div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><Upload size={16} className="text-white"/></div></div><div className="flex-1 w-full space-y-2"><input type="text" value={staff.name} onChange={(e) => handleUpdateStaff(staff.id, 'name', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-slate-300 outline-none font-bold text-slate-800" placeholder="Nombre"/><input type="text" value={staff.role} onChange={(e) => handleUpdateStaff(staff.id, 'role', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-slate-300 outline-none text-sm text-slate-500" placeholder="Rol"/><input type="text" value={staff.image} onChange={(e) => handleUpdateStaff(staff.id, 'image', e.target.value)} className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-400 outline-none focus:border-slate-400" placeholder="URL Foto de Perfil"/></div><button onClick={() => { setStaffData(staffData.filter(s => s.id !== staff.id)) }} className="text-slate-400 hover:text-red-500"><Trash2 size={18}/></button></div>))}</div>
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

  // --- VIEW: LANDING PAGE (CLIENTE) ---
  return (
    <div className={`font-sans text-slate-700 bg-slate-50/50 min-h-screen flex flex-col`}>
      <nav className={`fixed w-full z-40 transition-all duration-300 ${scrolled ? 'bg-white shadow-lg py-3' : 'bg-black/20 backdrop-blur-sm py-5'}`}>
        <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {config.logoUrl ? <img src={config.logoUrl} alt="Logo" className="w-10 h-10 object-contain bg-white rounded-lg shadow-sm"/> : <div className={`p-2 rounded-lg transition-colors ${scrolled ? `${getColorClass('bg')} text-white` : `bg-white ${getColorClass('text')}`}`}><Scissors size={22} strokeWidth={2.5} /></div>}
            <div className="flex flex-col"><span className={`text-xl font-bold leading-none tracking-tight ${scrolled ? 'text-slate-900' : 'text-white'}`}>{config.businessName}</span><span className={`text-[10px] uppercase font-bold tracking-widest ${scrolled ? getColorClass('text') : 'text-blue-200'}`}>Reserva Online</span></div>
          </div>
          <div className="hidden md:flex items-center gap-8"><a href="#" onClick={(e) => handleNavClick(e, 'top')} className={`text-sm font-semibold hover:opacity-80 transition ${scrolled ? 'text-slate-600' : 'text-white/90'}`}>Inicio</a><a href="#servicios" onClick={(e) => handleNavClick(e, 'servicios')} className={`text-sm font-semibold hover:opacity-80 transition ${scrolled ? 'text-slate-600' : 'text-white/90'}`}>Servicios</a><a href="#store" onClick={(e) => handleNavClick(e, 'store')} className={`text-sm font-semibold hover:opacity-80 transition ${scrolled ? 'text-slate-600' : 'text-white/90'}`}>Tienda</a><a href="#portfolio" onClick={(e) => handleNavClick(e, 'portfolio')} className={`text-sm font-semibold hover:opacity-80 transition ${scrolled ? 'text-slate-600' : 'text-white/90'}`}>Portafolio</a><a href="#reviews" onClick={(e) => handleNavClick(e, 'reviews')} className={`text-sm font-semibold hover:opacity-80 transition ${scrolled ? 'text-slate-600' : 'text-white/90'}`}>Reseñas</a><button onClick={() => setView('login')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition shadow-md hover:shadow-lg ${scrolled ? `${getColorClass('bg')} text-white` : 'bg-white text-slate-900'}`}><User size={16} /> Soy Dueño</button></div>
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
        <div className="absolute inset-0 z-0"><img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop" alt="Barber" className="w-full h-full object-cover opacity-60" /><div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-blue-900/30"></div></div>
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
                                <button className={`p-2 rounded-full ${item.stock > 0 ? `${getColorClass('bg')} text-white hover:opacity-90` : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>
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
              {step === 1 && (<div className="animate-in slide-in-from-right duration-300"><h4 className="font-bold text-slate-800 mb-4">Elige un Profesional</h4><div className="grid gap-4">{staffData.map(staff => (<button key={staff.id} onClick={() => setSelectedStaff(staff)} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group ${selectedStaff?.id === staff.id ? `border-${config.primaryColor}-600 bg-${config.primaryColor}-50` : 'border-slate-100 hover:border-slate-300'}`}><img src={staff.image} alt={staff.name} className="w-14 h-14 rounded-full object-cover group-hover:scale-105 transition" /><div><p className="font-bold text-slate-900">{staff.name}</p><p className="text-xs text-slate-500 font-medium">{staff.role}</p></div>{selectedStaff?.id === staff.id && <div className={`ml-auto ${getColorClass('bg')} text-white p-1 rounded-full`}><CheckCircle size={16} /></div>}</button>))}</div></div>)}
              {step === 2 && (<div className="space-y-6 animate-in slide-in-from-right duration-300"><div><label className="block text-sm font-bold text-slate-700 mb-3">Día</label><div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">{weekDays.map((day, idx) => (<button key={idx} onClick={() => setSelectedDate(day.fullDate)} className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${selectedDate === day.fullDate ? `border-${config.primaryColor}-600 bg-${config.primaryColor}-50 text-${config.primaryColor}-700 shadow-md scale-105` : 'border-slate-100 text-slate-500 hover:border-slate-300'}`}><span className="text-xs font-bold uppercase">{day.dayName}</span><span className="text-2xl font-bold">{day.dayNumber}</span></button>))}</div></div>{selectedDate && (<div className="animate-in fade-in slide-in-from-bottom-2 duration-300"><label className="block text-sm font-bold text-slate-700 mb-3">Horario con {selectedStaff.name.split(' ')[0]}</label><div className="grid grid-cols-4 gap-3">{TIME_SLOTS.map((time) => (<button key={time} onClick={() => setSelectedTime(time)} className={`py-2 rounded-lg text-sm font-semibold transition-all ${selectedTime === time ? `${getColorClass('bg')} text-white shadow-md transform scale-105` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{time}</button>))}</div></div>)}</div>)}
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