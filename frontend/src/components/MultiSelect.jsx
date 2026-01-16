import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

const MultiSelect = ({ label, options, selected, onChange, placeholder = "Select..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Toggle option
    const handleSelect = (value) => {
        let newSelected;
        if (selected.includes(value)) {
            newSelected = selected.filter(s => s !== value);
        } else {
            newSelected = [...selected, value];
        }
        onChange(newSelected);
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <label className="block mb-2 text-sm text-[#888]">{label}</label>
            <div
                className="w-full bg-bg-card border border-border-light rounded px-3 py-2 text-white cursor-pointer flex justify-between items-center min-h-10.5"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-1">
                    {selected.length === 0 ? (
                        <span className="text-[#666] text-sm">{placeholder}</span>
                    ) : (
                        selected.map(val => (
                            <span key={val} className="bg-white/10 text-xs px-2 py-1 rounded flex items-center gap-1">
                                {options.find(o => o.value === val)?.label || val}
                                <span
                                    className="cursor-pointer hover:text-white text-[#aaa]"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelect(val);
                                    }}
                                >
                                    <X size={12} />
                                </span>
                            </span>
                        ))
                    )}
                </div>
                <ChevronDown size={16} className={`text-[#888] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 w-full bg-[#1a1a1a] border border-border-light rounded-lg mt-1 z-50 shadow-xl max-h-62.5 overflow-y-auto animate-enter">
                    {options.length === 0 ? (
                        <div className="p-3 text-[#666] text-sm text-center">No options found</div>
                    ) : (
                        options.map((opt) => (
                            <div
                                key={opt.value}
                                className={`
                                    px-3 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors
                                    ${selected.includes(opt.value) ? 'bg-white/5 text-text-accent' : 'text-[#ccc]'}
                                `}
                                onClick={() => handleSelect(opt.value)}
                            >
                                <span>{opt.label}</span>
                                {selected.includes(opt.value) && <Check size={14} />}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default MultiSelect;
