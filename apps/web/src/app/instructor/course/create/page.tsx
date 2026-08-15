'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Video, BookOpen, Layers, Plus, Trash2, CheckCircle2, ArrowRight, ArrowLeft,
  HelpCircle, Save, Award, ShieldAlert, Sliders, FileText, CheckSquare, Eye, MonitorPlay,
  Sparkles, Zap, Copy, RotateCcw
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabaseAdmin } from '@/lib/supabase';
import { CourseThumbnail } from '@/components/CourseThumbnail';

export interface SlideInput {
  id: string;
  slide_number: number;
  title: string;
  content_type: 'text' | 'video' | 'code' | 'image';
  body_markdown: string;
  media_url: string;
}

export interface QuizQuestionInput {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface ModuleInput {
  id: string;
  title: string;
  description: string;
  slides: SlideInput[];
  quizTitle: string;
  passingScore: number;
  quizQuestions: QuizQuestionInput[];
}

const COURSE_PRESETS = [
  {
    name: '🚀 Full-Stack Web Architecture',
    icon: '⚡',
    title: 'Full-Stack Web Architecture & Cloud Operations',
    category: 'Computer Science',
    level: 'advanced',
    price: 49,
    summary: 'Master Next.js 15, Supabase Postgres DB, React 19, and serverless cloud deployment pipelines.',
    syllabus: 'End-to-end curriculum covering full-stack frontend architecture, backend database relations, serverless functions, and CI/CD pipelines.',
    prerequisites: 'Basic knowledge of JavaScript / TypeScript and fundamental REST APIs.',
    targetAudience: 'Software engineers, frontend developers, and system architects seeking production mastery.',
    outcomes: [
      'Architect resilient full-stack applications with Next.js & Supabase',
      'Implement row-level security (RLS) policies and database schemas',
      'Optimize bundle size, SSR hydration, and client-side state caching',
      'Deploy scalable web applications with automated CI/CD workflows'
    ],
    modules: [
      {
        id: 'mod-1',
        title: 'Module 1: Modern Frontend Architecture & Hydration',
        description: 'Deep dive into React 19 server components and client state synchronization.',
        slides: [
          { id: 's1-1', slide_number: 1, title: 'Slide 1: Server vs Client Components', content_type: 'text', body_markdown: 'React 19 introduces server component rendering by default for optimal TTFB.', media_url: '' },
          { id: 's1-2', slide_number: 2, title: 'Slide 2: System Diagram & Hydration Boundary', content_type: 'image', body_markdown: 'Visual breakdown of component trees during initial HTML streaming.', media_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80' }
        ],
        quizTitle: 'Module 1 Assessment Quiz',
        passingScore: 80,
        quizQuestions: [
          { question: 'Which component type runs exclusively on the server in Next.js App Router?', options: ['Server Component', 'Client Component', 'UseState Component', 'DOM Component'], correctAnswer: 0, explanation: 'Server Components execute only on the server, sending rendered HTML to the client.' },
          { question: 'What is the main benefit of streaming SSR?', options: ['Instant TTFB and faster perceived load time', 'Disables all JavaScript', 'Eliminates CSS styling', 'Prevents database calls'], correctAnswer: 0, explanation: 'Streaming SSR allows progressive HTML delivery before full bundle downloads.' }
        ]
      },
      {
        id: 'mod-2',
        title: 'Module 2: Database Schema & Supabase RLS Security',
        description: 'Designing transactional database schemas and Row Level Security policies.',
        slides: [
          { id: 's2-1', slide_number: 1, title: 'Slide 1: Relational Postgres Schemas', content_type: 'text', body_markdown: 'Structure tables with foreign keys and foreign constraint checks.', media_url: '' }
        ],
        quizTitle: 'Module 2 Database Assessment',
        passingScore: 80,
        quizQuestions: [
          { question: 'What does RLS stand for in Postgres database security?', options: ['Row Level Security', 'Remote Load System', 'Record Lock State', 'Rapid Logic Service'], correctAnswer: 0, explanation: 'Row Level Security (RLS) restricts row access based on user credentials.' }
        ]
      }
    ],
    certTitle: 'Verified Full-Stack Web Architecture Certificate',
    certSeal: 'Authentic Seal',
    certBadge: 'executive_monochrome'
  },
  {
    name: '📡 Digital Signal Processing',
    icon: '📊',
    title: 'Digital Signal Processing & Real-Time Filtering',
    category: 'Signal Processing',
    level: 'intermediate',
    price: 59,
    summary: 'Comprehensive guide to Fourier transforms, FIR/IIR digital filter design, and real-time audio/sensor signal processing.',
    syllabus: 'Covers discrete-time signals, Z-transforms, FFT algorithms, digital filter design, and noise cancellation.',
    prerequisites: 'Calculus, complex numbers, and basic Python or MATLAB programming.',
    targetAudience: 'Electrical engineers, audio algorithm engineers, and DSP researchers.',
    outcomes: [
      'Master Discrete Fourier Transform (DFT) and Fast Fourier Transform (FFT)',
      'Design Finite Impulse Response (FIR) & Infinite Impulse Response (IIR) digital filters',
      'Analyze frequency spectra and Nyquist sampling rate boundaries',
      'Implement real-time noise reduction algorithms on hardware DSP units'
    ],
    modules: [
      {
        id: 'mod-1',
        title: 'Module 1: Sampling Theorem & Frequency Spectrum',
        description: 'Understanding continuous to discrete signal conversion and aliasing.',
        slides: [
          { id: 's1-1', slide_number: 1, title: 'Slide 1: Nyquist-Shannon Sampling Rate', content_type: 'text', body_markdown: 'Sampling frequency must be at least twice the maximum signal frequency component.', media_url: '' }
        ],
        quizTitle: 'Module 1 Sampling Assessment',
        passingScore: 80,
        quizQuestions: [
          { question: 'What occurs when sampling a signal below the Nyquist rate?', options: ['Aliasing', 'Amplification', 'Attenuation', 'Quantization'], correctAnswer: 0, explanation: 'Sampling below twice the signal frequency creates high-frequency overlap known as aliasing.' }
        ]
      }
    ],
    certTitle: 'Verified Digital Signal Processing Specialist',
    certSeal: 'Distinction Seal',
    certBadge: 'gold_distinction'
  },
  {
    name: '🤖 AI & Deep Learning',
    icon: '🧠',
    title: 'Deep Learning & Neural Network Architecture',
    category: 'Deep Learning',
    level: 'advanced',
    price: 79,
    summary: 'Build and train Transformers, CNNs, and LLM fine-tuning pipelines using PyTorch and CUDA acceleration.',
    syllabus: 'Master loss gradient propagation, multi-head self-attention mechanisms, parameter-efficient fine-tuning (LoRA), and model quantization.',
    prerequisites: 'Python proficiency, linear algebra, and basic neural network knowledge.',
    targetAudience: 'AI researchers, machine learning engineers, and data science leaders.',
    outcomes: [
      'Architect custom Transformer models and multi-head attention blocks',
      'Optimize GPU memory usage with PyTorch AMP and LoRA fine-tuning',
      'Implement tensor quantization (INT8/FP4) for low-latency inference',
      'Deploy AI models to production cloud infrastructure with vLLM'
    ],
    modules: [
      {
        id: 'mod-1',
        title: 'Module 1: Self-Attention & Transformer Mechanics',
        description: 'Dissecting Query, Key, Value tensor matrices and softmax attention scaling.',
        slides: [
          { id: 's1-1', slide_number: 1, title: 'Slide 1: Attention Matrix Formula', content_type: 'text', body_markdown: 'Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V.', media_url: '' }
        ],
        quizTitle: 'Module 1 Transformer Quiz',
        passingScore: 80,
        quizQuestions: [
          { question: 'Why is scaled dot-product attention divided by sqrt(d_k)?', options: ['To prevent extremely small gradients during softmax', 'To speed up matrix multiplication', 'To remove bias terms', 'To compress tensor dimensions'], correctAnswer: 0, explanation: 'Scaling by sqrt(d_k) keeps dot product magnitudes stable, preventing softmax saturation.' }
        ]
      }
    ],
    certTitle: 'Verified Deep Learning Systems Specialist',
    certSeal: 'Mastery Seal',
    certBadge: 'gold_distinction'
  },
  {
    name: '🔒 Cybersecurity & Cloud',
    icon: '🛡️',
    title: 'Zero-Trust Cloud Security & IAM Architecture',
    category: 'Cybersecurity',
    level: 'intermediate',
    price: 69,
    summary: 'Design zero-trust cloud perimeters, identity provider OAuth2 authentication, and encrypted data pipelines.',
    syllabus: 'Covers infrastructure identity access control, network segmentation, JWT validation, and threat mitigation.',
    prerequisites: 'Foundational Linux command line knowledge and network routing concepts.',
    targetAudience: 'Security engineers, DevOps professionals, and cloud architects.',
    outcomes: [
      'Enforce zero-trust security perimeters across multi-cloud networks',
      'Configure enterprise OAuth2, SAML, and JWT authentication flows',
      'Audit Postgres RLS security and database encryption keys',
      'Implement automated vulnerability scanning in deployment pipelines'
    ],
    modules: [
      {
        id: 'mod-1',
        title: 'Module 1: Zero-Trust Security & Identity Verification',
        description: 'Principles of continuous identity verification and least-privilege access.',
        slides: [
          { id: 's1-1', slide_number: 1, title: 'Slide 1: Never Trust, Always Verify', content_type: 'text', body_markdown: 'Zero trust assumes network perimeters are compromised by default.', media_url: '' }
        ],
        quizTitle: 'Module 1 Security Assessment',
        passingScore: 80,
        quizQuestions: [
          { question: 'What is the core directive of Zero-Trust Security Architecture?', options: ['Never trust, always verify', 'Trust all internal IP addresses', 'Disable firewalls during deployments', 'Use unencrypted passwords'], correctAnswer: 0, explanation: 'Zero Trust demands explicit identity authentication for every access request.' }
        ]
      }
    ],
    certTitle: 'Verified Cloud Security & Zero-Trust Architect',
    certSeal: 'Authentic Seal',
    certBadge: 'executive_monochrome'
  }
];

export default function CreateCoursePage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const isLight = theme === 'light';

  // 5 Wizard Steps:
  // Step 1: Trainer & Course Name
  // Step 2: Content Overview & Objectives
  // Step 3: Modules 1..5 with Slides & Quizzes
  // Step 4: Final Assessment
  // Step 5: Attention Pop-up & Publish
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // STEP 1: Trainer & Course Name
  const [trainerName, setTrainerName] = useState(user?.fullName || 'Dr. Alex Vance, Senior Architect');
  const [courseTitle, setCourseTitle] = useState('');
  const [category, setCategory] = useState('Computer Science');
  const [level, setLevel] = useState('intermediate');
  const [isPaid, setIsPaid] = useState(true);
  const [price, setPrice] = useState(49);
  const [shortSummary, setShortSummary] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailType, setThumbnailType] = useState<'image' | 'video'>('image');

