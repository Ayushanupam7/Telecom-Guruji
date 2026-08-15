-- SignalHub Development Seed Script
-- Demo Accounts & Initial Course

-- 0. Demo Auth Users (Satisfies profiles FK constraint)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, role, aud)
VALUES 
('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'instructor@signalhub.app', '$2a$10$abcdefghijklmnopqrstuu', NOW(), '{"full_name":"Dr. Alex Rivera","role":"instructor"}'::jsonb, NOW(), NOW(), 'authenticated', 'authenticated'),
('b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'student@signalhub.app', '$2a$10$abcdefghijklmnopqrstuu', NOW(), '{"full_name":"Priya Sharma","role":"student"}'::jsonb, NOW(), NOW(), 'authenticated', 'authenticated'),
('c9999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000000', 'admin@signalhub.app', '$2a$10$abcdefghijklmnopqrstuu', NOW(), '{"full_name":"Lead Admin / Developer","role":"admin"}'::jsonb, NOW(), NOW(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- 1. Demo Instructor User Profile
INSERT INTO public.profiles (id, email, full_name, role, preferred_language, bio)
VALUES (
    'a1111111-1111-1111-1111-111111111111',
    'instructor@signalhub.app',
    'Dr. Alex Rivera',
    'instructor',
    'en',
    'Senior Systems Architect and Distributed Systems Professor.'
) ON CONFLICT (id) DO NOTHING;

-- 2. Demo Student User Profile
INSERT INTO public.profiles (id, email, full_name, role, preferred_language, bio)
VALUES (
    'b2222222-2222-2222-2222-222222222222',
    'student@signalhub.app',
    'Priya Sharma',
    'student',
    'hi',
    'Passionate CS student exploring Web Architectures & AI.'
) ON CONFLICT (id) DO NOTHING;

-- 3. Demo Admin / Developer User Profile
INSERT INTO public.profiles (id, email, full_name, role, preferred_language, bio)
VALUES (
    'c9999999-9999-9999-9999-999999999999',
    'admin@signalhub.app',
    'Lead Admin / Developer',
    'admin',
    'en',
    'Platform Super Administrator and Engineering Lead.'
) ON CONFLICT (id) DO NOTHING;

-- 4. Demo Course: Computer Networks & Web Systems
INSERT INTO public.courses (
    id, instructor_id, title, slug, summary, description, category, level, default_language, course_type, price, is_published, published_at
) VALUES (
    'c3333333-3333-3333-3333-333333333333',
    'a1111111-1111-1111-1111-111111111111',
    'Computer Networks & High-Performance Web Systems',
    'computer-networks-web-systems',
    'Master the OSI model, TCP/IP stack, HTTP protocols, and high-performance server architectures.',
    'This course provides a comprehensive deep-dive into networking fundamentals, socket programming, OSI/TCP layers, HTTP/2 & HTTP/3, and real-world system architecture design.',
    'Computer Science',
    'intermediate',
    'en',
    'free',
    0.00,
    true,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Course Translations (Hindi & Marathi)
INSERT INTO public.course_translations (course_id, language, title, summary, description)
VALUES 
(
    'c3333333-3333-3333-3333-333333333333',
    'hi',
    'कंप्यूटर नेटवर्क और वेब सिस्टम',
    'OSI मॉडल, TCP/IP स्टैक और वेब सर्वर आर्किटेक्चर सीखें।',
    'यह कोर्स नेटवर्किंग सिद्धांत, सॉकेट प्रोग्रामिंग और वेब प्रोटोकॉल का संपूर्ण परिचय देता है।'
),
(
    'c3333333-3333-3333-3333-333333333333',
    'mr',
    'संगणक नेटवर्क आणि वेब सिस्टम्स',
    'OSI मॉडेल, TCP/IP स्टॅक आणि वेब सर्व्हर आर्किटेक्चर शिका.',
    'हा कोर्स नेटवर्किंग मूलभूत गोष्टी आणि हाय-परफॉर्मन्स वेब सिस्टीमचे सखोल ज्ञान देतो.'
) ON CONFLICT (course_id, language) DO NOTHING;

-- Module 1: Introduction to Computer Networks
INSERT INTO public.modules (id, course_id, title, description, sequence_order, is_free_preview)
VALUES (
    'd4444444-4444-4444-4444-444444444444',
    'c3333333-3333-3333-3333-333333333333',
    'Module 1: Fundamentals of Network Architecture',
    'Core principles of network topologies, packet switching, and the 7-layer OSI model.',
    1,
    true
) ON CONFLICT (id) DO NOTHING;

-- Lesson 1.1: The OSI & TCP/IP Model
INSERT INTO public.lessons (id, module_id, title, description, sequence_order, is_free_preview, is_optional)
VALUES (
    'e5555555-5555-5555-5555-555555555555',
    'd4444444-4444-4444-4444-444444444444',
    'Lesson 1.1: Understanding OSI Layers & Protocols',
    'Detailed breakdown of Physical, Data Link, Network, Transport, and Application layers.',
    1,
    true,
    false
) ON CONFLICT (id) DO NOTHING;

-- Lesson Content Block 1: Overview Text
INSERT INTO public.lesson_content_blocks (id, lesson_id, block_type, sequence_order, content_payload, is_required)
VALUES (
    'f6666666-6666-6666-6666-666666666666',
    'e5555555-5555-5555-5555-555555555555',
    'TEXT',
    1,
    '{"markdown": "# The 7-Layer OSI Model\n\nThe **Open Systems Interconnection (OSI)** model conceptualizes how data travels across network hardware and software.\n\n### Key Layers:\n1. **Application**: HTTP, DNS, SMTP\n2. **Transport**: TCP, UDP\n3. **Network**: IP, ICMP\n4. **Data Link**: Ethernet, MAC Addresses"}'::jsonb,
    true
) ON CONFLICT (id) DO NOTHING;

-- Lesson Content Block 2: YouTube Video Lesson
INSERT INTO public.lesson_content_blocks (id, lesson_id, block_type, sequence_order, content_payload, is_required)
VALUES (
    'f7777777-7777-7777-7777-777777777777',
    'e5555555-5555-5555-5555-555555555555',
    'YOUTUBE',
    2,
    '{"youtube_url": "https://www.youtube.com/watch?v=vv4y_uOneC0", "video_id": "vv4y_uOneC0", "duration_seconds": 600, "required_watch_percent": 90}'::jsonb,
    true
) ON CONFLICT (id) DO NOTHING;

-- Question Bank & Module 1 Quiz
INSERT INTO public.question_banks (id, course_id, module_id, title)
VALUES (
    '1b111111-1111-1111-1111-111111111111',
    'c3333333-3333-3333-3333-333333333333',
    'd4444444-4444-4444-4444-444444444444',
    'Module 1 Question Pool'
) ON CONFLICT (id) DO NOTHING;

-- Question 1
INSERT INTO public.questions (id, bank_id, module_id, question_text, question_type, difficulty, topic, explanation)
VALUES (
    '1a111111-1111-1111-1111-111111111111',
    '1b111111-1111-1111-1111-111111111111',
    'd4444444-4444-4444-4444-444444444444',
    'Which layer of the OSI model is responsible for reliable end-to-end communication and packet delivery control?',
    'single_choice',
    'easy',
    'OSI Model',
    'The Transport Layer (Layer 4) manages end-to-end communication, flow control, and error recovery via protocols like TCP.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.question_options (question_id, option_text, is_correct, sequence_order)
VALUES 
('1a111111-1111-1111-1111-111111111111', 'Application Layer', false, 1),
('1a111111-1111-1111-1111-111111111111', 'Transport Layer', true, 2),
('1a111111-1111-1111-1111-111111111111', 'Network Layer', false, 3),
('1a111111-1111-1111-1111-111111111111', 'Physical Layer', false, 4)
ON CONFLICT DO NOTHING;

-- Module 1 Quiz Setup
INSERT INTO public.quizzes (id, module_id, title, quiz_type, passing_score_percent, total_questions_to_select, max_attempts)
VALUES (
    '1c111111-1111-1111-1111-111111111111',
    'd4444444-4444-4444-4444-444444444444',
    'Module 1 Comprehension Check',
    'module_quiz',
    70,
    1,
    3
) ON CONFLICT (id) DO NOTHING;
