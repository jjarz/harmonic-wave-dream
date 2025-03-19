
import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AudioUploadProps {
  onFileSelect: (file: File, objectUrl: string) => void;
  className?: string;
}

const AudioUpload: React.FC<AudioUploadProps> = ({ onFileSelect, className }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleClearSelection = () => {
    setFileName(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const processFile = (file: File) => {
    // Check if file is an audio file
    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }

    // Check file size (limit to 30MB)
    if (file.size > 30 * 1024 * 1024) {
      toast.error('File is too large. Please select a file under 30MB');
      return;
    }

    // Create object URL and pass to parent
    const objectUrl = URL.createObjectURL(file);
    onFileSelect(file, objectUrl);
    setFileName(file.name);
    toast.success('Audio file selected');
  };

  return (
    <div className={cn(
      "w-full p-6 rounded-xl text-center transition-all",
      dragActive 
        ? "bg-white/20 border-2 border-dashed border-white/40" 
        : "glass-panel border border-white/20",
      className
    )}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="audio/*"
        onChange={handleFileChange}
      />

      {fileName ? (
        <div className="animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-md font-medium truncate max-w-xs">{fileName}</span>
            <button 
              onClick={handleClearSelection}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Clear selection"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-white/70 mb-2">Audio file selected and ready to play</p>
          <button
            onClick={handleButtonClick}
            className="px-4 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            Select a different file
          </button>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-white/10 animate-pulse-subtle">
              <Upload size={32} className="text-white/80" />
            </div>
          </div>
          <h3 className="text-lg font-medium mb-2">Drop your audio file here</h3>
          <p className="text-sm text-white/70 mb-4">
            Support for MP3, WAV, OGG, and more
          </p>
          <button
            onClick={handleButtonClick}
            className="px-4 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            Browse files
          </button>
        </div>
      )}
      
      <p className="mt-4 text-xs text-white/60">
        Maximum file size: 30MB
      </p>
    </div>
  );
};

export default AudioUpload;