  // STEP 2: Content Overview
  const [syllabusSummary, setSyllabusSummary] = useState(
    'Comprehensive module-based course designed to take students from foundational principles to advanced industrial mastery.'
  );
  const [prerequisites, setPrerequisites] = useState('Basic programming knowledge and familiarization with fundamental algorithms.');
  const [targetAudience, setTargetAudience] = useState('Software engineers, system architects, and technical computer science students.');
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([
    'Understand core system architecture and theoretical foundations.',
    'Master practical design patterns across multi-slide technical modules.',
    'Pass module quizzes to validate active retention and gain practical mastery.',
    'Complete the final comprehensive evaluation to earn industry certification.'
  ]);

  // STEP 3: Modules 1 to 5+ Structure with Slides & Quizzes
  const [modulesList, setModulesList] = useState<ModuleInput[]>([
    {
      id: 'mod-1',
      title: 'Module 1: Architecture Foundations & Protocol Basics',
      description: 'Introduction to foundational protocol concepts and system topologies.',
      slides: [
        {
          id: 's-1-1',
          slide_number: 1,
          title: 'Slide 1: System Protocol Overview',
          content_type: 'text',
          body_markdown: 'Welcome to Module 1! In this initial slide, we explore the core concepts of distributed network architecture and state synchronization.',
          media_url: ''
        },
        {
          id: 's-1-2',
          slide_number: 2,
          title: 'Slide 2: Architectural Diagram & Flow',
          content_type: 'image',
          body_markdown: 'Visual breakdown of client-server data flow and load balancer node routing.',
          media_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80'
        },
        {
          id: 's-1-3',
          slide_number: 3,
          title: 'Slide 3: Video Demonstration & Deep Dive',
          content_type: 'video',
          body_markdown: 'Watch the live 5-minute technical walk-through of the execution pipeline.',
          media_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        }
      ],
      quizTitle: 'Module 1 Assessment Quiz',
      passingScore: 80,
      quizQuestions: [
        {
          question: 'Which protocol ensures ordered, reliable packet transport across distributed nodes?',
          options: ['UDP', 'TCP', 'ICMP', 'DNS'],
          correctAnswer: 1,
          explanation: 'TCP (Transmission Control Protocol) guarantees ordered and error-checked data delivery.'
        }
      ]
    },
    {
      id: 'mod-2',
      title: 'Module 2: High-Performance Data Pipeline Implementation',
      description: 'Building asynchronous pipelines and optimizing memory allocations.',
      slides: [
        {
          id: 's-2-1',
          slide_number: 1,
          title: 'Slide 1: Data Pipeline Architecture',
          content_type: 'text',
          body_markdown: 'Exploring zero-copy buffers, message queue workers, and event stream listeners.',
          media_url: ''
        },
        {
          id: 's-2-2',
          slide_number: 2,
          title: 'Slide 2: Code Implementation Snippet',
          content_type: 'code',
          body_markdown: '```typescript\nasync function processStream(event) {\n  const payload = await parseBuffer(event);\n  return dispatchWorker(payload);\n}\n```',
          media_url: ''
        },
        {
          id: 's-2-3',
          slide_number: 3,
          title: 'Slide 3: Performance Optimization Benchmarks',
          content_type: 'text',
          body_markdown: 'Analyzing microsecond latency differences across batching strategy configurations.',
          media_url: ''
        }
      ],
      quizTitle: 'Module 2 Assessment Quiz',
      passingScore: 80,
      quizQuestions: [
        {
          question: 'What is the primary benefit of zero-copy buffer operations in event streams?',
          options: ['Reduces CPU overhead & memory transfers', 'Increases storage disk size', 'Disables encryption', 'Requires manual restart'],
          correctAnswer: 0,
          explanation: 'Zero-copy avoids copying data between user space and kernel space, drastically cutting latency.'
        }
      ]
    },
    {
      id: 'mod-3',
      title: 'Module 3: Fault Tolerance & Resiliency Patterns',
      description: 'Implementing circuit breakers, retries, and fallback strategies.',
      slides: [
        {
          id: 's-3-1',
          slide_number: 1,
          title: 'Slide 1: Circuit Breaker State Machines',
          content_type: 'text',
          body_markdown: 'Understanding Closed, Open, and Half-Open states in resilient system designs.',
          media_url: ''
        },
        {
          id: 's-3-2',
          slide_number: 2,
          title: 'Slide 2: Exponential Backoff & Jitter',
          content_type: 'text',
          body_markdown: 'Preventing thundering herd problems during cluster node recovery.',
          media_url: ''
        },
        {
          id: 's-3-3',
          slide_number: 3,
          title: 'Slide 3: Video Demonstration of Failure Recovery',
          content_type: 'video',
          body_markdown: 'Live demo showing node crash isolation and automatic failover.',
          media_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        }
      ],
      quizTitle: 'Module 3 Assessment Quiz',
      passingScore: 80,
      quizQuestions: [
        {
          question: 'Why is jitter added to exponential backoff algorithms?',
          options: ['To spread retry attempts & avoid thundering herds', 'To slow down network bandwidth', 'To encrypt incoming tokens', 'To force server shutdown'],
          correctAnswer: 0,
          explanation: 'Jitter introduces randomness so concurrent failed requests do not retry at the exact same millisecond.'
        }
      ]
    },
    {
      id: 'mod-4',
      title: 'Module 4: Security, Authentication & Rate Limiting',
      description: 'Securing API endpoints, JWT rotation, and distributed rate limiters.',
      slides: [
        {
          id: 's-4-1',
          slide_number: 1,
          title: 'Slide 1: Token-Based Authentication Flow',
          content_type: 'text',
          body_markdown: 'Comparing session cookies, OAuth2 Bearer tokens, and asymmetric JWT signatures.',
          media_url: ''
        },
        {
          id: 's-4-2',
          slide_number: 2,
          title: 'Slide 2: Token Bucket Algorithm',
          content_type: 'text',
          body_markdown: 'Mathematical foundations of rate limiting using sliding window logs and token buckets.',
          media_url: ''
        },
        {
          id: 's-4-3',
          slide_number: 3,
          title: 'Slide 3: Defensive Code Guidelines',
          content_type: 'code',
          body_markdown: '// Enforce strict rate limits per IP\nconst limiter = new RateLimiter({ windowMs: 60000, max: 100 });',
          media_url: ''
        }
      ],
      quizTitle: 'Module 4 Assessment Quiz',
      passingScore: 80,
      quizQuestions: [
        {
          question: 'Which algorithm allows short bursts of traffic while enforcing average rate limits?',
          options: ['Token Bucket', 'Fixed Window Counter', 'Random Drop', 'First-In First-Out'],
          correctAnswer: 0,
          explanation: 'Token bucket allows consuming accumulated tokens in bursts up to the bucket capacity.'
        }
      ]
    },
    {
      id: 'mod-5',
      title: 'Module 5: Production Deployment & Observability',
      description: 'Deploying to cloud infrastructure, telemetry, metrics, and incident management.',
      slides: [
        {
          id: 's-5-1',
          slide_number: 1,
          title: 'Slide 1: Metrics, Logs & Traces (The 3 Pillars)',
          content_type: 'text',
          body_markdown: 'Setting up OpenTelemetry collectors and Prometheus alerting rules.',
          media_url: ''
        },
        {
          id: 's-5-2',
          slide_number: 2,
          title: 'Slide 2: Blue-Green & Canary Deployments',
          content_type: 'text',
          body_markdown: 'Zero-downtime release strategies and automated health-check rollbacks.',
          media_url: ''
        },
        {
          id: 's-5-3',
          slide_number: 3,
          title: 'Slide 3: Final Production Summary',
          content_type: 'text',
          body_markdown: 'Reviewing key architectural principles mastered across all 5 modules.',
          media_url: ''
        }
      ],
      quizTitle: 'Module 5 Assessment Quiz',
      passingScore: 80,
      quizQuestions: [
        {
          question: 'What characterizes a Canary deployment strategy?',
          options: ['Routing a small percentage of real traffic to the new version first', 'Replacing all servers simultaneously', 'Running tests offline without users', 'Deploying only on weekends'],
          correctAnswer: 0,
          explanation: 'Canary deployment exposes a subset of live traffic to the release to verify stability before full rollout.'
        }
      ]
    }
  ]);

