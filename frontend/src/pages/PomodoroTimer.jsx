import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { Play, Pause, RotateCcw, Coffee, Timer, Flame, Clock } from 'lucide-react';
import { SubjectContext } from '../context/SubjectContext';
import { AuthContext } from '../context/AuthContext';
import sessionService from '../context/sessionService';

const MODES = {
    pomodoro: { label: 'Work', duration: 25, type: 'pomodoro', icon: Timer },
    shortBreak: { label: 'Short Break', duration: 5, type: 'shortBreak', icon: Coffee },
    longBreak: { label: 'Long Break', duration: 15, type: 'longBreak', icon: Coffee },
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

    const timerRef = useRef(null);

    const audioStartRef = useRef(new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'));
    const audioEndRef = useRef(new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg'));

    const fetchStats = useCallback(async () => {
        try {
            const data = await sessionService.getStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch timer stats", error);
        }
    }, []);

    const playSound = useCallback((audioRef) => {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => { });
    }, []);

    useEffect(() => {
        let isMounted = true;

        if (user) {
            sessionService.getStats()
                .then((data) => {
                    if (isMounted) setStats(data);
                })
                .catch((error) => {
                    console.error("Failed to fetch timer stats", error);
                });
        }

        return () => {
            isMounted = false;
        };
    }, [user]);

    const currentMode = MODES[mode];

    const completeTimerSession = useCallback(() => {
        clearInterval(timerRef.current);
        setIsActive(false);
        playSound(audioEndRef);

        if (mode === 'pomodoro') {
            const newCount = pomodoriCount + 1;
            setPomodoriCount(newCount);

            if (sessionData) {
                sessionService.completeSession(
                    sessionData._id,
                    { actualTime: MODES.pomodoro.duration }
                ).catch((err) => {
                    console.error(err);
                }).finally(() => {
                    setSessionData(null);
                    fetchStats();
                });
            }
            setMode(newCount % 4 === 0 ? 'longBreak' : 'shortBreak');
        } else {
            setMode('pomodoro');
        }
    }, [mode, pomodoriCount, sessionData, fetchStats, playSound]);

    useEffect(() => {
        if (!isActive) return undefined;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    window.setTimeout(() => completeTimerSession(), 0);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [isActive, completeTimerSession]);


    const toggleTimer = async () => {
        if (!isActive) {
            if (mode === 'pomodoro' && !selectedSubject) {
                alert('Please select a subject first!');
                return;
            }
            if (mode === 'pomodoro' && !sessionData) {
                try {
                    const newSession = await sessionService.createSession({
                        subjectId: selectedSubject,
                        sessionType: 'pomodoro',
                        duration: MODES.pomodoro.duration,
                        startTime: new Date(),
                    });
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

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return (
            <div className="text-center font-sans">
                <p className="text-5xl font-semibold tracking-tight text-zinc-900 leading-none">
                    {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
                </p>
                <p className="text-[10px] text-zinc-400 font-bold mt-3 uppercase tracking-widest">
                    {!isActive ? 'Ready' :
                        mode === 'shortBreak' ? 'Relax' :
                            mode === 'longBreak' ? 'Recharge' : 'Focusing'}
                </p>
            </div>
        );
    };

    return (
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 font-sans text-zinc-800 bg-white min-h-screen">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-zinc-100 rounded-xl text-zinc-900 border border-zinc-200/50">
                    <Timer size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Focus Timer</h1>
                    <p className="text-sm text-zinc-500">Log study sessions and take timed breaks to boost efficiency.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 rounded-xl bg-white p-6 sm:p-8 border border-zinc-200/60 shadow-sm flex flex-col justify-between">
                    
                    <div className="flex bg-zinc-100/80 p-1 border border-zinc-200/20 rounded-lg mb-8">
                        {Object.values(MODES).map((m) => (
                            <button
                                key={m.type}
                                onClick={() => !isActive && setMode(m.type)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer
                                    ${mode === m.type
                                        ? "bg-zinc-950 text-white shadow-sm"
                                        : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50"
                                    }`}
                            >
                                <m.icon size={14} />
                                {m.label}
                            </button>
                        ))}
                    </div>

                    <div className="mb-8 max-w-xs w-full mx-auto">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 text-center select-none">Current Focus Subject</label>
                        <div className="relative">
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                disabled={isActive && mode === 'pomodoro'}
                                className="w-full px-4 py-2.5 text-xs rounded-lg border border-zinc-200 bg-zinc-50/50 text-zinc-800 font-semibold focus:border-zinc-800 hover:border-zinc-300 transition-all outline-none text-center appearance-none cursor-pointer shadow-sm"
                            >
                                <option value="">Select a Subject...</option>
                                {subjects.map((sub) => (
                                    <option key={sub._id} value={sub._id}>{sub.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center mb-8 select-none">
                        <div className="w-64 h-64 rounded-full border-4 border-zinc-100 flex items-center justify-center relative shadow-inner">
                            <div className="absolute inset-2 rounded-full border border-zinc-200/60 flex items-center justify-center">
                                {formatTime(timeLeft)}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-4 pt-4 border-t border-zinc-100">
                        <button
                            onClick={toggleTimer}
                            className="w-14 h-14 rounded-full bg-zinc-950 text-white flex items-center justify-center shadow-md hover:bg-zinc-900 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                            {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                        </button>
                        <button
                            onClick={resetTimer}
                            className="w-10 h-10 rounded-full border border-zinc-200 bg-white text-zinc-500 flex items-center justify-center hover:bg-zinc-50 hover:text-zinc-800 transition-all cursor-pointer shadow-sm"
                            title="Reset Timer"
                        >
                            <RotateCcw size={16} />
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-zinc-200/60 rounded-xl p-5 shadow-sm">
                        <h3 className="font-semibold text-sm text-zinc-900 mb-5 flex items-center gap-2 pb-3 border-b border-zinc-100 select-none">
                            <Flame className="text-orange-500" size={18} /> Today's Progress
                        </h3>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200/30 rounded-lg text-xs">
                                <span className="text-zinc-500 font-medium">Completed Blocks</span>
                                <span className="font-bold text-zinc-900">{stats ? stats.sessionsToday : 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200/30 rounded-lg text-xs">
                                <span className="text-zinc-500 font-medium">Focused study</span>
                                <span className="font-bold text-zinc-900">{stats ? Math.floor(stats.timeToday) : 0}m</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-orange-50/60 border border-orange-200/30 rounded-lg text-xs text-orange-700">
                                <span className="font-medium flex items-center gap-1"><Flame size={14} /> Daily Streak</span>
                                <span className="font-bold">{user?.currentStreak || 0} days</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-zinc-100">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5">Current Interval Blocks</p>
                            <div className="flex gap-2">
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-2 flex-1 rounded-full transition-all duration-300 ${i < pomodoriCount % 4
                                            ? 'bg-zinc-950'
                                            : 'bg-zinc-100'
                                            }`}
                                    />
                                ))}
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-2 text-center">
                                {4 - (pomodoriCount % 4)} blocks left until Long Break
                            </p>
                        </div>
                    </div>

                    <div className="bg-zinc-50 border border-zinc-200/60 rounded-xl p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="bg-zinc-950 text-white p-2 rounded-lg">
                                <Clock size={18} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-xs text-zinc-900 mb-1">Focus Tips</h4>
                                <p className="text-zinc-500 text-xs leading-relaxed italic">
                                    "The secret of getting ahead is getting started. Break down complex tasks, focus for 25 minutes, and reward yourself with a break."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PomodoroTimer;
