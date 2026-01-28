import { useContext, useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { SubjectContext } from '../context/SubjectContext';
import SubjectCard from '../components/subjects/SubjectCard';
import SubjectForm from '../components/subjects/SubjectForm';

const Subjects = () => {
    const { subjects, isLoading, addSubject, updateSubject, deleteSubject } = useContext(SubjectContext);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);

    const handleCreate = async (data) => {
        try {
            await addSubject(data);
            setIsFormOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdate = async (data) => {
        if (!editingSubject) return;
        try {
            await updateSubject(editingSubject._id, data);
            setEditingSubject(null);
            setIsFormOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    const onDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this subject? All related topics will be deleted.')) {
            await deleteSubject(id);
        }
    };

    const openCreateModal = () => {
        setEditingSubject(null);
        setIsFormOpen(true);
    };

    const openEditModal = (subject) => {
        setEditingSubject(subject);
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
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Subjects</h1>
                    <p className="text-gray-500 mt-1">Manage your learning path and track progress</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
                >
                    <Plus size={20} />
                    Add Subject
                </button>
            </div>

            {subjects.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No subjects yet</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mb-6">
                        Start your learning journey by creating your first subject. You can track topics, set goals, and monitor progress.
                    </p>
                    <button
                        onClick={openCreateModal}
                        className="text-indigo-600 font-semibold hover:text-indigo-700"
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
                onClose={() => setIsFormOpen(false)}
                onSubmit={editingSubject ? handleUpdate : handleCreate}
                initialData={editingSubject}
            />
        </div>
    );
};

export default Subjects;