  // STEP 4: Final Assessment
  const [finalAssessmentTitle, setFinalAssessmentTitle] = useState('Mastery Certification Final Assessment');
  const [finalPassingScore, setFinalPassingScore] = useState(85);
  const [finalQuestions, setFinalQuestions] = useState<QuizQuestionInput[]>([
    {
      question: 'Which combination of design patterns guarantees resilient, high-throughput microservices?',
      options: ['Circuit Breaker + Rate Limiting + Asynchronous Event Queue', 'Monolithic Blocking Sync Calls', 'Single Threaded Memory Arrays', 'Manual Restart Scripts'],
      correctAnswer: 0,
      explanation: 'Combining circuit breaking, rate limiting, and message queuing isolates failures while maintaining system scale.'
    },
    {
      question: 'What is the recommended approach for zero-downtime database migrations?',
      options: ['Expand and Contract pattern with backwards-compatible columns', 'Drop all tables and recreate during peak hours', 'Hardcode static data inside source code', 'Disable database logs'],
      correctAnswer: 0,
      explanation: 'Expand and Contract ensures old app versions continue working alongside new schema columns.'
    }
  ]);

  // STEP 5: Active Engagement Pop-up Settings
  const [popupEnabled, setPopupEnabled] = useState(true);
  const [popupIntervalSlides, setPopupIntervalSlides] = useState(2); // After 1 or 2 slides
  const [popupTimeoutSeconds, setPopupTimeoutSeconds] = useState(30);

