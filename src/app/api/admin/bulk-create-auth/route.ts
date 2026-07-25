import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Admin client dengan service_role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer bulk-create-secret-key-2026') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const DEFAULT_PASSWORD = 'ganesha123';

    // Get all profiles without user_id
    const { data: profiles, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .is('user_id', null)
      .eq('role', 'student');

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No profiles found without user_id',
        created: 0,
      });
    }

    console.log(`Found ${profiles.length} profiles to create auth users for`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Create auth user for each profile
    for (const profile of profiles) {
      try {
        console.log(`Creating user for: ${profile.email}`);

        // Create auth user
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: profile.email,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: {
            full_name: profile.full_name,
            role: 'student',
          },
        });

        if (authError) {
          console.error(`Auth error for ${profile.email}:`, authError);
          results.push({
            email: profile.email,
            status: 'error',
            error: authError.message,
          });
          errorCount++;
          continue;
        }

        // Update profile with user_id
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ user_id: authUser.user.id })
          .eq('id', profile.id);

        if (updateError) {
          console.error(`Update error for ${profile.email}:`, updateError);
          results.push({
            email: profile.email,
            status: 'error',
            error: `Auth created but profile update failed: ${updateError.message}`,
          });
          errorCount++;
          continue;
        }

        results.push({
          email: profile.email,
          status: 'success',
          user_id: authUser.user.id,
        });
        successCount++;
      } catch (error: any) {
        console.error(`Unexpected error for ${profile.email}:`, error);
        results.push({
          email: profile.email,
          status: 'error',
          error: error.message || 'Unknown error',
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${successCount} users, ${errorCount} errors`,
      total: profiles.length,
      successCount,
      errorCount,
      results,
      defaultPassword: DEFAULT_PASSWORD,
    });
  } catch (error: any) {
    console.error('Bulk create error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
