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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 3. Verify User Token
    // We use getUser() to ensure the token is valid and get the User ID securely
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth verification failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Starting deletion for user: ${user.id}`)

    // 4. Delete Database Records
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

    // 5. Delete Storage Files
    // Iterate over known buckets.
    // 'avatars' bucket must be cleaned to prevents "Ghost Avatar" on re-register.
    const buckets = ['book-files', 'book-covers', 'avatars']

    for (const bucket of buckets) {
      try {
        const { data: files } = await supabaseAdmin.storage.from(bucket).list(user.id)

        if (files && files.length > 0) {
          const filePaths = files.map(f => `${user.id}/${f.name}`)
          const { error: removeError } = await supabaseAdmin.storage.from(bucket).remove(filePaths)

          if (removeError) console.error(`Error removing files from ${bucket}:`, removeError)
          else console.log(`Removed ${filePaths.length} files from ${bucket}`)
        }

        // Also try to list root if files are not in folders (unlikely for user specific) 
        // Note: 'avatars' usually stores as 'avatar.png' or user_id as filename at root?
        // Standard Supabase starter often uses 'avatars' bucket with filename = path.
        // Let's check if the user has a file named simply `{user_id}` in avatars or something.
        // But safe bet is folder `user_id/*`.

        // Handling generic avatars bucket structure:
        // Sometimes avatars are stored as `public/avatar1.png`. 
        // If the user uploaded it, it should be under their folder or reference.
        // Since we can't search by metadata easily without DB, we rely on the folders.
      } catch (e) {
        console.error(`Storage error for bucket ${bucket}:`, e)
      }
    }

    // 6. Delete Auth User (Final Step)
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