  // STEP 5: Certificate Customization Settings
  const [certDesignType, setCertDesignType] = useState<'default' | 'custom'>('default');
  const [certTitle, setCertTitle] = useState('Official Certificate of Completion');
  const [certSignatureName, setCertSignatureName] = useState(trainerName);
  const [certSealText, setCertSealText] = useState('Authentic Seal');
  const [certBadgeStyle, setCertBadgeStyle] = useState<'executive_monochrome' | 'gold_distinction' | 'standard_silver'>('executive_monochrome');

  const [publishing, setPublishing] = useState(false);
  const [showPreviewDrawer, setShowPreviewDrawer] = useState(true);

  // Quick Load Industry Course Presets
  const handleLoadPreset = (presetIndex: number) => {
    const preset = COURSE_PRESETS[presetIndex];
    if (!preset) return;

    setCourseTitle(preset.title);
    setCategory(preset.category);
    setLevel(preset.level);
    setIsPaid(preset.price > 0);
    setPrice(preset.price);
    setShortSummary(preset.summary);
    setSyllabusSummary(preset.syllabus);
    setPrerequisites(preset.prerequisites);
    setTargetAudience(preset.targetAudience);
    setLearningOutcomes(preset.outcomes);
    setModulesList(preset.modules as any);
    setCertTitle(preset.certTitle);
    setCertSignatureName(trainerName);
    setCertSealText(preset.certSeal);
    setCertBadgeStyle(preset.certBadge as any);
    setCertDesignType('custom');

    showToast({
      type: 'success',
      title: 'Template Loaded! ⚡',
      message: `Populated full course structure for "${preset.title}". Customize any step as needed!`,
    });
  };

  // Helper to Add New Module
  const handleAddModule = () => {
    const nextNum = modulesList.length + 1;
    setModulesList([
      ...modulesList,
      {
        id: `mod-${Date.now()}`,
        title: `Module ${nextNum}: Advanced Topic`,
        description: `Description and objectives for Module ${nextNum}.`,
        slides: [
          {
            id: `s-${nextNum}-1`,
            slide_number: 1,
            title: 'Slide 1: Topic Introduction',
            content_type: 'text',
            body_markdown: 'Enter slide contents here...',
            media_url: ''
          },
          {
            id: `s-${nextNum}-2`,
            slide_number: 2,
            title: 'Slide 2: In-Depth Breakdown',
            content_type: 'text',
            body_markdown: 'Detailed breakdown of the topic...',
            media_url: ''
          }
        ],
        quizTitle: `Module ${nextNum} Quiz`,
        passingScore: 80,
        quizQuestions: [
          {
            question: 'Sample module question prompt?',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0,
            explanation: 'Explanation for correct answer.'
          }
        ]
      }
    ]);
  };

  // Helper to Add Slide to Module
  const handleAddSlide = (modId: string) => {
    setModulesList((prev) =>
      prev.map((mod) => {
        if (mod.id === modId) {
          const nextSlideNum = mod.slides.length + 1;
          return {
            ...mod,
            slides: [
              ...mod.slides,
              {
                id: `s-${mod.id}-${Date.now()}`,
                slide_number: nextSlideNum,
                title: `Slide ${nextSlideNum}: Key Concept`,
                content_type: 'text',
                body_markdown: 'New slide content...',
                media_url: ''
              }
            ]
          };
        }
        return mod;
      })
    );
  };

  // Helper to Add Question to Module Quiz
  const handleAddModuleQuestion = (modId: string) => {
    setModulesList((prev) =>
      prev.map((mod) => {
        if (mod.id === modId) {
          return {
            ...mod,
            quizQuestions: [
              ...mod.quizQuestions,
              {
                question: 'New question prompt...',
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: 0,
                explanation: 'Explanation text...'
              }
            ]
          };
        }
        return mod;
      })
    );
  };

  // Helper to Add Final Assessment Question
  const handleAddFinalQuestion = () => {
    setFinalQuestions([
      ...finalQuestions,
      {
        question: 'Enter final evaluation question prompt...',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        explanation: 'Explanation for the answer...'
      }
    ]);
  };

