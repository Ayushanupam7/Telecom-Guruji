'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { supabaseAdmin } from '@/lib/supabase';
import { Course, Module, FinalAssessment, CourseCreationMethod, CourseStatus } from '@signalhub/types';
import { CreationMethodModal } from '@/components/course-builder/CreationMethodModal';
import { WizardProgressHeader } from '@/components/course-builder/WizardProgressHeader';
import { Step1CourseInfo } from '@/components/course-builder/Step1CourseInfo';
import { Step2RoadmapBuilder } from '@/components/course-builder/Step2RoadmapBuilder';
import { Step3ModuleSlideBuilder } from '@/components/course-builder/Step3ModuleSlideBuilder';
import { Step4AssessmentBuilder } from '@/components/course-builder/Step4AssessmentBuilder';
import { Step5CertificateBuilder } from '@/components/course-builder/Step5CertificateBuilder';
import { Step6StudentPreview } from '@/components/course-builder/Step6StudentPreview';
import { Step7ValidationPublish } from '@/components/course-builder/Step7ValidationPublish';
import { PageLoader } from '@/components/PageLoader';

// Initial default 5-module starter template
const createDefaultModules = (): Module[] => [
  {
    id: `mod-1-${Date.now()}`,
    course_id: '',
    title: 'Module 1: Introduction to Telecommunications & Network Topology',
    description: 'Foundations of cellular telephony, electromagnetic spectrum, transmission channels, and network nodes.',
    sequence_order: 1,
    duration_minutes: 25,
    is_free_preview: true,
    has_quiz: true,
    learning_outcomes: [
      'Understand carrier frequencies and duplexing (FDD/TDD)',
      'Analyze cellular topology and cell handover boundaries',
    ],
    slides: [
      {
        id: `s-1-1-${Date.now()}`,
        slide_number: 1,
        title: 'Cellular Network Foundations & Evolution',
        content_type: 'block_based',
        blocks: [
          { id: 'b1', type: 'heading', content: { text: 'Cellular Network Architecture & Spectrum', level: 2 } },
          { id: 'b2', type: 'paragraph', content: { text: 'Modern telecommunication systems partition geographical coverage areas into hexagonal radio cells served by base transceiver stations.' } },
          { id: 'b3', type: 'bullet_list', content: { items: ['Base Station (eNodeB / gNodeB)', 'Core Network Packet Gateway', 'User Equipment (UE) Transceivers'] } },
        ],
        notes: 'Emphasize the difference between licensed spectrum and unlicensed bands.',
      },
      {
        id: 's-1-2',
        slide_number: 2,
        title: 'Transmission Bands and Multiplexing Principles',
        content_type: 'block_based',
        blocks: [
          { id: 'b4', type: 'heading', content: { text: 'OFDMA & Spectral Efficiency', level: 2 } },
          { id: 'b5', type: 'paragraph', content: { text: 'Orthogonal Frequency Division Multiple Access divides available frequency bandwidth into orthogonal subcarriers.' } },
          { id: 'b6', type: 'image', content: { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', caption: 'Cellular Base Station Transceiver' } },
        ],
      },
    ],
    quiz: {
      id: `quiz-1-${Date.now()}`,
      title: 'Module 1 Assessment Quiz',
      passing_score_percent: 80,
      time_limit_minutes: 10,
      max_attempts: 3,
      questions: [
        {
          id: 'q-1-1',
          question_text: 'What is the primary advantage of OFDMA in modern cellular communications?',
          question_type: 'single_choice',
          difficulty: 'medium',
          explanation: 'OFDMA divides wideband spectrum into orthogonal subcarriers, preventing inter-symbol interference and maximizing spectral efficiency.',
          options: [
            { id: 'o1', option_text: 'High spectral efficiency with resilient multi-carrier orthogonality', is_correct: true, sequence_order: 1 },
            { id: 'o2', option_text: 'Eliminates the requirement for antennas', is_correct: false, sequence_order: 2 },
            { id: 'o3', option_text: 'Restricts communication to analog signals', is_correct: false, sequence_order: 3 },
          ],
        },
      ],
    },
    created_at: new Date().toISOString(),
  },
  {
    id: `mod-2-${Date.now()}`,
    course_id: '',
    title: 'Module 2: 4G LTE System Architecture & E-UTRAN',
    description: 'Deep dive into LTE Evolved Packet Core (EPC), MME, SGW, PGW, and OFDMA modulation.',
    sequence_order: 2,
    duration_minutes: 35,
    is_free_preview: false,
    has_quiz: true,
    learning_outcomes: ['Design 4G EPC signalling flows', 'Configure MIMO antenna matrices'],
    slides: [
      {
        id: `s-2-1-${Date.now()}`,
        slide_number: 1,
        title: 'Evolved Packet Core (EPC) Architecture',
        content_type: 'block_based',
        blocks: [
          { id: 'b7', type: 'heading', content: { text: 'LTE Core Node Distribution', level: 2 } },
          { id: 'b8', type: 'paragraph', content: { text: 'The EPC separates control plane traffic (MME) from user plane data transport (SGW/PGW).' } },
        ],
      },
    ],
    quiz: {
      id: `quiz-2-${Date.now()}`,
      title: 'Module 2 LTE Assessment',
      passing_score_percent: 80,
      questions: [
        {
          id: 'q-2-1',
          question_text: 'Which entity in LTE handles control-plane mobility and authentication?',
          question_type: 'single_choice',
          difficulty: 'medium',
          explanation: 'The Mobility Management Entity (MME) is the principal control-node for LTE access networks.',
          options: [
            { id: 'o4', option_text: 'MME (Mobility Management Entity)', is_correct: true, sequence_order: 1 },
            { id: 'o5', option_text: 'PGW (Packet Data Gateway)', is_correct: false, sequence_order: 2 },
          ],
        },
      ],
    },
    created_at: new Date().toISOString(),
  },
  {
    id: `mod-3-${Date.now()}`,
    course_id: '',
    title: 'Module 3: 5G NR (New Radio) & Service-Based Architecture',
    description: 'Next-generation 5G Standalone (SA), gNodeB, AMF, SMF, UPF, and massive MIMO beamforming.',
    sequence_order: 3,
    duration_minutes: 40,
    is_free_preview: false,
    has_quiz: true,
    learning_outcomes: ['Deploy 5G SBA RESTful HTTP/2 interfaces', 'Implement massive MIMO beam steering'],
    slides: [
      {
        id: `s-3-1-${Date.now()}`,
        slide_number: 1,
        title: '5G Core Service Based Architecture (SBA)',
        content_type: 'block_based',
        blocks: [
          { id: 'b9', type: 'heading', content: { text: 'Microservices in the 5G Core', level: 2 } },
          { id: 'b10', type: 'paragraph', content: { text: '5G replaces traditional point-to-point hardware interfaces with standardized RESTful API endpoints over HTTP/2.' } },
        ],
      },
    ],
    quiz: {
      id: `quiz-3-${Date.now()}`,
      title: 'Module 3 5G Assessment',
      passing_score_percent: 80,
      questions: [
        {
          id: 'q-3-1',
          question_text: 'What protocol is used for Service-Based Architecture interfaces in 5G Core?',
          question_type: 'single_choice',
          difficulty: 'medium',
          explanation: '5G SBA specifies HTTP/2 with JSON payloads for network function communication.',
          options: [
            { id: 'o6', option_text: 'HTTP/2 over TLS with JSON payloads', is_correct: true, sequence_order: 1 },
            { id: 'o7', option_text: 'Legacy SS7 MAP signalling', is_correct: false, sequence_order: 2 },
          ],
        },
      ],
    },
    created_at: new Date().toISOString(),
  },
  {
    id: `mod-4-${Date.now()}`,
    course_id: '',
    title: 'Module 4: Network Slicing & Edge Cloud (MEC)',
    description: 'Virtualization, eMBB, URLLC, mMTC slices, and Multi-access Edge Computing placement.',
    sequence_order: 4,
    duration_minutes: 30,
    is_free_preview: false,
    has_quiz: true,
    learning_outcomes: ['Configure dynamic end-to-end network slices', 'Deploy MEC edge compute nodes'],
    slides: [
      {
        id: `s-4-1-${Date.now()}`,
        slide_number: 1,
        title: 'End-to-End Network Slicing Topology',
        content_type: 'block_based',
        blocks: [
          { id: 'b11', type: 'heading', content: { text: 'Three Standardized 5G Slices', level: 2 } },
          { id: 'b12', type: 'bullet_list', content: { items: ['eMBB: Enhanced Mobile Broadband', 'URLLC: Ultra-Reliable Low-Latency', 'mMTC: Massive Machine-Type IoT'] } },
        ],
      },
    ],
    quiz: {
      id: `quiz-4-${Date.now()}`,
      title: 'Module 4 Slicing Assessment',
      passing_score_percent: 80,
      questions: [
        {
          id: 'q-4-1',
          question_text: 'Which slice type caters to autonomous vehicles and remote robotic surgery?',
          question_type: 'single_choice',
          difficulty: 'medium',
          explanation: 'URLLC is designed specifically for mission-critical low-latency applications.',
          options: [
            { id: 'o8', option_text: 'URLLC (Ultra-Reliable Low-Latency Communication)', is_correct: true, sequence_order: 1 },
            { id: 'o9', option_text: 'eMBB (High bandwidth streaming)', is_correct: false, sequence_order: 2 },
          ],
        },
      ],
    },
    created_at: new Date().toISOString(),
  },
  {
    id: `mod-5-${Date.now()}`,
    course_id: '',
    title: 'Module 5: Future of Telecom — 6G, Open-RAN & AI',
    description: 'Open-RAN disaggregation, non-terrestrial satellite networks (NTN), and AI in telecom.',
    sequence_order: 5,
    duration_minutes: 30,
    is_free_preview: false,
    has_quiz: true,
    learning_outcomes: ['Analyze O-RAN RIC controller workflows', 'Evaluate LEO satellite NTN integration'],
    slides: [
      {
        id: `s-5-1-${Date.now()}`,
        slide_number: 1,
        title: 'Open-RAN Architecture & Disaggregation',
        content_type: 'block_based',
        blocks: [
          { id: 'b13', type: 'heading', content: { text: 'O-RU, O-DU, and O-CU Disaggregation', level: 2 } },
          { id: 'b14', type: 'paragraph', content: { text: 'Open RAN splits the traditional proprietary baseband into standard software running on commodity hardware.' } },
        ],
      },
    ],
    quiz: {
      id: `quiz-5-${Date.now()}`,
      title: 'Module 5 Future Telecom Quiz',
      passing_score_percent: 80,
      questions: [
        {
          id: 'q-5-1',
          question_text: 'What is the primary role of the RAN Intelligent Controller (RIC) in O-RAN?',
          question_type: 'single_choice',
          difficulty: 'medium',
          explanation: 'The RIC enables AI/ML-driven automated radio resource management (RRM).',
          options: [
            { id: 'o10', option_text: 'AI-driven dynamic radio optimization via xApps and rApps', is_correct: true, sequence_order: 1 },
            { id: 'o11', option_text: 'Replaces physical cellular towers', is_correct: false, sequence_order: 2 },
          ],
        },
      ],
    },
    created_at: new Date().toISOString(),
  },
];

function CourseCreationWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editCourseId = searchParams ? searchParams.get('editCourseId') : null;
  const methodFromQuery = searchParams ? (searchParams.get('method') as CourseCreationMethod | null) : null;
  const promptFromQuery = searchParams ? searchParams.get('prompt') : null;
  const modulesCountFromQuery = searchParams ? Number(searchParams.get('modulesCount')) || 5 : 5;
  const levelFromQuery = searchParams ? (searchParams.get('level') as any) || 'intermediate' : 'intermediate';

  const { user } = useAuth();
  const { showToast } = useToast();
  const { theme } = useTheme();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [showMethodModal, setShowMethodModal] = useState(!editCourseId && !methodFromQuery);
  const [creationMethod, setCreationMethod] = useState<CourseCreationMethod>(methodFromQuery || 'manual');
  const [currentStep, setCurrentStep] = useState(1);
  const [savingDraft, setSavingDraft] = useState(false);
  const [lastSavedText, setLastSavedText] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Core Course State
  const [course, setCourse] = useState<Course>({
    id: `course-${Date.now()}`,
    instructor_id: user?.id || 'a1111111-1111-1111-1111-111111111111',
    trainer_name: user?.fullName || 'Dr. Ayush Sharma, Lead Specialist',
    title: 'Mobile Network Fundamentals & 5G Architecture',
    slug: `mobile-network-fundamentals-${Date.now()}`,
    summary: 'Master 4G LTE, 5G NR architecture, massive MIMO beamforming, and core network slicing.',
    description: 'Comprehensive engineering curriculum covering wireless communications, cellular protocols, and modern telecom systems.',
    detailed_description: 'This masterclass equips telecommunications engineers, network architects, and computer scientists with end-to-end knowledge of modern mobile systems from 2G/3G legacy principles up to 5G Standalone core architecture.',
    category: '5G & Mobile Networks',
    level: 'intermediate',
    default_language: 'en',
    course_type: 'paid',
    price: 49,
    currency: 'INR',
    is_published: false,
    status: 'draft',
    creation_method: 'manual',
    course_duration: 160,
    tags: ['telecom', '5g', 'lte', 'networking', 'beamforming'],
    thumbnail_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    template_config: {
      theme: 'telecom_classic',
      primaryColor: '#0284c7',
      secondaryColor: '#6366f1',
      backgroundColor: '#000000',
      typography: 'roboto',
      cardStyle: 'bordered',
      slideLayout: 'standard',
      certificateDesign: 'classic',
    },
    certificate_config: {
      template: 'classic',
      title: 'Certificate of Telecommunications Mastery',
      signatureName: user?.fullName || 'Dr. Ayush Sharma',
      signatureTitle: 'Lead Telecom Systems Architect & Instructor',
      accentColor: '#0284c7',
    },
    final_assessment: {
      id: `fa-${Date.now()}`,
      title: 'Telecom Mastery Final Certification Exam',
      description: 'Comprehensive evaluation covering all modules. Passing awards verified digital certificate.',
      passing_score_percent: 80,
      time_limit_minutes: 30,
      max_attempts: 3,
      questions: [
        {
          id: 'fq-1',
          question_text: 'Which architectural combination guarantees resilient, high-throughput microservices in 5G Core?',
          question_type: 'single_choice',
          difficulty: 'medium',
          explanation: 'Service-Based Architecture with HTTP/2 and async event messaging isolates network functions while enabling dynamic scale.',
          options: [
            { id: 'fo-1', option_text: 'Service Based Architecture + REST HTTP/2 + Async Queues', is_correct: true, sequence_order: 1 },
            { id: 'fo-2', option_text: 'Point-to-point synchronous copper cables', is_correct: false, sequence_order: 2 },
          ],
        },
      ],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const [modules, setModules] = useState<Module[]>(createDefaultModules());

  // Automatically attribute course to currently logged-in instructor
  useEffect(() => {
    if (user && !editCourseId) {
      setCourse((prev) => ({
        ...prev,
        instructor_id: user.id || prev.instructor_id,
        trainer_name: user.fullName || prev.trainer_name,
      }));
    }
  }, [user?.id, user?.fullName, editCourseId]);

  // Load existing course if editing
  useEffect(() => {
    async function loadExistingCourse() {
      if (!editCourseId) {
        setLoadingInitial(false);
        return;
      }

      try {
        setLoadingInitial(true);
        const { data: dbCourse } = await supabaseAdmin
          .from('courses')
          .select('*')
          .eq('id', editCourseId)
          .single();

        if (dbCourse) {
          setCourse({
            ...dbCourse,
            price: Number(dbCourse.price) || 0,
            course_duration: dbCourse.course_duration || 90,
          });

          // Fetch modules
          const { data: dbModules } = await supabaseAdmin
            .from('modules')
            .select('*')
            .eq('course_id', editCourseId)
            .order('sequence_order', { ascending: true });

          if (dbModules && dbModules.length > 0) {
            const formatted = dbModules.map((m) => ({
              ...m,
              slides: m.slides_data || m.slides || [],
              quiz: m.quiz_data || m.quiz || undefined,
            }));
            setModules(formatted);
          }
        }
      } catch (err) {
        console.error('Error loading course for edit:', err);
      } finally {
        setLoadingInitial(false);
      }
    }

    loadExistingCourse();
  }, [editCourseId]);

  // Handle Query Param initialization (e.g. from Dashboard modal selection)
  useEffect(() => {
    if (methodFromQuery && !editCourseId) {
      setShowMethodModal(false);
      setCreationMethod(methodFromQuery);
      setCourse((prev) => ({ ...prev, creation_method: methodFromQuery }));
      if (methodFromQuery === 'ai_generated' && promptFromQuery) {
        handleSelectMethod(methodFromQuery, {
          prompt: promptFromQuery,
          modulesCount: modulesCountFromQuery,
          level: levelFromQuery,
        });
      }
    }
  }, [methodFromQuery, promptFromQuery, editCourseId]);

  // Handle Selection of Creation Method
  const handleSelectMethod = async (method: CourseCreationMethod, initialData?: any) => {
    setCreationMethod(method);
    setShowMethodModal(false);
    setCourse((prev) => ({ ...prev, creation_method: method }));

    // If AI generation method selected with prompt/files
    if (method === 'ai_generated' && initialData?.prompt) {
      try {
        setSavingDraft(true);
        showToast({
          type: 'info',
          title: 'Generating Course with AI',
          message: 'Groq & Gemini are structuring your multi-module course...',
        });

        const res = await fetch('/api/ai/generate-course', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: initialData.prompt,
            modulesCount: initialData.modulesCount || 5,
            level: initialData.level || 'intermediate',
            creationMethod: method,
          }),
        });

        const data = await res.json();
        if (data.success && data.data) {
          const ai = data.data;
          setCourse((prev) => ({
            ...prev,
            title: ai.title || prev.title,
            summary: ai.summary || prev.summary,
            detailed_description: ai.detailedDescription || prev.detailed_description,
            category: ai.category || prev.category,
            level: ai.level || prev.level,
            tags: ai.tags || prev.tags,
            final_assessment: ai.finalAssessment || prev.final_assessment,
          }));

          if (ai.modules && ai.modules.length > 0) {
            setModules(ai.modules);
          }

          showToast({
            type: 'success',
            title: 'Course Generated!',
            message: `Structured ${ai.modules?.length || 5} modules with slides & quizzes.`,
          });
        }
      } catch (err) {
        console.error('AI Generation error on wizard init:', err);
      } finally {
        setSavingDraft(false);
      }
    }
  };

  // Debounced Auto-Save into Supabase Draft State on any user change
  const hasInitializedRef = React.useRef(false);
  useEffect(() => {
    if (loadingInitial) return;
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSavingDraft(true);
        const isLive = course.is_published || course.status === 'published';
        const coursePayload = {
          id: course.id,
          instructor_id: user?.id || course.instructor_id,
          trainer_name: user?.fullName || course.trainer_name || 'Dr. Ayush Sharma, Lead Specialist',
          title: course.title || 'Untitled Course',
          slug: course.slug || (course.title || 'course').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          summary: course.summary || '',
          description: course.description || course.detailed_description || '',
          detailed_description: course.detailed_description || '',
          category: course.category || 'General',
          level: course.level || 'all_levels',
          default_language: course.default_language || 'en',
          course_type: course.course_type || 'paid',
          price: Number(course.price) || 0,
          currency: course.currency || 'INR',
          is_published: isLive,
          status: isLive ? 'published' : 'draft',
          creation_method: course.creation_method || creationMethod,
          thumbnail_url: course.thumbnail_url,
          template_config: course.template_config,
          certificate_config: course.certificate_config,
          final_assessment: course.final_assessment,
          modules_count: modules.length,
          lessons_count: modules.reduce((acc, m) => acc + (m.slides || m.slides_data || []).length, 0),
          course_duration: course.course_duration || 90,
          tags: course.tags || [],
          updated_at: new Date().toISOString(),
        };

        await supabaseAdmin.from('courses').upsert(coursePayload, { onConflict: 'id' });

        for (const mod of modules) {
          const modPayload = {
            id: mod.id,
            course_id: course.id,
            title: mod.title,
            description: mod.description,
            sequence_order: mod.sequence_order,
            is_free_preview: mod.is_free_preview,
            duration_minutes: mod.duration_minutes,
            has_quiz: mod.has_quiz,
            learning_outcomes: mod.learning_outcomes,
            slides_data: mod.slides || mod.slides_data || [],
            quiz_data: mod.quiz || mod.quiz_data || {},
            updated_at: new Date().toISOString(),
          };
          await supabaseAdmin.from('modules').upsert(modPayload, { onConflict: 'id' });
        }

        if (typeof window !== 'undefined' && !window.location.search.includes('editCourseId')) {
          window.history.replaceState(null, '', `/instructor/course/create?editCourseId=${course.id}`);
        }

        setLastSavedText(`Saved to drafts at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      } catch (e) {
        console.warn('Auto-save draft note:', e);
      } finally {
        setSavingDraft(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [course, modules, loadingInitial, user?.id, creationMethod]);

  // Explicit Save Draft Handler
  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);

      const isLive = course.is_published || course.status === 'published';
      const coursePayload = {
        id: course.id,
        instructor_id: user?.id || course.instructor_id,
        trainer_name: user?.fullName || course.trainer_name || 'Dr. Ayush Sharma, Lead Specialist',
        title: course.title || 'Untitled Course',
        slug: course.slug || (course.title || 'course').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        summary: course.summary || '',
        description: course.description || course.detailed_description || '',
        detailed_description: course.detailed_description || '',
        category: course.category || 'General',
        level: course.level || 'all_levels',
        default_language: course.default_language || 'en',
        course_type: course.course_type || 'paid',
        price: Number(course.price) || 0,
        currency: course.currency || 'INR',
        is_published: isLive,
        status: isLive ? 'published' : 'draft',
        creation_method: course.creation_method || creationMethod,
        thumbnail_url: course.thumbnail_url,
        template_config: course.template_config,
        certificate_config: course.certificate_config,
        final_assessment: course.final_assessment,
        modules_count: modules.length,
        lessons_count: modules.reduce((acc, m) => acc + (m.slides || m.slides_data || []).length, 0),
        course_duration: course.course_duration || 90,
        tags: course.tags || [],
        updated_at: new Date().toISOString(),
      };

      // 1. Upsert course record
      const { error: courseErr } = await supabaseAdmin
        .from('courses')
        .upsert(coursePayload, { onConflict: 'id' });

      if (courseErr) throw courseErr;

      // 2. Upsert module records
      for (const mod of modules) {
        const modPayload = {
          id: mod.id,
          course_id: course.id,
          title: mod.title,
          description: mod.description,
          sequence_order: mod.sequence_order,
          is_free_preview: mod.is_free_preview,
          duration_minutes: mod.duration_minutes,
          has_quiz: mod.has_quiz,
          learning_outcomes: mod.learning_outcomes,
          slides_data: mod.slides || mod.slides_data || [],
          quiz_data: mod.quiz || mod.quiz_data || {},
          updated_at: new Date().toISOString(),
        };

        await supabaseAdmin.from('modules').upsert(modPayload, { onConflict: 'id' });
      }

      if (typeof window !== 'undefined' && !window.location.search.includes('editCourseId')) {
        window.history.replaceState(null, '', `/instructor/course/create?editCourseId=${course.id}`);
      }

      setLastSavedText(`Saved to drafts at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      showToast({
        type: 'success',
        title: 'Draft Saved in Database! 💾',
        message: 'All your course modules, slides, and quizzes are safely synced to drafts.',
      });
    } catch (err: any) {
      console.error('Error saving draft:', err);
      showToast({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setSavingDraft(false);
    }
  };

  // Final Publish Handler
  const handlePublish = async (targetStatus: CourseStatus) => {
    try {
      setIsPublishing(true);
      const isLive = targetStatus === 'published';

      setCourse((prev) => ({
        ...prev,
        status: targetStatus,
        is_published: isLive,
        published_at: isLive ? new Date().toISOString() : prev.published_at,
      }));

      const coursePayload = {
        id: course.id,
        instructor_id: user?.id || course.instructor_id,
        trainer_name: course.trainer_name,
        title: course.title,
        slug: course.slug || course.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        summary: course.summary,
        description: course.description || course.detailed_description,
        detailed_description: course.detailed_description,
        category: course.category,
        level: course.level,
        default_language: course.default_language,
        course_type: course.course_type,
        price: course.price,
        currency: course.currency,
        is_published: isLive,
        status: targetStatus,
        creation_method: course.creation_method || creationMethod,
        thumbnail_url: course.thumbnail_url,
        template_config: course.template_config,
        certificate_config: course.certificate_config,
        final_assessment: course.final_assessment,
        modules_count: modules.length,
        lessons_count: modules.reduce((acc, m) => acc + (m.slides || m.slides_data || []).length, 0),
        published_at: isLive ? new Date().toISOString() : course.published_at,
        updated_at: new Date().toISOString(),
      };

      await supabaseAdmin.from('courses').upsert(coursePayload, { onConflict: 'id' });

      for (const mod of modules) {
        const modPayload = {
          id: mod.id,
          course_id: course.id,
          title: mod.title,
          description: mod.description,
          sequence_order: mod.sequence_order,
          is_free_preview: mod.is_free_preview,
          duration_minutes: mod.duration_minutes,
          has_quiz: mod.has_quiz,
          learning_outcomes: mod.learning_outcomes,
          slides_data: mod.slides || mod.slides_data || [],
          quiz_data: mod.quiz || mod.quiz_data || {},
          updated_at: new Date().toISOString(),
        };
        await supabaseAdmin.from('modules').upsert(modPayload, { onConflict: 'id' });
      }

      showToast({
        type: 'success',
        title: isLive ? 'Course Published Live! 🎉' : `Status Updated to ${targetStatus}`,
        message: isLive ? 'Your course is now available to students worldwide.' : 'Course settings saved.',
      });

      if (isLive) {
        router.push(`/courses/${course.id}`);
      } else {
        router.push('/instructor/dashboard');
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Publish Failed', message: err.message });
    } finally {
      setIsPublishing(false);
    }
  };

  if (loadingInitial) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black text-black dark:text-white">
      {/* Creation Method Chooser Modal */}
      <CreationMethodModal
        isOpen={showMethodModal}
        onClose={() => setShowMethodModal(false)}
        onSelectMethod={handleSelectMethod}
      />

      {/* Persistent Wizard Progress Header */}
      <WizardProgressHeader
        currentStep={currentStep}
        onSelectStep={(stepId) => setCurrentStep(stepId)}
        onSaveDraft={handleSaveDraft}
        savingDraft={savingDraft}
        lastSavedText={lastSavedText}
        courseTitle={course.title}
      />

      {/* Step View Routing */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 1 && (
          <Step1CourseInfo
            course={course}
            onChange={(updated) => setCourse((prev) => ({ ...prev, ...updated }))}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <Step2RoadmapBuilder
            modules={modules}
            onChange={(updated) => setModules(updated)}
            onNext={() => setCurrentStep(3)}
            onPrev={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <Step3ModuleSlideBuilder
            courseTitle={course.title}
            modules={modules}
            onChange={(updated) => setModules(updated)}
            onNext={() => setCurrentStep(4)}
            onPrev={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <Step4AssessmentBuilder
            courseTitle={course.title}
            modules={modules}
            finalAssessment={course.final_assessment}
            onUpdateModules={(updated) => setModules(updated)}
            onUpdateFinalAssessment={(fa) => setCourse((prev) => ({ ...prev, final_assessment: fa }))}
            onNext={() => setCurrentStep(5)}
            onPrev={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 5 && (
          <Step5CertificateBuilder
            course={course}
            certificateConfig={course.certificate_config}
            onChange={(cert) => setCourse((prev) => ({ ...prev, certificate_config: cert }))}
            onNext={() => setCurrentStep(6)}
            onPrev={() => setCurrentStep(4)}
          />
        )}

        {currentStep === 6 && (
          <Step6StudentPreview
            course={course}
            modules={modules}
            onNext={() => setCurrentStep(7)}
            onPrev={() => setCurrentStep(5)}
          />
        )}

        {currentStep === 7 && (
          <Step7ValidationPublish
            course={course}
            modules={modules}
            onJumpToStep={(stepId) => setCurrentStep(stepId)}
            onPublish={handlePublish}
            isPublishing={isPublishing}
            onPrev={() => setCurrentStep(6)}
          />
        )}
      </main>
    </div>
  );
}

export default function CourseCreationPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CourseCreationWizardContent />
    </Suspense>
  );
}
