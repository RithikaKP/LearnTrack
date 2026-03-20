import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, BarChart2 } from 'lucide-react';
import topicService from '../context/topicService';
import subjectService from '../context/subjectService';
import { AuthContext } from '../context/AuthContext';
import TopicCard from '../components/topics/TopicCard';
import TopicForm from '../components/topics/TopicForm';

const TopicTracker = () => {
    const { id: subjectId } = useParams();
    const { user } = useContext(AuthContext);

    const [subject, setSubject] = useState(null);
    const [topics, setTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            if (!user || !subjectId) return;
            try {
                const [subjectData, topicsData] = await Promise.all([
                    subjectService.getSubject(subjectId),
                    topicService.getTopics(subjectId)
                ]);
                setSubject(subjectData);
                setTopics(topicsData);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [subjectId, user]);

    // Handlers
    const handleStatusChange = async (topicId, newStatus) => {
        try {
            // Optimistic update
            setTopics(prev => prev.map(t =>
                t._id === topicId ? { ...t, status: newStatus } : t
            ));

            await topicService.updateTopicStatus(topicId, newStatus);

            // Refresh subject to get updated counters
            const updatedSubject = await subjectService.getSubject(subjectId);
            setSubject(updatedSubject);
        } catch (error) {
            console.error("Status update failed:", error);
        }
    };

    const handleCreate = async (topicData) => {
        try {
            // Include subjectId in creation
            const newTopic = await topicService.createTopic({ ...topicData, subjectId });

            // Add to list and sort
            setTopics(prev => [...prev, newTopic].sort((a, b) => a.dayNumber - b.dayNumber));

            // Refresh subject for counters
            const updatedSubject = await subjectService.getSubject(subjectId);
            setSubject(updatedSubject);
            setIsFormOpen(false);
        } catch (error) {
            console.error("Create failed:", error);
        }
    };

    const handleUpdate = async (topicData) => {
        if (!editingTopic) return;
        try {
            const updated = await topicService.updateTopic(editingTopic._id, topicData);
            setTopics(prev => prev.map(t => t._id === updated._id ? updated : t).sort((a, b) => a.dayNumber - b.dayNumber));
            setEditingTopic(null);
            setIsFormOpen(false);
        } catch (error) {
            console.error("Update failed:", error);
        }
    };

    const handleDelete = async (topicId) => {
        if (!window.confirm("Are you sure you want to delete this topic?")) return;
        try {
            await topicService.deleteTopic(topicId);
            setTopics(prev => prev.filter(t => t._id !== topicId));

            // Refresh subject counters
            const updatedSubject = await subjectService.getSubject(subjectId);
            setSubject(updatedSubject);
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const nextDayNumber = topics.length > 0
        ? Math.max(...topics.map(t => t.dayNumber)) + 1
        : 1;

    if (isLoading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500"></div></div>;
    if (!subject) return <div className="p-10 text-center">Subject not found</div>;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <Link to="/subjects" className="inline-flex items-center text-gray-400 hover:text-gray-600 mb-4 transition-colors">
                    <ArrowLeft size={16} className="mr-1" /> Back to Subjects
                </Link>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: subject.color }} />

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                        <div className="flex items-center gap-4">
                            <span className="text-4xl">{subject.icon}</span>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{subject.name}</h1>
                                <p className="text-gray-500 mt-1">{subject.description}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-4 md:mt-0 text-gray-600 text-sm font-medium">
                            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                                <Calendar size={16} className="text-gray-400" />
                                {new Date(subject.endDate).toLocaleDateString()} Deadline
                            </div>
                            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                                <BarChart2 size={16} className="text-gray-400" />
                                {subject.dailyTarget} topics/day
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar Large */}
                    <div>
                        <div className="flex justify-between mb-2 text-sm font-medium">
                            <span className="text-gray-700">Course Progress</span>
                            <span className="text-indigo-600">{subject.progressPercentage}%</span>
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full transition-all duration-700 ease-out relative"
                                style={{ width: `${subject.progressPercentage}%`, backgroundColor: subject.color }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-400">
                            <span>{subject.completedTopics} completed</span>
                            <span>{subject.totalTopics} total topics</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Goal Validation / Warning */}
            <DailyGoalTracker topics={topics} dailyTarget={subject.dailyTarget} />

            {/* Topics List */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Learning Path</h2>
                <button
                    onClick={() => { setEditingTopic(null); setIsFormOpen(true); }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 shadow-md transition-all hover:scale-105"
                >
                    <Plus size={18} /> Add Topic
                </button>
            </div>

            <div className="space-y-4">
                {topics.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-500">No topics yet. Start by adding your first topic!</p>
                    </div>
                ) : (
                    topics.map(topic => (
                        <TopicCard
                            key={topic._id}
                            topic={topic}
                            onStatusChange={handleStatusChange}
                            onEdit={(t) => { setEditingTopic(t); setIsFormOpen(true); }}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </div>

            <TopicForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={editingTopic ? handleUpdate : handleCreate}
                initialData={editingTopic}
                nextDayNumber={nextDayNumber}
            />
        </div>
    );
};

// Component to track daily goal validation
const DailyGoalTracker = ({ topics, dailyTarget }) => {
    // 1. Group topics by Day Number
    const topicsByDay = topics.reduce((acc, topic) => {
        const day = topic.dayNumber;
        if (!acc[day]) acc[day] = 0;
        acc[day]++;
        return acc;
    }, {});

    // 2. Find the "Latest" active day (max day)
    const topicDays = Object.keys(topicsByDay).map(Number);
    const maxDay = topicDays.length > 0 ? Math.max(...topicDays) : 1;

    // 3. Count for that day
    const currentCount = topicsByDay[maxDay] || 0;
    const isComplete = currentCount >= dailyTarget;
    const missing = dailyTarget - currentCount;

    if (isComplete) return null; // No warning if goal met

    return (
        <div className="mt-6 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl">
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800">
                        Daily Goal Alert: Day {maxDay}
                    </h3>
                    <div className="mt-2 text-sm text-orange-700">
                        <p>
                            You have added <strong>{currentCount}</strong> topics for Day {maxDay}, but your daily goal is <strong>{dailyTarget}</strong>.
                        </p>
                        <p className="mt-1 font-bold">
                            Please add {missing} more {missing === 1 ? 'topic' : 'topics'} to complete the schedule for Day {maxDay}.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopicTracker;
