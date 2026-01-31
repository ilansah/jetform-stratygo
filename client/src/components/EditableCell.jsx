import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Loader2 } from 'lucide-react';

const EditableCell = ({
    value,
    onSave,
    type = 'text',
    options = [],
    placeholder = 'Double-cliquez pour éditer'
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value || '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        setCurrentValue(value || '');
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            if (type === 'text' || type === 'email' || type === 'tel') {
                inputRef.current.select();
            }
        }
    }, [isEditing, type]);

    const handleDoubleClick = () => {
        if (!isSaving) {
            setIsEditing(true);
            setError('');
        }
    };

    const handleSave = async () => {
        if (currentValue === value) {
            setIsEditing(false);
            return;
        }

        // Validation
        if (type === 'email' && currentValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentValue)) {
            setError('Email invalide');
            return;
        }

        if (type === 'tel' && currentValue && !/^[\d\s+()-]+$/.test(currentValue)) {
            setError('Téléphone invalide');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            await onSave(currentValue);
            setIsEditing(false);
        } catch (err) {
            setError('Erreur de sauvegarde');
            console.error('Save error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setCurrentValue(value || '');
        setIsEditing(false);
        setError('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && type !== 'textarea') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    const renderInput = () => {
        const baseClasses = "w-full px-2 py-1 border-2 rounded focus:outline-none transition-colors";
        const borderColor = error ? 'border-red-500' : 'border-blue-500';

        switch (type) {
            case 'select':
                return (
                    <select
                        ref={inputRef}
                        value={currentValue}
                        onChange={(e) => setCurrentValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className={`${baseClasses} ${borderColor}`}
                        disabled={isSaving}
                    >
                        <option value="">Sélectionner...</option>
                        {options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                );

            case 'date':
                return (
                    <input
                        ref={inputRef}
                        type="date"
                        value={currentValue}
                        onChange={(e) => setCurrentValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className={`${baseClasses} ${borderColor}`}
                        disabled={isSaving}
                    />
                );

            case 'textarea':
                return (
                    <textarea
                        ref={inputRef}
                        value={currentValue}
                        onChange={(e) => setCurrentValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className={`${baseClasses} ${borderColor} min-h-[60px]`}
                        disabled={isSaving}
                        rows={3}
                    />
                );

            case 'email':
                return (
                    <input
                        ref={inputRef}
                        type="email"
                        value={currentValue}
                        onChange={(e) => setCurrentValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className={`${baseClasses} ${borderColor}`}
                        disabled={isSaving}
                        placeholder="email@example.com"
                    />
                );

            case 'tel':
                return (
                    <input
                        ref={inputRef}
                        type="tel"
                        value={currentValue}
                        onChange={(e) => setCurrentValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className={`${baseClasses} ${borderColor}`}
                        disabled={isSaving}
                        placeholder="06 12 34 56 78"
                    />
                );

            default:
                return (
                    <input
                        ref={inputRef}
                        type="text"
                        value={currentValue}
                        onChange={(e) => setCurrentValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className={`${baseClasses} ${borderColor}`}
                        disabled={isSaving}
                        placeholder={placeholder}
                    />
                );
        }
    };

    if (isEditing) {
        return (
            <div className="relative">
                {renderInput()}
                {error && (
                    <div className="absolute top-full left-0 mt-1 text-xs text-red-600 whitespace-nowrap">
                        {error}
                    </div>
                )}
                {isSaving && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Loader2 size={14} className="animate-spin text-blue-500" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            onDoubleClick={handleDoubleClick}
            className="px-2 py-1 cursor-pointer hover:bg-gray-50 rounded transition-colors min-h-[32px] flex items-center group"
            title="Double-cliquez pour éditer"
        >
            <span className={`${!value ? 'text-gray-400 italic' : 'text-gray-700'}`}>
                {value || placeholder}
            </span>
            <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400">
                ✏️
            </span>
        </div>
    );
};

export default EditableCell;
