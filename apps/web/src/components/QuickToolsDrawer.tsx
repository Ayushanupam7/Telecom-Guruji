'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { 
  SlidersHorizontal, X, Globe, Moon, Sun, Check, ChevronLeft,
  FileText, BookOpen, Maximize, Search, Trash2, Sparkles, Command,
  Cloud, Bookmark, BookmarkCheck, RefreshCw, Star
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { SUPPORTED_LANGUAGES } from '@signalhub/shared';

// Comprehensive Categorized Telecom & Cloud Glossary Library
export interface GlossaryItem {
  term: string;
  category: 'Architecture' | '5G RAN' | '5G Core' | 'Protocols' | 'Cloud' | 'Billing & Operations' | 'General';
  definition: string;
  courseTags?: string[]; // Course IDs or slugs that this term specifically belongs to
}

const TELECOM_GLOSSARY: GlossaryItem[] = [
  // Distributed Systems & Cloud Architecture (Matching Distributed Systems Masterclass)
  {
    term: 'Circuit Breaker Pattern',
    category: 'Architecture',
    courseTags: ['c3333333-3333-3333-3333-333333333333', 'distributed-systems-masterclass', 'distributed-systems'],
    definition: 'Fault-tolerance pattern preventing cascading failure across microservices during node degradation by tripping an open circuit state.'
  },
  {
    term: 'Zero-Copy Pipeline',
    category: 'Architecture',
    courseTags: ['c3333333-3333-3333-3333-333333333333', 'distributed-systems-masterclass', 'distributed-systems'],
    definition: 'Direct memory-to-kernel DMA transfers bypassing user-space buffer copies for ultra-high throughput and microsecond packet processing.'
  },
  {
    term: 'Canary Deployment',
    category: 'Cloud',
    courseTags: ['c3333333-3333-3333-3333-333333333333', 'distributed-systems-masterclass', 'distributed-systems'],
    definition: 'Gradual rollout strategy routing a fractional percentage (e.g. 5%) of live production traffic to verify stability before wide release.'
  },
  {
    term: 'Rate Limiting (Token Bucket)',
    category: 'Protocols',
    courseTags: ['c3333333-3333-3333-3333-333333333333', 'distributed-systems-masterclass', 'distributed-systems'],
    definition: 'Traffic shaping algorithm throttling bursts to enforce SLA thresholds and protect backend microservice clusters from overload.'
  },
  {
    term: 'Async Event Queue',
    category: 'Architecture',
    courseTags: ['c3333333-3333-3333-3333-333333333333', 'distributed-systems-masterclass', 'distributed-systems'],
    definition: 'Decoupled publisher-subscriber messaging buffer for burst-tolerant asynchronous processing and background workers.'
  },
  {
    term: 'CAP Theorem',
    category: 'Architecture',
    courseTags: ['c3333333-3333-3333-3333-333333333333', 'distributed-systems-masterclass', 'distributed-systems'],
    definition: 'Fundamental distributed computing theorem stating a system can only guarantee at most 2 of Consistency, Availability, and Partition Tolerance.'
  },
  {
    term: 'Raft Consensus Algorithm',
    category: 'Protocols',
    courseTags: ['c3333333-3333-3333-3333-333333333333', 'distributed-systems-masterclass', 'distributed-systems'],
    definition: 'Leader-based distributed consensus algorithm ensuring deterministic log replication and high availability across cluster nodes.'
  },
  {
    term: 'Service Mesh (Envoy/Istio)',
    category: 'Cloud',
    courseTags: ['c3333333-3333-3333-3333-333333333333', 'distributed-systems-masterclass', 'distributed-systems'],
    definition: 'Dedicated infrastructure layer handling service-to-service communication, mutual TLS (mTLS) encryption, and dynamic traffic routing.'
  },
  {
    term: 'gRPC & Protocol Buffers',
    category: 'Protocols',
    courseTags: ['c3333333-3333-3333-3333-333333333333', 'distributed-systems-masterclass', 'distributed-systems'],
    definition: 'High-performance binary RPC framework utilizing HTTP/2 multiplexing, bi-directional streaming, and strongly typed interface schemas.'
  },
  {
    term: 'Idempotency Key',
    category: 'Protocols',
    courseTags: ['c3333333-3333-3333-3333-333333333333', 'distributed-systems-masterclass', 'distributed-systems'],
    definition: 'Unique request identifier ensuring duplicate network retries produce identical state results without duplicate transactions or side-effects.'
  },
  {
    term: 'P99 Latency & SLA',
    category: 'Cloud',
    courseTags: ['c3333333-3333-3333-3333-333333333333', 'distributed-systems-masterclass', 'distributed-systems'],
    definition: '99th percentile response time metric ensuring the slowest 1% of requests satisfy production SLA performance benchmarks.'
  },

  // 5G NR & Wireless Radio Access Network (RAN)
  {
    term: 'gNodeB (gNB)',
    category: '5G RAN',
    courseTags: ['5g-nr', '5g-masterclass', 'ran', 'wireless'],
    definition: '5G NR base station node providing user plane and control plane protocol terminations towards the UE.'
  },
  {
    term: 'Massive MIMO & Beamforming',
    category: '5G RAN',
    courseTags: ['5g-nr', '5g-masterclass', 'ran', 'wireless'],
    definition: '32T32R/64T64R antenna array technology focusing RF transmissions into narrow directional spatial beams for 10x capacity multiplier.'
  },
  {
    term: 'OFDMA',
    category: '5G RAN',
    courseTags: ['5g-nr', '5g-masterclass', 'ran', 'wireless'],
    definition: 'Orthogonal Frequency Division Multiple Access allocating subcarriers across individual users for maximum spectral efficiency.'
  },
  {
    term: 'BWP (Bandwidth Part)',
    category: '5G RAN',
    courseTags: ['5g-nr', '5g-masterclass', 'ran', 'wireless'],
    definition: 'Dynamic sub-band configuration within a wideband 5G carrier enabling UEs to operate on narrow bandwidths to conserve battery.'
  },
  {
    term: 'Carrier Aggregation (CA)',
    category: '5G RAN',
    courseTags: ['5g-nr', '5g-masterclass', 'ran', 'wireless'],
    definition: 'Combining multiple carrier frequencies into a single wider aggregated RF channel for ultra-high multi-Gbps peak data throughput.'
  },
  {
    term: 'eCPRI & O-RAN (Split 7.2x)',
    category: '5G RAN',
    courseTags: ['5g-nr', '5g-masterclass', 'ran', 'wireless'],
    definition: 'Open Radio Access Network packetized fronthaul interface connecting Radio Units (RU) and Distributed Units (DU) over Ethernet.'
  },
  {
    term: 'mmWave vs Sub-6GHz',
    category: '5G RAN',
    courseTags: ['5g-nr', '5g-masterclass', 'ran', 'wireless'],
    definition: 'Millimeter-wave (24-100 GHz) for high-density extreme throughput vs Sub-6 GHz (FR1) for wide-area coverage and building penetration.'
  },
  {
    term: 'HARQ (Hybrid ARQ)',
    category: '5G RAN',
    courseTags: ['5g-nr', '5g-masterclass', 'ran', 'wireless'],
    definition: 'Forward Error Correction (FEC) combined with Automatic Repeat reQuest at PHY/MAC layer for ultra-reliable low latency communications.'
  },

  // 5G Core Network & Telecom Operations
  {
    term: 'AMF (Access & Mobility Function)',
    category: '5G Core',
    courseTags: ['5g-core', '5g-masterclass', 'core'],
    definition: '5G Core control plane function managing connection, reachability, registration, and mobility management.'
  },
  {
    term: 'UPF (User Plane Function)',
    category: '5G Core',
    courseTags: ['5g-core', '5g-masterclass', 'core'],
    definition: '5G Core user plane anchor for packet routing, forwarding, QoS enforcement, and external IP data network termination.'
  },
  {
    term: 'SMF (Session Management Function)',
    category: '5G Core',
    courseTags: ['5g-core', '5g-masterclass', 'core'],
    definition: '5G Core function managing PDU session establishment, modification, and IP address allocation with UPF control.'
  },
  {
    term: 'Network Slicing (NSSAI)',
    category: '5G Core',
    courseTags: ['5g-core', '5g-masterclass', 'core'],
    definition: 'Virtual network architecture providing isolated end-to-end logical networks tailored for eMBB, URLLC, and mMTC use cases.'
  },
  {
    term: 'VoNR (Voice over New Radio)',
    category: '5G Core',
    courseTags: ['5g-core', '5g-masterclass', 'core'],
    definition: 'Native IP voice and video communications over 5G Standalone (SA) core network infrastructure with guaranteed QoS.'
  },
  {
    term: '5G NSA vs 5G SA',
    category: '5G Core',
    courseTags: ['5g-core', '5g-masterclass', 'core'],
    definition: 'Non-Standalone (Option 3x) using 4G EPC core with 5G RAN vs Standalone (Option 2) using native cloud-native 5G Core (5GC).'
  },
  {
    term: 'QoS & 5QI (5G QoS Identifier)',
    category: '5G Core',
    courseTags: ['5g-core', '5g-masterclass', 'core'],
    definition: '5G Quality of Service framework guaranteeing latency budgets, packet error rates, and priority weighting for specific traffic flows.'
  },
  {
    term: 'CDR (Call Detail Record)',
    category: 'Billing & Operations',
    courseTags: ['billing', 'oss-bss', 'telecom-operations'],
    definition: 'Standardized telecom billing record containing timestamp, session duration, source/destination IMSI, and byte metrics for billing.'
  },
  {
    term: 'UDM & AUSF',
    category: '5G Core',
    courseTags: ['5g-core', '5g-masterclass', 'core'],
    definition: 'Unified Data Management and Authentication Server Function handling subscriber credentials, AKA keys, and subscription profiles.'
  },
  {
    term: 'PCF (Policy Control Function)',
    category: '5G Core',
    courseTags: ['5g-core', '5g-masterclass', 'core'],
    definition: '5G Core policy engine governing dynamic charging rules, QoS policies, and session bandwidth constraints.'
  }
];

