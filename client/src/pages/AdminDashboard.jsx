import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import EditableCell from '../components/EditableCell';
import { Eye, FileText, CheckCircle, Clock, Image as ImageIcon, Download, Search, FileSpreadsheet, XCircle, Trash2 } from 'lucide-react';

const AdminDashboard = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [previewFile, setPreviewFile] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    // Auth state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === 'STRAT-jotform59') {
            setIsAuthenticated(true);
            setLoginError('');
        } else {
            setLoginError('Mot de passe incorrect');
        }
    };



    useEffect(() => {
        if (isAuthenticated) {
            fetchSubmissions();
        }
    }, [isAuthenticated]);

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

    const updateField = async (id, field, value) => {
        try {
            const response = await fetch(`/api/submissions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ [field]: value }),
            });

            if (response.ok) {
                const result = await response.json();
                setSubmissions(submissions.map(sub =>
                    sub.id === id ? result.data : sub
                ));
            } else {
                throw new Error('Update failed');
            }
        } catch (error) {
            console.error('Error updating field:', error);
            throw error;
        }
    };



    const exportToCSV = () => {
        window.open('/api/submissions/export/csv', '_blank');
    };

    const exportToExcel = () => {
        window.open('/api/submissions/export/excel', '_blank');
    };

    // Modal state for refusal
    const [showRefusalModal, setShowRefusalModal] = useState(false);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
    const [refusalReason, setRefusalReason] = useState('');

    const deleteSubmission = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible.')) {
            return;
        }

        try {
            const response = await fetch(`/api/submissions/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setSubmissions(submissions.filter(sub => sub.id !== id));
                alert('Demande supprimée avec succès');
            } else {
                alert('Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Error deleting submission:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const handleStatusChange = (id, newStatus) => {
        if (newStatus === 'Refusé') {
            setSelectedSubmissionId(id);
            setRefusalReason('');
            setShowRefusalModal(true);
        } else {
            updateStatus(id, newStatus);
        }
    };

    const confirmRefusal = () => {
        if (selectedSubmissionId) {
            updateStatus(selectedSubmissionId, 'Refusé', refusalReason);
            setShowRefusalModal(false);
            setSelectedSubmissionId(null);
        }
    };

    const updateStatus = async (id, newStatus, reason = null) => {
        try {
            const response = await fetch(`/api/submissions/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, motif: reason }),
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

    const getFileType = (filename) => {
        if (!filename) return 'unknown';
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
        if (ext === 'pdf') return 'pdf';
        return 'unknown';
    };

    const openPreview = (filename) => {
        const type = getFileType(filename);
        setPreviewFile({ url: `/uploads/${filename}`, type, filename });
        setShowPreview(true);
    };

    const downloadFile = (filename) => {
        const link = document.createElement('a');
        link.href = `/uploads/${filename}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const filteredSubmissions = submissions.filter(sub => {
        const matchesSearch = !searchTerm ||
            sub.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.phone?.includes(searchTerm);

        const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Administration</h1>
                        <p className="text-gray-500">Veuillez vous identifier pour accéder au tableau de bord</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                placeholder="Entrez le mot de passe"
                                autoFocus
                            />
                        </div>
                        {loginError && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
                                <XCircle size={16} className="mr-2" />
                                {loginError}
                            </div>
                        )}
                        <button
                            type="submit"
                            className="w-full py-3 bg-[#2d2d2d] text-white rounded-xl hover:bg-black transition-colors font-medium"
                        >
                            Se connecter
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#e63946' }}></div>
                        <p style={{ color: '#4a4a4a' }}>Chargement...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="max-w-[1800px] mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2" style={{ color: '#2d2d2d' }}>
                        Dashboard Administrateur
                    </h1>
                    <p className="text-lg" style={{ color: '#4a4a4a' }}>
                        {filteredSubmissions.length} accréditation{filteredSubmissions.length > 1 ? 's' : ''}
                    </p>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex flex-wrap gap-4">
                        {/* Search */}
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Rechercher par nom, email ou téléphone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="min-w-[200px]">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="En Cours">En Cours</option>
                                <option value="Approuvé">Approuvé</option>
                                <option value="Refusé">Refusé</option>
                            </select>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex space-x-3">
                            <button
                                onClick={exportToCSV}
                                className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all flex items-center space-x-2 shadow-sm hover:shadow-md"
                            >
                                <FileSpreadsheet size={20} />
                                <span>CSV</span>
                            </button>
                            <button
                                onClick={exportToExcel}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center space-x-2 shadow-sm hover:shadow-md"
                            >
                                <FileSpreadsheet size={20} />
                                <span>Excel</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200" style={{ background: 'linear-gradient(to bottom, #f9fafb, #ffffff)' }}>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#2d2d2d' }}>ID</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#2d2d2d' }}>Statut</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#2d2d2d' }}>Date</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#2d2d2d' }}>Photo</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#2d2d2d' }}>Nom Complet</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#2d2d2d' }}>Téléphone</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#2d2d2d' }}>Email</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#2d2d2d' }}>Rôle</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#2d2d2d' }}>Ville Agence</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#2d2d2d' }}>Manager</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#2d2d2d' }}>Directeur</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#2d2d2d' }}>Animateur</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#2d2d2d' }}>Date Début</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#2d2d2d' }}>Code Équipe</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#2d2d2d' }}>Test Fibre</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#2d2d2d' }}>Documents</th>
                                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider" style={{ color: '#2d2d2d' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredSubmissions.map((sub, index) => (
                                    <tr
                                        key={sub.id}
                                        className="hover:bg-gray-50 transition-colors"
                                        style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa' }}
                                    >
                                        {/* ID */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm font-mono font-semibold" style={{ color: '#4a4a4a' }}>
                                                #{String(sub.id).padStart(3, '0')}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <select
                                                value={sub.status}
                                                onChange={(e) => handleStatusChange(sub.id, e.target.value)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border-2 ${sub.status === 'Approuvé'
                                                    ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                                                    : sub.status === 'Refusé'
                                                        ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                                                        : 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200'
                                                    }`}
                                            >
                                                <option value="En Cours">⏱️ En Cours</option>
                                                <option value="Approuvé">✅ Approuvé</option>
                                                <option value="Refusé">❌ Refusé</option>
                                            </select>
                                        </td>

                                        {/* Date */}
                                        <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: '#4a4a4a' }}>
                                            {formatDate(sub.created_at)}
                                        </td>

                                        {/* Photo */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {sub.photo_path ? (
                                                <button
                                                    onClick={() => openPreview(sub.photo_path, 'image')}
                                                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors"
                                                >
                                                    <img
                                                        src={`/uploads/${sub.photo_path}`}
                                                        alt="Photo"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </button>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <ImageIcon size={16} className="text-gray-400" />
                                                </div>
                                            )}
                                        </td>

                                        {/* Nom Complet */}
                                        <td className="px-4 py-3 min-w-[200px]">
                                            <EditableCell
                                                value={sub.full_name}
                                                onSave={(value) => updateField(sub.id, 'full_name', value)}
                                                type="text"
                                            />
                                        </td>

                                        {/* Téléphone */}
                                        <td className="px-4 py-3 min-w-[150px]">
                                            <EditableCell
                                                value={sub.phone}
                                                onSave={(value) => updateField(sub.id, 'phone', value)}
                                                type="tel"
                                            />
                                        </td>

                                        {/* Email */}
                                        <td className="px-4 py-3 min-w-[200px]">
                                            <EditableCell
                                                value={sub.email}
                                                onSave={(value) => updateField(sub.id, 'email', value)}
                                                type="email"
                                            />
                                        </td>

                                        {/* Rôle */}
                                        <td className="px-4 py-3 min-w-[150px]">
                                            <EditableCell
                                                value={sub.role}
                                                onSave={(value) => updateField(sub.id, 'role', value)}
                                                type="select"
                                                options={['Vendeur', 'Manager', 'Directeur', 'Animateur Réseau']}
                                            />
                                        </td>

                                        {/* Ville Agence */}
                                        <td className="px-4 py-3 min-w-[150px]">
                                            <EditableCell
                                                value={sub.agency_city}
                                                onSave={(value) => updateField(sub.id, 'agency_city', value)}
                                                type="text"
                                            />
                                        </td>

                                        {/* Manager Direct */}
                                        <td className="px-4 py-3 min-w-[180px]">
                                            <EditableCell
                                                value={sub.direct_manager_name || '-'}
                                                onSave={(value) => updateField(sub.id, 'direct_manager_name', value)}
                                                type="text"
                                            />
                                        </td>

                                        {/* Directeur */}
                                        <td className="px-4 py-3 min-w-[180px]">
                                            <EditableCell
                                                value={sub.director_name || '-'}
                                                onSave={(value) => updateField(sub.id, 'director_name', value)}
                                                type="text"
                                            />
                                        </td>

                                        {/* Animateur Réseau */}
                                        <td className="px-4 py-3 min-w-[180px]">
                                            <EditableCell
                                                value={sub.network_animator_name || '-'}
                                                onSave={(value) => updateField(sub.id, 'network_animator_name', value)}
                                                type="text"
                                            />
                                        </td>

                                        {/* Date Début */}
                                        <td className="px-4 py-3 min-w-[150px]">
                                            <EditableCell
                                                value={sub.start_date ? sub.start_date.split('T')[0] : ''}
                                                onSave={(value) => updateField(sub.id, 'start_date', value)}
                                                type="date"
                                            />
                                        </td>

                                        {/* Code Équipe */}
                                        <td className="px-4 py-3 min-w-[120px]">
                                            <EditableCell
                                                value={sub.team_code}
                                                onSave={(value) => updateField(sub.id, 'team_code', value)}
                                                type="text"
                                            />
                                        </td>



                                        {/* Test Fibre */}
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => updateField(sub.id, 'fiber_test_done', !sub.fiber_test_done)}
                                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${sub.fiber_test_done
                                                    ? 'bg-green-500 border-green-500'
                                                    : 'bg-white border-gray-300 hover:border-gray-400'
                                                    }`}
                                            >
                                                {sub.fiber_test_done && <CheckCircle size={14} className="text-white" />}
                                            </button>
                                        </td>

                                        {/* Documents */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                {sub.id_card_front_path && (
                                                    <button
                                                        onClick={() => openPreview(sub.id_card_front_path, 'pdf')}
                                                        className="p-2 hover:bg-blue-50 rounded transition-colors"
                                                        title="Carte d'identité recto"
                                                    >
                                                        <FileText size={16} style={{ color: '#3b82f6' }} />
                                                    </button>
                                                )}
                                                {sub.id_card_back_path && (
                                                    <button
                                                        onClick={() => openPreview(sub.id_card_back_path, 'pdf')}
                                                        className="p-2 hover:bg-blue-50 rounded transition-colors"
                                                        title="Carte d'identité verso"
                                                    >
                                                        <FileText size={16} style={{ color: '#3b82f6' }} />
                                                    </button>
                                                )}
                                                {sub.signature_path && (
                                                    <button
                                                        onClick={() => openPreview(sub.signature_path, 'image')}
                                                        className="p-2 hover:bg-purple-50 rounded transition-colors"
                                                        title="Signature"
                                                    >
                                                        <Eye size={16} style={{ color: '#9333ea' }} />
                                                    </button>
                                                )}
                                                {sub.signed_pdf_path && (
                                                    <button
                                                        onClick={() => openPreview(sub.signed_pdf_path, 'pdf')}
                                                        className="p-2 hover:bg-red-50 rounded transition-colors"
                                                        title="PDF signé"
                                                    >
                                                        <Download size={16} style={{ color: '#e63946' }} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => deleteSubmission(sub.id)}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={18} className="text-gray-400 group-hover:text-red-600 transition-colors" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredSubmissions.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-lg" style={{ color: '#4a4a4a' }}>
                                Aucune accréditation trouvée
                            </p>
                        </div>
                    )}
                </div>

                {/* Preview Modal */}
                {showPreview && previewFile && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowPreview(false)}
                    >
                        <div
                            className="bg-white rounded-2xl max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-lg font-semibold" style={{ color: '#2d2d2d' }}>
                                    Prévisualisation
                                </h3>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => downloadFile(previewFile.filename)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                    >
                                        <Download size={16} />
                                        <span>Télécharger</span>
                                    </button>
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
                                {previewFile.type === 'image' ? (
                                    <img
                                        src={previewFile.url}
                                        alt="Preview"
                                        className="max-w-full max-h-[70vh] rounded-lg shadow-lg object-contain"
                                    />
                                ) : previewFile.type === 'pdf' ? (
                                    <object
                                        data={previewFile.url}
                                        type="application/pdf"
                                        className="w-full h-[70vh] rounded-lg shadow-md"
                                    >
                                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-300">
                                            <p className="mb-4">Impossible d'afficher le PDF directement.</p>
                                            <a
                                                href={previewFile.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Ouvrir le PDF dans un nouvel onglet
                                            </a>
                                        </div>
                                    </object>
                                ) : (
                                    <div className="text-center p-8">
                                        <p className="text-gray-500 mb-4">Format non supporté pour la prévisualisation direct.</p>
                                        <button
                                            onClick={() => downloadFile(previewFile.filename)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Télécharger le fichier
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Refusal Reason Modal */}
                {showRefusalModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                            <h3 className="text-xl font-bold mb-4" style={{ color: '#2d2d2d' }}>Motif du refus</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Veuillez indiquer la raison du refus pour notifier le collaborateur.
                            </p>
                            <textarea
                                value={refusalReason}
                                onChange={(e) => setRefusalReason(e.target.value)}
                                placeholder="Ex: Document d'identité illisible, photo non conforme..."
                                className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none mb-6"
                                autoFocus
                            />
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowRefusalModal(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmRefusal}
                                    disabled={!refusalReason.trim()}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-200"
                                >
                                    Confirmer le refus
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
