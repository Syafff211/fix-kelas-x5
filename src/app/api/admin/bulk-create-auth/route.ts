import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer bulk-create-secret-key-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const DEFAULT_PASSWORD = 'ganesha123';

    // Get all profiles without user_id
    const { data: profiles, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .is('user_id', null)
      .eq('role', 'student');

    if (fetchError) {
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

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Create auth user for each profile WITH DELAY
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      
      try {
        // Add delay to avoid rate limit (500ms between each request)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Try signUp
        const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.signUp({
          email: profile.email,
          password: DEFAULT_PASSWORD,
          options: {
            data: {
              full_name: profile.full_name,
              role: 'student',
            },
          },
        });

        let userId: string | null = null;

        if (!signUpError && signUpData.user) {
          userId = signUpData.user.id;
          
          // Confirm email
          await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });
        } else {
          // Check if user already exists
          if (signUpError?.message?.includes('already registered')) {
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = existingUsers?.users?.find(u => u.email === profile.email);
            
            if (existingUser) {
              userId = existingUser.id;
            }
          }

          if (!userId) {
            results.push({
              email: profile.email,
              status: 'error',
              error: signUpError?.message || 'Failed to create user',
            });
            errorCount++;
            continue;
          }
        }

        // Update profile with user_id
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ user_id: userId })
          .eq('id', profile.id);

        if (updateError) {
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
          user_id: userId,
        });
        successCount++;
      } catch (error: any) {
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
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
