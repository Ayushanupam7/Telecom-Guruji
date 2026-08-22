'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Lock,
  Unlock,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  Award,
  PlayCircle,
  FileText,
  Code,
  Menu,
  X,
  Check,
  RotateCcw,
  Copy,
  Table,
  BarChart3,
  Quote,
  Paperclip,
  Clock,
  Star,
  ShieldCheck,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Layers,
  LayoutDashboard,
  CheckCircle,
  Circle,
  Home,
  AlertCircle,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import { INITIAL_DEMO_COURSE } from '@/lib/mockData';
import { Course, Module, CourseSlide, RichBlock, Question } from '@signalhub/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  translateCourseTitle, 
  translateCourseSummary, 
  translateCategory,
  translateModuleTitle,
  translateModuleDescription,
  translateSlideTitle,
  translateSlideBody,
  translateQuestionText,
  translateOptionText,
  translateExplanation,
  translateQuizTitle
} from '@signalhub/shared';
import { supabaseAdmin } from '@/lib/supabase';
import { PageLoader } from '@/components/PageLoader';
import { GurujiOverlay, GurujiSlideOverlay } from '@/components/guruji';

export default function RedesignedStudentLearningPlayer({
  params,
}: {
  params: { courseId: string; lessonId?: string };
}) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { language, dict } = useLanguage();
  const router = useRouter();
  const isLight = theme === 'light';

  const targetCourseId = params.courseId || INITIAL_DEMO_COURSE.id;

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course>(INITIAL_DEMO_COURSE);
  const [modules, setModules] = useState<Module[]>(INITIAL_DEMO_COURSE.modules || []);
  const [currentModIdx, setCurrentModIdx] = useState(0);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [activeView, setActiveView] = useState<'slide' | 'quiz' | 'final_exam' | 'passed'>('slide');
  
  // Card 2 Sidebar State (Collapsible on PC & Mobile)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Card 3 Maximize View State
  const [isMaximized, setIsMaximized] = useState(false);

  // Guruji AI Learning Assistant Overlay State
  const [isGurujiOpen, setIsGurujiOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('player-maximize-change', { detail: { isMaximized } }));
    }
  }, [isMaximized]);

  // Progress Tracking & Quiz Attempts
  const [completedSlideIds, setCompletedSlideIds] = useState<Set<string>>(new Set());
  const [passedQuizIds, setPassedQuizIds] = useState<Set<string>>(new Set());
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Quiz State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qIdx: number]: number[] }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizPassed, setQuizPassed] = useState(false);

  // Load Course & Progress from Supabase Database
  useEffect(() => {
    async function loadLearningData() {
      try {
        setLoading(true);

        // 1. Fetch Course
        const { data: dbCourses } = await supabaseAdmin
          .from('courses')
          .select('*')
          .or(`id.eq.${targetCourseId},slug.eq.${targetCourseId}`)
          .limit(1);

        const activeCourse = dbCourses && dbCourses.length > 0 ? dbCourses[0] : INITIAL_DEMO_COURSE;

        // 2. Fetch Modules
        const { data: dbModules } = await supabaseAdmin
          .from('modules')
          .select('*')
          .or(`course_id.eq.${activeCourse.id},course_id.eq.${targetCourseId}`)
          .order('sequence_order', { ascending: true });

        let parsedModules: Module[] = [];
        if (dbModules && dbModules.length > 0) {
          parsedModules = dbModules.map((m) => ({
            ...m,
            slides: m.slides_data || m.slides || [],
            quiz: m.quiz_data || m.quiz || undefined,
          }));
        } else if (activeCourse.modules && activeCourse.modules.length > 0) {
          parsedModules = activeCourse.modules;
        } else {
          parsedModules = INITIAL_DEMO_COURSE.modules || [];
        }

        setCourse({
          ...INITIAL_DEMO_COURSE,
          ...activeCourse,
          price: Number(activeCourse.price) || 0,
        });
        setModules(parsedModules);

        // Check if user is enrolled or has instructor/admin access
        let isUserEnrolled = false;
        if (user) {
          if (user.role === 'instructor' || user.role === 'admin' || user.id === activeCourse.instructor_id) {
            isUserEnrolled = true;
          } else {
            const { data: enrollCheck } = await supabaseAdmin
              .from('enrollments')
              .select('id')
              .eq('course_id', activeCourse.id)
              .or(`student_id.eq.${user.id},student_email.eq.${user.email}`)
              .limit(1);

            if (enrollCheck && enrollCheck.length > 0) {
              isUserEnrolled = true;
            }
          }
        }
        setIsEnrolled(isUserEnrolled);

        // 3. Load Progress, Quizzes & Restore Saved Position (Resume where student stopped)
        let hasRestoredPosition = false;
        if (user && isUserEnrolled) {
          // Check enrollments table for saved module / slide index
          const { data: enrollData } = await supabaseAdmin
            .from('enrollments')
            .select('last_active_module_index, last_active_slide_index, last_active_view, last_active_slide_id')
            .eq('course_id', activeCourse.id)
            .or(`student_id.eq.${user.id},student_email.eq.${user.email}`)
            .limit(1);

          if (enrollData && enrollData.length > 0) {
            const row = enrollData[0];
            if (
              typeof row.last_active_module_index === 'number' &&
              row.last_active_module_index >= 0 &&
              row.last_active_module_index < parsedModules.length
            ) {
              setCurrentModIdx(row.last_active_module_index);
              const targetModSlides = parsedModules[row.last_active_module_index]?.slides || [];
              if (
                typeof row.last_active_slide_index === 'number' &&
                row.last_active_slide_index >= 0 &&
                row.last_active_slide_index < targetModSlides.length
              ) {
                setCurrentSlideIdx(row.last_active_slide_index);
              }
              if (row.last_active_view) {
                setActiveView(row.last_active_view);
              }
              hasRestoredPosition = true;
            }
          }

          const { data: progList } = await supabaseAdmin
            .from('progress')
            .select('lesson_id, is_completed')
            .eq('course_id', activeCourse.id)
            .eq('student_id', user.id);

          if (progList && progList.length > 0) {
            const completed = new Set(
              progList.filter((p) => p.is_completed).map((p) => p.lesson_id)
            );
            setCompletedSlideIds(completed);
          }

          const { data: quizList } = await supabaseAdmin
            .from('quiz_attempts')
            .select('quiz_id, is_passed')
            .eq('course_id', activeCourse.id)
            .eq('student_id', user.id)
            .eq('is_passed', true);

          if (quizList && quizList.length > 0) {
            const passed = new Set(quizList.map((q) => q.quiz_id));
            setPassedQuizIds(passed);
          }
        }

        // Check local storage backup if not restored from database
        if (!hasRestoredPosition && typeof window !== 'undefined') {
          try {
            const localKey = `tg_resume_${activeCourse.id}_${user?.id || 'guest'}`;
            const cached = localStorage.getItem(localKey);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed.moduleIdx >= 0 && parsed.moduleIdx < parsedModules.length) {
                setCurrentModIdx(parsed.moduleIdx);
                const targetModSlides = parsedModules[parsed.moduleIdx]?.slides || [];
                if (parsed.slideIdx >= 0 && parsed.slideIdx < targetModSlides.length) {
                  setCurrentSlideIdx(parsed.slideIdx);
                }
                if (parsed.activeView) {
                  setActiveView(parsed.activeView);
                }
              }
            }
          } catch (e) {}
        }
      } catch (err) {
        console.error('Error loading player course:', err);
      } finally {
        setLoading(false);
      }
    }

    loadLearningData();
  }, [targetCourseId, user]);

  const activeModule = modules[currentModIdx] || modules[0];
  const slides = activeModule?.slides || activeModule?.slides_data || [];
  const currentSlide = slides[currentSlideIdx] || slides[0] || {
    id: 's-fallback',
    slide_number: 1,
    title: 'Lesson Overview',
    content_type: 'block_based',
    blocks: [],
  };

  // Auto-sync resume bookmark to DB & localStorage whenever student navigates or studies
  useEffect(() => {
    if (loading || !course.id) return;

    // 1. Save to LocalStorage
    if (typeof window !== 'undefined') {
      try {
        const localKey = `tg_resume_${course.id}_${user?.id || 'guest'}`;
        localStorage.setItem(
          localKey,
          JSON.stringify({
            moduleIdx: currentModIdx,
            slideIdx: currentSlideIdx,
            activeView,
            slideId: currentSlide?.id,
            timestamp: Date.now(),
          })
        );
      } catch (e) {}
    }

    // 2. Save to Supabase enrollments in background
    if (user && course.id && isEnrolled) {
      void (async () => {
        try {
          await supabaseAdmin
            .from('enrollments')
            .update({
              last_active_module_index: currentModIdx,
              last_active_slide_index: currentSlideIdx,
              last_active_view: activeView,
              last_active_slide_id: currentSlide?.id || null,
              last_accessed_at: new Date().toISOString(),
            })
            .eq('course_id', course.id)
            .or(`student_id.eq.${user.id},student_email.eq.${user.email}`);
        } catch (e) {}
      })();
    }

    // 3. Broadcast active slide context for Quick Tools & Glossary Slide Scanner
    if (typeof window !== 'undefined' && currentSlide) {
      const fullText = [
        currentSlide.title || '',
        ...(currentSlide.blocks || []).map((b: any) => `${b.header_text || ''} ${b.value || ''} ${b.code_snippet || ''}`)
      ].filter(Boolean).join(' ');

      (window as any).activeCourseSlide = {
        id: currentSlide.id,
        title: currentSlide.title || 'Slide',
        moduleTitle: activeModule?.title || 'Module',
        courseTitle: course?.title || 'Course',
        text: fullText,
      };
      window.dispatchEvent(new CustomEvent('active-slide-change', { detail: (window as any).activeCourseSlide }));
    }
  }, [currentModIdx, currentSlideIdx, activeView, currentSlide?.id, loading, course.id, user, isEnrolled]);

  // Dynamic Live Slide Translation Cache
  const [translatedBlockMap, setTranslatedBlockMap] = useState<Record<string, string>>({});
  const [isTranslatingSlide, setIsTranslatingSlide] = useState(false);

  useEffect(() => {
    if (language === 'en' || !currentSlide?.blocks?.length) {
      setTranslatedBlockMap({});
      return;
    }

    const textsToTranslate: string[] = [];

    // Collect slide title, headings, paragraphs, bullet points, callouts, and table cells
    if (currentSlide.title) textsToTranslate.push(currentSlide.title);

    for (const b of currentSlide.blocks) {
      const bType = b.type as string;
      if (
        bType === 'heading' ||
        bType === 'subheading' ||
        bType === 'paragraph' ||
        bType === 'callout' ||
        bType === 'quote'
      ) {
        if (b.content?.text && typeof b.content.text === 'string' && b.content.text.trim()) {
          textsToTranslate.push(b.content.text);
        }
      } else if (bType === 'bullet_list' || bType === 'numbered_list') {
        if (Array.isArray(b.content?.items)) {
          for (const item of b.content.items) {
            if (item && typeof item === 'string' && item.trim()) {
              textsToTranslate.push(item);
            }
          }
        }
      } else if (b.type === 'table') {
        if (Array.isArray(b.content?.headers)) {
          for (const h of b.content.headers) {
            if (h && typeof h === 'string' && h.trim()) textsToTranslate.push(h);
          }
        }
        if (Array.isArray(b.content?.rows)) {
          for (const row of b.content.rows) {
            if (Array.isArray(row)) {
              for (const cell of row) {
                if (cell && typeof cell === 'string' && cell.trim()) textsToTranslate.push(cell);
              }
            }
          }
        }
      }
    }

    if (textsToTranslate.length === 0) return;

    let isMounted = true;
    setIsTranslatingSlide(true);

    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texts: Array.from(new Set(textsToTranslate)),
        targetLang: language,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.translations)) {
          const uniqueTexts = Array.from(new Set(textsToTranslate));
          const map: Record<string, string> = {};
          uniqueTexts.forEach((orig, idx) => {
            if (data.translations[idx]) {
              map[orig] = data.translations[idx];
            }
          });
          setTranslatedBlockMap(map);
        }
      })
      .catch((err) => {
        console.warn('Slide block translation error:', err);
      })
      .finally(() => {
        if (isMounted) setIsTranslatingSlide(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentSlide?.id, language]);

  const getTranslatedText = (orig: string, fallbackHelper?: (t: string) => string): string => {
    if (!orig) return '';
    if (language === 'en') return orig;
    if (translatedBlockMap[orig]) return translatedBlockMap[orig];
    if (fallbackHelper) return fallbackHelper(orig);
    return translateSlideBody(orig, currentSlide.title, language);
  };

  // =========================================================================
  // LOCK & UNLOCK PROGRESSION LOGIC (FREE PREVIEW RESTRICTION ENFORCED)
  // =========================================================================
  
  // A module is unlocked if it's Module 0. In Free Preview mode, ONLY Module 0 is accessible!
  const isModuleUnlocked = (modIdx: number): boolean => {
    if (modIdx === 0) return true;
    if (!isEnrolled) return false; // Lock Module 1, 2, 3... in Free Preview Mode!

    const prevMod = modules[modIdx - 1];
    if (!prevMod) return true;

    const prevSlides = prevMod.slides || prevMod.slides_data || [];
    const allPrevSlidesDone = prevSlides.every((s) => completedSlideIds.has(s.id));
    if (!allPrevSlidesDone) return false;

    if (prevMod.has_quiz) {
      const quizKey = prevMod.quiz?.id || `quiz-${prevMod.id}` || prevMod.id;
      const isQuizPassed = passedQuizIds.has(quizKey) || passedQuizIds.has(prevMod.id);
      if (!isQuizPassed) return false;
    }

    return true;
  };

  // A slide is unlocked if its module is unlocked AND either it's slide 0 or prev slide is completed
  const isSlideUnlocked = (modIdx: number, slideIdx: number): boolean => {
    if (!isModuleUnlocked(modIdx)) return false;
    if (slideIdx === 0) return true;

    const mod = modules[modIdx];
    const modSlides = mod?.slides || mod?.slides_data || [];
    const prevSlide = modSlides[slideIdx - 1];
    if (prevSlide && !completedSlideIds.has(prevSlide.id)) {
      return false;
    }
    return true;
  };

  // Module Quiz is unlocked ONLY for enrolled users when all slides in module are completed
  const isModuleQuizUnlocked = (modIdx: number): boolean => {
    if (!isEnrolled) return false; // Quizzes are LOCKED in Free View Mode!
    if (!isModuleUnlocked(modIdx)) return false;
    const mod = modules[modIdx];
    const modSlides = mod?.slides || mod?.slides_data || [];
    return modSlides.length === 0 || modSlides.every((s) => completedSlideIds.has(s.id));
  };

  // Final Certification Exam is unlocked ONLY for enrolled users when all modules and quizzes are passed
  const isFinalExamUnlocked = (): boolean => {
    if (!isEnrolled) return false; // Final certification exam is LOCKED in Free View Mode!
    return modules.every((m, idx) => {
      if (!isModuleUnlocked(idx)) return false;
      const modSlides = m.slides || m.slides_data || [];
      const allSlidesDone = modSlides.every((s) => completedSlideIds.has(s.id));
      if (!allSlidesDone) return false;
      if (m.has_quiz) {
        const quizKey = m.quiz?.id || `quiz-${m.id}` || m.id;
        if (!passedQuizIds.has(quizKey) && !passedQuizIds.has(m.id)) return false;
      }
      return true;
    });
  };

  // Calculate Overall Course Completion
  const totalSlidesInCourse = modules.reduce(
    (acc, m) => acc + (m.slides || m.slides_data || []).length,
    0
  );
  const completionPercent = Math.min(
    100,
    Math.round(((completedSlideIds.size) / Math.max(1, totalSlidesInCourse)) * 100)
  );

  // Mark Current Slide Complete & Save Progress
  const markCurrentSlideCompleted = async () => {
    const slideId = currentSlide.id;
    if (!completedSlideIds.has(slideId)) {
      const updated = new Set(completedSlideIds);
      updated.add(slideId);
      setCompletedSlideIds(updated);

      if (user && isEnrolled) {
        await supabaseAdmin.from('progress').upsert({
          student_id: user.id,
          student_email: user.email,
          course_id: course.id,
          lesson_id: slideId,
          is_completed: true,
          updated_at: new Date().toISOString(),
        });

        const newTotalDone = updated.size;
        const calcPercent = Math.min(100, Math.round((newTotalDone / Math.max(1, totalSlidesInCourse)) * 100));

        await supabaseAdmin
          .from('enrollments')
          .update({
            progress_percent: calcPercent,
            last_active_module_index: currentModIdx,
            last_active_slide_index: currentSlideIdx,
            last_accessed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('course_id', course.id)
          .or(`student_id.eq.${user.id},student_email.eq.${user.email}`);
      }
    }
  };

  // Next Action Handler
  const handleNextSlideOrQuiz = async () => {
    await markCurrentSlideCompleted();

    // Check if more slides in current module
    if (currentSlideIdx < slides.length - 1) {
      setCurrentSlideIdx((prev) => prev + 1);
      setActiveView('slide');
    } else if (!isEnrolled) {
      showToast({
        type: 'warning',
        title: 'Free Preview Completed 🎓',
        message: 'You have finished the Module 1 Free Preview! Please enroll in the course to attempt quizzes and unlock all remaining modules.',
      });
    } else if (activeModule?.has_quiz && activeModule?.quiz) {
      setActiveView('quiz');
      setCurrentQuestionIdx(0);
      setSelectedAnswers({});
      setQuizSubmitted(false);
    } else if (currentModIdx < modules.length - 1) {
      const nextModIdx = currentModIdx + 1;
      if (isModuleUnlocked(nextModIdx)) {
        setCurrentModIdx(nextModIdx);
        setCurrentSlideIdx(0);
        setActiveView('slide');
      } else {
        showToast({
          type: 'warning',
          title: 'Module Locked 🔒',
          message: 'Please complete the module quiz before advancing to the next module.',
        });
      }
    } else {
      if (isFinalExamUnlocked()) {
        setActiveView('final_exam');
        setCurrentQuestionIdx(0);
        setSelectedAnswers({});
        setQuizSubmitted(false);
      } else {
        showToast({
          type: 'warning',
          title: 'Exam Locked 🔒',
          message: 'Complete all module quizzes first to unlock the final certification exam.',
        });
      }
    }
  };

  // Previous Action Handler
  const handlePrevSlide = () => {
    if (activeView === 'quiz' || activeView === 'final_exam') {
      setActiveView('slide');
      return;
    }

    if (currentSlideIdx > 0) {
      setCurrentSlideIdx((prev) => prev - 1);
    } else if (currentModIdx > 0) {
      const prevMod = modules[currentModIdx - 1];
      const prevSlides = prevMod.slides || prevMod.slides_data || [];
      setCurrentModIdx((prev) => prev - 1);
      setCurrentSlideIdx(Math.max(0, prevSlides.length - 1));
    }
  };

  // Submit Quiz / Assessment
  const handleSubmitQuiz = async (isFinal = false) => {
    const questions: Question[] = isFinal
      ? course.final_assessment?.questions || []
      : activeModule?.quiz?.questions || [];

    let correctCount = 0;
    questions.forEach((q, idx) => {
      const userSelected = selectedAnswers[idx] || [];
      const correctIdxs = (q.options || [])
        .map((o, optIdx) => (o.is_correct ? optIdx : -1))
        .filter((i) => i !== -1);

      if (
        userSelected.length === correctIdxs.length &&
        userSelected.every((val) => correctIdxs.includes(val))
      ) {
        correctCount += 1;
      }
    });

    const scorePct = Math.round((correctCount / Math.max(1, questions.length)) * 100);
    const passThreshold = isFinal
      ? course.final_assessment?.passing_score_percent || 80
      : activeModule?.quiz?.passing_score_percent || 80;

    const passed = scorePct >= passThreshold;
    setQuizScore(scorePct);
    setQuizPassed(passed);
    setQuizSubmitted(true);

    if (passed) {
      const quizKey = isFinal ? 'final-exam' : activeModule?.quiz?.id || `quiz-${activeModule.id}` || activeModule.id;
      setPassedQuizIds((prev) => new Set([...Array.from(prev), quizKey, activeModule.id]));

      if (user) {
        await supabaseAdmin.from('quiz_attempts').insert({
          student_id: user.id,
          student_email: user.email,
          course_id: course.id,
          quiz_id: quizKey,
          score_percent: scorePct,
          is_passed: true,
          answers: selectedAnswers,
          attempted_at: new Date().toISOString(),
        });
      }

      if (isFinal) {
        setActiveView('passed');

        const certHash = `TG-${course.id.slice(0, 4).toUpperCase()}-${user ? user.id.slice(0, 6).toUpperCase() : 'DEMO'}-${Date.now().toString(36).toUpperCase()}`;

        if (typeof window !== 'undefined') {
          localStorage.setItem(`completed_${course.id}`, 'true');
          if (course.slug) localStorage.setItem(`completed_${course.slug}`, 'true');
          localStorage.setItem(`cert_${course.id}`, certHash);
        }

        if (user) {
          // 1. Issue verified certificate in Supabase database
          await supabaseAdmin.from('certificates').upsert({
            id: `cert-${user.id.slice(0, 8)}-${course.id.slice(0, 8)}`,
            certificate_hash: certHash,
            student_id: user.id,
            student_name: user.fullName || 'Student Learner',
            course_id: course.id,
            course_title: course.title,
            instructor_name: course.trainer_name || 'Dr. Ayush Sharma',
            issue_date: new Date().toISOString(),
            metadata: {
              score: scorePct,
              passed: true,
              course_slug: course.slug || course.id,
              template: course.certificate_config || {},
            }
          }, { onConflict: 'id' });

          // 2. Mark enrollment as 100% completed
          await supabaseAdmin
            .from('enrollments')
            .update({
              status: 'completed',
              progress_percent: 100,
              completed_at: new Date().toISOString(),
              last_active_view: 'passed',
            })
            .eq('course_id', course.id)
            .or(`student_id.eq.${user.id},student_email.eq.${user.email}`);
        }

        showToast({
          type: 'success',
          title: 'Course Completed! 🎓',
          message: 'Congratulations! You passed the final exam with verified honors. Official certificate unlocked!',
        });
      } else {
        const nextModIdx = currentModIdx + 1;
        if (nextModIdx < modules.length) {
          const nextMod = modules[nextModIdx];
          showToast({
            type: 'success',
            title: 'Module Quiz Passed! 🎉',
            message: `Score: ${scorePct}%. Advancing to Module ${nextModIdx + 1}: ${nextMod.title}`,
          });
          // Auto advance to next module after brief feedback
          setTimeout(() => {
            setCurrentModIdx(nextModIdx);
            setCurrentSlideIdx(0);
            setActiveView('slide');
            setSelectedAnswers({});
            setQuizSubmitted(false);
          }, 1200);
        } else {
          showToast({
            type: 'success',
            title: 'All Modules Completed! 🏆',
            message: 'Advancing to the Final Certification Exam...',
          });
          setTimeout(() => {
            setActiveView('final_exam');
            setCurrentQuestionIdx(0);
            setSelectedAnswers({});
            setQuizSubmitted(false);
          }, 1200);
        }
      }
    } else {
      showToast({
        type: 'error',
        title: 'Assessment Not Passed',
        message: `Score: ${scorePct}%. Required: ${passThreshold}%. Review the slides and retry!`,
      });
    }
  };

  const handleCopyCode = (codeText: string, idx: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIdx(idx);
    showToast({ type: 'info', title: 'Code Copied', message: 'Snippet copied to clipboard.' });
    setTimeout(() => setCopiedCodeIdx(null), 2500);
  };

  if (loading) {
    return <PageLoader />;
  }

  const template = course.template_config || {
    theme: 'telecom_classic',
    primaryColor: '#0284c7',
    secondaryColor: '#6366f1',
    backgroundColor: '#000000',
    typography: 'roboto',
    cardStyle: 'bordered',
    slideLayout: 'standard',
    certificateDesign: 'classic',
  };

  return (
    <div className="min-h-screen w-full bg-zinc-100 dark:bg-zinc-950 text-black dark:text-white flex flex-col font-sans p-2 sm:p-3 lg:p-3 gap-2.5">
      {/* ========================================================================= */}
      {/* CARD 1: TOP BREADCRUMB, TITLE & PROGRESS HEADER CARD */}
      {/* ========================================================================= */}
      <header className={`rounded-2xl border transition-all duration-300 p-3 sm:px-5 sm:py-3 shadow-xs backdrop-blur ${
        isLight ? 'bg-white border-zinc-200 shadow-zinc-200/50' : 'bg-zinc-900/90 border-zinc-800 shadow-black/40'
      } ${isMaximized ? 'hidden' : 'block'}`}>
        {/* Top Line: Breadcrumbs & Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            {/* Back Button */}
            <Link
              href={`/courses/${course.id}`}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shrink-0"
              title="Back to Course Details"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            {/* Desktop Sidebar Collapse Toggle */}
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shrink-0"
              title={sidebarCollapsed ? 'Show Course Outline' : 'Collapse Sidebar'}
            >
              {sidebarCollapsed ? (
                <>
                  <PanelLeftOpen className="w-4 h-4 text-sky-500" />
                  <span>Show Outline</span>
                </>
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 text-zinc-400" />
                  <span>Collapse Sidebar</span>
                </>
              )}
            </button>

            {/* Mobile Outline Drawer Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
              title="Open Course Syllabus"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Breadcrumb Hierarchy Navigation */}
            <nav className="flex items-center space-x-1.5 text-xs text-zinc-500 dark:text-zinc-400 overflow-x-auto whitespace-nowrap py-0.5 scrollbar-none">
              <Link
                href="/courses"
                className="hover:text-black dark:hover:text-white font-medium transition flex items-center space-x-1"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Courses</span>
              </Link>

              <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-700 shrink-0" />

              <Link
                href={`/courses/${course.id}`}
                className="hover:text-black dark:hover:text-white font-medium max-w-[140px] sm:max-w-[200px] truncate transition"
                title={course.title}
              >
                {translateCourseTitle(course.slug || course.id, course.title, language)}
              </Link>

              <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-700 shrink-0" />

              <span className="font-bold text-sky-600 dark:text-sky-400 max-w-[140px] sm:max-w-[220px] truncate">
                {dict.moduleWord || 'Module'} {currentModIdx + 1}: {translateModuleTitle(activeModule?.title || '', language)}
              </span>

              {activeView === 'slide' && (
                <>
                  <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-700 shrink-0" />
                  <span className="font-black text-black dark:text-white max-w-[160px] truncate">
                    {dict.slideWord || 'Slide'} {currentSlideIdx + 1}: {translateSlideTitle(currentSlide?.title || '', language)}
                  </span>
                </>
              )}

              {activeView === 'quiz' && (
                <>
                  <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-700 shrink-0" />
                  <span className="font-black text-amber-500">{dict.moduleQuiz || 'Module Quiz'}</span>
                </>
              )}

              {activeView === 'final_exam' && (
                <>
                  <ChevronRight className="w-3 h-3 text-zinc-300 dark:text-zinc-700 shrink-0" />
                  <span className="font-black text-purple-500">{dict.finalAssessment || 'Final Certification Exam'}</span>
                </>
              )}
            </nav>
          </div>

          {/* Quick Header Actions (Guruji AI, Slide Scan, Dashboard Navigation) */}
          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
            {/* Guruji AI Assistant Header Toggle */}
            {(course.guruji_config?.enabled ?? true) && (
              <button
                type="button"
                onClick={() => setIsGurujiOpen(!isGurujiOpen)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-xs cursor-pointer ${
                  isGurujiOpen
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white border-sky-400 shadow-md shadow-sky-500/25 ring-2 ring-sky-400/30'
                    : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/25'
                }`}
                title={isGurujiOpen ? 'Collapse Guruji AI Teacher Card' : 'Expand Guruji AI Teacher Card'}
              >
                <span className="text-sm">👨‍🏫</span>
                <span>Guruji AI</span>
                {isGurujiOpen ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                ) : (
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-sky-500/20 text-sky-600 dark:text-sky-300">
                    Ask
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-quick-tools', { detail: { tab: 'glossary', autoScan: true } }));
                }
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold transition shadow-xs cursor-pointer"
              title="Scan current slide for hard/complex terms & add to Glossary"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Scan Hard Slide Terms</span>
            </button>

            <Link
              href="/student/dashboard"
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/25 border border-sky-400/30 transition-all duration-200 active:scale-95 cursor-pointer"
              title="Return to Student Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-white" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Bottom Line: Course Title & Live Progress Bar */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                {dict.moduleWord || 'Module'} {currentModIdx + 1} / {modules.length}
              </span>
              <span className="text-xs text-zinc-400">
                {activeModule?.duration_minutes || 15} mins • {slides.length} {dict.slidesCount || 'slides'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black truncate">
              {activeView === 'slide' 
                ? translateSlideTitle(currentSlide?.title || '', language) 
                : activeView === 'quiz' 
                ? `${translateModuleTitle(activeModule?.title || '', language)} - ${dict.moduleQuiz || 'Quiz'}` 
                : (dict.finalAssessment || 'Final Certification Exam')}
            </h1>
          </div>

          {/* Progress Bar & Percentage Pill */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right">
              <div className="text-xs font-black font-mono text-sky-600 dark:text-sky-400">
                {completionPercent}% {dict.completed || 'Completed'}
              </div>
              <div className="text-[10px] text-zinc-400">
                {completedSlideIds.size} / {totalSlidesInCourse} {dict.slidesCount || 'Lessons'}
              </div>
            </div>

            <div className="w-28 sm:w-36 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden p-0.5 border border-zinc-300 dark:border-zinc-700">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2-COLUMN WORKSPACE: CARD 2 (SIDEBAR) + CARD 3 (RIGHT CONTENT CARD) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex gap-2 sm:gap-3 min-h-0 relative items-start">
        {/* MOBILE & TABLET DRAWER BACKDROP */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          />
        )}

        {/* LEFT FLOATING EXPAND TAB (Visible on Desktop when Sidebar is Collapsed) */}
        {sidebarCollapsed && !isMaximized && (
          <button
            type="button"
            onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:flex fixed left-0 top-1/2 -translate-y-1/2 z-40 px-2 py-3.5 rounded-r-2xl bg-white dark:bg-zinc-900 border border-l-0 border-zinc-300 dark:border-zinc-700 shadow-xl text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-zinc-800 hover:px-3 transition-all items-center gap-1.5 group select-none cursor-pointer"
            title="Expand Course Syllabus (Click to open)"
          >
            <PanelLeftOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-mono font-black [writing-mode:vertical-lr] rotate-180 tracking-wider uppercase">
              Syllabus
            </span>
          </button>
        )}

        {/* RIGHT FLOATING EXPAND TAB (Visible on Desktop when Guruji is Collapsed, positioned cleanly below Quick Tools drawer tab) */}
        {!isGurujiOpen && !isMaximized && (course?.guruji_config?.enabled ?? true) && (
          <button
            type="button"
            onClick={() => setIsGurujiOpen(true)}
            className="hidden lg:flex fixed right-0 top-[calc(50%+68px)] -translate-y-1/2 z-40 px-2 py-3.5 rounded-l-2xl bg-white dark:bg-zinc-900 border border-r-0 border-zinc-300 dark:border-zinc-700 shadow-xl text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-zinc-800 hover:px-3 transition-all items-center gap-1.5 group select-none cursor-pointer"
            title="Expand Guruji AI Teacher Card (Click to open)"
          >
            <PanelRightOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-mono font-black [writing-mode:vertical-lr] tracking-wider uppercase">
              Guruji AI
            </span>
          </button>
        )}

        {/* ======================================================================= */}
        {/* CARD 2: LEFT SIDEBAR (COMPACT MINIMIZED WIDTH & RESPONSIVE DRAWER) */}
        {/* ======================================================================= */}
        <aside
          className={`
            fixed lg:static inset-y-2 sm:inset-y-3 left-2 sm:left-3 z-50 lg:z-10
            rounded-2xl sm:rounded-3xl border flex flex-col transition-all duration-300 ease-in-out shadow-lg
            ${isLight ? 'bg-white/95 border-zinc-200/80 shadow-zinc-200/50 backdrop-blur-md' : 'bg-zinc-900/95 border-zinc-800 shadow-black/50 backdrop-blur-md'}
            ${
              mobileMenuOpen
                ? 'w-[85vw] sm:w-80 max-w-[340px] translate-x-0'
                : '-translate-x-[110%] lg:translate-x-0'
            }
            ${
              sidebarCollapsed || isMaximized
                ? 'lg:w-0 lg:p-0 lg:border-0 lg:overflow-hidden lg:opacity-0 pointer-events-none'
                : 'lg:w-64 xl:w-72 lg:p-3 lg:opacity-100 lg:h-[calc(100vh-140px)] lg:sticky lg:top-3'
            }
          `}
          style={{ width: sidebarCollapsed || isMaximized ? '0px' : undefined }}
        >
          {/* 1. SIDEBAR TOP HEADER & OVERALL METRICS */}
          <div className="p-3 lg:p-0 lg:pb-2.5 border-b border-zinc-200/80 dark:border-zinc-800/80 shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-5.5 h-5.5 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 block leading-tight">
                    Syllabus
                  </span>
                  <span className="text-[9px] font-mono text-zinc-400">
                    {modules.length} Mods • {modules.reduce((acc, m) => acc + (m.slides || m.slides_data || []).length, 0)} Lessons
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {/* Overall Curriculum Completion Badge */}
                <div className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[10px] font-mono font-black">
                  {(() => {
                    const totalSlides = modules.reduce((acc, m) => acc + (m.slides || m.slides_data || []).length, 0);
                    const completed = modules.reduce((acc, m) => {
                      const mSlides = m.slides || m.slides_data || [];
                      return acc + mSlides.filter((s) => completedSlideIds.has(s.id)).length;
                    }, 0);
                    const pct = totalSlides > 0 ? Math.round((completed / totalSlides) * 100) : 0;
                    return `${pct}%`;
                  })()}
                </div>

                {/* PC Collapse Button */}
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden lg:flex p-1.5 rounded-xl text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>

                {/* Mobile Close Button */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="lg:hidden p-1.5 rounded-xl text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Overall Course Mini Linear Track */}
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(() => {
                    const totalSlides = modules.reduce((acc, m) => acc + (m.slides || m.slides_data || []).length, 0);
                    const completed = modules.reduce((acc, m) => {
                      const mSlides = m.slides || m.slides_data || [];
                      return acc + mSlides.filter((s) => completedSlideIds.has(s.id)).length;
                    }, 0);
                    return totalSlides > 0 ? Math.min(100, Math.round((completed / totalSlides) * 100)) : 0;
                  })()}%`,
                }}
              />
            </div>
          </div>

          {/* 2. MODULE LIST SCROLLABLE ACCORDION CONTAINER */}
          <div className="flex-1 overflow-y-auto p-2.5 lg:p-0 space-y-2 pt-2.5 scrollbar-thin">
            {modules.map((m, mIdx) => {
              const isModUnlocked = isModuleUnlocked(mIdx);
              const isModActive = currentModIdx === mIdx && activeView !== 'final_exam';
              const mSlides = m.slides || m.slides_data || [];
              const modCompletedCount = mSlides.filter((s) => completedSlideIds.has(s.id)).length;
              const isModDone = mSlides.length > 0 && modCompletedCount === mSlides.length;
              const quizKey = m.quiz?.id || `quiz-${m.id}` || m.id;
              const isQuizPassed = passedQuizIds.has(quizKey) || passedQuizIds.has(m.id);
              const modProgressPercent = mSlides.length > 0 ? Math.round((modCompletedCount / mSlides.length) * 100) : 0;

              // Clean redundant "Module X:" prefix if present in raw title to prevent truncation
              const rawTranslatedTitle = translateModuleTitle(m.title, language);
              const displayModTitle = rawTranslatedTitle.replace(/^Module\s+\d+:\s*/i, '');

              return (
                <div
                  key={m.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    !isModUnlocked
                      ? 'bg-zinc-50/80 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800/80'
                      : isModActive
                      ? isLight
                        ? 'border-sky-500 bg-sky-50/60 shadow-sm ring-1 ring-sky-500/30'
                        : 'border-sky-500/70 bg-sky-950/30 shadow-sm ring-1 ring-sky-500/30'
                      : isLight
                      ? 'border-zinc-200/90 bg-white hover:border-zinc-300 hover:shadow-xs'
                      : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/80'
                  }`}
                >
                  {/* Module Header Capsule */}
                  <div
                    onClick={() => {
                      if (!isModUnlocked) {
                        showToast({
                          type: 'warning',
                          title: 'Module Locked 🔒',
                          message: 'Please complete all previous lessons and pass the module evaluation to unlock.',
                        });
                        return;
                      }
                      setCurrentModIdx(mIdx);
                      setCurrentSlideIdx(0);
                      setActiveView('slide');
                      setMobileMenuOpen(false);
                    }}
                    className={`p-2.5 text-xs transition select-none ${
                      !isModUnlocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                        {/* Status Icon / Index Capsule */}
                        <div
                          className={`w-6 h-6 rounded-lg font-mono font-black text-[11px] flex items-center justify-center shrink-0 shadow-2xs mt-0.5 transition ${
                            !isModUnlocked
                              ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700'
                              : isModDone && (!m.has_quiz || isQuizPassed)
                              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                              : isModActive
                              ? 'bg-sky-600 text-white shadow-sky-500/30 ring-2 ring-sky-400/40'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700'
                          }`}
                        >
                          {!isModUnlocked ? (
                            <Lock className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                          ) : isModDone && (!m.has_quiz || isQuizPassed) ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            mIdx + 1
                          )}
                        </div>

                        {/* Module Info with clean multi-line display */}
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-sky-600 dark:text-sky-400 font-bold mb-0.5">
                            Module {mIdx + 1}
                          </div>
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
                            {displayModTitle}
                          </h4>
                          <div className="text-[10px] text-zinc-600 dark:text-zinc-400 flex items-center space-x-1.5 mt-1 font-mono">
                            <span>{modCompletedCount}/{mSlides.length} Lessons</span>
                            {m.has_quiz && (
                              <span className={isQuizPassed ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-amber-700 dark:text-amber-400 font-bold'}>
                                • {isQuizPassed ? 'Quiz Passed ✓' : 'Quiz Required'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expand / Lock Indicator */}
                      <div className="shrink-0 flex items-center space-x-1 mt-0.5">
                        {!isModUnlocked ? (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 flex items-center space-x-1 border border-zinc-300 dark:border-zinc-700">
                            <Lock className="w-2.5 h-2.5" />
                          </span>
                        ) : (
                          <div className={`p-1 rounded-lg ${isModActive ? 'text-sky-600 dark:text-sky-400 bg-sky-500/10' : 'text-zinc-400 hover:text-zinc-600'}`}>
                            {isModActive ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Module Mini Linear Track */}
                    {isModUnlocked && mSlides.length > 0 && (
                      <div className="mt-2 w-full bg-zinc-200/80 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isModDone ? 'bg-emerald-500' : 'bg-sky-500'
                          }`}
                          style={{ width: `${modProgressPercent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Expanded Lessons Tree for Active Module */}
                  {isModActive && isModUnlocked && (
                    <div className="px-2 pb-2.5 space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/40">
                      {mSlides.map((slide, sIdx) => {
                        const isSlideActive = currentSlideIdx === sIdx && activeView === 'slide';
                        const isSlideDone = completedSlideIds.has(slide.id);
                        const isSlideOpen = isSlideUnlocked(mIdx, sIdx);

                        return (
                          <button
                            key={slide.id}
                            type="button"
                            onClick={() => {
                              if (!isSlideOpen) {
                                showToast({
                                  type: 'warning',
                                  title: 'Lesson Locked 🔒',
                                  message: 'Please complete the previous lesson first to unlock.',
                                });
                                return;
                              }
                              setCurrentSlideIdx(sIdx);
                              setActiveView('slide');
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition-all duration-150 flex items-start justify-between gap-2 group ${
                              !isSlideOpen
                                ? 'opacity-60 cursor-not-allowed bg-zinc-100/50 dark:bg-zinc-900/30'
                                : isSlideActive
                                ? 'bg-sky-600 text-white font-bold shadow-md ring-2 ring-sky-400/40'
                                : isSlideDone
                                ? isLight
                                  ? 'bg-emerald-50/50 text-zinc-900 border border-emerald-200/60 hover:bg-emerald-50'
                                  : 'bg-emerald-950/20 text-zinc-100 border border-emerald-800/40 hover:bg-emerald-950/30'
                                : isLight
                                ? 'bg-white text-zinc-900 border border-zinc-200 hover:border-zinc-300 shadow-2xs'
                                : 'bg-zinc-900/70 text-zinc-100 border border-zinc-700/60 hover:border-zinc-600'
                            }`}
                          >
                            <div className="flex items-start space-x-2 min-w-0 flex-1">
                              {/* Step Number Tag */}
                              <span className={`font-mono font-black text-[10px] px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                                isSlideActive
                                  ? 'bg-white/20 text-white'
                                  : isSlideDone
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                                  : 'bg-zinc-200/80 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                              }`}>
                                {mIdx + 1}.{sIdx + 1}
                              </span>

                              {/* Lesson Title with multi-line support */}
                              <span className={`text-[11px] leading-snug flex-1 line-clamp-2 ${
                                isSlideActive
                                  ? 'text-white font-black'
                                  : 'text-zinc-900 dark:text-zinc-100 font-medium'
                              }`}>
                                {translateSlideTitle(slide.title, language)}
                              </span>
                            </div>

                            {/* Status Indicator */}
                            <span className={`text-[9px] font-mono font-bold shrink-0 px-1.5 py-0.5 rounded-md mt-0.5 ${
                              isSlideActive
                                ? 'bg-white/20 text-white font-black'
                                : isSlideDone
                                ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800'
                                : !isSlideOpen
                                ? 'text-zinc-500 bg-zinc-200 dark:bg-zinc-800'
                                : 'text-sky-700 bg-sky-100 dark:text-sky-300 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800'
                            }`}>
                              {!isSlideOpen ? '🔒 Lock' : isSlideDone ? '✓ Done' : 'Study'}
                            </span>
                          </button>
                        );
                      })}

                      {/* Module Evaluation Quiz Button */}
                      {m.has_quiz && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!isEnrolled) {
                              showToast({
                                type: 'warning',
                                title: 'Free Preview Mode 🔒',
                                message: 'Quizzes are disabled in Free Preview mode. Please enroll in the course to attempt quizzes and earn credentials!',
                              });
                              return;
                            }
                            if (!isModuleQuizUnlocked(mIdx)) {
                              showToast({
                                type: 'warning',
                                title: 'Evaluation Locked 🔒',
                                message: 'Complete all lessons in this module to unlock the evaluation quiz.',
                              });
                              return;
                            }
                            setActiveView('quiz');
                            setCurrentQuestionIdx(0);
                            setSelectedAnswers({});
                            setQuizSubmitted(false);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 mt-2 ${
                            !isModuleQuizUnlocked(mIdx)
                              ? 'opacity-60 cursor-not-allowed bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                              : activeView === 'quiz'
                              ? 'bg-amber-600 text-white shadow-md'
                              : isQuizPassed
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 hover:bg-amber-100 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            {!isModuleQuizUnlocked(mIdx) ? (
                              <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            ) : isQuizPassed ? (
                              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-bounce" />
                            )}
                            <span className="text-[11px] font-black line-clamp-1">
                              {translateQuizTitle(m.quiz?.title || 'Module Quiz Evaluation', language)}
                            </span>
                          </div>

                          <span className={`text-[9px] font-mono font-black shrink-0 px-2 py-0.5 rounded-md ${
                            activeView === 'quiz'
                              ? 'bg-white/20 text-white'
                              : isQuizPassed
                              ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200'
                              : !isModuleQuizUnlocked(mIdx)
                              ? 'text-zinc-500'
                              : 'bg-amber-500 text-white shadow-xs'
                          }`}>
                            {!isModuleQuizUnlocked(mIdx) ? 'Locked' : isQuizPassed ? 'Passed ✓' : 'Take Quiz'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}


            {/* 3. FINAL CERTIFICATION ASSESSMENT MILESTONE CARD */}
            <div className="pt-1.5 pb-1">
              <button
                type="button"
                onClick={() => {
                  if (!isEnrolled) {
                    showToast({
                      type: 'warning',
                      title: 'Free Preview Mode 🔒',
                      message: 'Certification exams are disabled in Free Preview mode. Please enroll in the course to unlock the final exam!',
                    });
                    return;
                  }
                  if (!isFinalExamUnlocked()) {
                    showToast({
                      type: 'warning',
                      title: 'Certification Exam Locked 🔒',
                      message: 'You must complete all course modules and pass their quizzes before taking the final exam.',
                    });
                    return;
                  }
                  setActiveView('final_exam');
                  setCurrentQuestionIdx(0);
                  setSelectedAnswers({});
                  setQuizSubmitted(false);
                  setMobileMenuOpen(false);
                }}
                className={`w-full p-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between text-left ${
                  !isFinalExamUnlocked()
                    ? isLight
                      ? 'bg-zinc-100/70 border-zinc-200 text-zinc-700'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                    : activeView === 'final_exam'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md ring-2 ring-purple-400/40'
                    : isLight
                    ? 'bg-purple-50 text-purple-900 border-purple-300 hover:border-purple-400 hover:bg-purple-100/70 shadow-xs'
                    : 'bg-gradient-to-r from-purple-500/15 to-indigo-500/15 text-purple-300 border border-purple-500/30 hover:border-purple-500/50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    activeView === 'final_exam'
                      ? 'bg-white/20 text-white'
                      : isFinalExamUnlocked()
                      ? 'bg-purple-600 text-white shadow-xs'
                      : isLight
                      ? 'bg-zinc-200 text-zinc-600'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    <Award className="w-3.5 h-3.5" />
                  </div>

                  <div className="truncate">
                    <div className="font-black text-[11px] truncate">
                      {dict.finalAssessment || 'Final Certification Exam'}
                    </div>
                    <div className="text-[8.5px] font-mono opacity-80">
                      {isFinalExamUnlocked() ? 'Ready for Exam' : 'Locked • Complete All Modules'}
                    </div>
                  </div>
                </div>

                <span className={`text-[8.5px] font-mono font-bold shrink-0 px-2 py-0.5 rounded-md ${
                  activeView === 'final_exam'
                    ? 'bg-white/20 text-white'
                    : isFinalExamUnlocked()
                    ? 'bg-purple-600 text-white shadow-xs'
                    : isLight
                    ? 'bg-zinc-200 text-zinc-700'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {!isFinalExamUnlocked() ? <Lock className="w-2.5 h-2.5 text-zinc-500" /> : 'Start Exam'}
                </span>
              </button>
            </div>
          </div>
        </aside>

        {/* ======================================================================= */}
        {/* CARD 3: RIGHT FULL VIEW CONTENT CARD (LESSON CANVAS & MAXIMIZE VIEW) */}
        {/* ======================================================================= */}
        <main
          className={`
            flex-1 rounded-2xl sm:rounded-3xl border transition-all duration-300 shadow-xs flex flex-col min-w-0 overflow-hidden relative
            ${isLight ? 'bg-white border-zinc-200/90 shadow-zinc-200/50' : 'bg-zinc-900/90 border-zinc-800 shadow-black/40'}
            ${
              isMaximized
                ? 'fixed inset-1 sm:inset-3 z-50 shadow-2xl h-[calc(100dvh-8px)] sm:h-[calc(100vh-24px)]'
                : 'h-[calc(100dvh-100px)] sm:h-[calc(100vh-140px)]'
            }
          `}
        >
          {/* GURUJI SLIDE OVERLAY (Draggable, Transparent Background, Live Speech, Mute/Stop/Analyse Quick Tools) */}
          {(course?.guruji_config?.enabled ?? true) && activeView === 'slide' && currentSlide && (
            <GurujiSlideOverlay
              course={course}
              activeModule={activeModule}
              activeSlide={currentSlide}
              allSlidesInModule={slides}
              currentSlideIdx={currentSlideIdx}
              isCardOpen={isGurujiOpen}
              onOpenCard={() => setIsGurujiOpen(true)}
            />
          )}

          {/* Card 3 Header Bar (Pinned at top of card) */}
          <div className="flex items-center justify-between p-2.5 sm:px-5 sm:py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur shrink-0 gap-2 sm:gap-3 z-10">
            <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
              {/* Mobile Quick Syllabus Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
                title="Open Syllabus Outline"
              >
                <Layers className="w-3.5 h-3.5 text-sky-500" />
              </button>

              {/* Desktop Expand Syllabus Button (when sidebar is collapsed) */}
              {sidebarCollapsed && !isMaximized && (
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(false)}
                  className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-xs font-bold hover:bg-sky-500/20 transition shrink-0"
                  title="Expand Course Outline"
                >
                  <PanelLeftOpen className="w-3.5 h-3.5 text-sky-500" />
                  <span>Syllabus</span>
                </button>
              )}

              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shrink-0 font-mono">
                M{currentModIdx + 1}
              </span>

              <h2 className="text-xs sm:text-base font-black truncate text-zinc-900 dark:text-zinc-100">
                {activeView === 'slide'
                  ? getTranslatedText(currentSlide.title, (t) => translateSlideTitle(t, language))
                  : activeView === 'quiz'
                  ? `${translateModuleTitle(activeModule?.title || 'Module', language)} Quiz`
                  : activeView === 'final_exam'
                  ? dict.finalAssessment || 'Final Certification Examination'
                  : 'Accreditation Unlocked'}
              </h2>
            </div>

            {/* Maximize / Minimize Control Button */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title={isMaximized ? 'Exit Maximize View' : 'Maximize Content Card'}
              >
                {isMaximized ? (
                  <>
                    <Minimize2 className="w-3 h-3 text-sky-500" />
                    <span className="hidden sm:inline">Exit Full</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3 h-3 text-zinc-400" />
                    <span className="hidden sm:inline">Maximize</span>
                  </>
                )}
              </button>
            </div>
          </div>


          {/* Card 3 Middle Area: Scrollable Content Canvas */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-6 scrollbar-thin">
            {/* A. SLIDE CONTENT RENDERER */}
            {activeView === 'slide' && (
              <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto w-full pb-32 sm:pb-8">
                {/* 14 Rich Block Types Renderer */}
                <div className="space-y-6">
                  {currentSlide.blocks && currentSlide.blocks.length === 0 ? (
                    <div className="p-12 text-center text-zinc-400 border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl space-y-3">
                      <BookOpen className="w-8 h-8 mx-auto text-zinc-500" />
                      <p className="text-sm font-bold">This slide is ready for study.</p>
                      <p className="text-xs">Proceed through the curriculum blocks or jump to the module assessment.</p>
                    </div>
                  ) : (
                    (currentSlide.blocks || []).map((block: RichBlock, blockIdx: number) => (
                      <div key={block.id || blockIdx} className="transition-all">
                        {(block.type as string) === 'heading' && (
                          <h2 className="text-xl sm:text-2xl font-black mt-6 first:mt-0 tracking-tight text-zinc-900 dark:text-zinc-100">
                            {getTranslatedText(block.content.text || '', (t) => translateSlideTitle(t, language))}
                          </h2>
                        )}

                        {(block.type as string) === 'subheading' && (
                          <h3 className="text-lg sm:text-xl font-bold mt-4 text-zinc-800 dark:text-zinc-200">
                            {getTranslatedText(block.content.text || '', (t) => translateSlideTitle(t, language))}
                          </h3>
                        )}

                        {block.type === 'paragraph' && (
                          <p className="text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                            {getTranslatedText(block.content.text || '')}
                          </p>
                        )}

                        {block.type === 'bullet_list' && (
                          <ul className="space-y-2 pl-4 text-sm sm:text-base text-zinc-700 dark:text-zinc-300">
                            {(block.content.items || []).map((item: string, iIdx: number) => (
                              <li key={iIdx} className="flex items-start space-x-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                                <span>{getTranslatedText(item || '')}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {(block.type as string) === 'numbered_list' && (
                          <ol className="space-y-2 pl-4 text-sm sm:text-base text-zinc-700 dark:text-zinc-300">
                            {(block.content.items || []).map((item: string, iIdx: number) => (
                              <li key={iIdx} className="flex items-start space-x-2">
                                <span className="font-mono font-bold text-sky-500 text-xs shrink-0 mt-0.5">
                                  {iIdx + 1}.
                                </span>
                                <span>{getTranslatedText(item || '')}</span>
                              </li>
                            ))}
                          </ol>
                        )}

                        {(block.type as string) === 'callout' && (
                          <div className={`p-5 rounded-2xl border flex items-start space-x-3.5 ${
                            block.content.type === 'warning'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
                              : block.content.type === 'success'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                              : 'bg-sky-500/10 border-sky-500/30 text-sky-800 dark:text-sky-200'
                          }`}>
                            <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                            <div className="text-xs sm:text-sm leading-relaxed font-medium">
                              {getTranslatedText(block.content.text || '')}
                            </div>
                          </div>
                        )}

                        {block.type === 'video' && (
                          <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-video bg-black flex items-center justify-center shadow-lg">
                            {block.content.url ? (
                              <iframe
                                src={block.content.url}
                                title="Video Lecture"
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <div className="text-center text-zinc-500 space-y-2">
                                <PlayCircle className="w-12 h-12 mx-auto text-sky-500" />
                                <p className="text-xs">Interactive Video Lecture Stream</p>
                              </div>
                            )}
                          </div>
                        )}

                        {block.type === 'image' && (
                          <figure className="space-y-2">
                            <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md">
                              <img
                                src={block.content.url || 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80'}
                                alt={block.content.caption || 'Slide Diagram'}
                                className="w-full h-auto object-cover max-h-[420px]"
                              />
                            </div>
                            {block.content.caption && (
                              <figcaption className="text-center text-xs text-zinc-500 italic">
                                {getTranslatedText(block.content.caption)}
                              </figcaption>
                            )}
                          </figure>
                        )}

                        {block.type === 'code' && (
                          <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-inner bg-zinc-950">
                            <div className="px-4 py-2 bg-zinc-900 flex items-center justify-between border-b border-zinc-800 text-xs text-zinc-400 font-mono">
                              <span>Code Snippet / Config</span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(block.content.code || '', blockIdx)}
                                className="flex items-center space-x-1 text-zinc-400 hover:text-white transition"
                              >
                                {copiedCodeIdx === blockIdx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedCodeIdx === blockIdx ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                            <pre className="p-5 text-emerald-400 font-mono text-xs sm:text-sm overflow-x-auto">
                              <code>{block.content.code}</code>
                            </pre>
                          </div>
                        )}

                        {block.type === 'quote' && (
                          <blockquote className="p-5 rounded-2xl border-l-4 border-sky-500 bg-zinc-100/70 dark:bg-zinc-900/50 italic text-sm sm:text-base text-zinc-700 dark:text-zinc-300">
                            "{getTranslatedText(block.content.text || '')}"
                            {block.content.author && (
                              <footer className="mt-2 text-xs font-bold not-italic text-zinc-500">
                                — {block.content.author}
                              </footer>
                            )}
                          </blockquote>
                        )}

                        {block.type === 'table' && (
                          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                              {block.content.headers && (
                                <thead className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                                  <tr>
                                    {block.content.headers.map((h: string, hIdx: number) => (
                                      <th key={hIdx} className="p-3.5 font-bold">
                                        {getTranslatedText(h)}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                              )}
                              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {(block.content.rows || []).map((row: string[], rIdx: number) => (
                                  <tr key={rIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                                    {row.map((cell: string, cIdx: number) => (
                                      <td key={cIdx} className="p-3.5">
                                        {getTranslatedText(cell)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {block.type === 'divider' && (
                          <hr className="border-zinc-200 dark:border-zinc-800 my-6" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* B. QUIZ & FINAL ASSESSMENT RUNNER */}
            {(activeView === 'quiz' || activeView === 'final_exam') && (
              !isEnrolled ? (
                <div className="p-8 sm:p-12 rounded-3xl border text-center space-y-5 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-xl max-w-xl mx-auto my-8 animate-in fade-in">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black">Free Preview Mode 🔒</h3>
                    <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed font-medium">
                      You are currently in Free Preview mode. You can study Module 1 lessons, but quizzes and certification assessments require course enrollment.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      href={`/courses/${course.id}`}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-wider shadow-lg hover:opacity-90 transition active:scale-95"
                    >
                      Enroll & Unlock Full Course →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in max-w-2xl mx-auto w-full">
                {/* Quiz Header Banner */}
                <div className="p-6 rounded-3xl border space-y-2 text-center bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{activeView === 'final_exam' ? (dict.finalAssessment || 'Final Certification Exam') : `${translateModuleTitle(activeModule?.title || '', language)} ${dict.moduleQuiz || 'Quiz'}`}</span>
                  </div>
                  <h2 className="text-2xl font-black">
                    {activeView === 'final_exam'
                      ? translateQuizTitle(course.final_assessment?.title || 'Final Exam', language)
                      : translateQuizTitle(activeModule?.quiz?.title || 'Module Quiz', language)}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Passing threshold: {activeView === 'final_exam' ? course.final_assessment?.passing_score_percent || 80 : activeModule?.quiz?.passing_score_percent || 80}% correct answers required
                  </p>
                </div>

                {/* Questions Runner */}
                {(() => {
                  const questions: Question[] =
                    activeView === 'final_exam'
                      ? course.final_assessment?.questions || []
                      : activeModule?.quiz?.questions || [];

                  if (questions.length === 0) {
                    return (
                      <div className="text-center py-12 text-zinc-400 space-y-4">
                        <p>No questions configured for this evaluation.</p>
                        <button
                          onClick={() => handleNextSlideOrQuiz()}
                          className="px-6 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs"
                        >
                          Continue to Next Module
                        </button>
                      </div>
                    );
                  }

                  const currentQ = questions[currentQuestionIdx] || questions[0];
                  const selectedOpts = selectedAnswers[currentQuestionIdx] || [];

                  return (
                    <div className="space-y-6">
                      {/* Progress Indicator */}
                      <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                        <span>Question {currentQuestionIdx + 1} / {questions.length}</span>
                        <span>Level: {currentQ.difficulty || 'Medium'}</span>
                      </div>

                      {/* Question Card */}
                      <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${isLight ? 'bg-white border-zinc-200 shadow-md' : 'bg-zinc-950 border-zinc-800'}`}>
                        <h3 className="text-lg sm:text-xl font-bold leading-relaxed">
                          {translateQuestionText(currentQ.question_text, language)}
                        </h3>

                        {/* Options */}
                        <div className="space-y-3">
                          {(currentQ.options || []).map((opt, optIdx) => {
                            const isSelected = selectedOpts.includes(optIdx);
                            return (
                              <div
                                key={opt.id || optIdx}
                                onClick={() => {
                                  if (quizSubmitted) return;
                                  const isMulti = currentQ.question_type === 'multiple_choice';
                                  if (isMulti) {
                                    const updated = isSelected
                                      ? selectedOpts.filter((i) => i !== optIdx)
                                      : [...selectedOpts, optIdx];
                                    setSelectedAnswers({ ...selectedAnswers, [currentQuestionIdx]: updated });
                                  } else {
                                    setSelectedAnswers({ ...selectedAnswers, [currentQuestionIdx]: [optIdx] });
                                  }
                                }}
                                className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                                  isSelected
                                    ? 'border-sky-500 bg-sky-500/10'
                                    : isLight
                                    ? 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50'
                                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center border text-xs font-bold ${
                                      isSelected
                                        ? 'bg-sky-500 text-white border-transparent'
                                        : 'border-zinc-400 dark:border-zinc-600'
                                    }`}
                                  >
                                    {isSelected && <Check className="w-3 h-3" />}
                                  </div>
                                  <span className="text-sm font-medium">{translateOptionText(opt.option_text, language)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation if submitted */}
                        {quizSubmitted && (
                          <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1 animate-in fade-in">
                            <span className="font-bold text-sky-500">Explanation:</span>
                            <p className="text-zinc-600 dark:text-zinc-400">{translateExplanation(currentQ.explanation || '', language) || 'Reviewed correctly according to standard telecom specifications.'}</p>
                          </div>
                        )}
                      </div>

                      {/* Quiz Navigation & Submit */}
                      <div className="flex items-center justify-between pt-4 gap-3">
                        <button
                          type="button"
                          disabled={currentQuestionIdx === 0}
                          onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                          className="px-5 py-2.5 rounded-xl border text-xs font-bold disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          ← Previous Question
                        </button>

                        {currentQuestionIdx < questions.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => setCurrentQuestionIdx((prev) => prev + 1)}
                            className="px-6 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs"
                          >
                            Next Question →
                          </button>
                        ) : !quizSubmitted ? (
                          <button
                            type="button"
                            onClick={() => handleSubmitQuiz(activeView === 'final_exam')}
                            className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-lg"
                          >
                            Submit Exam & Calculate Score
                          </button>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <div className="text-xs font-bold font-mono">Score: {quizScore}%</div>
                            {quizPassed ? (
                              <button
                                type="button"
                                onClick={handleNextSlideOrQuiz}
                                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                              >
                                {dict.nextLesson || 'Continue to Next Module'} →
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setQuizSubmitted(false);
                                  setSelectedAnswers({});
                                  setCurrentQuestionIdx(0);
                                }}
                                className="px-5 py-2.5 rounded-xl border text-xs font-bold flex items-center space-x-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Retry Quiz</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}

            {/* C. PASSED & CERTIFICATE CELEBRATION */}
            {activeView === 'passed' && (
              <div className="text-center py-12 space-y-6 max-w-xl mx-auto animate-in zoom-in-95">
                <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center shadow-lg">
                  <Award className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl sm:text-4xl font-black">🎉 Congratulations!</h2>
                  <p className="text-sm text-zinc-500">
                    You successfully mastered <strong>{translateCourseTitle(course.slug || course.id, course.title, language)}</strong> with a final examination score of {quizScore}%.
                  </p>
                </div>

                <div className="p-6 rounded-3xl border bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                    Verified Accreditation Unlocked
                  </div>
                  <h3 className="text-lg font-black">{course.certificate_config?.title || 'Certificate of Telecommunications Mastery'}</h3>
                  <div className="text-xs text-zinc-400">Issued to: {user?.fullName || 'Student Learner'}</div>

                  <div className="pt-2 flex items-center justify-center space-x-3">
                    <Link
                      href={`/certificate/${course.id}`}
                      className="px-6 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-wider shadow-md hover:opacity-90 transition"
                    >
                      View Official Certificate
                    </Link>

                    <Link
                      href="/student/dashboard"
                      className="px-5 py-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-xs font-bold transition flex items-center space-x-1.5"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>Back to Dashboard</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 3 Footer Navigation Bar (Pinned at bottom of Card 3, always visible without scrolling!) */}
          {activeView === 'slide' && (
            <div className="p-2.5 sm:px-6 sm:py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur shrink-0 shadow-lg flex flex-row items-center justify-between gap-2 sm:gap-4 z-10">
              {/* 1. Previous Lesson Button */}
              <button
                type="button"
                disabled={currentSlideIdx === 0 && currentModIdx === 0}
                onClick={handlePrevSlide}
                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition shrink-0 ${
                  currentSlideIdx === 0 && currentModIdx === 0
                    ? 'opacity-40 cursor-not-allowed border-zinc-200 dark:border-zinc-800 text-zinc-400'
                    : isLight
                    ? 'bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-100 hover:border-zinc-400 shadow-2xs'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600 shadow-2xs'
                }`}
                title="Previous Lesson"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{dict.previousLesson || 'Previous'}</span>
                <span className="sm:hidden">Prev</span>
              </button>

              {/* 2. Center Slide Position & Completion Badge */}
              <div className="flex items-center space-x-1.5 sm:space-x-2.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 shadow-inner">
                <div className="flex items-center space-x-1.5 text-[11px] sm:text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-sky-500 animate-pulse" />
                  <span>
                    {currentSlide.slide_number || currentSlideIdx + 1}/{slides.length}
                  </span>
                </div>

                <div className="h-3 w-px bg-zinc-300 dark:bg-zinc-700" />

                {completedSlideIds.has(currentSlide.id) ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span className="hidden sm:inline">{dict.completed || 'Completed'}</span>
                    <span className="sm:hidden">Done</span>
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-zinc-200/80 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span className="hidden sm:inline">In Progress</span>
                    <span className="sm:hidden">Study</span>
                  </span>
                )}
              </div>

              {/* 3. Primary Next Action Button */}
              <button
                type="button"
                onClick={handleNextSlideOrQuiz}
                className={`px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-md transition active:scale-98 shrink-0 ${
                  currentSlideIdx < slides.length - 1
                    ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'
                    : activeModule?.has_quiz
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20'
                    : currentModIdx < modules.length - 1
                    ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/20'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-500/20'
                }`}
              >
                {currentSlideIdx < slides.length - 1 ? (
                  <>
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{dict.markAsComplete || 'Mark Complete & Next'} →</span>
                    <span className="sm:hidden">Next →</span>
                  </>
                ) : activeModule?.has_quiz ? (
                  <>
                    <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{dict.moduleQuiz || 'Start Quiz'} →</span>
                    <span className="sm:hidden">Quiz →</span>
                  </>
                ) : currentModIdx < modules.length - 1 ? (
                  <>
                    <span className="hidden sm:inline">{dict.nextLesson || 'Next Module'} →</span>
                    <span className="sm:hidden">Next Mod →</span>
                  </>
                ) : (
                  <>
                    <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{dict.finalAssessment || 'Final Exam'} →</span>
                    <span className="sm:hidden">Exam →</span>
                  </>
                )}
              </button>
            </div>
          )}
        </main>

        {/* ======================================================================= */}
        {/* CARD 4: RIGHT GURUJI AI AVATAR CARD (INTEGRATED COURSE PLAYER COLUMN) */}
        {/* ======================================================================= */}
        {(course?.guruji_config?.enabled ?? true) && (
          <GurujiOverlay
            isOpen={isGurujiOpen}
            onClose={() => setIsGurujiOpen(false)}
            course={course}
            activeModule={activeModule}
            activeSlide={currentSlide}
            allSlidesInModule={slides}
            currentSlideIdx={currentSlideIdx}
            isMaximized={isMaximized}
          />
        )}
      </div>
    </div>
  );
}

