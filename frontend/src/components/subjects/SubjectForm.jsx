import { useState, useEffect } from 'react';
import { X, Sparkles, BookOpen, Plus, Trash2, ArrowUp, ArrowDown, Check, Loader2, Calendar, Info } from 'lucide-react';
import topicService from '../../context/topicService';

const COLORS = [
    '#4F7DF3',
    '#5FA8A0',
    '#22B573',
    '#A985D6',
    '#F4B400',
    '#F26D5B',
    '#9C3D7A',
    '#64748B'
];

const ICONS = ['📚', '💻', '🎯', '🧠', '⚡', '🚀', '📊', '🔬', '🎨', '🌟'];

const getNextAvailableColor = (existingSubjects = []) => {
    if (!existingSubjects || existingSubjects.length === 0) return COLORS[0];
    const usedColors = new Set(existingSubjects.map(s => s.color ? s.color.toUpperCase() : ''));
    for (const c of COLORS) {
        if (!usedColors.has(c.toUpperCase())) {
            return c;
        }
    }
    return COLORS[existingSubjects.length % COLORS.length];
};

const getColorByName = (subjectName, existingSubjects = []) => {
    const nameLower = (subjectName || '').toLowerCase().trim();
    if (nameLower.includes('operating system') || nameLower.includes('os')) return '#4F7DF3';
    if (nameLower.includes('dbms') || nameLower.includes('database')) return '#22B573';
    if (nameLower.includes('dsa') || nameLower.includes('data structure') || nameLower.includes('algorithm')) return '#A985D6';
    if (nameLower.includes('computer network') || nameLower.includes('network')) return '#5FA8A0';
    if (nameLower.includes('system design')) return '#F26D5B';
    if (nameLower.includes('java')) return '#F4B400';
    if (nameLower.includes('react')) return '#9C3D7A';
    
    return getNextAvailableColor(existingSubjects);
};
const GOALS = [
    {
        id: 'Beginner',
        title: 'Beginner',
        emoji: '🌱',
        description: 'I have never learned this subject and want to build a strong foundation.'
    },
    {
        id: 'Intermediate',
        title: 'Intermediate',
        emoji: '🚀',
        description: 'I know the basics and want to become industry-ready.'
    },
    {
        id: 'Advanced',
        title: 'Advanced',
        emoji: '🔥',
        description: 'I already know this subject and want to master advanced concepts.'
    },
    {
        id: 'Placement / FAANG',
        title: 'Placement / FAANG',
        emoji: '💼',
        description: 'Generate an interview-oriented roadmap focusing on frequently asked concepts and industry expectations.'
    }
];

