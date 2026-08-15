import { Course, Quiz } from '@signalhub/types';

export const INITIAL_DEMO_COURSE: Course = {
  id: 'c3333333-3333-3333-3333-333333333333',
  instructor_id: 'a1111111-1111-1111-1111-111111111111',
  trainer_name: 'Dr. Alex Vance, Senior Architect',
  title: 'Distributed Systems & Cloud Architecture (Module Masterclass)',
  slug: 'distributed-systems-masterclass',
  summary: 'Comprehensive 5-module training program featuring interactive slide decks, module quizzes, final assessment, and active engagement checks.',
  description: 'Master high-performance distributed protocols, microservice resiliency patterns, and production cloud infrastructure.',
  category: 'Computer Science',
  level: 'intermediate',
  default_language: 'en',
  course_type: 'paid',
  price: 49,
  currency: 'USD',
  is_published: true,
  published_at: '2026-08-14T00:00:00Z',
  created_at: '2026-08-14T00:00:00Z',
  updated_at: '2026-08-14T00:00:00Z',
  content_overview: {
    syllabus_summary: 'Comprehensive 5-Module curriculum covering system protocols, data pipelines, resiliency patterns, security, and cloud observability.',
    prerequisites: 'Basic programming background in TypeScript/Python and foundational data structures.',
    target_audience: 'Software engineers, computer science students, and system architects.',
    learning_outcomes: [
      'Master client-server synchronization protocols across distributed nodes.',
      'Implement zero-copy data pipelines with low-latency buffering.',
      'Apply circuit breaker state machines to prevent cascading failures.',
      'Pass all module quizzes and final evaluation to receive verified certification.'
    ]
  },
  attention_check: {
    enabled: true,
    triggerIntervalSlides: 2, // Pop up modal after every 2 slides
    timeoutSeconds: 30
  },
  final_assessment: {
    id: 'fa-demo-1',
    title: 'Mastery Certification Final Assessment',
    description: 'Comprehensive exam covering all 5 course modules.',
    passing_score_percent: 85,
    questions: [
      {
        id: 'fq-1',
        bank_id: 'bank-1',
        question_text: 'Which architectural combination guarantees resilient, high-throughput microservices?',
        question_type: 'single_choice',
        difficulty: 'medium',
        default_language: 'en',
        explanation: 'Combining Circuit Breaker, Rate Limiter, and Async Queue isolates failure states while allowing burst scale.',
        options: [
          { id: 'fo-1', question_id: 'fq-1', option_text: 'Circuit Breaker + Rate Limiting + Async Event Queue', is_correct: true, sequence_order: 1 },
          { id: 'fo-2', question_id: 'fq-1', option_text: 'Monolithic Blocking Synchronous Calls', is_correct: false, sequence_order: 2 },
          { id: 'fo-3', question_id: 'fq-1', option_text: 'Single-Threaded Memory Arrays', is_correct: false, sequence_order: 3 }
        ]
      },
      {
        id: 'fq-2',
        bank_id: 'bank-1',
        question_text: 'What is the primary benefit of Canary deployments?',
        question_type: 'single_choice',
        difficulty: 'medium',
        default_language: 'en',
        explanation: 'Canary deployment routes a small percentage of live traffic to verify stability before broad release.',
        options: [
          { id: 'fo-4', question_id: 'fq-2', option_text: 'Exposing a small fraction of live traffic to test stability', is_correct: true, sequence_order: 1 },
          { id: 'fo-5', question_id: 'fq-2', option_text: 'Replacing all servers simultaneously during peak hours', is_correct: false, sequence_order: 2 }
        ]
      }
    ]
  },
  instructor: {
    id: 'a1111111-1111-1111-1111-111111111111',
    email: 'instructor@signalhub.app',
    full_name: 'Dr. Alex Vance',
    role: 'instructor',
    preferred_language: 'en',
    bio: 'Senior Systems Architect and Engineering Lead.',
    created_at: '2026-08-14T00:00:00Z',
    updated_at: '2026-08-14T00:00:00Z'
  },
  modules: [
    {
      id: 'm-1',
      course_id: 'c3333333-3333-3333-3333-333333333333',
      title: 'Module 1: Architecture Foundations & Protocol Basics',
      description: 'Introduction to foundational protocol concepts and system topologies.',
      sequence_order: 1,
      is_free_preview: true,
      created_at: '2026-08-14T00:00:00Z',
      updated_at: '2026-08-14T00:00:00Z',
      slides: [
        {
          id: 's-1-1',
          slide_number: 1,
          title: 'Slide 1: System Protocol Overview',
          content_type: 'text',
          body_markdown: 'Welcome to Module 1! In this slide, we explore state synchronization across distributed network nodes.'
        },
        {
          id: 's-1-2',
          slide_number: 2,
          title: 'Slide 2: Client-Server Execution Flow',
          content_type: 'image',
          body_markdown: 'Visual breakdown of load balancer node routing and stateless application nodes.',
          media_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80'
        },
        {
          id: 's-1-3',
          slide_number: 3,
          title: 'Slide 3: Video Demonstration of Execution Pipeline',
          content_type: 'video',
          body_markdown: 'Technical video walk-through demonstrating network packet serialization.',
          media_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        }
      ],
      quiz: {
        id: 'q-m1',
        module_id: 'm-1',
        title: 'Module 1 Assessment Quiz',
        quiz_type: 'module_quiz',
        passing_score_percent: 80,
        total_questions_to_select: 1,
        max_attempts: 3,
        is_randomized: false,
        created_at: '2026-08-14T00:00:00Z',
        updated_at: '2026-08-14T00:00:00Z'
      }
    },
    {
      id: 'm-2',
      course_id: 'c3333333-3333-3333-3333-333333333333',
      title: 'Module 2: High-Performance Data Pipeline Implementation',
      description: 'Building asynchronous pipelines and optimizing memory allocations.',
      sequence_order: 2,
      is_free_preview: false,
      created_at: '2026-08-14T00:00:00Z',
      updated_at: '2026-08-14T00:00:00Z',
      slides: [
        {
          id: 's-2-1',
          slide_number: 1,
          title: 'Slide 1: Zero-Copy Buffers & Queue Workers',
          content_type: 'text',
          body_markdown: 'Zero-copy operations drastically cut CPU overhead by bypassing redundant memory copying.'
        },
        {
          id: 's-2-2',
          slide_number: 2,
          title: 'Slide 2: Pipeline Code Snippet',
          content_type: 'code',
          code_snippet: 'async function processStream(buffer) {\n  return await dispatchWorker(buffer);\n}'
        }
      ]
    },
    {
      id: 'm-3',
      course_id: 'c3333333-3333-3333-3333-333333333333',
      title: 'Module 3: Fault Tolerance & Resiliency Patterns',
      description: 'Circuit breakers, exponential backoff, and fallback mechanisms.',
      sequence_order: 3,
      is_free_preview: false,
      created_at: '2026-08-14T00:00:00Z',
      updated_at: '2026-08-14T00:00:00Z',
      slides: [
        {
          id: 's-3-1',
          slide_number: 1,
          title: 'Slide 1: Circuit Breaker State Transitions',
          content_type: 'text',
          body_markdown: 'Understanding Closed, Open, and Half-Open failure management states.'
        }
      ]
    },
    {
      id: 'm-4',
      course_id: 'c3333333-3333-3333-3333-333333333333',
      title: 'Module 4: Security, Authentication & Rate Limiting',
      description: 'Token buckets, JWT rotation, and network perimeter security.',
      sequence_order: 4,
      is_free_preview: false,
      created_at: '2026-08-14T00:00:00Z',
      updated_at: '2026-08-14T00:00:00Z',
      slides: [
        {
          id: 's-4-1',
          slide_number: 1,
          title: 'Slide 1: Token Bucket Rate Limiter',
          content_type: 'text',
          body_markdown: 'Limiting request bursts while keeping steady traffic throughput.'
        }
      ]
    },
    {
      id: 'm-5',
      course_id: 'c3333333-3333-3333-3333-333333333333',
      title: 'Module 5: Production Deployment & Observability',
      description: 'Metrics, tracing, log aggregation, and zero-downtime releases.',
      sequence_order: 5,
      is_free_preview: false,
      created_at: '2026-08-14T00:00:00Z',
      updated_at: '2026-08-14T00:00:00Z',
      slides: [
        {
          id: 's-5-1',
          slide_number: 1,
          title: 'Slide 1: OpenTelemetry Pillars (Logs, Metrics, Traces)',
          content_type: 'text',
          body_markdown: 'Setting up observability collectors and automated alert triggers.'
        }
      ]
    }
  ]
};