// Notebook & Multi-Page Types
export interface NotePage {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentNotebook {
  id: string;
  name: string;
  color?: string; // 'sky' | 'emerald' | 'amber' | 'purple' | 'rose'
  pages: NotePage[];
  activePageId: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_NOTEBOOKS: StudentNotebook[] = [
  {
    id: 'nb-default-1',
    name: 'My Telecom Study Notes',
    color: 'sky',
    pages: [
      {
        id: 'pg-default-1',
        title: 'General Scratchpad',
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    activePageId: 'pg-default-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function QuickToolsDrawer() {
  const rawPathname = usePathname();
  const pathname = rawPathname || '';

  // Extract Course Context from Pathname
  const courseMatch = pathname.match(/\/(?:learn|courses|certificate)\/([^/]+)/);
  const activeCourseId = courseMatch ? courseMatch[1] : null;
  const isCourseContext = Boolean(activeCourseId);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'preferences' | 'notes' | 'glossary'>('preferences');
  const [searchTerm, setSearchTerm] = useState('');

  // Course Glossary Scope Filter: 'course' | 'all' | 'saved'
  const [glossaryScope, setGlossaryScope] = useState<'course' | 'all' | 'saved'>(isCourseContext ? 'course' : 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Keep scope in sync when navigating between course and non-course pages
  useEffect(() => {
    if (isCourseContext) {
      setGlossaryScope('course');
    }
  }, [activeCourseId, isCourseContext]);


  // Notebooks & Multi-Page State
  const [notebooks, setNotebooks] = useState<StudentNotebook[]>(DEFAULT_NOTEBOOKS);
  const [activeNotebookId, setActiveNotebookId] = useState<string>('nb-default-1');
  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [newNotebookColor, setNewNotebookColor] = useState('sky');
  const [isRenamingPage, setIsRenamingPage] = useState(false);
  const [renamingPageTitle, setRenamingPageTitle] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Derived Active Notebook & Page
  const activeNotebook = notebooks.find((nb) => nb.id === activeNotebookId) || notebooks[0] || DEFAULT_NOTEBOOKS[0];
  const activePage = activeNotebook.pages.find((p) => p.id === activeNotebook.activePageId) || activeNotebook.pages[0];

  // AI Glossary State (Groq + Gemini AI)
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLang, setAiLang] = useState<string>('en');
  const [copiedToNotes, setCopiedToNotes] = useState(false);

  // Slide Scanner State
  const [activeSlide, setActiveSlide] = useState<any>(null);
  const [scannedSlideTerms, setScannedSlideTerms] = useState<any[]>([]);
  const [isScanningSlide, setIsScanningSlide] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Supabase Profile Sync State
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [savedGlossary, setSavedGlossary] = useState<any[]>([]);
  const [glossaryHistory, setGlossaryHistory] = useState<string[]>([]);
  const [glossarySubTab, setGlossarySubTab] = useState<'all' | 'saved'>('all');

  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const isLight = theme === 'light';

  const notesDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync AI language with active system language
  useEffect(() => {
    if (language) {
      setAiLang(language);
    }
  }, [language]);

  // Load Saved Notebooks & Profile Quick Tools from Supabase on Mount & User Change
  useEffect(() => {
    // 1. Initial LocalStorage fallback
    if (typeof window !== 'undefined') {
      const savedLocalNotebooks = localStorage.getItem('tg_student_notebooks');
      if (savedLocalNotebooks) {
        try {
          const parsed = JSON.parse(savedLocalNotebooks);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setNotebooks(parsed);
            setActiveNotebookId(parsed[0].id);
          }
        } catch {}
      } else {
        const legacyNotes = localStorage.getItem('tg_student_scratchpad') || '';
        if (legacyNotes) {
          const initialNbs = [
            {
              ...DEFAULT_NOTEBOOKS[0],
              pages: [
                {
                  id: 'pg-default-1',
                  title: 'General Scratchpad',
                  content: legacyNotes,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ],
            },
          ];
          setNotebooks(initialNbs);
        }
      }

      const savedLocalGlossary = localStorage.getItem('tg_saved_glossary');
      if (savedLocalGlossary) {
        try { setSavedGlossary(JSON.parse(savedLocalGlossary)); } catch {}
      }
    }

    // 2. Load from Supabase Profile if logged in
    if (user?.id) {
      const loadProfileQuickTools = async () => {
        try {
          setIsSyncing(true);
          const res = await fetch(`/api/user/quick-tools?userId=${user!.id}`);
          const resData = await res.json();
          if (resData.success && resData.data) {
            const { notebooks: remoteNotebooks, notes: remoteLegacyNotes, savedGlossary: remoteGlossary, glossaryHistory: remoteHistory, language: remoteLang, theme: remoteTheme, lastSyncedAt: remoteSynced } = resData.data;

            if (Array.isArray(remoteNotebooks) && remoteNotebooks.length > 0) {
              setNotebooks(remoteNotebooks);
              setActiveNotebookId(remoteNotebooks[0].id);
              if (typeof window !== 'undefined') localStorage.setItem('tg_student_notebooks', JSON.stringify(remoteNotebooks));
            } else if (remoteLegacyNotes) {
              const migrated = [
                {
                  ...DEFAULT_NOTEBOOKS[0],
                  pages: [
                    {
                      id: 'pg-default-1',
                      title: 'General Scratchpad',
                      content: remoteLegacyNotes,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    },
                  ],
                },
              ];
              setNotebooks(migrated);
            }

            if (Array.isArray(remoteGlossary)) {
              setSavedGlossary(remoteGlossary);
              if (typeof window !== 'undefined') localStorage.setItem('tg_saved_glossary', JSON.stringify(remoteGlossary));
            }
            if (Array.isArray(remoteHistory)) {
              setGlossaryHistory(remoteHistory);
            }
            if (remoteLang && remoteLang !== language) {
              setLanguage(remoteLang);
            }
            if (remoteSynced) {
              setLastSyncedAt(remoteSynced);
            }
          }
        } catch (err) {
          console.warn('Could not load profile quick tools:', err);
        } finally {
          setIsSyncing(false);
        }
      };
      loadProfileQuickTools();
    }
  }, [user?.id]);

  // Reusable Profile Sync to Supabase
  const syncToSupabaseProfile = useCallback(async (overrides?: {
    notebooks?: StudentNotebook[];
    notes?: string;
    language?: string;
    theme?: 'light' | 'dark';
    savedGlossary?: any[];
    glossaryHistory?: string[];
  }) => {
    if (!user?.id) return;
    setIsSyncing(true);
    try {
      const activeContent = activePage?.content || '';
      const res = await fetch('/api/user/quick-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          language: overrides?.language ?? language,
          theme: overrides?.theme ?? (isLight ? 'light' : 'dark'),
          notes: overrides?.notes ?? activeContent,
          notebooks: overrides?.notebooks ?? notebooks,
          savedGlossary: overrides?.savedGlossary ?? savedGlossary,
          glossaryHistory: overrides?.glossaryHistory ?? glossaryHistory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLastSyncedAt(data.lastSyncedAt || new Date().toISOString());
      }
    } catch (err) {
      console.warn('Sync to profile failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id, language, isLight, activePage?.content, notebooks, savedGlossary, glossaryHistory]);

  // Save Notebooks locally and trigger debounced sync to Supabase
  const persistNotebooks = (updatedNbs: StudentNotebook[]) => {
    setNotebooks(updatedNbs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tg_student_notebooks', JSON.stringify(updatedNbs));
    }

    if (user?.id) {
      if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
      notesDebounceRef.current = setTimeout(() => {
        syncToSupabaseProfile({ notebooks: updatedNbs });
      }, 1200);
    }
  };

  // Update content of active page in active notebook
  const handleUpdateActivePageContent = (newContent: string) => {
    const updated = notebooks.map((nb) => {
      if (nb.id !== activeNotebook.id) return nb;
      const updatedPages = nb.pages.map((pg) => {
        if (pg.id !== (activeNotebook.activePageId || nb.pages[0]?.id)) return pg;
        return {
          ...pg,
          content: newContent,
          updatedAt: new Date().toISOString(),
        };
      });
      return {
        ...nb,
        pages: updatedPages,
        updatedAt: new Date().toISOString(),
      };
    });

    persistNotebooks(updated);
  };

  // Add a New Page to the active notebook
  const handleAddPage = () => {
    const pageNum = activeNotebook.pages.length + 1;
    const newPage: NotePage = {
      id: `pg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `Page ${pageNum}`,
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = notebooks.map((nb) => {
      if (nb.id !== activeNotebook.id) return nb;
      return {
        ...nb,
        pages: [...nb.pages, newPage],
        activePageId: newPage.id,
        updatedAt: new Date().toISOString(),
      };
    });

    persistNotebooks(updated);
  };

  // Delete a Page from the active notebook
  const handleDeletePage = (pageIdToDelete: string) => {
    if (activeNotebook.pages.length <= 1) {
      // If last page, just clear it
      handleUpdateActivePageContent('');
      return;
    }

    const remainingPages = activeNotebook.pages.filter((p) => p.id !== pageIdToDelete);
    const newActivePageId = activeNotebook.activePageId === pageIdToDelete ? remainingPages[0].id : activeNotebook.activePageId;

    const updated = notebooks.map((nb) => {
      if (nb.id !== activeNotebook.id) return nb;
      return {
        ...nb,
        pages: remainingPages,
        activePageId: newActivePageId,
        updatedAt: new Date().toISOString(),
      };
    });

    persistNotebooks(updated);
  };

  // Rename the current active page
  const handleSavePageTitle = () => {
    const trimmed = renamingPageTitle.trim();
    if (!trimmed) {
      setIsRenamingPage(false);
      return;
    }

    const updated = notebooks.map((nb) => {
      if (nb.id !== activeNotebook.id) return nb;
      const updatedPages = nb.pages.map((pg) => {
        if (pg.id !== activePage.id) return pg;
        return { ...pg, title: trimmed, updatedAt: new Date().toISOString() };
      });
      return { ...nb, pages: updatedPages, updatedAt: new Date().toISOString() };
    });

    persistNotebooks(updated);
    setIsRenamingPage(false);
  };

  // Create a brand new Notebook
  const handleCreateNotebook = () => {
    const trimmed = newNotebookName.trim();
    if (!trimmed) return;

    const newNb: StudentNotebook = {
      id: `nb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      color: newNotebookColor || 'sky',
      pages: [
        {
          id: `pg-${Date.now()}-1`,
          title: 'Page 1',
          content: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      activePageId: `pg-${Date.now()}-1`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...notebooks, newNb];
    setActiveNotebookId(newNb.id);
    persistNotebooks(updated);
    setIsCreatingNotebook(false);
    setNewNotebookName('');
  };

  // Delete an entire notebook
  const handleDeleteNotebook = (nbIdToDelete: string) => {
    if (notebooks.length <= 1) return;
    const remaining = notebooks.filter((n) => n.id !== nbIdToDelete);
    setActiveNotebookId(remaining[0].id);
    persistNotebooks(remaining);
  };

  // Copy Page Content to Clipboard
  const handleCopyPageContent = () => {
    if (!activePage?.content) return;
    navigator.clipboard.writeText(activePage.content);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Switch Active Page within active notebook
  const handleSelectPage = (pageId: string) => {
    const updated = notebooks.map((nb) => {
      if (nb.id !== activeNotebook.id) return nb;
      return { ...nb, activePageId: pageId };
    });
    setNotebooks(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tg_student_notebooks', JSON.stringify(updated));
    }
  };

  // Handle Language Changes with immediate Supabase profile update
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setAiLang(newLang);
    if (user?.id) {
      syncToSupabaseProfile({ language: newLang });
    }
  };

  // Handle Theme Toggle with immediate Supabase profile update
  const handleThemeChange = (targetTheme: 'light' | 'dark') => {
    if ((targetTheme === 'light' && !isLight) || (targetTheme === 'dark' && isLight)) {
      toggleTheme();
      if (user?.id) {
        syncToSupabaseProfile({ theme: targetTheme });
      }
    }
  };

  // Toggle Save / Bookmark Glossary Term in Supabase Profile
  const toggleBookmarkTerm = (termObj: any) => {
    const termKey = termObj.term;
    const exists = savedGlossary.some((item) => item.term.toLowerCase() === termKey.toLowerCase());
    let updated: any[];

    if (exists) {
      updated = savedGlossary.filter((item) => item.term.toLowerCase() !== termKey.toLowerCase());
    } else {
      const newItem = {
        term: termObj.term,
        full_form: termObj.full_form || '',
        short_definition: termObj.short_definition || termObj.definition || '',
        detailed_meaning: termObj.detailed_meaning || '',
        telecom_application: termObj.telecom_application || '',
        real_world_example: termObj.real_world_example || '',
        key_takeaways: termObj.key_takeaways || [],
        saved_at: new Date().toISOString(),
      };
      updated = [newItem, ...savedGlossary];
    }

    setSavedGlossary(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tg_saved_glossary', JSON.stringify(updated));
    }
    if (user?.id) {
      syncToSupabaseProfile({ savedGlossary: updated });
    }
  };

  // Append AI definition directly into Active Page of Active Notebook
  const appendAiResultToNotes = () => {
    if (!aiResult) return;
    const formatted = `\n\n📌 [Glossary AI Note: ${aiResult.term}${aiResult.full_form ? ` (${aiResult.full_form})` : ''}]\n- Definition: ${aiResult.short_definition}\n- Meaning: ${aiResult.detailed_meaning}\n- Telecom Application: ${aiResult.telecom_application}\n- Real-World Example: ${aiResult.real_world_example}\n`;
    const newContent = ((activePage?.content || '').trim()) + formatted;
    handleUpdateActivePageContent(newContent);
    setCopiedToNotes(true);
    setTimeout(() => setCopiedToNotes(false), 2500);
  };


  // Search & Explain with Groq / Gemini AI
  const handleSearchAI = async (termToSearch?: string, targetLangOverride?: string) => {
    const query = (termToSearch || searchTerm).trim();
    if (!query) return;

    setAiLoading(true);
    setAiError(null);

    // Track search in history
    const updatedHistory = [query, ...glossaryHistory.filter((h) => h.toLowerCase() !== query.toLowerCase())].slice(0, 15);
    setGlossaryHistory(updatedHistory);
    if (user?.id) {
      syncToSupabaseProfile({ glossaryHistory: updatedHistory });
    }

    try {
      const res = await fetch('/api/ai/glossary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: query,
          language: targetLangOverride || aiLang || language || 'en',
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAiResult({
          ...data.data,
          providerUsed: data.providerUsed,
          model: data.model,
          fallbackUsed: data.fallbackUsed,
        });
      } else {
        setAiError(data.error || 'Could not fetch definition from AI provider');
      }
    } catch (err: any) {
      setAiError(err.message || 'Network error while contacting AI service');
    } finally {
      setAiLoading(false);
    }
  };

  // Scan Current Lesson Slide for Hard/Complex Terms using AI
  const handleScanCurrentSlide = async (overrideText?: string) => {
    let slideToUse = activeSlide || (typeof window !== 'undefined' ? (window as any).activeCourseSlide : null);
    const slideText = overrideText || slideToUse?.text || '';
    const slideTitle = slideToUse?.title || 'Current Slide';

    if (!slideText || !slideText.trim()) {
      setScanError('No slide text detected on current lesson player.');
      return;
    }

    setIsScanningSlide(true);
    setScanError(null);

    try {
      const res = await fetch('/api/ai/glossary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scan_slide',
          slideText,
          slideTitle,
          language: aiLang || language || 'en',
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setScannedSlideTerms(data.data);
      } else {
        setScanError(data.error || 'Could not scan slide terms');
      }
    } catch (err: any) {
      setScanError(err.message || 'Network error scanning slide terms');
    } finally {
      setIsScanningSlide(false);
    }
  };

  const handleSaveAllScannedTerms = () => {
    if (!scannedSlideTerms || scannedSlideTerms.length === 0) return;
    let updated = [...savedGlossary];
    scannedSlideTerms.forEach((item) => {
      if (!updated.some((b) => b.term.toLowerCase() === item.term.toLowerCase())) {
        updated.unshift({
          term: item.term,
          full_form: item.full_form || '',
          short_definition: item.short_definition,
          detailed_meaning: item.difficulty_reason || item.short_definition,
          category: item.category || 'General',
          saved_at: new Date().toISOString(),
        });
      }
    });
    setSavedGlossary(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tg_saved_glossary', JSON.stringify(updated));
    }
    if (user?.id) {
      syncToSupabaseProfile({ savedGlossary: updated });
    }
  };

  // Listen for open-quick-tools custom event & active-slide-change
  useEffect(() => {
    const handleOpen = (e: any) => {
      setIsOpen(true);
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
      if (e.detail?.autoScan) {
        setTimeout(() => handleScanCurrentSlide(), 200);
      }
    };

    const handleSlideChange = (e: any) => {
      if (e.detail) {
        setActiveSlide(e.detail);
      }
    };

    window.addEventListener('open-quick-tools', handleOpen);
    window.addEventListener('active-slide-change', handleSlideChange);

    if (typeof window !== 'undefined' && (window as any).activeCourseSlide) {
      setActiveSlide((window as any).activeCourseSlide);
    }

    return () => {
      window.removeEventListener('open-quick-tools', handleOpen);
      window.removeEventListener('active-slide-change', handleSlideChange);
    };
  }, []);


  // Hide completely on Authentication Page (/auth)
  if (pathname === '/auth') {
    return null;
  }

  // Course-specific and Global Glossary Filtering
  const courseSpecificTerms = TELECOM_GLOSSARY.filter((g) => {
    if (!activeCourseId) return false;
    const lowerCourseId = activeCourseId.toLowerCase();
    return g.courseTags?.some((tag) => lowerCourseId.includes(tag.toLowerCase()) || tag.toLowerCase().includes(lowerCourseId));
  });

  const activeGlossaryPool = 
    glossaryScope === 'course' && isCourseContext && courseSpecificTerms.length > 0
      ? courseSpecificTerms
      : TELECOM_GLOSSARY;

  const filteredGlossary = activeGlossaryPool.filter((g) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      g.term.toLowerCase().includes(q) ||
      g.definition.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q);
    const matchesCat = selectedCategory === 'All' || g.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getCategoryColor = (cat: GlossaryItem['category']) => {
    switch (cat) {
      case 'Architecture':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case '5G RAN':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case '5G Core':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'Protocols':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Cloud':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      case 'Billing & Operations':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <>
      {/* FLOATING RIGHT TRIGGER ARROW TAB (PERMANENTLY ACCESSIBLE) */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          type="button"
          className={`group py-3 px-2 rounded-l-2xl border-y border-l shadow-2xl transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-90 ${
            isLight
              ? 'bg-black border-zinc-800 text-white hover:bg-zinc-900 hover:px-3'
              : 'bg-white border-zinc-200 text-black hover:bg-zinc-100 hover:px-3'
          }`}
          title="Quick Tools (Notes, Settings, AI Glossary)"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'group-hover:scale-125'}`} />
        </button>
      </div>

      {/* BACKDROP OVERLAY */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* SLEEK SLIDING DRAWER PANEL */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-80 sm:w-[420px] z-50 border-l shadow-2xl transition-transform duration-250 ease-out flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${
          isLight
            ? 'bg-white border-zinc-200 text-black'
            : 'bg-zinc-950 border-zinc-800 text-white'
        }`}
      >
        {/* DRAWER HEADER */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-md">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-xs font-black tracking-tight uppercase">Quick Tools Hub</h3>
                {user?.id && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                    {isSyncing ? 'Syncing...' : 'Cloud Synced'}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                {isCourseContext ? (
                  <span className="text-[9px] text-sky-600 dark:text-sky-400 font-mono font-bold flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    <span>Course Context Active</span>
                  </span>
                ) : (
                  <span className="text-[9px] text-zinc-500 font-mono">
                    Settings • Notes • AI Glossary
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            type="button"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TAB NAVIGATION HEADER */}
        <div className="px-4 pt-2.5 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-900 pb-2.5">
          <button
            onClick={() => setActiveTab('preferences')}
            type="button"
            className={`flex-1 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'preferences'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            type="button"
            className={`flex-1 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'notes'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notes</span>
            <span className="text-[9px] opacity-70 font-mono">
              ({activeNotebook.pages.length}p)
            </span>
          </button>

          <button
            onClick={() => setActiveTab('glossary')}
            type="button"
            className={`flex-1 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'glossary'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Glossary</span>
            {savedGlossary.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[8px] bg-amber-500 text-black font-black">
                {savedGlossary.length}
              </span>
            )}
          </button>
        </div>

        {/* DRAWER CONTENT BODY */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 font-sans text-xs">
          
          {/* TAB 1: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-4 animate-in fade-in">
              {/* LANGUAGE SELECTOR */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-mono font-bold uppercase text-[11px]">
                    <Globe className="w-3.5 h-3.5" />
                    <span>App Language</span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase">
                    {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = language === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        type="button"
                        className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold'
                            : isLight
                            ? 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="text-base">{lang.flag}</span>
                          <div>
                            <span className="text-xs block font-bold">{lang.label}</span>
                            <span className="text-[9px] opacity-70 font-mono">{lang.nativeName}</span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* APPEARANCE MODE */}
              <div className="space-y-2.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between font-mono font-bold uppercase text-[11px]">
                  <div className="flex items-center space-x-1.5">
                    {isLight ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    <span>Appearance Theme</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleThemeChange('light')}
                    type="button"
                    className={`p-3 rounded-xl border text-center space-y-1 transition-all ${
                      isLight
                        ? 'bg-black text-white border-black font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <Sun className="w-4 h-4 mx-auto" />
                    <span className="text-[11px] block font-bold">Light Mode</span>
                  </button>

                  <button
                    onClick={() => handleThemeChange('dark')}
                    type="button"
                    className={`p-3 rounded-xl border text-center space-y-1 transition-all ${
                      !isLight
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    <Moon className="w-4 h-4 mx-auto" />
                    <span className="text-[11px] block font-bold">Dark Mode</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MULTI-NOTEBOOK & MULTI-PAGE NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-3.5 animate-in fade-in">
              
              {/* NOTEBOOK SELECTOR & ACTIONS BAR */}
              <div className="p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                    <select
                      value={activeNotebook.id}
                      onChange={(e) => setActiveNotebookId(e.target.value)}
                      className="text-xs font-mono font-bold bg-transparent border-0 focus:outline-none truncate cursor-pointer flex-1"
                      title="Select Active Notebook"
                    >
                      {notebooks.map((nb) => (
                        <option key={nb.id} value={nb.id} className="bg-white dark:bg-black text-black dark:text-white">
                          📚 {nb.name} ({nb.pages.length} {nb.pages.length === 1 ? 'page' : 'pages'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsCreatingNotebook((prev) => !prev)}
                      className="px-2 py-1 rounded-lg bg-black text-white dark:bg-white dark:text-black text-[10px] font-mono font-bold hover:opacity-90 transition flex items-center space-x-1"
                      title="Create New Notebook"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                      <span>+ Notebook</span>
                    </button>

                    {notebooks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteNotebook(activeNotebook.id)}
                        className="p-1 text-zinc-400 hover:text-red-500 rounded-md transition"
                        title="Delete this Notebook"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* CREATE NOTEBOOK INLINE FORM */}
                {isCreatingNotebook && (
                  <div className="p-3 rounded-xl border border-sky-500/30 bg-sky-500/5 space-y-2.5 animate-in fade-in">
                    <div className="text-[10px] font-mono font-bold uppercase text-sky-600 dark:text-sky-400">
                      Create New Notebook
                    </div>
                    <input
                      type="text"
                      value={newNotebookName}
                      onChange={(e) => setNewNotebookName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreateNotebook(); }}
                      placeholder="e.g. 5G NR Architecture & Exam Notes"
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono focus:outline-none ${
                        isLight ? 'bg-white border-zinc-200 text-black' : 'bg-black border-zinc-700 text-white'
                      }`}
                      autoFocus
                    />
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        {['sky', 'emerald', 'amber', 'purple', 'rose'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewNotebookColor(c)}
                            className={`w-4 h-4 rounded-full transition-transform ${
                              c === 'sky' ? 'bg-sky-500' :
                              c === 'emerald' ? 'bg-emerald-500' :
                              c === 'amber' ? 'bg-amber-500' :
                              c === 'purple' ? 'bg-purple-500' : 'bg-rose-500'
                            } ${newNotebookColor === c ? 'scale-125 ring-2 ring-black dark:ring-white' : 'opacity-60'}`}
                          />
                        ))}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setIsCreatingNotebook(false)}
                          className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 hover:text-black dark:hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!newNotebookName.trim()}
                          onClick={handleCreateNotebook}
                          className="px-2.5 py-0.5 rounded-md bg-black text-white dark:bg-white dark:text-black text-[10px] font-mono font-bold disabled:opacity-40"
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PAGES NAVIGATION TABS STRIP */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-zinc-400 font-bold">
                  <span>Pages in this Notebook ({activeNotebook.pages.length})</span>
                  <button
                    type="button"
                    onClick={handleAddPage}
                    className="text-sky-600 dark:text-sky-400 hover:underline flex items-center space-x-0.5"
                  >
                    <span>+ Add Page</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {activeNotebook.pages.map((pg, pIdx) => {
                    const isPgActive = pg.id === (activeNotebook.activePageId || activeNotebook.pages[0]?.id);
                    return (
                      <button
                        key={pg.id}
                        type="button"
                        onClick={() => handleSelectPage(pg.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition flex items-center space-x-1.5 shrink-0 ${
                          isPgActive
                            ? 'bg-black text-white dark:bg-white dark:text-black font-bold shadow-xs'
                            : isLight
                            ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200'
                            : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                        }`}
                      >
                        <FileText className="w-2.5 h-2.5" />
                        <span className="max-w-[100px] truncate">{pg.title || `Page ${pIdx + 1}`}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ACTIVE PAGE TITLE & CONTROLS TOOLBAR */}
              <div className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                {isRenamingPage ? (
                  <div className="flex items-center space-x-1.5 flex-1">
                    <input
                      type="text"
                      value={renamingPageTitle}
                      onChange={(e) => setRenamingPageTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSavePageTitle(); }}
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold flex-1 focus:outline-none border ${
                        isLight ? 'bg-white border-black' : 'bg-black border-white'
                      }`}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSavePageTitle}
                      className="px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black font-mono text-[10px] font-bold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      setRenamingPageTitle(activePage?.title || 'Page');
                      setIsRenamingPage(true);
                    }}
                    className="flex items-center space-x-1.5 cursor-pointer group flex-1 min-w-0"
                    title="Click to rename page title"
                  >
                    <span className="font-mono font-bold text-xs truncate group-hover:text-sky-500 transition">
                      📄 {activePage?.title || 'Untitled Page'}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition">
                      (edit)
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyPageContent}
                    className="p-1 rounded text-zinc-400 hover:text-black dark:hover:text-white transition"
                    title="Copy this Page"
                  >
                    {copyFeedback ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Command className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePage(activePage?.id || '')}
                    className="p-1 rounded text-zinc-400 hover:text-red-500 transition"
                    title={activeNotebook.pages.length > 1 ? 'Delete this Page' : 'Clear Page'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* MULTI-LINE PAGE CONTENT TEXTAREA */}
              <textarea
                value={activePage?.content || ''}
                onChange={(e) => handleUpdateActivePageContent(e.target.value)}
                placeholder={`Type your notes, equations, and slide takeaways for "${activePage?.title || 'this page'}"... (Saved to Supabase Profile)`}
                rows={11}
                className={`w-full p-3 rounded-xl border text-xs font-mono focus:outline-none transition-all resize-none ${
                  isLight
                    ? 'bg-zinc-50 border-zinc-200 text-black focus:border-black'
                    : 'bg-zinc-900 border-zinc-800 text-white focus:border-white'
                }`}
              />

              {/* FOOTER METRICS & SUPABASE SYNC STATUS */}
              <div className="text-[10px] text-zinc-400 font-mono flex items-center justify-between">
                <span>{(activePage?.content || '').length} chars • {((activePage?.content || '').trim().split(/\s+/).filter(Boolean)).length} words</span>
                <span className="text-emerald-500 font-bold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{user ? (isSyncing ? 'Syncing...' : 'Cloud Profile Synced') : 'Saved Locally'}</span>
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: CONTEXT-AWARE TELECOM & COURSE GLOSSARY */}
          {activeTab === 'glossary' && (
            <div className="space-y-4 animate-in fade-in">
              
              {/* 1. TOP NAVIGATION / SCOPE SELECTOR */}
              <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => { setGlossaryScope('all'); setAiResult(null); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                    glossaryScope === 'all'
                      ? 'bg-white dark:bg-zinc-800 text-black dark:text-white font-semibold shadow-xs'
                      : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  All Terms ({TELECOM_GLOSSARY.length})
                </button>

                {isCourseContext && (
                  <button
                    type="button"
                    onClick={() => { setGlossaryScope('course'); setAiResult(null); }}
                    className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                      glossaryScope === 'course'
                        ? 'bg-white dark:bg-zinc-800 text-sky-600 dark:text-sky-400 font-semibold shadow-xs'
                        : 'text-zinc-500 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    🎯 This Course ({courseSpecificTerms.length})
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => { setGlossaryScope('saved'); setAiResult(null); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1 ${
                    glossaryScope === 'saved'
                      ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 font-semibold shadow-xs'
                      : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Bookmark className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                  <span>Saved ({savedGlossary.length})</span>
                </button>
              </div>

              {/* SLIDE SCANNER BANNER (When course slide context is active) */}
              {(isCourseContext || activeSlide) && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-sky-500/20 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shrink-0" />
                        <span className="text-xs font-bold text-sky-600 dark:text-sky-400 block truncate">
                          Slide Term Scanner
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {activeSlide?.title ? `Active: "${activeSlide.title}"` : 'Scan lesson slide for difficult terms'}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isScanningSlide}
                      onClick={() => handleScanCurrentSlide()}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-xs transition flex items-center space-x-1 shrink-0 disabled:opacity-40"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isScanningSlide ? 'animate-spin' : ''}`} />
                      <span>{isScanningSlide ? 'Scanning...' : 'Scan Slide'}</span>
                    </button>
                  </div>

                  {/* Scan error message */}
                  {scanError && (
                    <p className="text-[11px] text-red-500 font-medium">{scanError}</p>
                  )}

                  {/* Extracted Slide Terms List */}
                  {scannedSlideTerms.length > 0 && (
                    <div className="pt-2 border-t border-sky-500/15 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                        <span>Extracted Hard Terms ({scannedSlideTerms.length})</span>
                        <button
                          type="button"
                          onClick={handleSaveAllScannedTerms}
                          className="px-2 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold text-[10px] transition"
                        >
                          + Save All to Glossary
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin">
                        {scannedSlideTerms.map((sItem, sIdx) => {
                          const isSaved = savedGlossary.some((b) => b.term.toLowerCase() === sItem.term.toLowerCase());
                          return (
                            <div
                              key={sIdx}
                              className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs space-y-1"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="font-bold text-sky-600 dark:text-sky-400">{sItem.term}</span>
                                  {sItem.full_form && (
                                    <span className="text-[10px] text-zinc-400 font-mono ml-1">({sItem.full_form})</span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSearchTerm(sItem.term);
                                      handleSearchAI(sItem.term);
                                    }}
                                    className="px-2 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-[10px] font-semibold flex items-center space-x-0.5"
                                  >
                                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                                    <span>AI Explain</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleBookmarkTerm(sItem)}
                                    className={`p-1 rounded transition ${isSaved ? 'text-amber-500' : 'text-zinc-400 hover:text-amber-500'}`}
                                    title={isSaved ? 'Bookmarked' : 'Bookmark Term'}
                                  >
                                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                                  </button>
                                </div>
                              </div>
                              <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-snug">
                                {sItem.short_definition}
                              </p>
                              {sItem.difficulty_reason && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                                  💡 {sItem.difficulty_reason}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. SEARCH & AI BAR */}
              {glossaryScope !== 'saved' && (
                <div className="space-y-2.5">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 absolute left-3 text-zinc-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchTerm.trim()) {
                          handleSearchAI();
                        }
                      }}
                      placeholder={
                        glossaryScope === 'course'
                          ? 'Search course terms or ask AI...'
                          : 'Search term or ask AI (e.g. gNB, UPF, 5QI)...'
                      }
                      className={`w-full pl-9 pr-24 py-2.5 rounded-xl border text-xs font-sans transition-all focus:outline-none focus:ring-2 ${
                        isLight
                          ? 'bg-zinc-50 border-zinc-200 text-black placeholder:text-zinc-400 focus:ring-sky-500/20 focus:border-sky-500'
                          : 'bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:ring-sky-500/20 focus:border-sky-500'
                      }`}
                    />
                    
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-20 p-1 text-zinc-400 hover:text-black dark:hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={!searchTerm.trim() || aiLoading}
                      onClick={() => handleSearchAI()}
                      className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-xs disabled:opacity-40 transition-all flex items-center space-x-1 shadow-xs"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                      <span>Ask AI</span>
                    </button>
                  </div>

                  {/* CATEGORIES & LANGUAGE ROW */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    {/* Category Scroll Pills */}
                    <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none flex-1">
                      {['All', 'Architecture', '5G RAN', '5G Core', 'Protocols', 'Cloud', 'Billing & Operations'].map((cat) => {
                        const isActive = selectedCategory === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${
                              isActive
                                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs font-semibold'
                                : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>

                    {/* Language Dropdown */}
                    <div className="shrink-0 flex items-center space-x-1 pl-1">
                      <select
                        value={aiLang}
                        onChange={(e) => {
                          setAiLang(e.target.value);
                          if (aiResult?.term) {
                            handleSearchAI(aiResult.term, e.target.value);
                          }
                        }}
                        className="text-[10px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 font-medium focus:outline-none cursor-pointer text-zinc-700 dark:text-zinc-300"
                        title="AI Explanation Language"
                      >
                        <option value="en">🇺🇸 EN</option>
                        <option value="hi">🇮🇳 HI</option>
                        <option value="ta">🇮🇳 TA</option>
                        <option value="te">🇮🇳 TE</option>
                        <option value="kn">🇮🇳 KN</option>
                        <option value="ml">🇮🇳 ML</option>
                      </select>
                    </div>
                  </div>

                  {/* RECENT SEARCHES */}
                  {glossaryHistory.length > 0 && !searchTerm && (
                    <div className="flex items-center space-x-1.5 pt-1 overflow-x-auto text-[10px] text-zinc-400">
                      <span className="shrink-0 font-medium text-zinc-400">Recent:</span>
                      <div className="flex items-center space-x-1">
                        {glossaryHistory.slice(0, 4).map((hTerm, hIdx) => (
                          <button
                            key={hIdx}
                            type="button"
                            onClick={() => {
                              setSearchTerm(hTerm);
                              handleSearchAI(hTerm);
                            }}
                            className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:text-sky-500 transition"
                          >
                            {hTerm}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. AI SEARCH LOADING STATE */}
              {aiLoading && (
                <div className="p-4 rounded-2xl border border-sky-500/20 bg-sky-500/5 text-center space-y-2 animate-pulse">
                  <div className="w-8 h-8 mx-auto rounded-full bg-sky-500/20 flex items-center justify-center text-sky-500">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                    Generating AI Explanation...
                  </div>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                    Analyzing telecom standards and real-world network applications for "{searchTerm}"
                  </p>
                </div>
              )}

              {/* 4. AI ERROR STATE */}
              {aiError && !aiLoading && (
                <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs space-y-1 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="font-semibold flex items-center space-x-1">
                      <X className="w-3.5 h-3.5" />
                      <span>Could not fetch AI definition</span>
                    </div>
                    <p className="text-[11px] text-red-500/90">{aiError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSearchAI()}
                    className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 font-medium text-[10px] shrink-0"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* 5. ACTIVE AI DEFINITION CARD */}
              {aiResult && !aiLoading && (
                <div className={`p-4 rounded-2xl border space-y-3.5 shadow-sm transition-all animate-in fade-in ${
                  isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900/90 border-zinc-800'
                }`}>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3">
                    <div>
                      <div className="text-sm font-bold text-sky-600 dark:text-sky-400 flex items-center space-x-2">
                        <span>{aiResult.term}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                          ✨ AI Explanation
                        </span>
                      </div>
                      {aiResult.full_form && (
                        <p className="text-xs text-zinc-500 font-medium mt-0.5">
                          {aiResult.full_form}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => toggleBookmarkTerm(aiResult)}
                        className={`p-1.5 rounded-lg border transition ${
                          savedGlossary.some((b) => b.term.toLowerCase() === aiResult.term.toLowerCase())
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                            : 'text-zinc-400 hover:text-amber-500 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800'
                        }`}
                        title="Bookmark Term"
                      >
                        <Bookmark className={`w-4 h-4 ${savedGlossary.some((b) => b.term.toLowerCase() === aiResult.term.toLowerCase()) ? 'fill-current text-amber-500' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiResult(null)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white"
                        title="Close AI View"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Definition */}
                  <div className="space-y-1">
                    <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-200 font-normal">
                      {aiResult.short_definition}
                    </p>
                  </div>

                  {/* Detailed Meaning */}
                  {aiResult.detailed_meaning && (
                    <div className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 space-y-1">
                      <p>{aiResult.detailed_meaning}</p>
                    </div>
                  )}

                  {/* Telecom Application */}
                  {aiResult.telecom_application && (
                    <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/15 space-y-1">
                      <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 flex items-center space-x-1.5">
                        <span>📡 Network Application</span>
                      </span>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {aiResult.telecom_application}
                      </p>
                    </div>
                  )}

                  {/* Real-World Example */}
                  {aiResult.real_world_example && (
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-1">
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
                        <span>💡 Deployment Example</span>
                      </span>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {aiResult.real_world_example}
                      </p>
                    </div>
                  )}

                  {/* Key Takeaways */}
                  {aiResult.key_takeaways && aiResult.key_takeaways.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">
                        Key Takeaways
                      </span>
                      <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                        {aiResult.key_takeaways.map((item: string, kIdx: number) => (
                          <li key={kIdx} className="flex items-start space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Bottom Actions */}
                  <div className="pt-2 flex items-center justify-between border-t border-zinc-200/80 dark:border-zinc-800/80">
                    <button
                      type="button"
                      onClick={appendAiResultToNotes}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition flex items-center space-x-1.5 ${
                        copiedToNotes
                          ? 'bg-emerald-500 text-white border-transparent font-semibold'
                          : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {copiedToNotes ? <Check className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5 text-sky-500" />}
                      <span>{copiedToNotes ? 'Saved to Notes ✓' : 'Save to Notes'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAiResult(null)}
                      className="text-xs text-zinc-500 hover:text-black dark:hover:text-white font-medium"
                    >
                      Back to Terms
                    </button>
                  </div>
                </div>
              )}

              {/* 6. LIST OF CURATED GLOSSARY TERMS */}
              {glossaryScope !== 'saved' && !aiResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                    <span>
                      {glossaryScope === 'course' ? 'Course Concepts' : 'Telecom & Cloud Concepts'} ({filteredGlossary.length})
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                    {filteredGlossary.map((item, idx) => {
                      const isBookmarked = savedGlossary.some((b) => b.term.toLowerCase() === item.term.toLowerCase());

                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl border space-y-2 transition-all ${
                            isLight
                              ? 'bg-zinc-50/80 border-zinc-200/90 hover:border-zinc-300'
                              : 'bg-zinc-900/60 border-zinc-800/90 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold border ${getCategoryColor(item.category)}`}>
                                  {item.category}
                                </span>
                              </div>
                              <h4 className="font-semibold text-xs text-black dark:text-white truncate">
                                {item.term}
                              </h4>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleBookmarkTerm(item)}
                                className={`p-1.5 rounded-lg border transition ${
                                  isBookmarked
                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                    : 'text-zinc-400 hover:text-amber-500 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800'
                                }`}
                                title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Term'}
                              >
                                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current text-amber-500' : ''}`} />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSearchTerm(item.term);
                                  handleSearchAI(item.term);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-xs font-semibold flex items-center space-x-1 transition"
                                title="Explain with AI"
                              >
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                <span>Explain</span>
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
                            {item.definition}
                          </p>
                        </div>
                      );
                    })}

                    {filteredGlossary.length === 0 && (
                      <div className="text-center py-8 text-zinc-400 text-xs space-y-2.5">
                        <p>No local matching terms found for "{searchTerm}".</p>
                        <button
                          type="button"
                          onClick={() => handleSearchAI()}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold text-xs shadow-md inline-flex items-center space-x-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Search "{searchTerm}" with AI</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 7. SAVED TERMS SCOPE */}
              {glossaryScope === 'saved' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                    <span>Bookmarked Terms ({savedGlossary.length})</span>
                  </div>

                  {savedGlossary.length === 0 ? (
                    <div className="text-center py-10 text-zinc-400 text-xs space-y-2.5 border border-dashed rounded-2xl p-6">
                      <Bookmark className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-700" />
                      <p className="font-medium text-zinc-500">No saved terms yet.</p>
                      <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                        Click the bookmark icon on any term to save it across your devices.
                      </p>
                      <button
                        type="button"
                        onClick={() => setGlossaryScope('all')}
                        className="px-4 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-xs mt-2"
                      >
                        Browse All Terms
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                      {savedGlossary.map((bItem, bIdx) => (
                        <div
                          key={bIdx}
                          className={`p-3.5 rounded-2xl border space-y-2 transition-all ${
                            isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-xs text-sky-600 dark:text-sky-400 flex items-center space-x-1.5">
                                <Bookmark className="w-3.5 h-3.5 fill-current text-amber-500" />
                                <span>{bItem.term}</span>
                              </h4>
                              {bItem.full_form && (
                                <p className="text-[11px] text-zinc-400">{bItem.full_form}</p>
                              )}
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchTerm(bItem.term);
                                  handleSearchAI(bItem.term);
                                  setGlossaryScope('all');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-xs font-semibold flex items-center space-x-1 transition"
                              >
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                <span>Explain</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleBookmarkTerm(bItem)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition"
                                title="Remove bookmark"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            {bItem.short_definition || bItem.definition}
                          </p>

                          {bItem.real_world_example && (
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                              💡 {bItem.real_world_example}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* DRAWER FOOTER */}
        <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-2">
          <div className="text-[9px] font-mono text-zinc-400 flex items-center space-x-1">
            {user ? (
              <span className="flex items-center space-x-1 text-emerald-500 font-bold">
                <Cloud className="w-3 h-3" />
                <span>Synced to Profile</span>
              </span>
            ) : (
              <span>Offline / Local Mode</span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            type="button"
            className="px-5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-md transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}

export default QuickToolsDrawer;


