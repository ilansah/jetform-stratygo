import React, { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import FileDropzone from '../components/ui/FileDropzone';
import Header from '../components/Header';
import PdfSignatureModal from '../components/PdfSignatureModal';
import { CheckCircle2, AlertCircle, FileText, User, Briefcase, Paperclip, PenTool } from 'lucide-react';

const PublicForm = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        address_street: '',
        address_complement: '',
        address_city: '',
        address_region: '',
        address_zip: '',
        role: '',
        agency_city: '',
        direct_manager_name: '',
        director_name: '',
        network_animator_name: '',
        start_date: '',
        team_code: '',
        manager_email: '',
        hr_email: '',
        tshirt_size: 'S',
        fiber_test_done: false,
        proxy_name: '',
        terms_accepted: false,
    });

    const [files, setFiles] = useState({
        photo: null,
        id_card_front: null,
        id_card_back: null
    });

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [signedPdfBlob, setSignedPdfBlob] = useState(null);
    const sigPad = useRef(null);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (name, file) => {
        setFiles(prev => ({ ...prev, [name]: file }));
    };

    const clearSignature = () => {
        sigPad.current.clear();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.terms_accepted) {
            setError('Veuillez accepter les termes et conditions.');
            window.scrollTo(0, document.body.scrollHeight);
            return;
        }

        if (sigPad.current.isEmpty()) {
            setError('Veuillez signer le document.');
            return;
        }

        setLoading(true);

        const form = new FormData();
        form.append('full_name', formData.full_name);
        form.append('phone', formData.phone);
        form.append('email', formData.email);
        form.append('address', `${formData.address_street}, ${formData.address_complement} ${formData.address_zip} ${formData.address_city}, ${formData.address_region}`);
        form.append('role', formData.role);
        form.append('agency_city', formData.agency_city);
        form.append('direct_manager_name', formData.direct_manager_name || '');
        form.append('director_name', formData.director_name || '');
        form.append('network_animator_name', formData.network_animator_name || '');
        form.append('start_date', formData.start_date);
        form.append('team_code', formData.team_code);
        form.append('manager_email', formData.manager_email);
        form.append('hr_email', formData.hr_email);
        form.append('tshirt_size', formData.tshirt_size);
        form.append('fiber_test_done', formData.fiber_test_done);
        form.append('proxy_name', formData.proxy_name);
        form.append('terms_accepted', formData.terms_accepted);

        if (files.id_card_front) form.append('id_card_front', files.id_card_front);
        if (files.id_card_back) form.append('id_card_back', files.id_card_back);
        if (files.photo) form.append('photo', files.photo);

        const signatureBlob = await new Promise(resolve => sigPad.current.getCanvas().toBlob(resolve, 'image/png'));
        form.append('signature', signatureBlob, 'signature.png');

        // Add signed PDF if available
        if (signedPdfBlob) {
            form.append('signed_pdf', signedPdfBlob, 'code-deontologie-signe.pdf');
        }

        try {
            const response = await fetch('/api/submissions', {
                method: 'POST',
                body: form
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erreur lors de la soumission');
            }

            setSubmitted(true);
            window.scrollTo(0, 0);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-stratygo-light-gray to-gray-100 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-12 rounded-2xl shadow-2xl text-center max-w-lg w-full transform transition-all animate-in fade-in zoom-in duration-500 border border-gray-100">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-stratygo-dark mb-4 tracking-tight">Demande reçue !</h2>
                    <p className="text-stratygo-gray mb-8 leading-relaxed">Merci {formData.full_name.split(' ')[0]}, votre demande d'accréditation a bien été transmise à nos équipes. Vous recevrez une confirmation par email prochainement.</p>
                    <Button onClick={() => window.location.reload()} variant="primary">Nouvelle demande</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-stratygo-light-gray/30 to-white pb-20 font-sans">
            <Header />

            <main className="container mx-auto px-4 max-w-4xl relative">
                {/* Decorative background element */}
                <div className="absolute top-0 -left-64 w-96 h-96 bg-stratygo-red/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 -right-64 w-96 h-96 bg-stratygo-red/5 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                <div className="bg-white rounded-2xl shadow-2xl shadow-black/5 overflow-hidden border border-gray-200 relative z-10 my-8">
                    <div className="p-10 border-b border-gray-200 bg-gradient-to-b from-white to-stratygo-light-gray/20 text-center">
                        <h1 className="text-3xl font-extrabold text-stratygo-dark tracking-tight">Accréditation Fibre</h1>
                        <p className="text-stratygo-gray mt-3 text-lg">Formulaire officiel de demande d'accès</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 space-y-12">
                        {/* 1. Informations Personnelles */}
                        <section>
                            <div className="flex items-center mb-6">
                                <div className="w-10 h-10 rounded-full bg-stratygo-dark/10 text-stratygo-dark flex items-center justify-center mr-4 shadow-sm">
                                    <User size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-stratygo-dark">Informations Personnelles</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-14">
                                <Input label="Nom complet" name="full_name" required value={formData.full_name} onChange={handleInputChange} placeholder="Prénom et Nom" />
                                <Input label="Numéro de téléphone" name="phone" required value={formData.phone} onChange={handleInputChange} placeholder="+33 6..." />
                                <Input label="Email" name="email" type="email" required value={formData.email} onChange={handleInputChange} placeholder="exemple@email.com" className="md:col-span-2" />

                                <div className="md:col-span-2 space-y-4 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                                    <label className="block text-sm font-bold text-gray-700">Adresse complète <span className="text-stratygo-dark">*</span></label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input name="address_street" required value={formData.address_street} onChange={handleInputChange} placeholder="Numéro et rue" className="mb-0" showLabel={false} />
                                        <Input name="address_complement" value={formData.address_complement} onChange={handleInputChange} placeholder="Complément (bat, étage...)" className="mb-0" showLabel={false} />
                                        <Input name="address_postal" required value={formData.address_zip} onChange={(e) => setFormData({ ...formData, address_zip: e.target.value })} placeholder="Code Postal" className="mb-0" showLabel={false} />
                                        <Input name="address_city" required value={formData.address_city} onChange={(e) => setFormData({ ...formData, address_city: e.target.value })} placeholder="Ville" className="mb-0" showLabel={false} />
                                        <Input name="address_region" required value={formData.address_region} onChange={(e) => setFormData({ ...formData, address_region: e.target.value })} placeholder="État / Région" className="mb-0 md:col-span-2" showLabel={false} />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* 2. Informations Opérationnelles */}
                        <section>
                            <div className="flex items-center mb-6">
                                <div className="w-10 h-10 rounded-full bg-stratygo-dark/10 text-stratygo-dark flex items-center justify-center mr-4 shadow-sm">
                                    <Briefcase size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-stratygo-dark">Informations Opérationnelles</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-14">
                                <Input label="Date de commencement" name="start_date" type="date" required value={formData.start_date} onChange={handleInputChange} />

                                {/* Role Selection */}
                                <div className="mb-6 group">
                                    <label className="block text-sm font-semibold text-stratygo-dark mb-2 ml-1 transition-colors group-hover:text-stratygo-dark">
                                        Rôle <span className="text-stratygo-dark">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-stratygo-dark/10 focus:border-stratygo-dark focus:bg-white transition-all duration-300 shadow-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">Sélectionnez votre rôle</option>
                                            <option value="Vendeur">Vendeur</option>
                                            <option value="Manager">Manager</option>
                                            <option value="Directeur">Directeur</option>
                                            <option value="Animateur Réseau">Animateur Réseau</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                        </div>
                                    </div>
                                </div>

                                <Input label="Ville d'agence" name="agency_city" required value={formData.agency_city} onChange={handleInputChange} />

                                {/* Conditional Hierarchy Fields */}
                                {formData.role === 'Vendeur' && (
                                    <>
                                        <Input label="Nom du Manager" name="direct_manager_name" required value={formData.direct_manager_name} onChange={handleInputChange} />
                                        <Input label="Nom du Directeur" name="director_name" required value={formData.director_name} onChange={handleInputChange} />
                                        <Input label="Nom de l'Animateur Réseau" name="network_animator_name" required value={formData.network_animator_name} onChange={handleInputChange} />
                                    </>
                                )}

                                {formData.role === 'Manager' && (
                                    <>
                                        <Input label="Nom du Directeur" name="director_name" required value={formData.director_name} onChange={handleInputChange} />
                                        <Input label="Nom de l'Animateur Réseau" name="network_animator_name" required value={formData.network_animator_name} onChange={handleInputChange} />
                                    </>
                                )}

                                {formData.role === 'Directeur' && (
                                    <Input label="Nom de l'Animateur Réseau" name="network_animator_name" required value={formData.network_animator_name} onChange={handleInputChange} />
                                )}

                                <Input label="Code équipe" name="team_code" required value={formData.team_code} onChange={handleInputChange} />

                                <div className="mb-6 group">
                                    <label className="block text-sm font-semibold text-stratygo-dark mb-2 ml-1 transition-colors group-hover:text-stratygo-dark">Taille Tee-shirt <span className="text-stratygo-dark">*</span></label>
                                    <div className="relative">
                                        <select
                                            name="tshirt_size"
                                            value={formData.tshirt_size}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-stratygo-dark/10 focus:border-stratygo-dark focus:bg-white transition-all duration-300 shadow-sm appearance-none cursor-pointer"
                                        >
                                            <option value="S">S</option>
                                            <option value="M">M</option>
                                            <option value="L">L</option>
                                            <option value="XL">XL</option>
                                            <option value="XXL">XXL</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                        </div>
                                    </div>
                                </div>

                                <Input label="Courriel du gestionnaire" name="manager_email" type="email" required value={formData.manager_email} onChange={handleInputChange} />
                                <Input label="E-mail service RH" name="hr_email" type="email" required value={formData.hr_email} onChange={handleInputChange} />
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* 3. Documents */}
                        <section>
                            <div className="flex items-center mb-6">
                                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-4 shadow-sm">
                                    <Paperclip size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-stratygo-dark">Documents Requis</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4 pl-14">
                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 mb-4 flex items-start">
                                    <AlertCircle className="text-yellow-600 mr-3 mt-0.5 flex-shrink-0" size={18} />
                                    <p className="text-sm text-yellow-800">Assurez-vous que les photos sont nettes et lisibles. La photo d'identité doit être sur fond blanc uni.</p>
                                </div>
                                <FileDropzone label="Pièce d'identité (Recto)" name="id_card_front" required onFileChange={handleFileChange} />
                                <FileDropzone label="Pièce d'identité (Verso)" name="id_card_back" required onFileChange={handleFileChange} />
                                <FileDropzone label="Photo d'identité (Fond blanc uniquement)" name="photo" required onFileChange={handleFileChange} acceptedFileTypes="image/*" />
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* 4. Conformité et Signature */}
                        <section>
                            <div className="flex items-center mb-6">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-4 shadow-sm">
                                    <PenTool size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-stratygo-dark">Validation & Signature</h3>
                            </div>

                            <div className="pl-14 space-y-6">
                                <div className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer" style={{ backgroundColor: 'rgba(245, 245, 245, 0.3)' }} onClick={() => handleInputChange({ target: { name: 'fiber_test_done', checked: !formData.fiber_test_done, type: 'checkbox' } })}>
                                    <div className="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors" style={formData.fiber_test_done ? { backgroundColor: '#2d2d2d', borderColor: '#2d2d2d' } : { borderColor: '#d1d5db', backgroundColor: '#ffffff' }}>
                                        {formData.fiber_test_done && <CheckCircle2 size={16} style={{ color: '#ffffff' }} />}
                                    </div>
                                    <label className="font-medium cursor-pointer select-none" style={{ color: '#2d2d2d' }}>Je certifie avoir réalisé le test fibre.</label>
                                </div>

                                <Input label="Nom et prénom du demandeur si réalisé par un tiers" name="proxy_name" value={formData.proxy_name} onChange={handleInputChange} required={false} placeholder="Laisser vide si vous remplissez pour vous-même" />

                                <div className="border border-gray-200 rounded-xl p-6" style={{ background: 'linear-gradient(to bottom, rgba(245, 245, 245, 0.3), #ffffff)' }}>
                                    <h4 className="font-bold mb-3 flex items-center" style={{ color: '#2d2d2d' }}>
                                        <FileText size={16} className="mr-2" style={{ color: '#4a4a4a' }} />
                                        Code De Déontologie VAD
                                    </h4>

                                    <p className="text-sm mb-4" style={{ color: '#4a4a4a' }}>
                                        Veuillez lire et signer le Code de Déontologie STRATYGO avant de soumettre votre demande.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => setShowPdfModal(true)}
                                        className="w-full px-6 py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
                                        style={{ background: 'linear-gradient(to right, #2d2d2d, #1a1a1a)' }}
                                    >
                                        <FileText size={20} />
                                        <span>{signedPdfBlob ? 'Voir le document signé' : 'Lire et Signer le Code de Déontologie'}</span>
                                    </button>

                                    {signedPdfBlob && (
                                        <div className="mt-4 p-3 rounded-lg flex items-center space-x-2" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                                            <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
                                            <span className="text-sm font-medium" style={{ color: '#16a34a' }}>
                                                Document signé avec succès
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center space-x-3 mt-4" onClick={() => handleInputChange({ target: { name: 'terms_accepted', checked: !formData.terms_accepted, type: 'checkbox' } })}>
                                        <div className="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer" style={formData.terms_accepted ? { backgroundColor: '#2d2d2d', borderColor: '#2d2d2d' } : { borderColor: '#d1d5db', backgroundColor: '#ffffff' }}>
                                            {formData.terms_accepted && <CheckCircle2 size={16} style={{ color: '#ffffff' }} />}
                                        </div>
                                        <label className="text-sm font-semibold cursor-pointer select-none" style={{ color: '#2d2d2d' }}>J'accepte les termes & conditions du code de déontologie de STRATYGO <span style={{ color: '#2d2d2d' }}>*</span></label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-stratygo-dark mb-3 uppercase tracking-wide">Votre Signature <span className="text-stratygo-dark">*</span></label>
                                    <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white relative shadow-sm hover:border-gray-300 transition-colors">
                                        <SignatureCanvas
                                            penColor='black'
                                            canvasProps={{ className: 'sigCanvas cursor-crosshair', style: { width: '100%', height: '200px' } }}
                                            ref={sigPad}
                                            velocityFilterWeight={0.7}
                                        />
                                        <div className="absolute top-3 right-3">
                                            <button
                                                type="button"
                                                onClick={clearSignature}
                                                className="text-xs font-semibold text-stratygo-dark bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors uppercase tracking-wide cursor-pointer"
                                            >
                                                Effacer
                                            </button>
                                        </div>
                                        <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                                            <span className="text-[10px] text-gray-300 uppercase tracking-widest font-bold">Signez dans le cadre ci-dessus</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-r-lg shadow-sm flex items-center animate-shake" role="alert">
                                <AlertCircle className="mr-3 flex-shrink-0" />
                                <span className="block sm:inline font-medium">{error}</span>
                            </div>
                        )}

                        <div className="pt-6">
                            <Button type="submit" disabled={loading} loading={loading}>
                                {loading ? 'Envoi du dossier en cours...' : 'Envoyer ma demande d\'accréditation'}
                            </Button>
                            <p className="text-center text-xs text-stratygo-gray/60 mt-4">Vos données sont sécurisées et traitées de manière confidentielle par Stratygo.</p>
                        </div>
                    </form>
                </div>
            </main>

            {/* PDF Signature Modal */}
            <PdfSignatureModal
                isOpen={showPdfModal}
                onClose={() => setShowPdfModal(false)}
                pdfUrl="/documents/code-deontologie.pdf"
                onSigned={(pdfBlob) => {
                    setSignedPdfBlob(pdfBlob);
                    setFormData(prev => ({ ...prev, terms_accepted: true }));
                }}
            />
        </div>
    );
};

export default PublicForm;