export const DEMO_QUIZ_DATA: Record<string, {
  quiz: Quiz;
  questions: Array<{
    questionId: string;
    questionText: string;
    explanation: string;
    options: Array<{ optionId: string; optionText: string; isCorrect: boolean }>;
  }>;
}> = {
  '1c111111-1111-1111-1111-111111111111': {
    quiz: {
      id: '1c111111-1111-1111-1111-111111111111',
      module_id: 'd4444444-4444-4444-4444-444444444444',
      title: 'Module 1 Comprehension Check',
      quiz_type: 'module_quiz',
      passing_score_percent: 70,
      total_questions_to_select: 1,
      max_attempts: 3,
      is_randomized: true,
      created_at: '2026-08-13T00:00:00Z',
      updated_at: '2026-08-13T00:00:00Z'
    },
    questions: [
      {
        questionId: 'q-101',
        questionText: 'Which protocol ensures ordered, reliable packet transport across distributed nodes?',
        explanation: 'TCP (Transmission Control Protocol) guarantees ordered and error-checked data delivery.',
        options: [
          { optionId: 'opt-1', optionText: 'TCP (Transmission Control Protocol)', isCorrect: true },
          { optionId: 'opt-2', optionText: 'UDP (User Datagram Protocol)', isCorrect: false },
          { optionId: 'opt-3', optionText: 'DNS (Domain Name System)', isCorrect: false }
        ]
      }
    ]
  }
};

