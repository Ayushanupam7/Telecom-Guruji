const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seedRemote() {
  console.log('Seeding initial dataset to live Supabase database...');

  // Create auth user via admin API so profiles trigger or FK is satisfied
  const { data: user, error: authErr } = await supabase.auth.admin.createUser({
    email: 'instructor@signalhub.app',
    password: 'Password123!',
    email_confirm: true,
    user_metadata: { full_name: 'Dr. Alex Rivera', role: 'instructor' }
  });

  let instructorId = 'a1111111-1111-1111-1111-111111111111';
  if (user && user.user) {
    instructorId = user.user.id;
    console.log('✓ Created auth user for instructor:', instructorId);
  } else if (authErr) {
    console.log('Auth user info:', authErr.message);
    const { data: existingProfiles } = await supabase.from('profiles').select('id').limit(1);
    if (existingProfiles && existingProfiles.length > 0) {
      instructorId = existingProfiles[0].id;
    }
  }

  // 2. Course
  const { error: courseErr } = await supabase.from('courses').upsert([
    {
      id: 'c3333333-3333-3333-3333-333333333333',
      instructor_id: instructorId,
      title: 'Computer Networks & High-Performance Web Systems',
      slug: 'computer-networks-web-systems',
      summary: 'Master the OSI model, TCP/IP stack, HTTP protocols, and high-performance server architectures.',
      description: 'This course provides a comprehensive deep-dive into networking fundamentals, socket programming, OSI/TCP layers, HTTP/2 & HTTP/3, and real-world system architecture design.',
      category: 'Computer Science',
      level: 'intermediate',
      default_language: 'en',
      course_type: 'free',
      price: 0,
      is_published: true,
      published_at: new Date().toISOString()
    }
  ]);

  if (courseErr) {
    console.error('Course seed error:', courseErr.message);
    return;
  }
  console.log('✓ Course seeded (Computer Networks & High-Performance Web Systems)');

  // 3. Course Translations
  await supabase.from('course_translations').upsert([
    {
      course_id: 'c3333333-3333-3333-3333-333333333333',
      language: 'hi',
      title: 'कंप्यूटर नेटवर्क और वेब सिस्टम',
      summary: 'OSI मॉडल, TCP/IP स्टैक और वेब सर्वर आर्किटेक्चर सीखें।',
      description: 'यह कोर्स नेटवर्किंग सिद्धांत, सॉकेट प्रोग्रामिंग और वेब प्रोटोकॉल का संपूर्ण परिचय देता है।'
    },
    {
      course_id: 'c3333333-3333-3333-3333-333333333333',
      language: 'mr',
      title: 'संगणक नेटवर्क आणि वेब सिस्टम्स',
      summary: 'OSI मॉडेल, TCP/IP स्टॅक आणि वेब सर्व्हर आर्किटेक्चर शिका.',
      description: 'हा कोर्स नेटवर्किंग मूलभूत गोष्टी आणि हाय-परफॉर्मन्स वेब सिस्टीमचे सखोल ज्ञान देतो.'
    }
  ]);
  console.log('✓ Course translations seeded (Hindi & Marathi)');

  // 4. Module 1
  await supabase.from('modules').upsert([
    {
      id: 'd4444444-4444-4444-4444-444444444444',
      course_id: 'c3333333-3333-3333-3333-333333333333',
      title: 'Module 1: Fundamentals of Network Architecture',
      description: 'Core principles of network topologies, packet switching, and the 7-layer OSI model.',
      sequence_order: 1,
      is_free_preview: true
    }
  ]);
  console.log('✓ Module 1 seeded');

  // 5. Lesson 1.1
  await supabase.from('lessons').upsert([
    {
      id: 'e5555555-5555-5555-5555-555555555555',
      module_id: 'd4444444-4444-4444-4444-444444444444',
      title: 'Lesson 1.1: Understanding OSI Layers & Protocols',
      description: 'Detailed breakdown of Physical, Data Link, Network, Transport, and Application layers.',
      sequence_order: 1,
      is_free_preview: true,
      is_optional: false
    }
  ]);
  console.log('✓ Lesson 1.1 seeded');

  // 6. Lesson Content Blocks
  await supabase.from('lesson_content_blocks').upsert([
    {
      id: 'f6666666-6666-6666-6666-666666666666',
      lesson_id: 'e5555555-5555-5555-5555-555555555555',
      block_type: 'TEXT',
      sequence_order: 1,
      content_payload: {
        markdown: '# The 7-Layer OSI Model\n\nThe **Open Systems Interconnection (OSI)** model conceptualizes how data travels across network hardware and software.\n\n### Key Layers:\n1. **Application**: HTTP, DNS, SMTP\n2. **Transport**: TCP, UDP\n3. **Network**: IP, ICMP\n4. **Data Link**: Ethernet, MAC Addresses'
      },
      is_required: true
    },
    {
      id: 'f7777777-7777-7777-7777-777777777777',
      lesson_id: 'e5555555-5555-5555-5555-555555555555',
      block_type: 'YOUTUBE',
      sequence_order: 2,
      content_payload: {
        youtube_url: 'https://www.youtube.com/watch?v=vv4y_uOneC0',
        video_id: 'vv4y_uOneC0',
        duration_seconds: 600,
        required_watch_percent: 90
      },
      is_required: true
    }
  ]);
  console.log('✓ Lesson Content Blocks seeded (Text & YouTube player)');

  // 7. Question Bank & Questions
  await supabase.from('question_banks').upsert([
    {
      id: '1b111111-1111-1111-1111-111111111111',
      course_id: 'c3333333-3333-3333-3333-333333333333',
      module_id: 'd4444444-4444-4444-4444-444444444444',
      title: 'Module 1 Question Pool'
    }
  ]);

  await supabase.from('questions').upsert([
    {
      id: '1a111111-1111-1111-1111-111111111111',
      bank_id: '1b111111-1111-1111-1111-111111111111',
      module_id: 'd4444444-4444-4444-4444-444444444444',
      question_text: 'Which layer of the OSI model is responsible for reliable end-to-end communication and packet delivery control?',
      question_type: 'single_choice',
      difficulty: 'easy',
      topic: 'OSI Model',
      explanation: 'The Transport Layer (Layer 4) manages end-to-end communication, flow control, and error recovery via protocols like TCP.'
    }
  ]);

  await supabase.from('question_options').upsert([
    { question_id: '1a111111-1111-1111-1111-111111111111', option_text: 'Application Layer', is_correct: false, sequence_order: 1 },
    { question_id: '1a111111-1111-1111-1111-111111111111', option_text: 'Transport Layer', is_correct: true, sequence_order: 2 },
    { question_id: '1a111111-1111-1111-1111-111111111111', option_text: 'Network Layer', is_correct: false, sequence_order: 3 },
    { question_id: '1a111111-1111-1111-1111-111111111111', option_text: 'Physical Layer', is_correct: false, sequence_order: 4 }
  ]);
  console.log('✓ Question Bank & Quiz Options seeded');

  // 8. Quiz
  await supabase.from('quizzes').upsert([
    {
      id: '1c111111-1111-1111-1111-111111111111',
      module_id: 'd4444444-4444-4444-4444-444444444444',
      title: 'Module 1 Comprehension Check',
      quiz_type: 'module_quiz',
      passing_score_percent: 70,
      total_questions_to_select: 1,
      max_attempts: 3
    }
  ]);
  console.log('✓ Quiz configuration seeded');
  console.log('\n🎉 ALL SEED DATA SUCCESSFULLY INSTALLED ON REMOTE SUPABASE DATABASE!');
}

seedRemote();
