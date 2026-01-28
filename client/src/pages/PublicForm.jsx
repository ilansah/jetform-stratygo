import React, { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import FileDropzone from '../components/ui/FileDropzone';
import Header from '../components/Header';
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
        start_date: '',
        manager_name: '',
        team_code: '',
        manager_email: '',
        hr_email: '',
        tshirt_size: 'M',
        fiber_test_done: false,
        proxy_name: '',
        terms_accepted: false
    });

    const [files, setFiles] = useState({
        id_card_front: null,
        id_card_back: null,
        photo: null
    });

    const sigPad = useRef({});
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

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
        form.append('start_date', formData.start_date);
        form.append('manager_name', formData.manager_name);
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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-12 rounded-2xl shadow-xl text-center max-w-lg w-full transform transition-all animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Demande reçue !</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">Merci {formData.full_name.split(' ')[0]}, votre demande d'accréditation a bien été transmise à nos équipes. Vous recevrez une confirmation par email prochainement.</p>
                    <Button onClick={() => window.location.reload()} variant="primary">Nouvelle demande</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 selection:bg-red-100 selection:text-red-900 font-sans">
            <Header />

            <main className="container mx-auto px-4 max-w-4xl relative">
                {/* Decorative background element */}
                <div className="absolute top-0 -left-64 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 -right-64 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                <div className="bg-white rounded-2xl shadow-2xl shadow-black/5 overflow-hidden border border-gray-100 relative z-10 my-8">
                    <div className="p-10 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50 text-center">
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Accréditation Fibre</h1>
                        <p className="text-gray-500 mt-3 text-lg">Formulaire officiel de demande d'accès</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 space-y-12">
                        {/* 1. Informations Personnelles */}
                        <section>
                            <div className="flex items-center mb-6">
                                <div className="w-10 h-10 rounded-full bg-red-100 text-stratygo-red flex items-center justify-center mr-4 shadow-sm">
                                    <User size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Informations Personnelles</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-14">
                                <Input label="Nom complet" name="full_name" required value={formData.full_name} onChange={handleInputChange} placeholder="Prénom et Nom" />
                                <Input label="Numéro de téléphone" name="phone" required value={formData.phone} onChange={handleInputChange} placeholder="+33 6..." />
                                <Input label="Email" name="email" type="email" required value={formData.email} onChange={handleInputChange} placeholder="exemple@email.com" className="md:col-span-2" />

                                <div className="md:col-span-2 space-y-4 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                                    <label className="block text-sm font-bold text-gray-700">Adresse complète <span className="text-stratygo-red">*</span></label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input name="address_street" required value={formData.address_street} onChange={handleInputChange} placeholder="Numéro et rue" className="mb-0" />
                                        <Input name="address_complement" value={formData.address_complement} onChange={handleInputChange} placeholder="Complément (bat, étage...)" className="mb-0" />
                                        <Input name="address_postal" required value={formData.address_zip} onChange={(e) => setFormData({ ...formData, address_zip: e.target.value })} placeholder="Code Postal" className="mb-0" />
                                        <Input name="address_city" required value={formData.address_city} onChange={(e) => setFormData({ ...formData, address_city: e.target.value })} placeholder="Ville" className="mb-0" />
                                        <Input name="address_region" required value={formData.address_region} onChange={(e) => setFormData({ ...formData, address_region: e.target.value })} placeholder="État / Région" className="mb-0 md:col-span-2" />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* 2. Informations Opérationnelles */}
                        <section>
                            <div className="flex items-center mb-6">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4 shadow-sm">
                                    <Briefcase size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Informations Opérationnelles</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-14">
                                <Input label="Date de commencement" name="start_date" type="date" required value={formData.start_date} onChange={handleInputChange} />
                                <div className="mb-6 group">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1 transition-colors group-hover:text-stratygo-red">Taille Tee-shirt <span className="text-stratygo-red">*</span></label>
                                    <div className="relative">
                                        <select
                                            name="tshirt_size"
                                            value={formData.tshirt_size}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-stratygo-red/10 focus:border-stratygo-red focus:bg-white transition-all duration-300 shadow-sm appearance-none cursor-pointer"
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

                                <Input label="Nom du Gestionnaire" name="manager_name" required value={formData.manager_name} onChange={handleInputChange} />
                                <Input label="Code équipe" name="team_code" required value={formData.team_code} onChange={handleInputChange} />
                                <Input label="Courriel du gestionnaire" name="manager_email" type="email" required value={formData.manager_email} onChange={handleInputChange} />
                                <Input label="E-mail service RH" name="hr_email" type="email" required value={formData.hr_email} onChange={handleInputChange} />
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* 3. Documents */}
                        <section>
                            <div className="flex items-center mb-6">
                                <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mr-4 shadow-sm">
                                    <Paperclip size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Documents Requis</h3>
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
                                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-4 shadow-sm">
                                    <PenTool size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Validation & Signature</h3>
                            </div>

                            <div className="pl-14 space-y-6">
                                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer" onClick={() => handleInputChange({ target: { name: 'fiber_test_done', checked: !formData.fiber_test_done, type: 'checkbox' } })}>
                                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${formData.fiber_test_done ? 'bg-stratygo-red border-stratygo-red' : 'border-gray-300 bg-white'}`}>
                                        {formData.fiber_test_done && <CheckCircle2 size={16} className="text-white" />}
                                    </div>
                                    <label className="text-gray-900 font-medium cursor-pointer select-none">Je certifie avoir réalisé le test fibre.</label>
                                </div>

                                <Input label="Nom et prénom du demandeur si réalisé par un tiers" name="proxy_name" value={formData.proxy_name} onChange={handleInputChange} required={false} placeholder="Laisser vide si vous remplissez pour vous-même" />

                                <div className="border border-gray-200 rounded-xl p-6 bg-gray-50/50">
                                    <h4 className="font-bold text-gray-900 mb-3 flex items-center"><FileText size={16} className="mr-2 text-gray-500" /> Code De Déontologie VAD</h4>
                                    <div className="h-48 overflow-y-auto scrollbar-thin text-sm text-gray-600 mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-inner prose prose-sm max-w-none">
                                        <p><strong>Préambule :</strong> Le présent code de déontologie définit les règles de bonne conduite applicables à tous les collaborateurs.</p>
                                        <p>1. <strong>Intégrité et Professionnalisme :</strong> Chaque collaborateur s'engage à agir avec honnêteté, intégrité et professionnalisme dans toutes ses interactions.</p>
                                        <p>2. <strong>Confidentialité :</strong> Le respect de la confidentialité des données clients est une priorité absolue. Aucune information ne doit être divulguée sans autorisation.</p>
                                        <p>3. <strong>Respect des biens et des personnes :</strong> Tout comportement irrespectueux, discriminant ou harcelant est strictement interdit.</p>
                                        <p>4. <strong>Sécurité :</strong> Les règles de sécurité, notamment lors des interventions techniques, doivent être scrupuleusement respectées.</p>
                                        <p className="mt-4 italic">En signant ce document, vous reconnaissez avoir pris connaissance de ces règles et vous engagez à les respecter.</p>
                                    </div>

                                    <div className="flex items-center space-x-3 mt-4" onClick={() => handleInputChange({ target: { name: 'terms_accepted', checked: !formData.terms_accepted, type: 'checkbox' } })}>
                                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer ${formData.terms_accepted ? 'bg-stratygo-red border-stratygo-red' : 'border-gray-300 bg-white'}`}>
                                            {formData.terms_accepted && <CheckCircle2 size={16} className="text-white" />}
                                        </div>
                                        <label className="text-sm font-semibold text-gray-700 cursor-pointer select-none">J'accepte les termes & conditions du code de déontologie de STRATYGO <span className="text-stratygo-red">*</span></label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Votre Signature <span className="text-stratygo-red">*</span></label>
                                    <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white relative shadow-sm hover:border-gray-300 transition-colors">
                                        <SignatureCanvas
                                            penColor='black'
                                            canvasProps={{ width: 600, height: 200, className: 'sigCanvas w-full h-56 cursor-crosshair' }}
                                            ref={sigPad}
                                            velocityFilterWeight={0.7}
                                        />
                                        <div className="absolute top-3 right-3">
                                            <button
                                                type="button"
                                                onClick={clearSignature}
                                                className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors uppercase tracking-wide"
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
                            <Button type="submit" disabled={loading} loading={loading} className="py-4 text-base shadow-red-200">
                                {loading ? 'Envoi du dossier en cours...' : 'Envoyer ma demande d\'accréditation'}
                            </Button>
                            <p className="text-center text-xs text-gray-400 mt-4">Vos données sont sécurisées et traitées de manière confidentielle par Stratygo.</p>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default PublicForm;
