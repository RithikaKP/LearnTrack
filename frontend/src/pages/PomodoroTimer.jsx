import { useState, useEffect, useRef, useContext } from 'react';
import { Play, Pause, RotateCcw, Coffee, Timer, Flame, Clock } from 'lucide-react';
import { SubjectContext } from '../context/SubjectContext';
import { AuthContext } from '../context/AuthContext';
import sessionService from '../context/sessionService';

const MODES = {
    pomodoro: { label: 'Work', duration: 25, color: 'blue', type: 'pomodoro', icon: Timer },
    shortBreak: { label: 'Short Break', duration: 5, color: 'green', type: 'shortBreak', icon: Coffee },
    longBreak: { label: 'Long Break', duration: 15, color: 'purple', type: 'longBreak', icon: Coffee },
};

const PomodoroTimer = () => {
    const { subjects } = useContext(SubjectContext);
    const { user } = useContext(AuthContext);

    const [mode, setMode] = useState('pomodoro');
    const [timeLeft, setTimeLeft] = useState(MODES.pomodoro.duration * 60);
    const [isActive, setIsActive] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [sessionData, setSessionData] = useState(null);
    const [pomodoriCount, setPomodoriCount] = useState(0);
    const [stats, setStats] = useState(null);

    // Fetch daily stats
    const fetchStats = async () => {
        try {
            const data = await sessionService.getStats(user.token);
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch timer stats", error);
        }
    };

    useEffect(() => {
        if (user) fetchStats();
    }, [user]);

    const timerRef = useRef(null);

    // Audio
    const audioStartRef = useRef(new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'));
    const audioEndRef = useRef(new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg'));

    const currentMode = MODES[mode];
    const activeColor = currentMode.color;

    // --- EFFECTS ---
    useEffect(() => {
        if (!isActive) {
            setTimeLeft(MODES[mode].duration * 60);
        }
    }, [mode]);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleComplete();
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    // --- HANDLERS ---
    const playSound = (audioRef) => {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => { });
    };

    const toggleTimer = async () => {
        if (!isActive) {
            if (mode === 'pomodoro' && !selectedSubject) {
                alert('Please select a subject first!');
                return;
            }
            if (mode === 'pomodoro' && !sessionData) {
                try {
                    const newSession = await sessionService.createSession(
                        {
                            subjectId: selectedSubject,
                            sessionType: 'pomodoro',
                            duration: MODES.pomodoro.duration,
                            startTime: new Date(),
                        },
                        user.token
                    );
                    setSessionData(newSession);
                } catch (err) {
                    console.error(err);
                    return;
                }
            }
            playSound(audioStartRef);
        }
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        clearInterval(timerRef.current);
        setIsActive(false);
        setTimeLeft(currentMode.duration * 60);
        setSessionData(null);
    };

    const handleComplete = async () => {
        clearInterval(timerRef.current);
        setIsActive(false);
        playSound(audioEndRef);

        if (mode === 'pomodoro') {
            const newCount = pomodoriCount + 1;
            setPomodoriCount(newCount);

            if (sessionData) {
                try {
                    await sessionService.completeSession(
                        sessionData._id,
                        { actualTime: MODES.pomodoro.duration },
                        user.token
                    );
                } catch (err) {
                    console.error(err);
                }
                setSessionData(null);
                fetchStats(); // Update progress card
            }
            setMode(newCount % 4 === 0 ? 'longBreak' : 'shortBreak');
        } else {
            setMode('pomodoro');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return (
            <div className="text-center">
                <p className="text-6xl font-bold text-gray-800">
                    {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
                </p>
                <p className="text-sm text-gray-500 font-medium mt-2 uppercase tracking-widest">
                    {!isActive ? 'Ready' :
                        mode === 'shortBreak' ? 'Relax' :
                            mode === 'longBreak' ? 'Recharge' : 'Focusing'}
                </p>
            </div>
        );
    };

    // Color Maps for Tailwind (Safelist these if needed, or use style)
    // We'll use inline styles or specific classes to ensure dynamic colors work
    const getColorClass = (color, type) => {
        const map = {
            blue: { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-500', ring: 'border-blue-100', text: 'text-blue-600' },
            green: { bg: 'bg-green-500', light: 'bg-green-50', border: 'border-green-500', ring: 'border-green-100', text: 'text-green-600' },
            purple: { bg: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-500', ring: 'border-purple-100', text: 'text-purple-600' },
        };
        return map[color]?.[type] || '';
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Timer className="text-indigo-600" /> Focus Timer
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ================= TIMER CARD ================= */}
                <div className={`lg:col-span-2 rounded-3xl bg-white p-8 shadow-lg border-t-8 transition-colors duration-500 ${getColorClass(activeColor, 'border')}`}>

                    {/* Mode Switch */}
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
                        {Object.values(MODES).map((m) => (
                            <button
                                key={m.type}
                                onClick={() => !isActive && setMode(m.type)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300
                                    ${mode === m.type
                                        ? `bg-white text-gray-900 shadow-md transform scale-100`
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                    }`}
                            >
                                <m.icon size={16} className={mode === m.type ? getColorClass(m.color, 'text') : ''} />
                                {m.label}
                            </button>
                        ))}
                    </div>

                    {/* Subject */}
                    <div className="mb-10 max-w-sm mx-auto">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 text-center">Current Focus</label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            disabled={isActive && mode === 'pomodoro'}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-gray-700 font-medium focus:border-indigo-500 focus:bg-white transition-all outline-none text-center appearance-none cursor-pointer"
                        >
                            <option value="">Select a Subject...</option>
                            {subjects.map((sub) => (
                                <option key={sub._id} value={sub._id}>{sub.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Timer Ring */}
                    <div className="flex flex-col items-center justify-center mb-10">
                        <div className={`w-72 h-72 rounded-full border-[20px] ${getColorClass(activeColor, 'ring')} flex items-center justify-center relative transition-colors duration-500`}>
                            {formatTime(timeLeft)}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-6">
                        <button
                            onClick={toggleTimer}
                            className={`w-20 h-20 rounded-2xl ${getColorClass(activeColor, 'bg')} text-white flex items-center justify-center shadow-lg shadow-blue-200/50 hover:scale-105 active:scale-95 transition-all`}
                        >
                            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>
                        <button
                            onClick={resetTimer}
                            className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 hover:text-gray-700 transition-all"
                        >
                            <RotateCcw size={22} />
                        </button>
                    </div>
                </div>

                {/* ================= PROGRESS CARD ================= */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Flame className="text-orange-500" size={20} /> Today's Progress
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <span className="text-gray-500 text-sm font-medium">Sessions</span>
                                <span className="text-xl font-bold text-gray-900">{stats ? stats.sessionsToday : 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <span className="text-gray-500 text-sm font-medium">Focus Time</span>
                                <span className="text-xl font-bold text-gray-900">{stats ? Math.floor(stats.timeToday) : 0}m</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                <span className="text-orange-600 text-sm font-medium flex items-center gap-1.5"><Flame size={16} /> Streak</span>
                                <span className="text-xl font-bold text-orange-600">{user?.currentStreak || 0}</span>
                            </div>
                        </div>

                        <div className="mt-8">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pomodoros</p>
                            <div className="flex flex-wrap gap-2">
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-3 flex-1 rounded-full transition-all duration-500 ${i < pomodoriCount % 4
                                            ? getColorClass(activeColor, 'bg')
                                            : 'bg-gray-100'
                                            }`}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-2 text-center">
                                {4 - (pomodoriCount % 4)} more until Long Break
                            </p>
                        </div>
                    </div>

                    {/* Tip Card */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg">
                        <div className="flex items-start gap-4">
                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                <Clock size={24} className="text-white" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">Stay Focused!</h4>
                                <p className="text-indigo-100 text-sm leading-relaxed">
                                    "The secret of getting ahead is getting started."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                /* Custom styles if needed */
            `}</style>
        </div>
    );
};

export default PomodoroTimer;
