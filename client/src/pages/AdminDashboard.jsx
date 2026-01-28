import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { Eye, FileText, CheckCircle, Clock } from 'lucide-react';

const AdminDashboard = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        try {
            const response = await fetch('/api/submissions');
            const data = await response.json();
            setSubmissions(data);
        } catch (error) {
            console.error('Error fetching submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'En Cours' ? 'Approuvé' : 'En Cours';
        try {
            const response = await fetch(`/api/submissions/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                setSubmissions(submissions.map(sub =>
                    sub.id === id ? { ...sub, status: newStatus } : sub
                ));
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const openFile = (path) => {
        if (!path) return;
        window.open(`/uploads/${path}`, '_blank');
    };

    if (loading) return <div className="text-center p-10">Chargement...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin - Accréditations</h1>
                    <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                        {submissions.length} Total
                    </span>
                </div>

                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Infos</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opérationnel</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fichiers</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {submissions.map((submission) => (
                                <tr key={submission.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => updateStatus(submission.id, submission.status)}
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${submission.status === 'Approuvé'
                                                    ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                                                    : 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
                                                }`}
                                        >
                                            {submission.status === 'Approuvé' ? <CheckCircle size={14} className="mr-1" /> : <Clock size={14} className="mr-1" />}
                                            {submission.status}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(submission.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {submission.photo_path ? (
                                                <img
                                                    className="h-10 w-10 rounded-full object-cover mr-3 cursor-pointer border border-gray-200"
                                                    src={`/uploads/${submission.photo_path}`}
                                                    alt="Photo"
                                                    onClick={() => openFile(submission.photo_path)}
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-gray-200 mr-3"></div>
                                            )}
                                            <div className="text-sm font-medium text-gray-900">{submission.full_name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="text-gray-900">{submission.phone}</div>
                                        <div className="text-gray-500">{submission.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div>Code: <span className="font-medium text-gray-900">{submission.team_code}</span></div>
                                        <div>Mgr: {submission.manager_name}</div>
                                        <div>Taille: {submission.tshirt_size}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => openFile(submission.id_card_front_path)}
                                                className="text-gray-400 hover:text-stratygo-red"
                                                title="ID Recto"
                                            >
                                                <FileText size={18} />
                                            </button>
                                            <button
                                                onClick={() => openFile(submission.id_card_back_path)}
                                                className="text-gray-400 hover:text-stratygo-red"
                                                title="ID Verso"
                                            >
                                                <FileText size={18} />
                                            </button>
                                            <button
                                                onClick={() => openFile(submission.signature_path)}
                                                className="text-gray-400 hover:text-stratygo-red"
                                                title="Signature"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