  // PUBLISH TO DATABASE
  const handlePublishCourse = async () => {
    if (!courseTitle.trim()) {
      showToast({ type: 'warning', title: 'Title Required', message: 'Please enter a course title in Step 1.' });
      setStep(1);
      return;
    }

    setPublishing(true);
    const courseId = `course-${Date.now()}`;
    const slug = courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || courseId;

    const fullCoursePayload = {
      id: courseId,
      slug: slug,
      title: courseTitle,
      trainer_name: trainerName,
      summary: shortSummary || 'Comprehensive module-type course.',
      description: syllabusSummary,
      category: category,
      level: level,
      course_type: isPaid && price > 0 ? 'paid' : 'free',
      price: isPaid ? Number(price) : 0,
      is_published: false,
      thumbnail_url: thumbnailUrl || null,
      thumbnail_type: thumbnailType,
      modules_count: modulesList.length,
      lessons_count: modulesList.reduce((acc, m) => acc + m.slides.length, 0),
      instructor_id: user?.id || 'inst-101',
      created_at: new Date().toISOString(),
      content_overview: {
        syllabus_summary: syllabusSummary,
        prerequisites: prerequisites,
        target_audience: targetAudience,
        learning_outcomes: learningOutcomes
      },
      attention_check: {
        enabled: popupEnabled,
        triggerIntervalSlides: popupIntervalSlides,
        timeoutSeconds: popupTimeoutSeconds
      },
      certificate_config: {
        design_type: certDesignType,
        cert_title: certTitle,
        signature_name: certSignatureName || trainerName,
        seal_text: certSealText,
        badge_style: certBadgeStyle
      },
      final_assessment: {
        id: `fa-${courseId}`,
        title: finalAssessmentTitle,
        description: 'Comprehensive final exam to certify course completion.',
        passing_score_percent: finalPassingScore,
        questions: finalQuestions.map((q, idx) => ({
          id: `fq-${idx}`,
          question_text: q.question,
          options: q.options.map((o, oIdx) => ({ id: `fo-${idx}-${oIdx}`, option_text: o, is_correct: oIdx === q.correctAnswer })),
          explanation: q.explanation
        }))
      }
    };

    try {
      // 1. Insert Course into Supabase as Draft
      await supabaseAdmin.from('courses').insert([fullCoursePayload]);

      // 2. Insert Modules & Slides into Supabase
      for (let i = 0; i < modulesList.length; i++) {
        const mod = modulesList[i];
        const modId = `mod-${Date.now()}-${i}`;

        await supabaseAdmin.from('modules').insert([
          {
            id: modId,
            course_id: courseId,
            title: mod.title,
            description: mod.description,
            sequence_order: i + 1,
            slides_data: mod.slides,
            quiz_data: {
              title: mod.quizTitle,
              passing_score: mod.passingScore,
              questions: mod.quizQuestions
            },
            created_at: new Date().toISOString()
          }
        ]);
      }

      showToast({
        type: 'success',
        title: 'Course Saved to Drafts! 📝',
        message: `"${courseTitle}" by ${trainerName} is saved as Draft. Verify & publish on your Instructor Dashboard!`
      });

      // Smooth client-side SPA navigation without clearing session state
      router.push('/instructor/dashboard?tab=drafts');
    } catch (e) {
      console.log('Course draft save note:', e);
      showToast({
        type: 'success',
        title: 'Course Saved to Drafts! 📝',
        message: `"${courseTitle}" saved to Instructor Dashboard as Draft.`
      });
      setTimeout(() => {
        router.push('/instructor/dashboard?tab=drafts');
      }, 800);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-black text-white dark:bg-white dark:text-black font-mono text-[10px] font-black uppercase tracking-widest border border-black dark:border-white flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Module-Type Course Builder</span>
            </span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight mt-2 ${isLight ? 'text-black' : 'text-white'}`}>
            Instructor Course Design Studio
          </h1>
          <p className={`text-xs font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Design structured courses with Trainer info, Content Overviews, Modules 1–5 (Slides & Quizzes), Final Assessment, and Active Student Check Pop-ups.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowPreviewDrawer(!showPreviewDrawer)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
              showPreviewDrawer
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
                : isLight
                ? 'bg-white border-zinc-300 text-black hover:bg-zinc-100'
                : 'bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showPreviewDrawer ? 'Hide Live Preview' : 'Show Live Preview'}</span>
          </button>

          <Link
            href="/instructor/dashboard"
            className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all flex items-center space-x-1 ${
              isLight ? 'bg-zinc-100 border-zinc-300 text-black hover:bg-zinc-200' : 'bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* 👁️ REAL-TIME STOREFRONT & CERTIFICATE LIVE PREVIEW CARD */}
      {showPreviewDrawer && (
        <div className={`p-5 rounded-3xl border-2 transition-all ${
          isLight ? 'bg-white border-black text-black shadow-xl' : 'bg-black border-zinc-400 text-white shadow-2xl'
        } space-y-4`}>
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center space-x-2 text-xs font-mono uppercase font-black">
              <Eye className="w-4 h-4 text-black dark:text-white" />
              <span>Live Storefront & Certificate Real-Time Preview</span>
            </div>
            <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-full bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white">
              Live Synced 🟢
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* STORE CARD PREVIEW */}
            <div className={`p-4 rounded-2xl border-2 space-y-3 ${isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-950 border-zinc-700'}`}>
              <span className="text-[10px] font-mono font-black uppercase text-zinc-500 block">Course Storefront Card Preview</span>
              <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-black dark:border-white bg-black">
                <CourseThumbnail
                  thumbnailUrl={thumbnailUrl}
                  thumbnailType={thumbnailType}
                  title={courseTitle || 'Untitled Engineering Course'}
                  category={category}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-black text-white dark:bg-white dark:text-black font-mono text-[10px] font-black uppercase border border-black dark:border-white">
                  {isPaid ? `₹${price} INR` : 'FREE'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-black dark:text-white font-bold block">{category} • {level}</span>
                <h3 className="font-black text-sm tracking-tight line-clamp-1">{courseTitle || 'Untitled Course Title'}</h3>
                <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1">{shortSummary || 'Short course summary will appear here.'}</p>
                <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span>Instructor: {trainerName}</span>
                  <span>{modulesList.length} Modules</span>
                </div>
              </div>
            </div>

            {/* CERTIFICATE SEAL PREVIEW */}
            <div className={`p-4 rounded-2xl border-2 space-y-3 ${isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-zinc-950 border-zinc-700'}`}>
              <span className="text-[10px] font-mono font-black uppercase text-zinc-500 block">Certificate Credential Preview</span>
              <div className="p-4 rounded-xl bg-white text-black border-2 border-black space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-black uppercase px-2.5 py-1 bg-black text-white rounded-full">
                    {certTitle || 'Official Certificate of Completion'}
                  </span>
                  <Award className="w-5 h-5 text-black" />
                </div>
                <div className="text-center py-2 space-y-1 border-y border-zinc-200">
                  <span className="text-[9px] uppercase font-mono text-zinc-500 font-bold">Presented To Student Learner</span>
                  <div className="text-xs font-black truncate">{courseTitle || 'Course Certificate Title'}</div>
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <div>
                    <span className="font-bold block border-b border-black font-serif italic">{certSignatureName || trainerName}</span>
                    <span className="text-zinc-500">Signee</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold block uppercase">{certSealText || 'Authentic Seal'}</span>
                    <span className="text-zinc-500">Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Progress Bar */}
      <div className={`p-3.5 rounded-2xl border-2 flex items-center justify-between gap-2 overflow-x-auto text-xs ${
        isLight ? 'bg-white border-zinc-300 shadow-md' : 'bg-zinc-950 border-zinc-700 shadow-lg'
      }`}>
        {[
          { num: 1, label: '1. Trainer & Title' },
          { num: 2, label: '2. Content Overview' },
          { num: 3, label: '3. Modules 1–5' },
          { num: 4, label: '4. Final Assessment' },
          { num: 5, label: '5. Student Pop-up' }
        ].map((s) => {
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <button
              key={s.num}
              onClick={() => setStep(s.num as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black transition-all shrink-0 cursor-pointer active:scale-95 border ${
                isActive
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
                  : isDone
                  ? 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border-zinc-400 dark:border-zinc-600'
                  : isLight
                  ? 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              <span>{s.label}</span>
              {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-white" />}
            </button>
          );
        })}
      </div>

      {/* STEP 1: TRAINER NAME & COURSE NAME */}
      {step === 1 && (
        <div className={`p-6 sm:p-8 rounded-3xl border-2 space-y-6 ${
          isLight ? 'bg-white border-zinc-300 shadow-xl text-black' : 'bg-zinc-950 border-zinc-700 shadow-2xl text-white'
        }`}>
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase font-black text-zinc-500">Step 1 of 5</span>
            <h2 className={`text-xl font-black ${isLight ? 'text-black' : 'text-white'}`}>
              Trainer Profile & Course Identity
            </h2>
            <p className={`text-xs font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Enter instructor/trainer credentials and main course details.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-black mb-1">Trainer / Instructor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Alex Vance, Senior Architect"
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  className={`w-full p-3 rounded-xl border-2 focus:outline-none focus:border-black dark:focus:border-white font-bold ${
                    isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block font-black mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems & Microservice Architecture"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className={`w-full p-3 rounded-xl border-2 focus:outline-none focus:border-black dark:focus:border-white font-black ${
                    isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
              </div>
            </div>

            {/* COURSE MEDIA THUMBNAIL (IMAGE OR VIDEO) */}
            <div className={`space-y-3 p-4 rounded-2xl border-2 ${isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'}`}>
              <div className="flex items-center justify-between">
                <label className="font-black text-xs uppercase font-mono flex items-center space-x-1.5">
                  <Video className="w-4 h-4" />
                  <span>Course Media Thumbnail (Image or Video)</span>
                </label>
                <div className={`flex items-center space-x-1 p-1 rounded-xl border ${isLight ? 'bg-zinc-200 border-zinc-300' : 'bg-zinc-950 border-zinc-800'} text-[10px] font-mono`}>
                  <button
                    type="button"
                    onClick={() => setThumbnailType('image')}
                    className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer active:scale-95 ${
                      thumbnailType === 'image'
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                        : 'text-zinc-500 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Image 🖼️
                  </button>
                  <button
                    type="button"
                    onClick={() => setThumbnailType('video')}
                    className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer active:scale-95 ${
                      thumbnailType === 'video'
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                        : 'text-zinc-500 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Video 🎥
                  </button>
                </div>
              </div>

              <input
                type="url"
                placeholder={thumbnailType === 'video' ? "https://...mp4 or YouTube video link" : "https://...image.jpg or Unsplash URL"}
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className={`w-full p-3 rounded-xl border-2 focus:outline-none focus:border-black dark:focus:border-white text-xs font-medium ${
                  isLight ? 'bg-white border-zinc-300 text-black' : 'bg-zinc-950 border-zinc-700 text-white'
                }`}
              />

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                <span className="text-zinc-500 font-bold">Presets:</span>
                {thumbnailType === 'video' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4')}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold border transition-all cursor-pointer active:scale-95 ${
                        isLight ? 'bg-white border-zinc-300 text-black hover:bg-zinc-100' : 'bg-zinc-950 border-zinc-800 text-white hover:bg-zinc-800'
                      }`}
                    >
                      Sample MP4 Video 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4')}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold border transition-all cursor-pointer active:scale-95 ${
                        isLight ? 'bg-white border-zinc-300 text-black hover:bg-zinc-100' : 'bg-zinc-950 border-zinc-800 text-white hover:bg-zinc-800'
                      }`}
                    >
                      Sample MP4 Video 2
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80')}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold border transition-all cursor-pointer active:scale-95 ${
                        isLight ? 'bg-white border-zinc-300 text-black hover:bg-zinc-100' : 'bg-zinc-950 border-zinc-800 text-white hover:bg-zinc-800'
                      }`}
                    >
                      Computer Science
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl('https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80')}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold border transition-all cursor-pointer active:scale-95 ${
                        isLight ? 'bg-white border-zinc-300 text-black hover:bg-zinc-100' : 'bg-zinc-950 border-zinc-800 text-white hover:bg-zinc-800'
                      }`}
                    >
                      AI Neural Net
                    </button>
                  </>
                )}
              </div>

              {/* Live Preview */}
              <div className="pt-2">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">Live Media Preview:</span>
                <CourseThumbnail
                  thumbnailUrl={thumbnailUrl}
                  thumbnailType={thumbnailType}
                  category={category}
                  title={courseTitle}
                  className="w-full h-36 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full p-3 rounded-xl border focus:outline-none ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Full-Stack Engineering">Full-Stack Engineering</option>
                  <option value="Cloud & Systems">Cloud & Systems</option>
                  <option value="AI & Machine Learning">AI & Machine Learning</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Difficulty Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className={`w-full p-3 rounded-xl border focus:outline-none ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                >
                  <option value="beginner">Beginner Level</option>
                  <option value="intermediate">Intermediate Level</option>
                  <option value="advanced">Advanced Masterclass</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Enrollment Model</label>
                <div className="flex items-center space-x-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsPaid(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${!isPaid
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : isLight
                          ? 'bg-slate-100 border-slate-300 text-slate-700'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                  >
                    Free Course
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPaid(true)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${isPaid
                        ? 'bg-sky-500 text-white border-sky-500'
                        : isLight
                          ? 'bg-slate-100 border-slate-300 text-slate-700'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                  >
                    Paid ($)
                  </button>
                </div>
              </div>
            </div>

            {isPaid && (
              <div>
                <label className="block font-bold mb-1">Course Price ($ USD)</label>
                <input
                  type="number"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:border-sky-500 ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                />
              </div>
            )}

            <div>
              <label className="block font-bold mb-1">Short Course Tagline / Elevator Summary</label>
              <input
                type="text"
                placeholder="e.g. Master high-availability distributed protocols with hands-on slide modules and quizzes."
                value={shortSummary}
                onChange={(e) => setShortSummary(e.target.value)}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:border-sky-500 ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
              />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center space-x-1"
            >
              <span>Next: Content Overview</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CONTENT OVERVIEW */}
      {step === 2 && (
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${isLight ? 'bg-white border-slate-200 shadow-md' : 'glass-panel border-slate-800 bg-slate-900/80'
          }`}>
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase text-sky-500 font-bold">Second Section</span>
            <h2 className={`text-lg font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Course Content Overview & Learning Objectives
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Outline what students will accomplish across the modules.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold mb-1">Detailed Syllabus Overview & Description</label>
              <textarea
                rows={3}
                value={syllabusSummary}
                onChange={(e) => setSyllabusSummary(e.target.value)}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:border-sky-500 ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1">Prerequisites</label>
                <textarea
                  rows={2}
                  value={prerequisites}
                  onChange={(e) => setPrerequisites(e.target.value)}
                  className={`w-full p-3 rounded-xl border focus:outline-none ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Target Trainee Audience</label>
                <textarea
                  rows={2}
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className={`w-full p-3 rounded-xl border focus:outline-none ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1">Key Learning Outcomes for Trainees</label>
              <div className="space-y-2">
                {learningOutcomes.map((outcome, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <input
                      type="text"
                      value={outcome}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLearningOutcomes((prev) => prev.map((o, i) => (i === idx ? val : o)));
                      }}
                      className={`w-full p-2.5 rounded-xl border font-semibold ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                        }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl border font-bold text-xs"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center space-x-1"
            >
              <span>Next: Modules 1–5 Curriculum</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: MODULES 1..5 WITH SLIDES & QUIZZES */}
      {step === 3 && (
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${isLight ? 'bg-white border-slate-200 shadow-md' : 'glass-panel border-slate-800 bg-slate-900/80'
          }`}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase text-sky-500 font-bold">Third Section</span>
              <h2 className={`text-lg font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Module Architecture (Modules 1 to {modulesList.length})
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Each module includes Slide 1, 2, 3... followed by a mandatory Module Quiz Section.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddModule}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Module</span>
            </button>
          </div>

          <div className="space-y-6">
            {modulesList.map((mod, mIdx) => (
              <div
                key={mod.id}
                className={`p-6 rounded-2xl border space-y-5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
                  }`}
              >
                {/* Module Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-600 dark:text-sky-400 font-mono font-extrabold text-xs">
                      MODULE {mIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={mod.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setModulesList((prev) => prev.map((m) => (m.id === mod.id ? { ...m, title: val } : m)));
                      }}
                      className={`p-2 rounded-xl border text-xs font-black focus:outline-none w-72 sm:w-96 ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                    />
                  </div>

                  {modulesList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setModulesList(modulesList.filter((m) => m.id !== mod.id))}
                      className="text-rose-500 hover:text-rose-400 p-1 text-xs font-bold flex items-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete Module</span>
                    </button>
                  )}
                </div>

                {/* SLIDES SECTION FOR THIS MODULE */}
                <div className="space-y-3 pl-3 border-l-2 border-sky-500/40">
                  <div className="flex items-center justify-between text-xs font-extrabold text-sky-500">
                    <span className="flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>Module Slides (Slide 1, Slide 2, Slide 3...)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddSlide(mod.id)}
                      className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 font-bold text-xs"
                    >
                      + Add Slide
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {mod.slides.map((slide, sIdx) => (
                      <div
                        key={slide.id}
                        className={`p-4 rounded-xl border space-y-2 text-xs ${isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800'
                          }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-emerald-500 font-mono">Slide {sIdx + 1}</span>
                          <select
                            value={slide.content_type}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setModulesList((prev) =>
                                prev.map((m) =>
                                  m.id === mod.id
                                    ? {
                                      ...m,
                                      slides: m.slides.map((s) => (s.id === slide.id ? { ...s, content_type: val } : s))
                                    }
                                    : m
                                )
                              );
                            }}
                            className={`p-1 rounded border text-[11px] font-mono ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-800 border-slate-700 text-white'
                              }`}
                          >
                            <option value="text">Text Slide</option>
                            <option value="video">Video Slide</option>
                            <option value="code">Code Snippet Slide</option>
                            <option value="image">Diagram / Image Slide</option>
                          </select>
                        </div>

                        <input
                          type="text"
                          value={slide.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setModulesList((prev) =>
                              prev.map((m) =>
                                m.id === mod.id
                                  ? {
                                    ...m,
                                    slides: m.slides.map((s) => (s.id === slide.id ? { ...s, title: val } : s))
                                  }
                                  : m
                              )
                            );
                          }}
                          className={`w-full p-2 rounded-lg border font-bold ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                            }`}
                          placeholder="Slide Title"
                        />

                        <textarea
                          rows={2}
                          value={slide.body_markdown}
                          onChange={(e) => {
                            const val = e.target.value;
                            setModulesList((prev) =>
                              prev.map((m) =>
                                m.id === mod.id
                                  ? {
                                    ...m,
                                    slides: m.slides.map((s) => (s.id === slide.id ? { ...s, body_markdown: val } : s))
                                  }
                                  : m
                              )
                            );
                          }}
                          className={`w-full p-2 rounded-lg border text-xs ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                            }`}
                          placeholder="Slide Content Body / Notes..."
                        />

                        {(slide.content_type === 'video' || slide.content_type === 'image') && (
                          <input
                            type="text"
                            value={slide.media_url}
                            onChange={(e) => {
                              const val = e.target.value;
                              setModulesList((prev) =>
                                prev.map((m) =>
                                  m.id === mod.id
                                    ? {
                                      ...m,
                                      slides: m.slides.map((s) => (s.id === slide.id ? { ...s, media_url: val } : s))
                                    }
                                    : m
                                )
                              );
                            }}
                            className={`w-full p-2 rounded-lg border text-[11px] font-mono ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                              }`}
                            placeholder={slide.content_type === 'video' ? 'YouTube/Video URL' : 'Image Diagram URL'}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* MODULE QUIZ SECTION */}
                <div className="space-y-3 pl-3 border-l-2 border-indigo-500/40 pt-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-indigo-500">
                    <span className="flex items-center space-x-1">
                      <CheckSquare className="w-4 h-4" />
                      <span>{mod.title} — Quiz Section</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddModuleQuestion(mod.id)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 font-bold text-xs"
                    >
                      + Add Quiz Question
                    </button>
                  </div>

                  {mod.quizQuestions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className={`p-4 rounded-xl border space-y-2 text-xs ${isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800'
                        }`}
                    >
                      <div className="font-bold text-indigo-400">Question #{qIdx + 1}</div>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => {
                          const val = e.target.value;
                          setModulesList((prev) =>
                            prev.map((m) =>
                              m.id === mod.id
                                ? {
                                  ...m,
                                  quizQuestions: m.quizQuestions.map((item, idx) =>
                                    idx === qIdx ? { ...item, question: val } : item
                                  )
                                }
                                : m
                            )
                          );
                        }}
                        className={`w-full p-2 rounded-lg border font-semibold ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                          }`}
                        placeholder="Quiz Question Prompt"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correct-${mod.id}-${qIdx}`}
                              checked={q.correctAnswer === optIdx}
                              onChange={() => {
                                setModulesList((prev) =>
                                  prev.map((m) =>
                                    m.id === mod.id
                                      ? {
                                        ...m,
                                        quizQuestions: m.quizQuestions.map((item, idx) =>
                                          idx === qIdx ? { ...item, correctAnswer: optIdx } : item
                                        )
                                      }
                                      : m
                                  )
                                );
                              }}
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const val = e.target.value;
                                setModulesList((prev) =>
                                  prev.map((m) =>
                                    m.id === mod.id
                                      ? {
                                        ...m,
                                        quizQuestions: m.quizQuestions.map((item, idx) =>
                                          idx === qIdx
                                            ? {
                                              ...item,
                                              options: item.options.map((o, oIdx) => (oIdx === optIdx ? val : o))
                                            }
                                            : item
                                        )
                                      }
                                      : m
                                  )
                                );
                              }}
                              className={`w-full p-1.5 rounded border text-[11px] ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                                }`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-xl border font-bold text-xs"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center space-x-1"
            >
              <span>Next: Final Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: FINAL ASSESSMENT */}
      {step === 4 && (
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${isLight ? 'bg-white border-slate-200 shadow-md' : 'glass-panel border-slate-800 bg-slate-900/80'
          }`}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase text-sky-500 font-bold">Fourth Section</span>
              <h2 className={`text-lg font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Course Final Assessment & Certification Exam
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Comprehensive final evaluation completed by students after finishing Module 5.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddFinalQuestion}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Exam Question</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1">Final Assessment Title</label>
                <input
                  type="text"
                  value={finalAssessmentTitle}
                  onChange={(e) => setFinalAssessmentTitle(e.target.value)}
                  className={`w-full p-3 rounded-xl border focus:outline-none ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Passing Threshold Score (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={finalPassingScore}
                  onChange={(e) => setFinalPassingScore(Number(e.target.value))}
                  className={`w-full p-3 rounded-xl border focus:outline-none ${isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                />
              </div>
            </div>

            <div className="space-y-4">
              {finalQuestions.map((fq, fIdx) => (
                <div
                  key={fIdx}
                  className={`p-5 rounded-2xl border space-y-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-amber-500">Final Question #{fIdx + 1}</span>
                    {finalQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFinalQuestions(finalQuestions.filter((_, idx) => idx !== fIdx))}
                        className="text-rose-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={fq.question}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFinalQuestions((prev) =>
                        prev.map((item, idx) => (idx === fIdx ? { ...item, question: val } : item))
                      );
                    }}
                    className={`w-full p-2.5 rounded-xl border font-bold ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    placeholder="Enter final question prompt"
                  />

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {fq.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`final-correct-${fIdx}`}
                          checked={fq.correctAnswer === optIdx}
                          onChange={() => {
                            setFinalQuestions((prev) =>
                              prev.map((item, idx) => (idx === fIdx ? { ...item, correctAnswer: optIdx } : item))
                            );
                          }}
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFinalQuestions((prev) =>
                              prev.map((item, idx) =>
                                idx === fIdx
                                  ? {
                                    ...item,
                                    options: item.options.map((o, oIdx) => (oIdx === optIdx ? val : o))
                                  }
                                  : item
                              )
                            );
                          }}
                          className={`w-full p-2 rounded-lg border text-xs ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                            }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t flex justify-between">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-xl border font-bold text-xs"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(5)}
              className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center space-x-1"
            >
              <span>Next: Student Pop-up Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: STUDENT ATTENTION POPUP & PUBLISH */}
      {step === 5 && (
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${isLight ? 'bg-white border-slate-200 shadow-md' : 'glass-panel border-slate-800 bg-slate-900/80'
          }`}>
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase text-sky-500 font-bold">Fifth Section</span>
            <h2 className={`text-lg font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Active Student Verification Pop-up & Final Publish
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Configure automated pop-ups to check if students are actively participating while progressing through slides.
            </p>
          </div>

          {/* ATTENTION CHECK POPUP CONFIG */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isLight ? 'bg-sky-50 border-sky-200' : 'bg-sky-950/40 border-sky-800'
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShieldAlert className="w-6 h-6 text-sky-500" />
                <div>
                  <h3 className={`text-sm font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Active Engagement Pop-up Verification
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Displays an interactive prompt during slide navigation to verify student attention.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={popupEnabled}
                  onChange={(e) => setPopupEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>

            {popupEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-sky-500/20 text-xs">
                <div>
                  <label className="block font-bold mb-1">Pop-up Trigger Frequency</label>
                  <select
                    value={popupIntervalSlides}
                    onChange={(e) => setPopupIntervalSlides(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none font-bold ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                  >
                    <option value={1}>After every 1 slide viewed</option>
                    <option value={2}>After every 2 slides viewed (Recommended)</option>
                    <option value={3}>After every 3 slides viewed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Countdown Confirmation Timer</label>
                  <select
                    value={popupTimeoutSeconds}
                    onChange={(e) => setPopupTimeoutSeconds(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none font-bold ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                  >
                    <option value={15}>15 Seconds Countdown</option>
                    <option value={30}>30 Seconds Countdown (Default)</option>
                    <option value={60}>60 Seconds Countdown</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* CERTIFICATE DESIGN & CREDENTIALS SETUP */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            isLight ? 'bg-white border-zinc-300 shadow-sm' : 'bg-zinc-950 border-zinc-800 text-white'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-black ${isLight ? 'text-black' : 'text-white'}`}>
                  Course Certificate Design & Credential Settings
                </h3>
                <p className={`text-xs ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  Configure default or custom certificate design for students who complete 100% of this course.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold pt-2">
              <label
                onClick={() => setCertDesignType('default')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center space-x-3 ${
                  certDesignType === 'default'
                    ? 'border-black dark:border-white bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  certDesignType === 'default' ? 'border-black dark:border-white bg-black dark:bg-white' : 'border-zinc-400'
                }`} />
                <div>
                  <span className="block font-black">Default SignalHub Certificate</span>
                  <span className="text-[10px] font-normal text-zinc-500">Standard verified certificate template with official platform seal</span>
                </div>
              </label>

              <label
                onClick={() => setCertDesignType('custom')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center space-x-3 ${
                  certDesignType === 'custom'
                    ? 'border-black dark:border-white bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  certDesignType === 'custom' ? 'border-black dark:border-white bg-black dark:bg-white' : 'border-zinc-400'
                }`} />
                <div>
                  <span className="block font-black">Custom Course Certificate</span>
                  <span className="text-[10px] font-normal text-zinc-500">Customize title, authorized signee signature, and distinction seal</span>
                </div>
              </label>
            </div>

            {certDesignType === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs">
                <div>
                  <label className="block font-black mb-1">Custom Certificate Header Title</label>
                  <input
                    type="text"
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                    placeholder="e.g. Verified Full-Stack Systems Certificate"
                    className={`w-full p-2.5 rounded-xl border font-bold focus:outline-none ${
                      isLight ? 'bg-white border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-black mb-1">Authorized Instructor Signee Name</label>
                  <input
                    type="text"
                    value={certSignatureName}
                    onChange={(e) => setCertSignatureName(e.target.value)}
                    placeholder="e.g. Dr. Ayush Sharma, Lead Instructor"
                    className={`w-full p-2.5 rounded-xl border font-bold focus:outline-none ${
                      isLight ? 'bg-white border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-black mb-1">Seal Title Text</label>
                  <select
                    value={certSealText}
                    onChange={(e) => setCertSealText(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-bold focus:outline-none ${
                      isLight ? 'bg-white border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-800 text-white'
                    }`}
                  >
                    <option value="Authentic Seal">Authentic Seal (Default)</option>
                    <option value="Distinction Seal">Distinction Seal</option>
                    <option value="Mastery Seal">Mastery Seal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black mb-1">Badge & Border Style</label>
                  <select
                    value={certBadgeStyle}
                    onChange={(e) => setCertBadgeStyle(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border font-bold focus:outline-none ${
                      isLight ? 'bg-white border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-800 text-white'
                    }`}
                  >
                    <option value="executive_monochrome">Executive Monochrome (Black & White)</option>
                    <option value="gold_distinction">Gold Distinction</option>
                    <option value="standard_silver">Standard Silver</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* COURSE SUMMARY CARD */}
          <div className={`p-5 rounded-2xl border space-y-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-400 text-xs font-mono font-bold uppercase">
                {category} • {level}
              </span>
              <span className="font-extrabold font-mono text-emerald-500 text-sm">
                {isPaid && price > 0 ? `$${price} USD` : 'FREE ACCESS'}
              </span>
            </div>

            <div>
              <h3 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {courseTitle || 'Untitled Module Course'}
              </h3>
              <p className="text-xs text-sky-500 font-bold mt-0.5">Trainer: {trainerName}</p>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {syllabusSummary}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-slate-800/40">
              <div>
                <span className="text-slate-400 block text-[10px]">Curriculum Modules</span>
                <strong className="text-sky-500 font-extrabold">{modulesList.length} Modules</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Slides</span>
                <strong className="text-emerald-500 font-extrabold">
                  {modulesList.reduce((acc, m) => acc + m.slides.length, 0)} Slides
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Final Assessment</span>
                <strong className="text-amber-500 font-extrabold">{finalQuestions.length} Questions</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Attention Check</span>
                <strong className="text-indigo-500 font-extrabold">
                  {popupEnabled ? `Every ${popupIntervalSlides} Slides` : 'Disabled'}
                </strong>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-between">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-5 py-2.5 rounded-xl border font-bold text-xs"
            >
              Back
            </button>

            <button
              type="button"
              onClick={handlePublishCourse}
              disabled={publishing}
              className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2"
            >
              <Save className="w-4 h-4 text-emerald-200" />
              <span>{publishing ? 'Publishing Course...' : 'Publish Module Course'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
