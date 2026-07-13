import { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import subjectService from './subjectService';
import { AuthContext } from './AuthContext';

export const SubjectContext = createContext();

export const SubjectProvider = ({ children }) => {
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const { user } = useContext(AuthContext);

    const fetchSubjects = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await subjectService.getSubjects();
            setSubjects(data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch subjects');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchSubjects();
        } else {
            setSubjects([]);
        }
    }, [user, fetchSubjects]);

    const addSubject = useCallback(async (subjectData) => {
        setIsLoading(true);
        try {
            const newSubject = await subjectService.createSubject(subjectData);
            setSubjects(prev => [newSubject, ...prev]);
            setError(null);
            return newSubject;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create subject');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateSubject = useCallback(async (id, subjectData) => {
        setIsLoading(true);
        try {
            const updatedSubject = await subjectService.updateSubject(id, subjectData);
            setSubjects(prev => prev.map((sub) => (sub._id === id ? updatedSubject : sub)));
            setError(null);
            return updatedSubject;
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update subject');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deleteSubject = useCallback(async (id) => {
        setIsLoading(true);
        try {
            await subjectService.deleteSubject(id);
            setSubjects(prev => prev.filter((sub) => sub._id !== id));
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete subject');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const value = useMemo(() => ({
        subjects,
        isLoading,
        error,
        fetchSubjects,
        addSubject,
        updateSubject,
        deleteSubject,
    }), [subjects, isLoading, error, fetchSubjects, addSubject, updateSubject, deleteSubject]);

    return (
        <SubjectContext.Provider value={value}>
            {children}
        </SubjectContext.Provider>
    );
};
