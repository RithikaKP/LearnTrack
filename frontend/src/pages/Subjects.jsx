import { useContext, useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { SubjectContext } from '../context/SubjectContext';
import SubjectCard from '../components/subjects/SubjectCard';
import SubjectForm from '../components/subjects/SubjectForm';

const Subjects = () => {
    const { subjects, isLoading, addSubject, updateSubject, deleteSubject } = useContext(SubjectContext);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [submitError, setSubmitError] = useState('');

    const handleCreate = async (data) => {
        try {
            await addSubject(data);
            setSubmitError('');
            setIsFormOpen(false);
        } catch (error) {
            setSubmitError(error.response?.data?.message || 'Unable to create subject. Check that the backend is running and you are logged in.');
        }
    };

    const handleUpdate = async (data) => {
        if (!editingSubject) return;
        try {
            await updateSubject(editingSubject._id, data);
            setSubmitError('');
            setEditingSubject(null);
            setIsFormOpen(false);
        } catch (error) {
            setSubmitError(error.response?.data?.message || 'Unable to update subject. Check that the backend is running and you are logged in.');
        }
    };

    const onDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this subject? All related topics will be deleted.')) {
            await deleteSubject(id);
        }
    };

    const openCreateModal = () => {
        setEditingSubject(null);
        setSubmitError('');
        setIsFormOpen(true);
    };

    const openEditModal = (subject) => {
        setEditingSubject(subject);
        setSubmitError('');
        setIsFormOpen(true);
    };

    if (isLoading && subjects.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 font-sans text-zinc-800 bg-white min-h-screen">
            <div className="flex justify-between items-center mb-8 pb-5 border-b border-zinc-200/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-100 rounded-xl text-zinc-900 border border-zinc-200/50">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">My Subjects</h1>
                        <p className="text-sm text-zinc-500">Manage your learning path and track course schedules.</p>
                    </div>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-2 bg-zinc-950 text-white px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-zinc-900 shadow-sm hover:translate-y-[-0.5px] active:translate-y-0 transition-all cursor-pointer"
                >
                    <Plus size={16} />
                    Add Subject
                </button>
            </div>

            {submitError && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 text-xs text-red-700">
                    {submitError}
                </div>
            )}

            {subjects.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-zinc-200 p-12 text-center select-none">
                    <div className="w-12 h-12 bg-zinc-50 text-zinc-500 rounded-lg border border-zinc-200/60 flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <BookOpen size={22} />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 mb-1">No subjects created</h3>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-6">
                        Start your learning track by creating your first subject to schedule topics, set daily targets, and log focus hours.
                    </p>
                    <button
                        onClick={openCreateModal}
                        className="text-xs font-bold text-zinc-950 hover:underline cursor-pointer"
                    >
                        Create your first subject &rarr;
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subjects.map((subject) => (
                        <SubjectCard
                            key={subject._id}
                            subject={subject}
                            onDelete={onDelete}
                            onEdit={openEditModal}
                        />
                    ))}
                </div>
            )}

            <SubjectForm
                isOpen={isFormOpen}
                onClose={() => {
                    setSubmitError('');
                    setIsFormOpen(false);
                }}
                onSubmit={editingSubject ? handleUpdate : handleCreate}
                initialData={editingSubject}
            />
        </div>
    );
};

export default Subjects;
