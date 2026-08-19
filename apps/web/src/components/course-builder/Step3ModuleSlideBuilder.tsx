'use client';

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Layers,
  FileText,
  Video,
  Image as ImageIcon,
  Code,
  Table,
  BarChart3,
  Quote,
  Paperclip,
  Minus,
  Check,
  X,
  Play,
  RotateCcw,
  Edit3,
  HelpCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Volume2,
  FileUp,
  FolderPlus,
  Layout
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Module, CourseSlide, RichBlock, RichBlockType } from '@signalhub/types';

interface Step3ModuleSlideBuilderProps {
  courseTitle: string;
  modules: Module[];
  onChange: (modules: Module[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step3ModuleSlideBuilder({
  courseTitle,
  modules,
  onChange,
  onNext,
  onPrev,
}: Step3ModuleSlideBuilderProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [activeModIdx, setActiveModIdx] = useState(0);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);

  // In-line AI Modal / State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTargetBlockId, setAiTargetBlockId] = useState<string | null>(null);
  const [aiAction, setAiAction] = useState<'improve' | 'simplify' | 'expand' | 'summarize' | 'translate' | 'generate_example' | 'generate_slide'>('improve');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiGeneratedResult, setAiGeneratedResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProviderUsed, setAiProviderUsed] = useState<string>('');

  const currentModule = modules[activeModIdx] || modules[0];
  const slides = currentModule?.slides || currentModule?.slides_data || [];
  const currentSlide = slides[activeSlideIdx] || slides[0] || {
    id: 's-fallback',
    slide_number: 1,
    title: 'Introduction',
    content_type: 'block_based',
    blocks: [],
    notes: '',
  };

  // Helper to update current slide
  const handleUpdateCurrentSlide = (updates: Partial<CourseSlide>) => {
    const updatedModules = [...modules];
    const mod = { ...updatedModules[activeModIdx] };
    const currentSlides = [...(mod.slides || mod.slides_data || [])];
    
    currentSlides[activeSlideIdx] = {
      ...currentSlide,
      ...updates,
    };
    
    mod.slides = currentSlides;
    mod.slides_data = currentSlides;
    updatedModules[activeModIdx] = mod;
    onChange(updatedModules);
  };

  // Add Block to Current Slide
  const handleAddBlock = (type: RichBlockType) => {
    const existingBlocks = currentSlide.blocks || [];
    let initialContent: any = {};

    switch (type) {
      case 'heading':
        initialContent = { text: 'Key Topic Heading', level: 2 };
        break;
      case 'paragraph':
        initialContent = { text: 'Explain the core telecommunication concept, signal flow, or architectural block.' };
        break;
      case 'bullet_list':
        initialContent = { items: ['First key principle', 'Second operational characteristic', 'Third performance requirement'] };
        break;
      case 'image':
        initialContent = {
          url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
          caption: 'Telecom Tower and Baseband Transmission',
        };
        break;
      case 'table':
        initialContent = {
          headers: ['Generation', 'Max Speed', 'Latency', 'Key Technology'],
          rows: [
            ['4G LTE', '100 Mbps', '50 ms', 'OFDMA / MIMO'],
            ['5G NR', '10 Gbps', '1 ms', 'Beamforming / mmWave / Network Slicing'],
          ],
        };
        break;
      case 'code':
        initialContent = {
          language: 'bash',
          code: `# Configure 5G gNodeB cell parameters\ngnb_cli --set-freq 3500MHz --bandwidth 100MHz\ngnb_cli --enable-beamforming 64T64R`,
        };
        break;
      case 'quote':
        initialContent = {
          text: '3GPP Release 16 expands 5G NR ultra-reliable low-latency communications (URLLC) for industrial automation.',
          author: '3GPP Specification Overview',
        };
        break;
      case 'chart':
        initialContent = {
          chartType: 'bar',
          chartData: [
            { label: '2G/3G', value: 15 },
            { label: '4G LTE', value: 55 },
            { label: '5G NR', value: 95 },
          ],
        };
        break;
      case 'video':
        initialContent = {
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          caption: 'Video lesson recording',
        };
        break;
      case 'divider':
        initialContent = {};
        break;
      case 'file':
        initialContent = {
          fileName: '3GPP_Rel17_Network_Slicing_Guide.pdf',
          fileSize: '4.2 MB',
          url: '#',
        };
        break;
      default:
        initialContent = { text: 'Content block' };
    }

    const newBlock: RichBlock = {
      id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      content: initialContent,
    };

    handleUpdateCurrentSlide({
      blocks: [...existingBlocks, newBlock],
    });
  };

  // Update specific block
  const handleUpdateBlock = (blockId: string, updatedContent: any) => {
    const blocks = (currentSlide.blocks || []).map((b) =>
      b.id === blockId ? { ...b, content: { ...b.content, ...updatedContent } } : b
    );
    handleUpdateCurrentSlide({ blocks });
  };

  // Delete block
  const handleDeleteBlock = (blockId: string) => {
    const blocks = (currentSlide.blocks || []).filter((b) => b.id !== blockId);
    handleUpdateCurrentSlide({ blocks });
  };

  // Move block up/down
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const blocks = [...(currentSlide.blocks || [])];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = blocks[index];
    blocks[index] = blocks[targetIndex];
    blocks[targetIndex] = temp;

    handleUpdateCurrentSlide({ blocks });
  };

