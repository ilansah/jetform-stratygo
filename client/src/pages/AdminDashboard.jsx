import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import EditableCell from '../components/EditableCell';
import { Eye, FileText, CheckCircle, Clock, Image as ImageIcon, Download, Search, FileSpreadsheet, XCircle, Trash2, Upload, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import PdfPreview from '../components/PdfPreview';
import fibreIcon from '../assets/telecoms.png';
import energieIcon from '../assets/picto_energie.png';

// Helper for pagination range
const getPaginationRange = (totalPage, page, limit = 5, siblings = 1) => {
    let totalPageNoInArray = 7 + siblings;
    if (totalPageNoInArray >= totalPage) {
        return Array.from({ length: totalPage }, (_, i) => i + 1);
    }
    let leftSiblingsIndex = Math.max(page - siblings, 1);
    let rightSiblingsIndex = Math.min(page + siblings, totalPage);
    let showLeftDots = leftSiblingsIndex > 2;
    let showRightDots = rightSiblingsIndex < totalPage - 2;

    if (!showLeftDots && showRightDots) {
        let leftItemCount = 3 + 2 * siblings;
        let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
        return [...leftRange, " ...", totalPage];
    } else if (showLeftDots && !showRightDots) {
        let rightItemCount = 3 + 2 * siblings;
        let rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPage - rightItemCount + i + 1);
        return [1, "... ", ...rightRange];
    } else {
        let middleRange = Array.from({ length: rightSiblingsIndex - leftSiblingsIndex + 1 }, (_, i) => leftSiblingsIndex + i);
        return [1, "... ", ...middleRange, " ...", totalPage];
    }
};

