import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/quick-tools?userId=...
 * Fetch user preferences, notebooks, pages, and glossary bookmarks from Supabase.
 * Checks user_quick_tools table first, falls back to profiles.
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // 1. Try reading from dedicated user_quick_tools table
    const { data: quickToolsData, error: qtError } = await supabaseAdmin
      .from('user_quick_tools')
      .select('user_id, preferred_language, scratchpad_notes, notebooks, saved_glossary, glossary_history, last_synced_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (quickToolsData && !qtError) {
      const scratchpadNotes = quickToolsData.scratchpad_notes || '';
      let notebooks = Array.isArray(quickToolsData.notebooks) ? quickToolsData.notebooks : [];

      if (notebooks.length === 0) {
        notebooks = [
          {
            id: 'nb-default-1',
            name: 'My Telecom Study Notes',
            color: 'sky',
            pages: [
              {
                id: 'pg-default-1',
                title: 'General Scratchpad',
                content: scratchpadNotes || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            activePageId: 'pg-default-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
      }

      return NextResponse.json({
        success: true,
        source: 'user_quick_tools',
        data: {
          language: quickToolsData.preferred_language || 'en',
          notes: scratchpadNotes,
          notebooks,
          savedGlossary: Array.isArray(quickToolsData.saved_glossary) ? quickToolsData.saved_glossary : [],
          glossaryHistory: Array.isArray(quickToolsData.glossary_history) ? quickToolsData.glossary_history : [],
          lastSyncedAt: quickToolsData.last_synced_at || quickToolsData.updated_at || null,
        },
      });
    }

    // 2. Fallback: Read from profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, preferred_language, search_history, updated_at')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.warn('Could not fetch quick-tools data from profiles:', profileError.message);
      return NextResponse.json({ success: false, error: profileError.message }, { status: 500 });
    }

    const searchHistoryObj = profile?.search_history && typeof profile.search_history === 'object'
      ? profile.search_history
      : {};

    const scratchpadNotes = (searchHistoryObj as any)?.scratchpad_notes || '';
    let notebooks = Array.isArray((searchHistoryObj as any)?.notebooks)
      ? (searchHistoryObj as any).notebooks
      : [];

    if (notebooks.length === 0) {
      notebooks = [
        {
          id: 'nb-default-1',
          name: 'My Telecom Study Notes',
          color: 'sky',
          pages: [
            {
              id: 'pg-default-1',
              title: 'General Scratchpad',
              content: scratchpadNotes || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          activePageId: 'pg-default-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    const savedGlossary = Array.isArray((searchHistoryObj as any)?.saved_glossary)
      ? (searchHistoryObj as any).saved_glossary
      : [];
    const glossaryHistory = Array.isArray((searchHistoryObj as any)?.glossary_history)
      ? (searchHistoryObj as any).glossary_history
      : [];
    const lastSyncedAt = (searchHistoryObj as any)?.last_updated || profile?.updated_at || null;

    return NextResponse.json({
      success: true,
      source: 'profiles',
      data: {
        language: profile?.preferred_language || 'en',
        notes: scratchpadNotes,
        notebooks,
        savedGlossary,
        glossaryHistory,
        lastSyncedAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/user/quick-tools
 * Persist user settings (language), learning notebooks & pages, and glossary items to Supabase.
 * Upserts to user_quick_tools table AND updates profiles.search_history.
 */
export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const { userId, language, notes, notebooks, savedGlossary, glossaryHistory } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const currentTimestamp = new Date().toISOString();

    // 1. First fetch existing search_history object to merge safely on profiles
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('preferred_language, search_history')
      .eq('id', userId)
      .single();

    const currentSearchHistory = existingProfile?.search_history && typeof existingProfile.search_history === 'object'
      ? existingProfile.search_history
      : {};

    const updatedSearchHistory = {
      ...(currentSearchHistory as any),
      scratchpad_notes: typeof notes === 'string' ? notes : (currentSearchHistory as any)?.scratchpad_notes || '',
      notebooks: Array.isArray(notebooks) ? notebooks : (currentSearchHistory as any)?.notebooks || [],
      saved_glossary: Array.isArray(savedGlossary) ? savedGlossary : (currentSearchHistory as any)?.saved_glossary || [],
      glossary_history: Array.isArray(glossaryHistory) ? glossaryHistory : (currentSearchHistory as any)?.glossary_history || [],
      last_updated: currentTimestamp,
    };

    const updateProfilePayload: any = {
      search_history: updatedSearchHistory,
      updated_at: currentTimestamp,
    };

    if (language && typeof language === 'string') {
      updateProfilePayload.preferred_language = language;
    }

    // Update profiles table
    await supabaseAdmin
      .from('profiles')
      .update(updateProfilePayload)
      .eq('id', userId);

    // 2. UPSERT into user_quick_tools table
    try {
      const quickToolsPayload = {
        user_id: userId,
        preferred_language: language || existingProfile?.preferred_language || 'en',
        scratchpad_notes: typeof notes === 'string' ? notes : updatedSearchHistory.scratchpad_notes,
        notebooks: Array.isArray(notebooks) ? notebooks : updatedSearchHistory.notebooks,
        saved_glossary: Array.isArray(savedGlossary) ? savedGlossary : updatedSearchHistory.saved_glossary,
        glossary_history: Array.isArray(glossaryHistory) ? glossaryHistory : updatedSearchHistory.glossary_history,
        last_synced_at: currentTimestamp,
        updated_at: currentTimestamp,
      };

      const { error: qtUpsertError } = await supabaseAdmin
        .from('user_quick_tools')
        .upsert(quickToolsPayload, { onConflict: 'user_id' });

      if (qtUpsertError) {
        console.warn('Note on user_quick_tools upsert:', qtUpsertError.message);
      }
    } catch (qtErr) {
      console.warn('user_quick_tools table sync notice:', qtErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Quick tools notebooks, pages, and settings saved to Supabase (user_quick_tools & profiles)!',
      lastSyncedAt: currentTimestamp,
    });
  } catch (err: any) {
    console.error('POST /api/user/quick-tools error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}