  // Add Slide
  const handleAddSlide = () => {
    const updatedModules = [...modules];
    const mod = { ...updatedModules[activeModIdx] };
    const currentSlides = [...(mod.slides || mod.slides_data || [])];
    const newSlideNum = currentSlides.length + 1;

    const newSlide: CourseSlide = {
      id: `s-${Date.now()}`,
      slide_number: newSlideNum,
      title: `Slide ${newSlideNum}: New Topic`,
      content_type: 'block_based',
      blocks: [
        { id: `b-${Date.now()}-1`, type: 'heading', content: { text: `Topic ${newSlideNum} Overview`, level: 2 } },
        { id: `b-${Date.now()}-2`, type: 'paragraph', content: { text: 'Key engineering explanation and core concepts.' } },
      ],
      notes: 'Instructor presentation notes and speaking points.',
    };

    currentSlides.push(newSlide);
    mod.slides = currentSlides;
    mod.slides_data = currentSlides;
    updatedModules[activeModIdx] = mod;
    onChange(updatedModules);
    setActiveSlideIdx(currentSlides.length - 1);
  };

  // Delete Slide
  const handleDeleteSlide = (slideIdx: number) => {
    if (slides.length <= 1) {
      alert('A module must have at least one slide.');
      return;
    }
    const updatedModules = [...modules];
    const mod = { ...updatedModules[activeModIdx] };
    const currentSlides = (mod.slides || mod.slides_data || []).filter((_, i) => i !== slideIdx);
    
    // Re-index slide numbers
    const reindexed = currentSlides.map((s, i) => ({ ...s, slide_number: i + 1 }));
    mod.slides = reindexed;
    mod.slides_data = reindexed;
    updatedModules[activeModIdx] = mod;
    onChange(updatedModules);
    setActiveSlideIdx(Math.max(0, slideIdx - 1));
  };

