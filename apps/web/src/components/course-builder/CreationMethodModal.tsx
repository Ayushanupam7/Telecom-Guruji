'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  FileText,
  Video,
  Presentation,
  Upload,
  ArrowRight,
  X,
  CheckCircle2,
  FileUp,
  Sliders,
  Cpu,
  Bot,
  Wand2,
  Zap,
  Check,
  RefreshCw,
  FolderUp
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { CourseCreationMethod } from '@signalhub/types';

interface CreationMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: CourseCreationMethod, initialData?: any) => void;
}

const SAMPLE_TOPICS = [
  '5G Standalone & Core Service-Based Architecture',
  'Massive MIMO & Active Antenna Beamforming',
  'Open RAN (O-RAN) Principles & Fronthaul Interface',
  'Satellite NTN & Non-Terrestrial 5G Integration',
  'Network Slicing & Quality of Service (QoS)',
];

export function CreationMethodModal({
  isOpen,
  onClose,
  onSelectMethod,
}: CreationMethodModalProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [selectedMethod, setSelectedMethod] = useState<CourseCreationMethod>('manual_ai');
  const [fileDragActive, setFileDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [aiTopicPrompt, setAiTopicPrompt] = useState('');
  const [aiModulesCount, setAiModulesCount] = useState(5);
  const [aiTargetLevel, setAiTargetLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [isLaunching, setIsLaunching] = useState(false);

  if (!isOpen) return null;

  const methods: Array<{
    id: CourseCreationMethod;
    title: string;
    tagline: string;
    description: string;
    icon: React.ReactNode;
    badge?: string;
    isPrimary?: boolean;
  }> = [
    {
      id: 'ai_generated',
      title: 'AI Course Architect',
      tagline: 'Instant Multi-Module Curriculum',
      description: 'Provide a topic or upload documents (PDF, PPTX, DOCX) to generate a full structured curriculum with slides & quizzes automatically.',
      icon: <Bot className="w-6 h-6" />,
      badge: '⚡ Fastest',
      isPrimary: true,
    },
    {
      id: 'manual_ai',
      title: 'Manual + AI Copilot',
      tagline: 'Recommended Studio Workflow',
      description: 'Build your custom outline with total creative control, while using in-line AI tools to generate, expand, or simplify content on demand.',
      icon: <Sparkles className="w-6 h-6" />,
      badge: '★ Popular',
    },
    {
      id: 'manual',
      title: 'Blank Canvas',
      tagline: 'From Scratch',
      description: 'Create everything from scratch without automated pre-fills. Perfect for instructors with specific custom slides and exam materials.',
      icon: <Layers className="w-6 h-6" />,
    },
    {
      id: 'ppt',
      title: 'PowerPoint (PPTX) Import',
      tagline: 'Slide-First Conversion',
      description: 'Upload existing presentation decks. We extract slides, speaker notes, and diagram layouts directly into interactive learning blocks.',
      icon: <Presentation className="w-6 h-6" />,
    },
    {
      id: 'video',
      title: 'Video Course Masterclass',
      tagline: 'Media & Timestamps',
      description: 'Structure your training modules around video lessons, lecture links, chapter timestamps, and downloadable companion notes.',
      icon: <Video className="w-6 h-6" />,
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (!selectedMethod) return;
    setIsLaunching(true);

    onClose();

    if (selectedMethod === 'ai_generated') {
      onSelectMethod(selectedMethod, {
        prompt: aiTopicPrompt || '5G Network Architecture & Core Protocols',
        modulesCount: aiModulesCount,
        level: aiTargetLevel,
        files: uploadedFiles,
      });
    } else {
      onSelectMethod(selectedMethod, {
        files: uploadedFiles,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border shadow-2xl transition-all ${
          isLight ? 'bg-white border-zinc-200 text-black' : 'bg-zinc-950 border-zinc-800 text-white'
        } p-6 sm:p-8 scrollbar-none`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-2xl text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-xs font-black uppercase tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Telecom Course Studio</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-sans">
            How would you like to build your course?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Select an authoring engine. All formats produce standard, high-performance interactive modules with digital certificate accreditation.
          </p>
        </div>

        {/* 5 Creation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6">
          {methods.map((method) => {
            const isSelected = selectedMethod === method.id;
            return (
              <div
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`relative p-5 rounded-3xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between group ${
                  isSelected
                    ? isLight
                      ? 'border-black bg-zinc-50 shadow-md ring-4 ring-black/5'
                      : 'border-white bg-zinc-900 shadow-md ring-4 ring-white/5'
                    : isLight
                    ? 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50/50'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950 hover:bg-zinc-900/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div
                      className={`p-3 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-black dark:bg-white text-white dark:text-black border-transparent'
                          : isLight
                          ? 'bg-zinc-100 border-zinc-200 text-zinc-800 group-hover:bg-zinc-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-200 group-hover:bg-zinc-800'
                      }`}
                    >
                      {method.icon}
                    </div>

                    {method.badge && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black shadow-xs">
                        {method.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-black tracking-tight mb-1">
                    {method.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed line-clamp-3">
                    {method.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                    {method.tagline}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-black dark:bg-white text-white dark:text-black border-transparent'
                        : 'border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* DYNAMIC CONFIGURATION FOR SELECTED METHOD */}
        {selectedMethod === 'ai_generated' && (
          <div className={`p-6 rounded-3xl border mb-6 space-y-4 animate-in fade-in shadow-xs ${
            isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <div className="flex items-center space-x-2 pb-1 border-b border-zinc-200/60 dark:border-zinc-800">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <h4 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                AI Course Generation Parameters
              </h4>
            </div>

            {/* Prompt Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Syllabus Topic or Concept Prompt
              </label>
              <input
                type="text"
                placeholder="e.g. 5G Standalone Architecture, RAN Fronthaul & Network Slicing"
                value={aiTopicPrompt}
                onChange={(e) => setAiTopicPrompt(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-bold outline-none transition ${
                  isLight ? 'bg-white border-zinc-300 text-black' : 'bg-zinc-950 border-zinc-700 text-white'
                }`}
              />

              {/* Sample Topic Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-zinc-400 self-center">Try:</span>
                {SAMPLE_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setAiTopicPrompt(topic)}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                      aiTopicPrompt === topic
                        ? 'bg-black dark:bg-white text-white dark:text-black font-bold'
                        : isLight
                        ? 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Modules & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Target Proficiency Level
                </label>
                <select
                  value={aiTargetLevel}
                  onChange={(e) => setAiTargetLevel(e.target.value as any)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm font-bold outline-none transition cursor-pointer ${
                    isLight ? 'bg-white border-zinc-300 text-black' : 'bg-zinc-950 border-zinc-700 text-white'
                  }`}
                >
                  <option value="beginner">Beginner (Foundations)</option>
                  <option value="intermediate">Intermediate (Systems & Signals)</option>
                  <option value="advanced">Advanced (Protocols & Standards)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Curriculum Modules Count
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 8].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setAiModulesCount(count)}
                      className={`py-2 rounded-2xl border font-black text-xs transition cursor-pointer ${
                        aiModulesCount === count
                          ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-xs'
                          : isLight
                          ? 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100'
                          : 'bg-zinc-950 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {count} Modules
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Document Drag & Drop */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Attach Existing Source Materials (Optional)
              </label>
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setFileDragActive(true);
                }}
                onDragLeave={() => setFileDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setFileDragActive(false);
                  if (e.dataTransfer.files) {
                    setUploadedFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer block transition-all ${
                  fileDragActive
                    ? 'border-sky-500 bg-sky-500/10'
                    : isLight
                    ? 'border-zinc-300 hover:border-zinc-400 bg-white'
                    : 'border-zinc-700 hover:border-zinc-600 bg-zinc-950'
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept=".ppt,.pptx,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <FolderUp className="w-6 h-6 mx-auto mb-1 text-sky-500" />
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                  Click to browse files or drag & drop documents
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Supported: PPTX, PDF, DOCX, CSV, TXT, Technical Diagrams
                </p>
              </label>

              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {uploadedFiles.map((file, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold"
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-500" />
                      <span className="truncate max-w-xs">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-zinc-400 hover:text-red-500 ml-1 font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {(selectedMethod === 'ppt' || selectedMethod === 'video') && (
          <div className={`p-6 rounded-3xl border mb-6 space-y-3 animate-in fade-in ${
            isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <h4 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
              {selectedMethod === 'ppt' ? 'Upload PowerPoint Presentation (.pptx)' : 'Upload Video Lectures & Media'}
            </h4>
            <label className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer block transition ${
              isLight ? 'border-zinc-300 bg-white hover:border-zinc-400' : 'border-zinc-700 bg-zinc-950 hover:border-zinc-600'
            }`}>
              <input
                type="file"
                accept={selectedMethod === 'ppt' ? '.ppt,.pptx' : 'video/*'}
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-7 h-7 mx-auto mb-1.5 text-sky-500" />
              <p className="text-xs font-bold">
                {selectedMethod === 'ppt' ? 'Click to select PowerPoint (.pptx) file' : 'Click to select training video files'}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                We will preserve slide sequence and generate modular content blocks.
              </p>
            </label>
            {uploadedFiles.length > 0 && (
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 pt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Selected: {uploadedFiles.map((f) => f.name).join(', ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-5 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-3 rounded-2xl border text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              isLight
                ? 'border-zinc-300 hover:bg-zinc-100 text-zinc-700'
                : 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!selectedMethod || isLaunching}
            onClick={handleContinue}
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider hover:opacity-90 transition active:scale-95 shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLaunching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Launching...</span>
              </>
            ) : (
              <>
                <span>Launch Course Studio</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
