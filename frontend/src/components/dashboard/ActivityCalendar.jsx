import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const ActivityCalendar = ({ selectedDate, onDateSelect }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay();

        const days = [];

        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    }, [currentMonth]);

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const isToday = (date) => {
        return isSameDay(date, new Date());
    };

    return (
        <div className="bg-white border border-zinc-200/70 rounded-2xl p-5 shadow-sm font-sans text-zinc-800 transition-all duration-200 hover:border-zinc-300 hover:shadow-[0_18px_44px_-24px_rgba(24,24,27,0.35)]">
            <div className="flex items-center justify-between mb-5 gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="bg-zinc-100 p-2 rounded-xl text-zinc-900 border border-zinc-200/70">
                        <CalendarIcon size={18} />
                    </div>
                    <h2 className="text-[11px] font-bold tracking-[0.24em] text-zinc-900 uppercase">Activity Calendar</h2>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-100/80 rounded-xl p-1 border border-zinc-200/70 shadow-sm">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-700 min-w-19 text-center select-none">
                        {currentMonth.toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                    </span>
                    <button
                        onClick={handleNextMonth}
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
                    <div key={i} className="text-center text-[9px] font-bold text-zinc-400 py-1 uppercase tracking-[0.2em]">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isTodayDate = day && isToday(day);

                    return (
                        <div key={index} className="flex justify-center items-center py-0.5">
                            {day && (
                                <button
                                    onClick={() => onDateSelect(day)}
                                    className={`
                                        w-8 h-8 flex items-center justify-center rounded-lg text-xs transition-all duration-150 cursor-pointer hover:-translate-y-0.5
                                        ${isSelected
                                            ? 'bg-zinc-950 text-white font-semibold shadow-sm ring-2 ring-zinc-950/10'
                                            : isTodayDate
                                                ? 'bg-zinc-100 text-zinc-900 border border-zinc-300 font-semibold hover:bg-zinc-200'
                                                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                                        }
                                    `}
                                >
                                    {day.getDate()}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-zinc-950"></span>
                        Selected Date
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded bg-zinc-100 border border-zinc-300"></span>
                        Today
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityCalendar;