  // Trigger In-line AI Action
  const triggerAiAction = async (actionType: any, targetBlockId?: string) => {
    setAiAction(actionType);
    setAiTargetBlockId(targetBlockId || null);
    setShowAiModal(true);
    setAiGeneratedResult(null);
    setAiLoading(true);

    const targetBlock = targetBlockId ? (currentSlide.blocks || []).find((b) => b.id === targetBlockId) : null;
    const contentToProcess = targetBlock
      ? targetBlock.content.text || (targetBlock.content.items ? targetBlock.content.items.join('\n') : '')
      : currentSlide.title;

    try {
      if (actionType === 'generate_slide') {
        const res = await fetch('/api/ai/generate-slide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseTitle,
            moduleTitle: currentModule.title,
            slideTitle: currentSlide.title,
            prompt: aiCustomPrompt || 'Create rich telecom slide content with headers, bullets, and formulas.',
          }),
        });
        const data = await res.json();
        if (data.success && data.data) {
          setAiGeneratedResult(JSON.stringify(data.data, null, 2));
          setAiProviderUsed(data.providerUsed || 'groq');
        }
      } else {
        const res = await fetch('/api/ai/improve-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: actionType,
            content: contentToProcess || currentSlide.title,
            instruction: aiCustomPrompt,
          }),
        });
        const data = await res.json();
        if (data.success && data.result) {
          setAiGeneratedResult(data.result);
          setAiProviderUsed(data.providerUsed || 'groq');
        }
      }
    } catch (err) {
      console.error('In-line AI error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // Accept AI Content
  const handleAcceptAiContent = () => {
    if (!aiGeneratedResult) return;

    if (aiAction === 'generate_slide') {
      try {
        const parsed = JSON.parse(aiGeneratedResult);
        if (parsed.blocks && Array.isArray(parsed.blocks)) {
          handleUpdateCurrentSlide({
            title: parsed.slideTitle || currentSlide.title,
            notes: parsed.notes || currentSlide.notes,
            blocks: parsed.blocks,
          });
        }
      } catch (err) {
        console.error('Could not parse slide blocks:', err);
      }
    } else if (aiTargetBlockId) {
      handleUpdateBlock(aiTargetBlockId, { text: aiGeneratedResult });
    } else {
      // Add as new paragraph block
      const existing = currentSlide.blocks || [];
      handleUpdateCurrentSlide({
        blocks: [
          ...existing,
          { id: `b-${Date.now()}`, type: 'paragraph', content: { text: aiGeneratedResult } },
        ],
      });
    }

    setShowAiModal(false);
    setAiGeneratedResult(null);
  };

  const blockTypeButtons: Array<{ type: RichBlockType; label: string; icon: React.ReactNode }> = [
    { type: 'heading', label: 'Heading', icon: <FileText className="w-4 h-4" /> },
    { type: 'paragraph', label: 'Text Block', icon: <FileText className="w-4 h-4 text-zinc-400" /> },
    { type: 'bullet_list', label: 'Bullet List', icon: <Layers className="w-4 h-4 text-sky-500" /> },
    { type: 'image', label: 'Image', icon: <ImageIcon className="w-4 h-4 text-emerald-500" /> },
    { type: 'table', label: 'Data Table', icon: <Table className="w-4 h-4 text-purple-500" /> },
    { type: 'code', label: 'Code / CLI', icon: <Code className="w-4 h-4 text-amber-500" /> },
    { type: 'quote', label: 'Quote / Callout', icon: <Quote className="w-4 h-4 text-blue-500" /> },
    { type: 'chart', label: 'Chart Metric', icon: <BarChart3 className="w-4 h-4 text-rose-500" /> },
    { type: 'video', label: 'Video Embed', icon: <Video className="w-4 h-4 text-red-500" /> },
    { type: 'file', label: 'File Download', icon: <Paperclip className="w-4 h-4 text-teal-500" /> },
    { type: 'divider', label: 'Divider', icon: <Minus className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-sky-500 mb-1">
            <span>Step 3 of 7</span>
            <span>•</span>
            <span>Slide Studio</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight font-sans">
            Module & Slide Content Studio
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Canva & Notion style block editor. Edit slides, craft rich multimedia blocks, and use in-line AI assistance.
          </p>
        </div>

        {/* Global AI Action for Current Slide */}
        <button
          type="button"
          onClick={() => triggerAiAction('generate_slide')}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs hover:opacity-90 transition shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>✨ Generate Full Slide with AI</span>
        </button>
      </div>

      {/* 3-COLUMN STUDIO LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* 1. LEFT COLUMN: COURSE STRUCTURE TREE (3 cols) */}
        {/* ========================================================================= */}
        <div className={`lg:col-span-3 rounded-2xl border p-4 space-y-4 max-h-[80vh] overflow-y-auto ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Course Outline</h3>
            <span className="text-[10px] font-bold text-zinc-400">{modules.length} Modules</span>
          </div>

          <div className="space-y-3">
            {modules.map((mod, modIdx) => {
              const isModActive = activeModIdx === modIdx;
              const modSlides = mod.slides || mod.slides_data || [];

              return (
                <div key={mod.id} className="space-y-1">
                  {/* Module Header Pill */}
                  <div
                    onClick={() => {
                      setActiveModIdx(modIdx);
                      setActiveSlideIdx(0);
                    }}
                    className={`p-2.5 rounded-xl cursor-pointer font-bold text-xs flex items-center justify-between transition ${
                      isModActive
                        ? 'bg-sky-500 text-white shadow-sm'
                        : isLight
                        ? 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                        : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Layers className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{mod.title}</span>
                    </div>
                    <span className="text-[10px] opacity-80 shrink-0">{modSlides.length}s</span>
                  </div>

                  {/* Slides under active module */}
                  {isModActive && (
                    <div className="pl-3 pr-1 py-1 space-y-1 border-l-2 border-sky-500/30 ml-2">
                      {modSlides.map((slide, slideIdx) => {
                        const isSlideActive = activeSlideIdx === slideIdx;
                        return (
                          <div
                            key={slide.id}
                            onClick={() => setActiveSlideIdx(slideIdx)}
                            className={`p-2 rounded-lg cursor-pointer text-xs font-medium flex items-center justify-between group transition ${
                              isSlideActive
                                ? isLight
                                  ? 'bg-zinc-200 text-black font-bold'
                                  : 'bg-zinc-800 text-white font-bold'
                                : 'text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
                            }`}
                          >
                            <span className="truncate">
                              {slide.slide_number || slideIdx + 1}. {slide.title || 'Untitled Slide'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSlide(slideIdx);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 p-0.5 ml-1"
                              title="Delete Slide"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}

                      {/* Add Slide Button */}
                      <button
                        type="button"
                        onClick={handleAddSlide}
                        className="w-full py-1.5 px-2 rounded-lg border border-dashed text-[11px] font-bold text-sky-500 hover:bg-sky-500/10 transition flex items-center justify-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Slide</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CENTER COLUMN: SLIDE CANVAS (6 cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-4">
          {/* Canvas Slide Card */}
          <div className={`p-6 rounded-3xl border shadow-lg space-y-6 ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
            {/* Slide Header & Title */}
            <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-500">
                  {currentModule.title} • Slide {currentSlide.slide_number || activeSlideIdx + 1}
                </span>
                <input
                  type="text"
                  value={currentSlide.title || ''}
                  onChange={(e) => handleUpdateCurrentSlide({ title: e.target.value })}
                  placeholder="Slide Title..."
                  className={`w-full text-xl sm:text-2xl font-black bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-sky-500 focus:outline-none py-1 mt-0.5 ${
                    isLight ? 'text-black' : 'text-white'
                  }`}
                />
              </div>

              {/* In-line Slide AI Button */}
              <button
                type="button"
                onClick={() => triggerAiAction('improve')}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold shrink-0 hover:bg-amber-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>✨ Refine Slide</span>
              </button>
            </div>

            {/* Render Slide Blocks */}
            <div className="space-y-4 min-h-[300px]">
              {(currentSlide.blocks || []).length === 0 ? (
                <div className="py-12 text-center text-zinc-400 border-2 border-dashed rounded-2xl p-6">
                  <Layout className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-bold">This slide is empty</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Click any content block below to add headings, text, diagrams, code, or charts.
                  </p>
                </div>
              ) : (
                (currentSlide.blocks || []).map((block, bIdx) => (
                  <div
                    key={block.id}
                    className={`relative p-4 rounded-2xl border group transition ${
                      isLight ? 'bg-zinc-50 border-zinc-200 hover:border-zinc-300' : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* Block Top Controls */}
                    <div className="absolute right-3 top-3 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => triggerAiAction('improve', block.id)}
                        className="p-1 rounded bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-[10px] font-bold flex items-center space-x-1"
                        title="Improve with AI"
                      >
                        <Sparkles className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={bIdx === 0}
                        onClick={() => handleMoveBlock(bIdx, 'up')}
                        className="p-1 rounded text-zinc-400 hover:text-black dark:hover:text-white"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={bIdx === (currentSlide.blocks || []).length - 1}
                        onClick={() => handleMoveBlock(bIdx, 'down')}
                        className="p-1 rounded text-zinc-400 hover:text-black dark:hover:text-white"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(block.id)}
                        className="p-1 rounded text-zinc-400 hover:text-red-500"
                        title="Delete Block"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Block Type Label */}
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-2">
                      {block.type}
                    </span>

                    {/* Dynamic Block Content Editors */}
                    {block.type === 'heading' && (
                      <input
                        type="text"
                        value={block.content.text || ''}
                        onChange={(e) => handleUpdateBlock(block.id, { text: e.target.value })}
                        className="w-full text-lg font-black bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-sky-500 rounded p-1"
                        placeholder="Heading text..."
                      />
                    )}

                    {block.type === 'paragraph' && (
                      <textarea
                        rows={3}
                        value={block.content.text || ''}
                        onChange={(e) => handleUpdateBlock(block.id, { text: e.target.value })}
                        className="w-full text-sm bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-sky-500 rounded p-1 leading-relaxed"
                        placeholder="Enter explanatory paragraph..."
                      />
                    )}

                    {block.type === 'bullet_list' && (
                      <div className="space-y-1.5">
                        {(block.content.items || []).map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newItems = [...(block.content.items || [])];
                                newItems[itemIdx] = e.target.value;
                                handleUpdateBlock(block.id, { items: newItems });
                              }}
                              className="flex-1 text-sm bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-sky-500 rounded p-0.5"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = [...(block.content.items || []), 'New key point'];
                            handleUpdateBlock(block.id, { items: newItems });
                          }}
                          className="text-xs text-sky-500 font-bold hover:underline pt-1"
                        >
                          + Add List Item
                        </button>
                      </div>
                    )}

                    {block.type === 'image' && (
                      <div className="space-y-2">
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900">
                          <img
                            src={block.content.url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'}
                            alt="Slide asset"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <input
                          type="text"
                          value={block.content.url || ''}
                          onChange={(e) => handleUpdateBlock(block.id, { url: e.target.value })}
                          placeholder="Image URL..."
                          className="w-full text-xs font-mono px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent"
                        />
                      </div>
                    )}

                    {block.type === 'code' && (
                      <div className="space-y-2">
                        <textarea
                          rows={4}
                          value={block.content.code || ''}
                          onChange={(e) => handleUpdateBlock(block.id, { code: e.target.value })}
                          className="w-full text-xs font-mono bg-zinc-950 text-emerald-400 p-3 rounded-xl focus:outline-none"
                          placeholder="// Code snippet or telecom CLI commands"
                        />
                      </div>
                    )}

                    {block.type === 'quote' && (
                      <div className="border-l-4 border-sky-500 pl-3 space-y-1">
                        <textarea
                          rows={2}
                          value={block.content.text || ''}
                          onChange={(e) => handleUpdateBlock(block.id, { text: e.target.value })}
                          className="w-full text-sm italic bg-transparent border-0 focus:outline-none"
                          placeholder="Quote or rule..."
                        />
                        <input
                          type="text"
                          value={block.content.author || ''}
                          onChange={(e) => handleUpdateBlock(block.id, { author: e.target.value })}
                          className="w-full text-xs text-zinc-400 bg-transparent border-0 focus:outline-none"
                          placeholder="— Source / Author"
                        />
                      </div>
                    )}

                    {block.type === 'table' && (
                      <div className="overflow-x-auto text-xs">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-300 dark:border-zinc-700">
                              {(block.content.headers || ['Col 1', 'Col 2']).map((h, hIdx) => (
                                <th key={hIdx} className="p-1.5 text-left font-bold">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(block.content.rows || [['Data 1', 'Data 2']]).map((r, rIdx) => (
                              <tr key={rIdx} className="border-b border-zinc-200 dark:border-zinc-800">
                                {r.map((c, cIdx) => (
                                  <td key={cIdx} className="p-1.5">{c}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {block.type === 'divider' && (
                      <hr className="border-zinc-300 dark:border-zinc-700 my-2" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Block Picker Toolbar */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-2">
                + Add Content Block
              </span>
              <div className="flex flex-wrap gap-2">
                {blockTypeButtons.map((btn) => (
                  <button
                    key={btn.type}
                    type="button"
                    onClick={() => handleAddBlock(btn.type)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                      isLight ? 'border-zinc-200 hover:bg-zinc-100 text-zinc-700' : 'border-zinc-800 hover:bg-zinc-900 text-zinc-300'
                    }`}
                  >
                    {btn.icon}
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. RIGHT COLUMN: SLIDE PROPERTIES & INSTRUCTOR NOTES (3 cols) */}
        {/* ========================================================================= */}
        <div className={`lg:col-span-3 rounded-2xl border p-4 space-y-5 ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Slide Inspector</h3>
            <span className="text-xs font-bold text-sky-500">Slide {activeSlideIdx + 1}</span>
          </div>

          {/* Quick AI Assist Options */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
              In-line AI Content Tools
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => triggerAiAction('improve')}
                className="p-2 rounded-xl border text-[11px] font-bold text-left flex items-center space-x-1.5 hover:border-sky-500"
              >
                <Sparkles className="w-3 h-3 text-sky-500" />
                <span>✨ Improve</span>
              </button>
              <button
                type="button"
                onClick={() => triggerAiAction('simplify')}
                className="p-2 rounded-xl border text-[11px] font-bold text-left flex items-center space-x-1.5 hover:border-emerald-500"
              >
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>✨ Simplify</span>
              </button>
              <button
                type="button"
                onClick={() => triggerAiAction('expand')}
                className="p-2 rounded-xl border text-[11px] font-bold text-left flex items-center space-x-1.5 hover:border-purple-500"
              >
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span>✨ Expand</span>
              </button>
              <button
                type="button"
                onClick={() => triggerAiAction('generate_example')}
                className="p-2 rounded-xl border text-[11px] font-bold text-left flex items-center space-x-1.5 hover:border-amber-500"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>✨ Example</span>
              </button>
            </div>
          </div>

          {/* Instructor Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
              Instructor Speaking Notes
            </label>
            <textarea
              rows={6}
              value={currentSlide.notes || ''}
              onChange={(e) => handleUpdateCurrentSlide({ notes: e.target.value })}
              placeholder="Private teaching notes, emphasis points, and speaking prompts..."
              className={`w-full p-3 rounded-xl border text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-900 border-zinc-700'
              }`}
            />
            <p className="text-[10px] text-zinc-400 mt-1">
              These notes are for instructor presentation reference.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Bottom Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={onPrev}
          className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl border text-sm font-bold ${
            isLight ? 'border-zinc-300 hover:bg-zinc-100 text-zinc-700' : 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Roadmap</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center space-x-2 px-8 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 transition shadow-sm"
        >
          <span>Continue to Assessments & Quizzes →</span>
        </button>
      </div>

      {/* AI REVIEW & CONFIRMATION MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border p-6 sm:p-8 ${isLight ? 'bg-white border-zinc-200 text-black' : 'bg-zinc-950 border-zinc-800 text-white'}`}>
            <button
              onClick={() => setShowAiModal(false)}
              className="absolute right-6 top-6 p-2 rounded-full text-zinc-400 hover:text-black dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black">AI Content Assistant</h3>
                <p className="text-xs text-zinc-500">
                  Review generated suggestions before applying. Your existing content is never overwritten without confirmation.
                </p>
              </div>
            </div>

            {aiLoading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-bold text-zinc-500">Generating with Groq / Gemini failover engine...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {aiProviderUsed && (
                  <div className="text-[10px] font-mono text-zinc-400 flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Generated via {aiProviderUsed.toUpperCase()} Engine</span>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm leading-relaxed max-h-60 overflow-y-auto font-sans">
                  {aiGeneratedResult || 'No content generated'}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800 gap-3">
                  <button
                    type="button"
                    onClick={() => triggerAiAction(aiAction, aiTargetBlockId || undefined)}
                    className="px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowAiModal(false)}
                      className="px-4 py-2.5 rounded-xl border text-xs font-bold"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={handleAcceptAiContent}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
                    >
                      ✓ Accept & Apply to Slide
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
