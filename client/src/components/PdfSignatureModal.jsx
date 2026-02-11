import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { X, FileText, PenTool } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument, rgb } from 'pdf-lib';

// Configure PDF.js worker for Vite
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PdfSignatureModal = ({ isOpen, onClose, pdfUrl, onSigned }) => {
    const [pdfDoc, setPdfDoc] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [signedPdfBlob, setSignedPdfBlob] = useState(null);
    const canvasRef = useRef(null);
    const sigPadRef = useRef(null);

    useEffect(() => {
        if (isOpen && pdfUrl) {
            loadPdf();
        }
    }, [isOpen, pdfUrl]);

    const loadPdf = async () => {
        try {
            console.log('Loading PDF from:', pdfUrl);
            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            console.log('Loading task created:', loadingTask);
            const pdf = await loadingTask.promise;
            console.log('PDF loaded successfully:', pdf);
            setPdfDoc(pdf);
            setTotalPages(pdf.numPages);
            setCurrentPage(1);
            console.log('Total pages:', pdf.numPages);
            renderPage(pdf, 1);
        } catch (error) {
            console.error('Error loading PDF:', error);
            alert('Erreur lors du chargement du PDF: ' + error.message);
        }
    };

    const renderPage = async (pdf, pageNumber) => {
        const page = await pdf.getPage(pageNumber);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Calculate scale to fit the container width
        const containerWidth = canvas.parentElement.clientWidth;
        const viewport = page.getViewport({ scale: 1 });
        const scale = (containerWidth - 40) / viewport.width; // 40px for padding
        const scaledViewport = page.getViewport({ scale });

        // High DPI Support
        const outputScale = window.devicePixelRatio || 1;

        canvas.width = Math.floor(scaledViewport.width * outputScale);
        canvas.height = Math.floor(scaledViewport.height * outputScale);
        canvas.style.width = Math.floor(scaledViewport.width) + "px";
        canvas.style.height = Math.floor(scaledViewport.height) + "px";

        const transform = outputScale !== 1
            ? [outputScale, 0, 0, outputScale, 0, 0]
            : null;

        const renderContext = {
            canvasContext: context,
            transform: transform,
            viewport: scaledViewport
        };

        await page.render(renderContext).promise;
    };

    const handleSignClick = () => {
        setShowSignaturePad(true);
    };

    const clearSignature = () => {
        if (sigPadRef.current) {
            sigPadRef.current.clear();
        }
    };

    const handleSignatureConfirm = async () => {
        if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
            const signatureDataUrl = sigPadRef.current.toDataURL();
            await addSignatureToPdf(signatureDataUrl);
            setShowSignaturePad(false);
        }
    };

    const addSignatureToPdf = async (signatureDataUrl) => {
        try {
            // Fetch the original PDF
            const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
            const pdfDoc = await PDFDocument.load(existingPdfBytes);

            // Get the last page (where signature usually goes)
            const pages = pdfDoc.getPages();
            const lastPage = pages[pages.length - 1];
            const { width, height } = lastPage.getSize();

            // Embed the signature image
            const signatureImage = await pdfDoc.embedPng(signatureDataUrl);
            const signatureDims = signatureImage.scale(0.3);

            // Position signature at bottom right
            lastPage.drawImage(signatureImage, {
                x: width - signatureDims.width - 50,
                y: 50,
                width: signatureDims.width,
                height: signatureDims.height,
            });

            // Add signature date
            const signatureDate = new Date().toLocaleDateString('fr-FR');
            lastPage.drawText(`Signé le ${signatureDate}`, {
                x: width - signatureDims.width - 50,
                y: 35,
                size: 10,
                color: rgb(0.4, 0.4, 0.4)
            });

            // Save the PDF
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            setSignedPdfBlob(blob);

            // Reload the signed PDF for preview
            const signedPdfUrl = URL.createObjectURL(blob);
            const loadingTask = pdfjsLib.getDocument(signedPdfUrl);
            const pdf = await loadingTask.promise;
            setPdfDoc(pdf);
            setTotalPages(pdf.numPages);
            renderPage(pdf, currentPage);

            // Notify parent component
            if (onSigned) {
                onSigned(blob);
            }
            onClose();
        } catch (error) {
            console.error('Error adding signature to PDF:', error);
        }
    };

    const handleDownload = () => {
        if (signedPdfBlob) {
            const url = URL.createObjectURL(signedPdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'code-deontologie-signe.pdf';
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200" style={{ background: 'linear-gradient(to bottom, #ffffff, rgba(245, 245, 245, 0.3))' }}>
                    <div className="flex items-center space-x-3">
                        <FileText size={24} style={{ color: '#2d2d2d' }} />
                        <h2 className="text-xl font-bold" style={{ color: '#2d2d2d' }}>Code de Déontologie</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        style={{ color: '#4a4a4a' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 overflow-auto p-6 bg-gray-50">
                    <div className="flex justify-center">
                        <canvas ref={canvasRef} className="shadow-lg border border-gray-200 rounded-lg bg-white" />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-200 bg-white flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => {
                                if (currentPage > 1) {
                                    setCurrentPage(currentPage - 1);
                                    renderPage(pdfDoc, currentPage - 1);
                                }
                            }}
                            disabled={currentPage <= 1}
                            className="px-4 py-2 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ color: '#2d2d2d' }}
                        >
                            ← Précédent
                        </button>
                        <div className="text-sm" style={{ color: '#4a4a4a' }}>
                            Page {currentPage} / {totalPages}
                        </div>
                        <button
                            onClick={() => {
                                if (currentPage < totalPages) {
                                    setCurrentPage(currentPage + 1);
                                    renderPage(pdfDoc, currentPage + 1);
                                }
                            }}
                            disabled={currentPage >= totalPages}
                            className="px-4 py-2 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ color: '#2d2d2d' }}
                        >
                            Suivant →
                        </button>
                    </div>
                    <div className="flex space-x-3">
                        {signedPdfBlob && (
                            <button
                                onClick={handleDownload}
                                className="px-6 py-3 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                                style={{ color: '#2d2d2d' }}
                            >
                                Télécharger
                            </button>
                        )}
                        <button
                            onClick={handleSignClick}
                            disabled={currentPage < totalPages}
                            className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center ${currentPage < totalPages
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                : 'text-white hover:shadow-xl hover:scale-[1.02]'
                                }`}
                            style={currentPage < totalPages ? {} : { background: 'linear-gradient(to right, #2d2d2d, #1a1a1a)' }}
                        >
                            <PenTool size={18} className="inline mr-2" />
                            {signedPdfBlob ? 'Signer à nouveau' : (currentPage < totalPages ? `Lire jusqu'à la fin (${totalPages - currentPage} pages restants)` : 'Signer le document')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Signature Pad Modal */}
            {showSignaturePad && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full">
                        <h3 className="text-lg font-bold mb-4" style={{ color: '#2d2d2d' }}>Dessinez votre signature</h3>
                        <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white relative shadow-sm">
                            <SignatureCanvas
                                penColor='black'
                                canvasProps={{ className: 'sigCanvas cursor-crosshair h-[350px] md:h-[450px] w-full', style: { width: '100%' } }}
                                ref={sigPadRef}
                                velocityFilterWeight={0.7}
                            />
                            <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                                <span className="text-[10px] text-gray-300 uppercase tracking-widest font-bold">Signez dans le cadre ci-dessus</span>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-4">
                            <button
                                onClick={clearSignature}
                                className="px-4 py-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                                style={{ color: '#2d2d2d' }}
                            >
                                Effacer
                            </button>
                            <button
                                onClick={() => setShowSignaturePad(false)}
                                className="px-4 py-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                style={{ color: '#2d2d2d' }}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSignatureConfirm}
                                className="px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                                style={{ background: 'linear-gradient(to right, #2d2d2d, #1a1a1a)' }}
                            >
                                Valider la signature
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PdfSignatureModal;
