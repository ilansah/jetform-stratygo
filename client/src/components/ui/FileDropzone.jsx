import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

const FileDropzone = ({ label, name, required, onFileChange, acceptedFileTypes = "image/*, application/pdf" }) => {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            setFile(droppedFile);
            onFileChange(name, droppedFile);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            onFileChange(name, selectedFile);
        }
    };

    const removeFile = (e) => {
        e.stopPropagation();
        setFile(null);
        if (inputRef.current) inputRef.current.value = '';
        onFileChange(name, null);
    };

    return (
        <div className="mb-6 group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1 transition-colors group-hover:text-stratygo-red">
                {label} {required && <span className="text-stratygo-red">*</span>}
            </label>

            <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 overflow-hidden
          ${isDragging
                        ? 'border-stratygo-red bg-red-50/50 scale-[1.02]'
                        : 'border-gray-200 hover:border-stratygo-red/50 hover:bg-gray-50 bg-white'
                    }
          ${file ? 'border-green-500 bg-green-50/30' : ''}
        `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current.click()}
            >
                <input
                    type="file"
                    ref={inputRef}
                    className="hidden"
                    accept={acceptedFileTypes}
                    onChange={handleChange}
                />

                {file ? (
                    <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3 shadow-sm">
                            <CheckCircle2 size={24} />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm truncate max-w-[200px] mb-1">{file.name}</span>
                        <span className="text-xs text-gray-500 mb-3">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        <button
                            onClick={removeFile}
                            className="px-3 py-1 bg-white border border-gray-200 text-gray-500 text-xs rounded-full hover:bg-gray-100 hover:text-red-500 transition-colors shadow-sm"
                        >
                            Remplacer / Supprimer
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3 group/icon">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover/icon:bg-red-50 transition-colors duration-300">
                            <Upload className="h-7 w-7 text-gray-400 group-hover/icon:text-stratygo-red transition-colors duration-300" />
                        </div>
                        <div className="text-sm text-gray-600">
                            <span className="text-stratygo-red font-semibold hover:underline">Cliquez pour uploader</span> ou glisser ici
                        </div>
                        <p className="text-xs text-gray-400 font-medium">PNG, JPG ou PDF (Max 10MB)</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileDropzone;
