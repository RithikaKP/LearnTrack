import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const ActivityCalendar = ({ selectedDate, onDateSelect }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [calendarDays, setCalendarDays] = useState([]);

    useEffect(() => {
        generateCalendar(currentMonth);
    }, [currentMonth]);

    const generateCalendar = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)

        const days = [];

        // Padding for previous month
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        // Days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        setCalendarDays(days);
    };

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
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                        <CalendarIcon size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">Activity Calendar</h2>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1 hover:bg-white hover:shadow-sm rounded-md text-gray-400 hover:text-gray-600 transition-all"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-medium text-gray-600 min-w-[80px] text-center">
                        {currentMonth.toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                    </span>
                    <button
                        onClick={handleNextMonth}
                        className="p-1 hover:bg-white hover:shadow-sm rounded-md text-gray-400 hover:text-gray-600 transition-all"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isTodayDate = day && isToday(day);

                    return (
                        <div key={index} className="flex justify-center items-center py-1">
                            {day && (
                                <button
                                    onClick={() => onDateSelect(day)}
                                    className={`
                                        w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-all
                                        ${isSelected
                                            ? 'bg-indigo-600 text-white shadow-md font-bold'
                                            : isTodayDate
                                                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 font-semibold hover:bg-indigo-100'
                                                : 'text-gray-600 hover:bg-gray-50'
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

            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                        Selected
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-50 border border-indigo-200"></span>
                        Today
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityCalendar;