const AdminDashboard = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [previewFile, setPreviewFile] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [activeTab, setActiveTab] = useState('Fibre');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 50;

    // Auth state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    // Password Modal for Actions
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordAction, setPasswordAction] = useState(null); // { type: 'delete' | 'bulk_delete' | 'import', id?: number, tab?: string, file?: File }
    const [actionPassword, setActionPassword] = useState('');
    const [pendingImportFile, setPendingImportFile] = useState(null);

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
            // Debounce search could be better, but for now just fetch
            const timer = setTimeout(() => {
                fetchSubmissions(1, activeTab);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, activeTab, searchTerm, statusFilter]);

    // Trigger pagination change separately to avoid loop if I added currentPage to above dependency
    useEffect(() => {
        if (isAuthenticated) {
            fetchSubmissions(currentPage, activeTab);
        }
    }, [currentPage]);

    const fetchSubmissions = async (page = 1, type = activeTab) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page,
                limit: itemsPerPage,
                type,
                status: statusFilter !== 'all' ? statusFilter : '',
                search: searchTerm
            });

            const response = await fetch(`/api/submissions?${queryParams.toString()}`);
            const result = await response.json();

            if (result.pagination) {
                setSubmissions(result.data);
                setTotalPages(result.pagination.totalPages);
                setTotalItems(result.pagination.total);
                setCurrentPage(result.pagination.page);
            } else {
                setSubmissions(result); // Fallback for old API behavior
                setTotalPages(1);
                setTotalItems(result.length);
            }
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

    // Import functionality
    const fileInputRef = React.useRef(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validation: Check extension
        const validExtensions = ['.csv', '.xlsx', '.xls'];
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (!validExtensions.includes(fileExtension)) {
            alert('Format de fichier invalide. Veuillez importer un fichier CSV ou Excel (.xlsx, .xls).');
            return;
        }

        if (!confirm(`Voulez-vous vraiment importer le fichier "${file.name}" ?\n\nCela ajoutera de nouvelles accréditations à la base de données.`)) {
            event.target.value = ''; // Reset input
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', activeTab); // Pass current tab as default type

        try {
            setLoading(true);
            const response = await fetch('/api/submissions/import', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                let message = result.message + `\n\n✅ Succès: ${result.success}`;
                if (result.failed > 0) {
                    message += `\n❌ Échecs: ${result.failed}`;
                    message += `\n\nDétails des erreurs:\n` + result.errors.slice(0, 5).join('\n') + (result.errors.length > 5 ? '\n...' : '');
                }
                alert(message);
                fetchSubmissions(); // Refresh list
            } else {
                alert(`Erreur lors de l'import: ${result.error || result.message}`);
            }
        } catch (error) {
            console.error('Error importing file:', error);
            alert('Une erreur est survenue lors de l\'importation.');
        } finally {
            setLoading(false);
            event.target.value = ''; // Reset input
        }
    };

    // Modal state for refusal
    const [showRefusalModal, setShowRefusalModal] = useState(false);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
    const [refusalReason, setRefusalReason] = useState('');

    const deleteSubmissionsByType = async (type) => {
        const count = totalItems; // Use totalItems from pagination which is accurate for the current tab
        if (count === 0) {
            alert(`Aucune donnée ${type} à supprimer.`);
            return;
        }

        if (!confirm(`ATTENTION : Vous êtes sur le point de supprimer TOUTES les ${count} demandes "${type}".\n\nCette action est IRRÉVERSIBLE et supprimera également tous les fichiers associés.\n\nVoulez-vous vraiment continuer ?`)) {
            return;
        }

        // Open Password Modal instead of prompt
        setPasswordAction({ type: 'bulk_delete', tab: type });
        setActionPassword('');
        setShowPasswordModal(true);
    };

    const deleteSubmission = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette accréditation ?')) return;

        // Open Password Modal instead of prompt
        setPasswordAction({ type: 'delete', id });
        setActionPassword('');
        setShowPasswordModal(true);
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (actionPassword !== '03071982') {
            alert('Mot de passe incorrect');
            return;
        }

        setShowPasswordModal(false);
        setLoading(true);

        try {
            if (passwordAction.type === 'bulk_delete') {
                const response = await fetch(`/api/submissions/type/${passwordAction.tab}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: actionPassword })
                });

                if (response.ok) {
                    alert(`Toutes les données ${passwordAction.tab} ont été supprimées.`);
                    fetchSubmissions(1, activeTab); // Refresh
                } else {
                    alert('Erreur lors de la suppression');
                }
            } else if (passwordAction.type === 'delete') {
                const response = await fetch(`/api/submissions/${passwordAction.id}`, { method: 'DELETE' });
                if (response.ok) {
                    // Update local state is safer than refetch logic here to avoid page jumps, but refetch is cleaner
                    fetchSubmissions(currentPage, activeTab);
                } else {
                    alert('Erreur lors de la suppression');
                }
            } else if (passwordAction.type === 'import') {
                await handleImportSubmit();
            }
        } catch (error) {
            console.error('Error executing action:', error);
            alert('Une erreur est survenue');
        } finally {
            if (passwordAction?.type !== 'import') { // Import handles its own cleanup/loading
                setLoading(false);
            }
            setPasswordAction(null);
            setActionPassword('');
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

    const filteredSubmissions = submissions; // No need to filter locally anymore, backend does it

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

                {/* Tabs Section */}
                <div className="flex space-x-4 mb-6">
                    <button
                        onClick={() => setActiveTab('Fibre')}
                        className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center space-x-2 ${activeTab === 'Fibre'
                            ? 'bg-[#2d2d2d] text-white shadow-lg transform scale-105'
                            : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                    >
                        <span><img src={fibreIcon} alt="Fibre" className="w-6 h-6 object-contain" /></span>
                        <span>Fibre</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('Energie')}
                        className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center space-x-2 ${activeTab === 'Energie'
                            ? 'bg-green-600 text-white shadow-lg transform scale-105'
                            : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                    >
                        <span><img src={energieIcon} alt="Energie" className="w-6 h-6 object-contain" /></span>
                        <span>Energie</span>
                    </button>
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

                        {/* Import Button */}
                        <div className="flex space-x-3">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".csv, .xlsx, .xls"
                                onChange={handleFileChange}
                            />
                            <button
                                onClick={handleImportClick}
                                className="px-6 py-3 bg-[#2d2d2d] text-white rounded-xl font-semibold hover:bg-black transition-all flex items-center space-x-2 shadow-sm hover:shadow-md"
                                title="Importer avec mot de passe"
                            >
                                <Upload size={20} />
                                <span>Importer</span>
                            </button>
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

                        {/* Bulk Delete Button - Specific to Active Tab */}
                        <div className="border-l border-gray-200 pl-4 ml-2">
                            <button
                                onClick={() => deleteSubmissionsByType(activeTab)}
                                className="px-6 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-semibold hover:bg-red-600 hover:text-white transition-all flex items-center space-x-2 shadow-sm hover:shadow-md"
                                title={`Supprimer TOTALE de tous les dossiers ${activeTab}`}
                            >
                                <Trash2 size={20} />
                                <span>Vider {activeTab}</span>
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
                                    <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider w-10">ID</th>
                                    <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider w-24">Statut</th>
                                    <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider w-20">Date</th>
                                    <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider w-16">Photo</th>
                                    <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider max-w-[120px]">Nom</th>
                                    <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider max-w-[100px]">Tél</th>
                                    <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider max-w-[120px]">Email</th>
                                    <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider max-w-[80px]">Rôle</th>
                                    <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider max-w-[80px]">Contrat</th>
                                    <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider max-w-[80px]">Ville</th>
                                    <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider max-w-[80px]">Manager</th>
                                    <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider max-w-[80px]">Directeur</th>
                                    <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider max-w-[80px]">Anim.</th>
                                    <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider w-20">Début</th>
                                    <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider w-16">Eq.</th>
                                    {activeTab === 'Fibre' && (
                                        <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider w-16">Test</th>
                                    )}
                                    <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider w-24">Docs</th>
                                    <th className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider w-16">Act.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs">
                                {filteredSubmissions.map((sub, index) => (
                                    <tr
                                        key={sub.id}
                                        className="hover:bg-gray-50 transition-colors"
                                        style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa' }}
                                    >
                                        {/* ID */}
                                        <td className="px-2 py-1 whitespace-nowrap">
                                            <span className="font-mono font-semibold text-gray-600">
                                                #{sub.id}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-2 py-1 whitespace-nowrap">
                                            <select
                                                value={sub.status}
                                                onChange={(e) => handleStatusChange(sub.id, e.target.value)}
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${sub.status === 'Approuvé'
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : sub.status === 'Refusé'
                                                        ? 'bg-red-50 text-red-700 border-red-200'
                                                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                    }`}
                                            >
                                                <option value="En Cours">En Cours</option>
                                                <option value="Approuvé">Approuvé</option>
                                                <option value="Refusé">Refusé</option>
                                            </select>
                                        </td>

                                        {/* Date */}
                                        <td className="px-2 py-1 whitespace-nowrap text-gray-500">
                                            {formatDate(sub.created_at)}
                                        </td>

                                        {/* Photo */}
                                        <td className="px-2 py-1 whitespace-nowrap">
                                            {sub.photo_path ? (
                                                <button
                                                    onClick={() => openPreview(sub.photo_path)}
                                                    className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors flex items-center justify-center bg-gray-50"
                                                >
                                                    {sub.photo_path.toLowerCase().endsWith('.pdf') ? (
                                                        <FileText size={14} className="text-red-500" />
                                                    ) : (
                                                        <img
                                                            src={`/uploads/${sub.photo_path}`}
                                                            alt="Photo"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                </button>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <ImageIcon size={14} className="text-gray-400" />
                                                </div>
                                            )}
                                        </td>

                                        {/* Nom Complet */}
                                        <td className="px-2 py-1 max-w-[120px] truncate" title={sub.full_name}>
                                            <EditableCell
                                                value={sub.full_name}
                                                onSave={(value) => updateField(sub.id, 'full_name', value)}
                                                type="text"
                                            />
                                        </td>

                                        {/* Téléphone */}
                                        <td className="px-2 py-1 max-w-[100px] truncate" title={sub.phone}>
                                            <EditableCell
                                                value={sub.phone}
                                                onSave={(value) => updateField(sub.id, 'phone', value)}
                                                type="tel"
                                            />
                                        </td>

                                        {/* Email */}
                                        <td className="px-2 py-1 max-w-[120px] truncate" title={sub.email}>
                                            <EditableCell
                                                value={sub.email}
                                                onSave={(value) => updateField(sub.id, 'email', value)}
                                                type="email"
                                            />
                                        </td>

                                        {/* Rôle */}
                                        <td className="px-2 py-1 max-w-[80px] truncate" title={sub.role}>
                                            <EditableCell
                                                value={sub.role}
                                                onSave={(value) => updateField(sub.id, 'role', value)}
                                                type="select"
                                                options={['Vendeur', 'Manager', 'Directeur', 'Animateur Réseau']}
                                            />
                                        </td>

                                        {/* Type Contrat */}
                                        <td className="px-2 py-1 max-w-[80px] truncate" title={sub.contract_type}>
                                            <EditableCell
                                                value={sub.contract_type || '-'}
                                                onSave={(value) => updateField(sub.id, 'contract_type', value)}
                                                type="select"
                                                options={['VRP', 'VDI', 'CDI/CDD', 'Auto-entrepreneur']}
                                            />
                                        </td>

                                        {/* Ville Agence */}
                                        <td className="px-2 py-1 max-w-[80px] truncate" title={sub.agency_city}>
                                            <EditableCell
                                                value={sub.agency_city}
                                                onSave={(value) => updateField(sub.id, 'agency_city', value)}
                                                type="text"
                                            />
                                        </td>

                                        {/* Manager Direct */}
                                        <td className="px-2 py-1 max-w-[80px] truncate" title={sub.direct_manager_name}>
                                            <EditableCell
                                                value={sub.direct_manager_name || '-'}
                                                onSave={(value) => updateField(sub.id, 'direct_manager_name', value)}
                                                type="text"
                                            />
                                        </td>

                                        {/* Directeur */}
                                        <td className="px-2 py-1 max-w-[80px] truncate" title={sub.director_name}>
                                            <EditableCell
                                                value={sub.director_name || '-'}
                                                onSave={(value) => updateField(sub.id, 'director_name', value)}
                                                type="text"
                                            />
                                        </td>

                                        {/* Animateur Réseau */}
                                        <td className="px-2 py-1 max-w-[80px] truncate" title={sub.network_animator_name}>
                                            <EditableCell
                                                value={sub.network_animator_name || '-'}
                                                onSave={(value) => updateField(sub.id, 'network_animator_name', value)}
                                                type="text"
                                            />
                                        </td>

                                        {/* Date Début */}
                                        <td className="px-2 py-1 w-20 truncate">
                                            <EditableCell
                                                value={sub.start_date ? sub.start_date.split('T')[0] : ''}
                                                onSave={(value) => updateField(sub.id, 'start_date', value)}
                                                type="date"
                                            />
                                        </td>

                                        {/* Code Équipe */}
                                        <td className="px-2 py-1 w-16 truncate">
                                            <EditableCell
                                                value={sub.team_code}
                                                onSave={(value) => updateField(sub.id, 'team_code', value)}
                                                type="text"
                                            />
                                        </td>



                                        {/* Test Fibre */}
                                        {activeTab === 'Fibre' && (
                                            <td className="px-2 py-1 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => updateField(sub.id, 'fiber_test_done', !sub.fiber_test_done)}
                                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${sub.fiber_test_done
                                                        ? 'bg-green-500 border-green-500'
                                                        : 'bg-white border-gray-300 hover:border-gray-400'
                                                        }`}
                                                >
                                                    {sub.fiber_test_done && <CheckCircle size={10} className="text-white" />}
                                                </button>
                                            </td>
                                        )}

                                        {/* Documents */}
                                        <td className="px-2 py-1 whitespace-nowrap">
                                            <div className="flex items-center space-x-1">
                                                {sub.id_card_front_path && (
                                                    <button
                                                        onClick={() => openPreview(sub.id_card_front_path, 'pdf')}
                                                        className="p-1 hover:bg-blue-50 rounded transition-colors"
                                                        title="CNI R"
                                                    >
                                                        <FileText size={14} className="text-blue-500" />
                                                    </button>
                                                )}
                                                {sub.id_card_back_path && (
                                                    <button
                                                        onClick={() => openPreview(sub.id_card_back_path, 'pdf')}
                                                        className="p-1 hover:bg-blue-50 rounded transition-colors"
                                                        title="CNI V"
                                                    >
                                                        <FileText size={14} className="text-blue-500" />
                                                    </button>
                                                )}
                                                {sub.signature_path && (
                                                    <button
                                                        onClick={() => openPreview(sub.signature_path, 'image')}
                                                        className="p-1 hover:bg-purple-50 rounded transition-colors"
                                                        title="Sig"
                                                    >
                                                        <Eye size={14} className="text-purple-600" />
                                                    </button>
                                                )}
                                                {sub.signed_pdf_path && (
                                                    <button
                                                        onClick={() => openPreview(sub.signed_pdf_path, 'pdf')}
                                                        className="p-1 hover:bg-red-50 rounded transition-colors"
                                                        title="PDF Sig"
                                                    >
                                                        <Download size={14} className="text-red-500" />
                                                    </button>
                                                )}
                                                {sub.signed_charte_path && (
                                                    <button
                                                        onClick={() => openPreview(sub.signed_charte_path, 'pdf')}
                                                        className="p-1 hover:bg-amber-50 rounded transition-colors"
                                                        title="Charte"
                                                    >
                                                        <FileText size={14} className="text-amber-500" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-2 py-1 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center space-x-1">
                                                <button
                                                    onClick={() => {
                                                        setSelectedSubmissionId(sub.id);
                                                        setRefusalReason('');
                                                        setShowRefusalModal(true);
                                                    }}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Refuser"
                                                >
                                                    <XCircle size={14} />
                                                </button>
                                                <button
                                                    onClick={() => deleteSubmission(sub.id)}
                                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
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

                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-4 bg-white p-2 rounded-xl shadow-sm">
                    <div className="text-xs text-gray-500">
                        Total: {totalItems}
                    </div>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded border hover:bg-gray-50 disabled:opacity-50"
                            title="Première page"
                        >
                            <ChevronsLeft size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded border hover:bg-gray-50 disabled:opacity-50"
                            title="Page précédente"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {getPaginationRange(totalPages, currentPage).map((value, idx) => {
                            if (value === "... " || value === " ...") {
                                return <span key={idx} className="px-2 text-gray-400">...</span>;
                            }
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentPage(value)}
                                    className={`px-3 py-1 rounded text-xs font-semibold ${currentPage === value
                                        ? 'bg-red-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border'
                                        }`}
                                >
                                    {value}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded border hover:bg-gray-50 disabled:opacity-50"
                            title="Page suivante"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded border hover:bg-gray-50 disabled:opacity-50"
                            title="Dernière page"
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Preview Modal */}
                {showPreview && previewFile && (
                    previewFile.type === 'pdf' ? (
                        <PdfPreview
                            url={previewFile.url}
                            filename={previewFile.filename}
                            onClose={() => setShowPreview(false)}
                        />
                    ) : (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                            onClick={() => setShowPreview(false)}
                        >
                            <div
                                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
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

                                {/* Modal Content - Images only (PDFs handled by PdfPreview component) */}
                                <div className="p-6 overflow-auto max-h-[calc(90vh-80px)] flex justify-center items-center bg-gray-100">
                                    {previewFile.type === 'image' ? (
                                        <img
                                            src={previewFile.url}
                                            alt="Preview"
                                            className="max-w-full max-h-[70vh] rounded-lg shadow-lg object-contain"
                                        />
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
                    )
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

                {/* Secure Password Modal */}
                {showPasswordModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
                            <h3 className="text-xl font-bold mb-2" style={{ color: '#2d2d2d' }}>Sécurité</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Veuillez entrer le mot de passe administrateur pour confirmer cette action sensible.
                            </p>
                            <form onSubmit={handlePasswordSubmit}>
                                <div className="mb-6">
                                    <input
                                        type="password"
                                        value={actionPassword}
                                        onChange={(e) => setActionPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-center text-lg tracking-widest"
                                        placeholder="••••••••"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPasswordModal(false);
                                            setPasswordAction(null);
                                            setActionPassword('');
                                        }}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md shadow-red-200"
                                    >
                                        Confirmer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