export function getInstructorNameForCourse(category?: string, title?: string, rawInstructor?: any): string {
  if (rawInstructor) {
    if (typeof rawInstructor === 'string' && rawInstructor !== 'Instructor' && rawInstructor !== 'SignalHub Instructor') {
      return rawInstructor;
    }
    if (typeof rawInstructor === 'object' && rawInstructor.full_name && rawInstructor.full_name !== 'Instructor' && rawInstructor.full_name !== 'SignalHub Instructor') {
      return rawInstructor.full_name;
    }
  }

  const catLower = (category || '').toLowerCase();
  const titleLower = (title || '').toLowerCase();

  if (catLower.includes('signal') || titleLower.includes('signal') || titleLower.includes('dsp') || titleLower.includes('communication')) {
    return 'Dr. Ayush Sharma';
  }
  if (catLower.includes('full-stack') || catLower.includes('web') || titleLower.includes('react') || titleLower.includes('full-stack')) {
    return 'Prof. Vikramaditya V.';
  }
  if (catLower.includes('ai') || catLower.includes('data') || titleLower.includes('machine learning') || titleLower.includes('neural')) {
    return 'Dr. Ananya Roy';
  }
  if (catLower.includes('system') || catLower.includes('cloud') || titleLower.includes('distributed') || titleLower.includes('architecture')) {
    return 'Prof. Rajesh K. Nair';
  }
  if (catLower.includes('security') || titleLower.includes('cyber') || titleLower.includes('crypto')) {
    return 'Dr. Priya Sundaram';
  }

  return 'Dr. Ayush Sharma';
}
