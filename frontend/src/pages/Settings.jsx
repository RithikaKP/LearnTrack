import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Settings as SettingsIcon, User, Bell, Shield, Keyboard, Save, Check } from 'lucide-react';

const Settings = () => {
    const { user } = useContext(AuthContext);
    const [saved, setSaved] = useState(false);
    
    const [theme, setTheme] = useState(() => localStorage.getItem('learnTrack-theme') || 'light');
    const [dailyTarget, setDailyTarget] = useState(() => localStorage.getItem('learnTrack-daily-target') || '60');
    const [notifications, setNotifications] = useState(true);
    const [profileData, setProfileData] = useState({
        name: user?.name || 'Rithika KP',
        email: user?.email || 'rithika@example.com',
        college: 'Technical University',
    });

    useEffect(() => {
        localStorage.setItem('learnTrack-theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const handleSave = (e) => {
        e.preventDefault();
        localStorage.setItem('learnTrack-daily-target', dailyTarget);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 font-sans bg-white min-h-screen text-zinc-800">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-zinc-100 rounded-xl text-zinc-900 border border-zinc-200/50">
                        <SettingsIcon size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Settings</h1>
                        <p className="text-sm text-zinc-500">Manage your profile, preferences, and account configuration.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1 space-y-1">
                        {[
                            { id: 'profile', icon: User, label: 'Profile' },
                            { id: 'preferences', icon: SettingsIcon, label: 'Preferences' },
                            { id: 'notifications', icon: Bell, label: 'Notifications' },
                            { id: 'security', icon: Shield, label: 'Security & API' },
                            { id: 'shortcuts', icon: Keyboard, label: 'Shortcuts' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-all duration-150 ${
                                    item.id === 'profile' || item.id === 'preferences'
                                        ? 'bg-zinc-100 text-zinc-900 font-medium'
                                        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'
                                }`}
                            >
                                <item.icon size={16} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="md:col-span-3 space-y-6">
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="bg-white border border-zinc-200/60 rounded-xl shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-zinc-100 bg-zinc-50/50">
                                    <h3 className="text-sm font-semibold text-zinc-900">Personal Information</h3>
                                    <p className="text-xs text-zinc-500">Update your account name and email address.</p>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Name</label>
                                            <input
                                                type="text"
                                                value={profileData.name}
                                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-800 bg-zinc-50/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Email Address</label>
                                            <input
                                                type="email"
                                                value={profileData.email}
                                                disabled
                                                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-400 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">University / College</label>
                                        <input
                                            type="text"
                                            value={profileData.college}
                                            onChange={(e) => setProfileData({ ...profileData, college: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-800 bg-zinc-50/30"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-zinc-200/60 rounded-xl shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-zinc-100 bg-zinc-50/50">
                                    <h3 className="text-sm font-semibold text-zinc-900">Study Preferences</h3>
                                    <p className="text-xs text-zinc-500">Customize how LearnTrack feels and behave.</p>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Interface Theme</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setTheme('light')}
                                                    className={`py-2 px-3 border rounded-lg text-xs font-medium transition-all ${
                                                        theme === 'light'
                                                            ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                                                            : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                                                    }`}
                                                >
                                                    Light
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTheme('dark')}
                                                    className={`py-2 px-3 border rounded-lg text-xs font-medium transition-all ${
                                                        theme === 'dark'
                                                            ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                                                            : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                                                    }`}
                                                >
                                                    Dark Mode
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Daily Study Goal (Minutes)</label>
                                            <select
                                                value={dailyTarget}
                                                onChange={(e) => setDailyTarget(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg outline-none focus:border-zinc-800 bg-zinc-50/30"
                                            >
                                                <option value="30">30 minutes</option>
                                                <option value="60">60 minutes</option>
                                                <option value="90">90 minutes</option>
                                                <option value="120">120 minutes</option>
                                                <option value="180">180 minutes</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-semibold text-zinc-800">Email Notifications</h4>
                                            <p className="text-[10px] text-zinc-400">Receive weekly summaries and streak reminders.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setNotifications(!notifications)}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                                notifications ? 'bg-zinc-900' : 'bg-zinc-200'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                    notifications ? 'translate-x-4' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 bg-zinc-950 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-zinc-900 shadow-sm hover:translate-y-[-0.5px] active:translate-y-0 transition-all cursor-pointer"
                                >
                                    {saved ? <Check size={16} /> : <Save size={16} />}
                                    <span>{saved ? 'Changes Saved!' : 'Save Settings'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
