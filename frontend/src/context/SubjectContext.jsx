import { createContext, useState, useEffect, useContext } from 'react';
import subjectService from './subjectService';
import { AuthContext } from './AuthContext';

export const SubjectContext = createContext();

export const SubjectProvider = ({ children }) => {
    const [subjects, setSubjects] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (user) {
            fetchSubjects();
        } else {
            setSubjects([]);
        }
    }, [user]);

    const fetchSubjects = async () => {
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
    };

    const addSubject = async (subjectData) => {
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
    };

    const updateSubject = async (id, subjectData) => {
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
    };

    const deleteSubject = async (id) => {
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
    };

    return (
        <SubjectContext.Provider
            value={{
                subjects,
                isLoading,
                error,
                fetchSubjects,
                addSubject,
                updateSubject,
                deleteSubject,
            }}
        >
            {children}
        </SubjectContext.Provider>
    );
};
