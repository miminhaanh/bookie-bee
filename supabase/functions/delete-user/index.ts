import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    // 1. Get Authorization Header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing Authorization header')
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Initialize Admin Client
    // WARNING: 'SUPABASE_SERVICE_ROLE_KEY' must be set in Edge Function Secrets
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error('Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY')
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Verify User Token with ANON client
    const supabaseUser = createClient(
      supabaseUrl,
      anonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()

    if (userError || !user) {
      console.error('User auth failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Initialize Admin Client (SERVICE ROLE)
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log(`Starting deletion for user: ${user.id}`)

    // 4. Load profile (for avatar path cleanup)
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .limit(1)

    const profile = profileData?.[0] ?? null

    // 5. Delete Database Records
    // We try to delete from child tables first to avoid FK constraints, 
    // although CASCADE should handle it, manual is safer for cleanup scripts.
    const tables = ['highlights', 'reading_sessions', 'daily_reading', 'books', 'profiles']

    for (const table of tables) {
      const { error } = await supabaseAdmin.from(table).delete().eq('user_id', user.id)
      if (error) {
        console.error(`Error deleting from ${table}:`, error)
        // We continue intentionally to try deleting everything possible
      } else {
        console.log(`Deleted records from ${table}`)
      }
    }

    // 6. Delete Storage Files
    // Iterate over known buckets.
    // 'avatars' bucket must be cleaned to prevents "Ghost Avatar" on re-register.
    const buckets = ['book-files', 'book-covers']

    for (const bucket of buckets) {
      try {
        const { data: files } = await supabaseAdmin.storage.from(bucket).list(user.id)

        if (files && files.length > 0) {
          const filePaths = files.map(f => `${user.id}/${f.name}`)
          const { error: removeError } = await supabaseAdmin.storage.from(bucket).remove(filePaths)

          if (removeError) console.error(`Error removing files from ${bucket}:`, removeError)
          else console.log(`Removed ${filePaths.length} files from ${bucket}`)
        }
      } catch (e) {
        console.error(`Storage error for bucket ${bucket}:`, e)
      }
    }

    // Avatars: files are stored under "avatars/<userId>-<timestamp>.*"
    try {
      const { data: avatarFiles } = await supabaseAdmin.storage
        .from('avatars')
        .list('avatars', { search: `${user.id}-` })

      if (avatarFiles && avatarFiles.length > 0) {
        const avatarPaths = avatarFiles.map(f => `avatars/${f.name}`)
        const { error: removeAvatarError } = await supabaseAdmin.storage
          .from('avatars')
          .remove(avatarPaths)

        if (removeAvatarError) console.error('Error removing avatars:', removeAvatarError)
        else console.log(`Removed ${avatarPaths.length} avatar files`)
      }
    } catch (e) {
      console.error('Storage error for bucket avatars:', e)
    }

    // Fallback: remove avatar by URL (if stored outside the expected folder)
    if (profile?.avatar_url) {
      const match = String(profile.avatar_url).match(/avatars\/(.+)$/)
      if (match?.[1]) {
        await supabaseAdmin.storage.from('avatars').remove([`avatars/${match[1]}`])
      }
    }

    // 7. Delete Auth User (Final Step)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteUserError) {
      console.error('Failed to delete auth user:', deleteUserError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete auth user', details: deleteUserError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 7. Success
    console.log(`User ${user.id} deleted successfully.`)
    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