const SubjectForm = ({ isOpen, onClose, onSubmit, initialData, subjects = [] }) => {
    const [step, setStep] = useState(1);
    const [method, setMethod] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState(COLORS[0]);
    const [icon, setIcon] = useState(ICONS[0]);
    const [status, setStatus] = useState('active');
    const [userHasChangedColor, setUserHasChangedColor] = useState(false);

    const [topics, setTopics] = useState([]);
    const [topicInput, setTopicInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateQuery, setGenerateQuery] = useState('');
    const [learningGoal, setLearningGoal] = useState('Beginner');
    const [generateSubStep, setGenerateSubStep] = useState('subject');

    const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [dailyTarget, setDailyTarget] = useState(2);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setDescription(initialData.description || '');
            setColor(initialData.color || COLORS[0]);
            setIcon(initialData.icon || ICONS[0]);
            setStatus(initialData.status || 'active');
            setDailyTarget(initialData.dailyTarget || 2);
            setUserHasChangedColor(true);
            if (initialData.startDate) {
                setStartDate(new Date(initialData.startDate).toISOString().split('T')[0]);
            }
        } else {
            setStep(1);
            setMethod(null);
            setName('');
            setDescription('');
            setColor(getNextAvailableColor(subjects));
            setIcon(ICONS[0]);
            setStatus('active');
            setTopics([]);
            setTopicInput('');
            setGenerateQuery('');
            setStartDate(new Date().toISOString().split('T')[0]);
            setDailyTarget(2);
            setUserHasChangedColor(false);
            setLearningGoal('Beginner');
            setGenerateSubStep('subject');
        }
    }, [initialData, isOpen, subjects]);

    if (!isOpen) return null;

    const handleAddTopic = () => {
        if (!topicInput.trim()) return;
        setTopics(prev => [...prev, { name: topicInput.trim(), description: 'Custom added topic' }]);
        setTopicInput('');
    };

    const handleRemoveTopic = (index) => {
        setTopics(prev => prev.filter((_, i) => i !== index));
    };

    const handleRenameTopic = (index, newName) => {
        setTopics(prev => prev.map((t, i) => i === index ? { ...t, name: newName } : t));
    };

    const handleMoveTopic = (index, direction) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === topics.length - 1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        setTopics(prev => {
            const list = [...prev];
            const temp = list[index];
            list[index] = list[targetIndex];
            list[targetIndex] = temp;
            return list;
        });
    };

    const handleRegenerateTopic = (index) => {
        const currentName = topics[index].name;
        const variations = [
            `${currentName} Masterclass`,
            `${currentName} Deep Dive`,
            `Practical ${currentName} Exercises`,
            `${currentName} Best Practices & Security`,
            `Advanced ${currentName} Concepts`
        ];
        const randomVariation = variations[Math.floor(Math.random() * variations.length)];
        setTopics(prev => prev.map((t, i) => i === index ? { ...t, name: randomVariation } : t));
    };

    const triggerGenerate = async () => {
        if (!generateQuery.trim()) return;
        setIsGenerating(true);
        try {
            const result = await topicService.generateSuggestions(generateQuery.trim(), learningGoal);
            setName(generateQuery.trim());
            setTopics(result || []);
        } catch (error) {
            console.error('Failed to generate syllabus:', error);
            alert('Failed to generate. Please check your network or try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            name,
            description,
            color,
            icon,
            dailyTarget: parseInt(dailyTarget, 10),
            startDate
        };

        if (initialData) {
            payload.status = status;
            onSubmit(payload);
        } else {
            payload.topics = topics;
            onSubmit(payload);
        }
    };

    const calculateEndDate = (paceValue) => {
        const total = topics.length;
        if (total === 0) return 'N/A';
        const days = Math.ceil(total / paceValue);
        const date = new Date(startDate);
        date.setDate(date.getDate() + days - 1);
        return {
            days,
            dateStr: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        };
    };

    const isFormValid = name.trim() !== '' && startDate !== '' && parseInt(dailyTarget, 10) >= 1 && topics.length > 0;

    if (initialData) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-zinc-50">
                        <h2 className="text-base font-bold text-zinc-900 flex items-center gap-1.5">
                            <BookOpen size={16} /> Edit Subject settings
                        </h2>
                        <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-200/50 rounded-full transition-colors cursor-pointer">
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Subject Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-200 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows="2"
                                className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-200 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none resize-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-200 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition-all bg-white"
                                >
                                    <option value="active">Active</option>
                                    <option value="paused">Paused</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Pace (topics/day)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={dailyTarget}
                                    onChange={(e) => setDailyTarget(e.target.value)}
                                    required
                                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-200 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Icon</label>
                                <select
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-200 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition-all bg-white"
                                >
                                    {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Color Label</label>
                                <div className="flex gap-1.5 flex-wrap">
                                    {COLORS.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => {
                                                setColor(c);
                                                setUserHasChangedColor(true);
                                            }}
                                            className={`w-6 h-6 rounded-full border transition-transform ${color === c ? 'scale-110 border-zinc-950 ring-1 ring-zinc-950' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer shadow-sm"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col font-sans text-zinc-800">
                
                <div className="flex items-center justify-between p-5 border-b border-zinc-150/70 bg-zinc-50 shrink-0">
                    <div>
                        <h2 className="text-base font-bold text-zinc-900 flex items-center gap-1.5">
                            <Sparkles size={16} className="text-zinc-500" /> New Study Plan Wizard
                        </h2>
                        <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Step {step} of 3: {
                            step === 1 ? 'Choose syllabus type' : step === 2 ? 'Build your topic list' : 'Configure schedule pace'
                        }</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-200/50 rounded-full transition-colors cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
                    
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="text-center max-w-md mx-auto mb-6">
                                <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">How would you like to build your syllabus?</h3>
                                <p className="text-xs text-zinc-400 mt-1">Select a method below to generate topics automatically or design your own study schedule.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => { setMethod('generate'); setStep(2); }}
                                    className="p-5 border border-zinc-200 hover:border-zinc-950 bg-white rounded-xl text-left transition-all hover:shadow-md cursor-pointer group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="w-10 h-10 bg-indigo-50 border border-indigo-150 rounded-lg flex items-center justify-center text-xl mb-3 group-hover:scale-105 transition-transform">
                                            ✨
                                        </div>
                                        <h4 className="font-bold text-sm text-zinc-900">Generate Topics</h4>
                                        <p className="text-[11px] text-zinc-450 mt-1.5 leading-relaxed">
                                            Use AI to generate a structured, professional curriculum. Best for interview preparation, development stacks, and programming languages.
                                        </p>
                                    </div>
                                    <div className="text-[10px] font-bold text-indigo-650 mt-4 select-none">
                                        React, DSA, Operating Systems, AWS &rarr;
                                    </div>
                                </button>

                                <button
                                    onClick={() => { setMethod('custom'); setStep(2); }}
                                    className="p-5 border border-zinc-200 hover:border-zinc-950 bg-white rounded-xl text-left transition-all hover:shadow-md cursor-pointer group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center text-xl mb-3 group-hover:scale-105 transition-transform">
                                            📚
                                        </div>
                                        <h4 className="font-bold text-sm text-zinc-900">Custom Curriculum</h4>
                                        <p className="text-[11px] text-zinc-450 mt-1.5 leading-relaxed">
                                            Manually define your syllabus structure. Best for university exams, college courses, coaching sheets, and highly customized study routes.
                                        </p>
                                    </div>
                                    <div className="text-[10px] font-bold text-zinc-650 mt-4 select-none">
                                        Create custom syllabi manually &rarr;
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in duration-200 space-y-4">
                            
                            {method === 'generate' && topics.length === 0 && (
                                <>
                                    {generateSubStep === 'subject' && (
                                        <div className="space-y-4 py-8 max-w-md mx-auto text-center animate-in fade-in duration-200">
                                            <h3 className="font-bold text-sm text-zinc-900 uppercase tracking-wide">What subject are you learning?</h3>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={generateQuery}
                                                    onChange={(e) => {
                                                        setGenerateQuery(e.target.value);
                                                        if (!userHasChangedColor) {
                                                            setColor(getColorByName(e.target.value, subjects));
                                                        }
                                                    }}
                                                    placeholder="e.g. React hooks, Operating Systems, AWS Practitioner"
                                                    className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-zinc-250 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition-all"
                                                    onKeyDown={(e) => e.key === 'Enter' && generateQuery.trim() && setGenerateSubStep('goal')}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setGenerateSubStep('goal')}
                                                    disabled={!generateQuery.trim()}
                                                    className="px-4 py-2 bg-zinc-950 text-white font-semibold rounded-lg text-xs hover:bg-zinc-900 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                                                >
                                                    Next &rarr;
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-zinc-400">Common inputs: React, DBMS, System Design, Java, Machine Learning, DSA</p>
                                        </div>
                                    )}

                                    {generateSubStep === 'goal' && (
                                        <div className="space-y-4 animate-in fade-in duration-200">
                                            <div className="text-center max-w-md mx-auto mb-4">
                                                <h3 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">Choose Your Learning Goal</h3>
                                                <p className="text-[11px] text-zinc-400 mt-1">Select the target depth for the AI generated syllabus of <strong className="text-zinc-700">"{generateQuery}"</strong>.</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {GOALS.map(goal => (
                                                    <button
                                                        type="button"
                                                        key={goal.id}
                                                        onClick={() => setLearningGoal(goal.id)}
                                                        className={`p-4 border rounded-xl text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between h-full select-none ${
                                                            learningGoal === goal.id
                                                                ? 'border-indigo-650 bg-indigo-50/30 shadow-sm ring-1 ring-indigo-650'
                                                                : 'border-zinc-200 hover:border-zinc-400 bg-white hover:bg-zinc-50/20'
                                                        }`}
                                                    >
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xl leading-none">{goal.emoji}</span>
                                                                    <span className="font-extrabold text-xs text-zinc-900 tracking-tight">{goal.title}</span>
                                                                </div>
                                                                {learningGoal === goal.id && (
                                                                    <span className="w-4 h-4 rounded-full bg-indigo-650 flex items-center justify-center text-[10px] text-white">
                                                                        ✓
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-zinc-500 leading-relaxed font-normal">
                                                                {goal.description}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex justify-between items-center pt-4 mt-6 border-t border-zinc-100 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setGenerateSubStep('subject')}
                                                    className="px-4 py-2 border border-zinc-250 text-zinc-650 hover:bg-zinc-50 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                                                >
                                                    &larr; Back
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={triggerGenerate}
                                                    disabled={isGenerating}
                                                    className="px-4 py-2 bg-zinc-950 text-white font-semibold rounded-lg text-xs hover:bg-zinc-900 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                                                >
                                                    {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                                                    Generate Topics
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {((method === 'generate' && topics.length > 0) || method === 'custom') && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-zinc-100 pb-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Subject Name</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => {
                                                    setName(e.target.value);
                                                    if (!userHasChangedColor) {
                                                        setColor(getColorByName(e.target.value, subjects));
                                                    }
                                                }}
                                                placeholder="e.g. Learn React V2"
                                                required
                                                className="w-full px-3 py-1.5 text-xs rounded border border-zinc-200 focus:border-zinc-950 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Subject Description</label>
                                            <input
                                                type="text"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="e.g. Master React fundamentals and advanced patterns"
                                                className="w-full px-3 py-1.5 text-xs rounded border border-zinc-200 focus:border-zinc-950 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50/50 p-3 rounded-lg border border-zinc-150/40">
                                        <div className="flex items-center gap-2">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider select-none shrink-0">Icon</label>
                                            <select
                                                value={icon}
                                                onChange={(e) => setIcon(e.target.value)}
                                                className="px-2.5 py-1 text-xs rounded border border-zinc-200 bg-white"
                                            >
                                                {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider select-none shrink-0">Color</label>
                                            <div className="flex gap-1 flex-wrap">
                                                {COLORS.map(c => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => {
                                                            setColor(c);
                                                            setUserHasChangedColor(true);
                                                        }}
                                                        className={`w-4 h-4 rounded-full border transition-transform ${color === c ? 'scale-110 border-zinc-900 ring-1 ring-zinc-900' : 'border-transparent'}`}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                                                Syllabus Checklist ({topics.length} topics)
                                            </h4>
                                            <span className="text-[10px] text-zinc-450">Drag order using Up/Down</span>
                                        </div>

                                        <div className="border border-zinc-200/80 rounded-xl divide-y divide-zinc-100 max-h-[260px] overflow-y-auto bg-zinc-50/20">
                                            {topics.length === 0 ? (
                                                <div className="p-8 text-center text-xs text-zinc-400 italic">No topics in this curriculum yet. Add some below!</div>
                                            ) : (
                                                topics.map((t, idx) => (
                                                    <div key={idx} className="p-2.5 flex items-center justify-between gap-3 bg-white hover:bg-zinc-50 group transition-colors">
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <span className="text-xs font-bold text-zinc-400 select-none w-5">{idx + 1}</span>
                                                            <input
                                                                type="text"
                                                                value={t.name}
                                                                onChange={(e) => handleRenameTopic(idx, e.target.value)}
                                                                className="flex-1 bg-transparent hover:bg-zinc-50 focus:bg-zinc-100 text-xs px-2 py-1 rounded border border-transparent focus:border-zinc-200 outline-none"
                                                            />
                                                        </div>

                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleMoveTopic(idx, 'up')}
                                                                disabled={idx === 0}
                                                                className="p-1 text-zinc-400 hover:text-zinc-800 disabled:opacity-30 rounded hover:bg-zinc-155"
                                                            >
                                                                <ArrowUp size={11} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleMoveTopic(idx, 'down')}
                                                                disabled={idx === topics.length - 1}
                                                                className="p-1 text-zinc-400 hover:text-zinc-800 disabled:opacity-30 rounded hover:bg-zinc-155"
                                                            >
                                                                <ArrowDown size={11} />
                                                            </button>
                                                            {method === 'generate' && (
                                                                <button
                                                                    onClick={() => handleRegenerateTopic(idx)}
                                                                    className="px-1.5 py-0.5 text-[9px] bg-zinc-100 text-zinc-600 rounded hover:bg-zinc-200 border border-zinc-200/50"
                                                                    title="Regenerate theme variation"
                                                                >
                                                                    Var
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleRemoveTopic(idx)}
                                                                className="p-1 text-zinc-400 hover:text-red-650 rounded hover:bg-red-50"
                                                            >
                                                                <Trash2 size={11} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className="flex gap-2 mt-3 bg-zinc-50 border border-zinc-150/60 p-2 rounded-xl">
                                            <input
                                                type="text"
                                                value={topicInput}
                                                onChange={(e) => setTopicInput(e.target.value)}
                                                placeholder="Add custom topic..."
                                                className="flex-1 px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-md outline-none"
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                                            />
                                            <button
                                                onClick={handleAddTopic}
                                                className="px-3.5 py-1.5 bg-zinc-950 text-white rounded-lg text-xs hover:bg-zinc-900 font-bold flex items-center gap-1 cursor-pointer"
                                            >
                                                <Plus size={12} /> Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in duration-200 space-y-6">
                            <div className="bg-zinc-950 text-white p-5 rounded-2xl border border-zinc-850/80 shadow-md flex justify-between items-center relative overflow-hidden">
                                <div className="absolute top-[-20px] right-[-20px] w-24 h-24 rounded-full bg-zinc-800/40 blur-2xl"></div>
                                <div className="z-10">
                                    <span className="text-[9px] font-black tracking-wider uppercase text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full select-none">SYLLABUS TOTAL</span>
                                    <h4 className="text-xl font-bold mt-2">{topics.length} Learning Topics</h4>
                                    <p className="text-xs text-zinc-400 mt-0.5">Redistributed across study schedule days.</p>
                                </div>
                                <div className="text-3xl select-none z-10">{icon}</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Start Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            required
                                            className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-zinc-250 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition-all"
                                        />
                                        <Calendar size={14} className="absolute left-3 top-3 text-zinc-400" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Topics Per Day</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={dailyTarget}
                                        onChange={(e) => setDailyTarget(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                        required
                                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-250 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">Live Study Pace Preview</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {[1, 2, 3].map(paceOption => {
                                        const est = calculateEndDate(paceOption);
                                        return (
                                            <button
                                                key={paceOption}
                                                type="button"
                                                onClick={() => setDailyTarget(paceOption)}
                                                className={`p-4 border rounded-xl text-left transition-all ${
                                                    dailyTarget === paceOption
                                                        ? 'border-zinc-950 bg-zinc-950/5/5 shadow-sm'
                                                        : 'border-zinc-200 hover:border-zinc-350 bg-white'
                                                }`}
                                            >
                                                <div className="flex justify-between items-center mb-1 select-none">
                                                    <span className="text-xs font-bold text-zinc-900">{paceOption} Topic / Day</span>
                                                    {dailyTarget === paceOption && <div className="w-2 h-2 rounded-full bg-zinc-900" />}
                                                </div>
                                                <p className="text-[10px] text-zinc-450 mt-1 select-none">Estimated Completion:</p>
                                                <p className="text-xs font-bold text-zinc-800 mt-0.5 select-none">{est.dateStr}</p>
                                                <p className="text-[9px] text-zinc-400 mt-0.5 uppercase tracking-wider select-none">{est.days} Days schedule</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl text-xs text-sky-850 flex gap-2.5">
                                <Info size={16} className="text-sky-500 shrink-0 mt-0.5" />
                                <div className="leading-relaxed">
                                    <p className="font-semibold text-sky-950">Study Schedule Allocation</p>
                                    <p className="text-sky-800 mt-0.5">
                                        Selecting <strong>{dailyTarget} topics per day</strong> starting <strong>{new Date(startDate).toLocaleDateString()}</strong> will automatically allocate your {topics.length} topics across study days. You will complete your plan on <strong>{calculateEndDate(dailyTarget).dateStr}</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-zinc-150/70 bg-zinc-50 flex justify-between shrink-0">
                    <div>
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={() => setStep(prev => prev - 1)}
                                className="px-4 py-2 border border-zinc-300 hover:bg-zinc-150 rounded-lg text-xs font-bold text-zinc-650 transition-all cursor-pointer"
                            >
                                Back
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-200/50 rounded-lg transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>

                        {step === 2 && topics.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                className="px-4 py-2 bg-zinc-950 text-white hover:bg-zinc-900 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                            >
                                Next: Scheduling
                            </button>
                        )}

                        {step === 3 && (
                            <button
                                type="button"
                                onClick={isFormValid ? handleSubmit : null}
                                disabled={!isFormValid}
                                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                                    isFormValid
                                        ? 'bg-zinc-950 text-white hover:bg-zinc-900 cursor-pointer shadow-sm shadow-zinc-200'
                                        : 'bg-zinc-150 text-zinc-400 border border-zinc-250 cursor-not-allowed shadow-none'
                                }`}
                            >
                                Confirm & Create study plan
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubjectForm;
