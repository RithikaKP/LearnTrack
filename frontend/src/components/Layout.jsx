import { useState, useContext } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard, BookOpen, Clock, Code, Book, LogOut, ChevronRight, Settings, Menu, X, Calendar
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const SidebarContent = ({ navItems, location, user, handleLogout, onLinkClick }) => (
    <div className="flex flex-col h-full bg-zinc-50 border-r border-zinc-200/60 font-sans">
        <div className="p-6 border-b border-zinc-200/40">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-white shadow-sm font-bold text-lg select-none">
                    LT
                </div>
                <div>
                    <h1 className="font-semibold text-zinc-900 tracking-tight text-lg">LearnTrack</h1>
                    <p className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase">SaaS Platform</p>
                </div>
            </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path ||
                    (item.path !== "/dashboard" && item.path !== "/today" && location.pathname.startsWith(item.path));
                const Icon = item.icon;

                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={onLinkClick}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-150 group ${isActive
                            ? "bg-zinc-950 text-white font-medium shadow-sm"
                            : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900"
                            }`}
                    >
                        <Icon size={18} className={isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-600"} />
                        <span>{item.label}</span>
                        {isActive && <ChevronRight size={14} className="ml-auto opacity-50" />}
                    </Link>
                );
            })}
        </nav>

        <div className="p-4 border-t border-zinc-200/40 bg-zinc-100/30">
            <div className="flex items-center gap-3 px-3 py-2.5 mb-3 rounded-lg bg-white border border-zinc-200/50 shadow-sm overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white font-bold text-xs select-none">
                    {user?.name?.charAt(0) || "U"}
                </div>
                <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-zinc-800 truncate">{user?.name}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{user?.email}</p>
                </div>
            </div>

            <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-zinc-600 hover:bg-red-50 hover:text-red-600 transition-colors text-xs font-medium"
            >
                <LogOut size={16} />
                <span>Sign Out</span>
            </button>
        </div>
    </div>
);

const Layout = () => {
    const { logout, user } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const navItems = [
        { path: "/today", icon: Calendar, label: "Today" },
        { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/subjects", icon: BookOpen, label: "Subjects" },
        { path: "/problems", icon: Code, label: "Practice" },
        { path: "/timer", icon: Clock, label: "Focus Timer" },
        { path: "/notes", icon: Book, label: "Notes" },
        { path: "/settings", icon: Settings, label: "Settings" },
    ];

    const toggleMobileMenu = () => setIsMobileOpen(!isMobileOpen);

    return (
        <div className="flex min-h-screen bg-white">
            <aside className="fixed left-0 top-0 h-screen w-64 hidden md:block z-40">
                <SidebarContent
                    navItems={navItems}
                    location={location}
                    user={user}
                    handleLogout={handleLogout}
                    onLinkClick={() => setIsMobileOpen(false)}
                />
            </aside>

            <header className="fixed top-0 left-0 w-full h-16 bg-white border-b border-zinc-200/60 flex items-center justify-between px-4 md:hidden z-30">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white font-bold text-sm">
                        LT
                    </div>
                    <span className="font-semibold text-zinc-900 text-sm">LearnTrack</span>
                </div>
                <button
                    onClick={toggleMobileMenu}
                    className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                    {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </header>

            {isMobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={toggleMobileMenu} />
                    
                    <div className="relative w-64 max-w-xs h-full animate-slide-in shadow-xl flex flex-col z-10">
                        <button
                            onClick={toggleMobileMenu}
                            className="absolute top-4 right-[-44px] p-2 bg-white text-zinc-600 rounded-r-lg shadow border-y border-r border-zinc-200 flex items-center justify-center"
                        >
                            <X size={20} />
                        </button>
                        <SidebarContent
                            navItems={navItems}
                            location={location}
                            user={user}
                            handleLogout={handleLogout}
                            onLinkClick={() => setIsMobileOpen(false)}
                        />
                    </div>
                </div>
            )}

            <main className="flex-1 md:ml-64 min-h-screen pt-16 md:pt-0 overflow-x-hidden">
                <div className="max-w-[1700px] mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
