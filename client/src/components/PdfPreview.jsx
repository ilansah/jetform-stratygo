import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';

// Configure PDF.js worker for Vite
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PdfPreview = ({ url, filename, onClose }) => {
    const [pdfDoc, setPdfDoc] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (url) {
            loadPdf();
        }
    }, [url]);

    useEffect(() => {
        if (pdfDoc) {
            renderPage(currentPage);
        }
    }, [pdfDoc, currentPage, scale]);

    const loadPdf = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Loading PDF from:', url);
            const loadingTask = pdfjsLib.getDocument(url);
            const pdf = await loadingTask.promise;
            console.log('PDF loaded successfully');
            setPdfDoc(pdf);
            setTotalPages(pdf.numPages);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error loading PDF:', error);
            setError('Impossible de charger le document PDF. Le fichier est peut-être corrompu ou inaccessible.');
        } finally {
            setLoading(false);
        }
    };

    const renderPage = async (pageNumber) => {
        if (!pdfDoc) return;

        try {
            const page = await pdfDoc.getPage(pageNumber);
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            // Calculate scale to fit the container width naturally if scale is 1
            // otherwise use text-zoom style scaling
            const viewport = page.getViewport({ scale: scale });

            // High DPI Support
            const outputScale = window.devicePixelRatio || 1;

            canvas.width = Math.floor(viewport.width * outputScale);
            canvas.height = Math.floor(viewport.height * outputScale);
            canvas.style.width = Math.floor(viewport.width) + "px";
            canvas.style.height = Math.floor(viewport.height) + "px";

            const transform = outputScale !== 1
                ? [outputScale, 0, 0, outputScale, 0, 0]
                : null;

            const renderContext = {
                canvasContext: context,
                transform: transform,
                viewport: viewport
            };

            await page.render(renderContext).promise;
        } catch (err) {
            console.error('Error rendering page:', err);
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const changePage = (offset) => {
        const newPage = currentPage + offset;
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold truncate max-w-md" style={{ color: '#2d2d2d' }}>
                        {filename}
                    </h3>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleDownload}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
                            title="Télécharger"
                        >
                            <Download size={20} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors text-gray-500"
                            title="Fermer"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-8 relative"
                >
                    {loading && (
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-500">Chargement du document...</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg">
                            <div className="text-red-500 mb-4 text-5xl">⚠️</div>
                            <p className="text-gray-700 mb-4">{error}</p>
                            <button
                                onClick={handleDownload}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Télécharger le fichier à la place
                            </button>
                        </div>
                    )}

                    {!loading && !error && (
                        <canvas
                            ref={canvasRef}
                            className="shadow-2xl border border-gray-200 bg-white"
                        />
                    )}
                </div>

                {/* Footer / Toolbar */}
                {!loading && !error && (
                    <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                                title="Zoom arrière"
                            >
                                <ZoomOut size={20} />
                            </button>
                            <span className="text-sm font-medium text-gray-500 min-w-[3rem] text-center">
                                {Math.round(scale * 100)}%
                            </span>
                            <button
                                onClick={() => setScale(s => Math.min(3, s + 0.25))}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                                title="Zoom avant"
                            >
                                <ZoomIn size={20} />
                            </button>
                        </div>

                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => changePage(-1)}
                                disabled={currentPage <= 1}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <span className="text-sm font-medium text-gray-900">
                                Page {currentPage} sur {totalPages}
                            </span>
                            <button
                                onClick={() => changePage(1)}
                                disabled={currentPage >= totalPages}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>

                        {/* Spacer to balance the zoom controls */}
                        <div className="w-32"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PdfPreview;
