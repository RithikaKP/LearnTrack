import { useContext } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard, BookOpen, Clock, Activity, FileText,
    Book, LogOut, ChevronRight
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const Layout = () => {
    const { logout, user } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const navItems = [
        { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/subjects", icon: BookOpen, label: "Subjects" },
        { path: "/timer", icon: Clock, label: "Focus Timer" },
        { path: "/problems", icon: Activity, label: "Problem Tracker" },
        { path: "/history", icon: FileText, label: "History" },
        { path: "/notes", icon: Book, label: "Notes" },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 hidden md:flex flex-col z-50">
                <div className="p-6 border-b border-gray-50">
                    <div className="flex items-center gap-1">
                        <img src="/src/assets/logo.png" alt="Logo" className="w-20 h-20 rounded-xl object-cover" />
                        <div>
                            <h1 className="font-bold text-gray-900 leading-none text-[20px]">LearnTrack</h1>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                                    ? "bg-indigo-50 text-indigo-600 font-medium shadow-sm"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                            >
                                <Icon size={20} className={isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"} />
                                <span>{item.label}</span>
                                {isActive && <ChevronRight size={16} className="ml-auto opacity-50" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-50">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-gray-50">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {user?.name?.charAt(0) || "U"}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>







                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside >

            {/* Main Content */}
            < main className="flex-1 md:ml-64 p-4 md:p-8 overflow-x-hidden" >
                <Outlet />
            </main >
        </div >
    );
};

export default Layout;
