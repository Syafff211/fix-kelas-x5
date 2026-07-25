import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceRoleKey
      });
      return NextResponse.json(
        { error: 'Server configuration error. Please contact administrator.' },
        { status: 500 }
      );
    }

    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer bulk-create-secret-key-2026') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const DEFAULT_PASSWORD = 'ganesha123';

    // Get all profiles without user_id
    console.log('Fetching profiles without user_id...');
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
        console.log(`\n=== Creating user for: ${profile.email} ===`);

        // Method 1: Try signUp first (more reliable)
        console.log('Trying auth.signUp...');
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
        let method = '';

        if (!signUpError && signUpData.user) {
          console.log('✅ signUp succeeded:', signUpData.user.id);
          userId = signUpData.user.id;
          method = 'signUp';

          // Try to confirm email (might fail if email confirmation is ON)
          try {
            await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });
            console.log('✅ Email confirmed');
          } catch (confirmErr: any) {
            console.warn('⚠️ Email confirm failed (this is OK if email confirmation is OFF):', confirmErr.message);
          }
        } else {
          console.error('❌ signUp failed:', signUpError);
          
          // Check if user already exists
          if (signUpError?.message?.includes('already registered')) {
            console.log('User already exists, trying to find existing user...');
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = existingUsers?.users?.find(u => u.email === profile.email);
            
            if (existingUser) {
              userId = existingUser.id;
              method = 'existing';
              console.log('✅ Found existing user:', userId);
            }
          }

          if (!userId) {
            // Log detailed error
            const errorDetails = {
              message: signUpError?.message || 'Unknown error',
              status: signUpError?.status,
              name: signUpError?.name,
              fullError: JSON.stringify(signUpError, Object.getOwnPropertyNames(signUpError)),
            };
            
            console.error('❌ Failed to create user:', errorDetails);
            
            results.push({
              email: profile.email,
              status: 'error',
              error: signUpError?.message || 'Failed to create user. Check Supabase Auth settings: make sure "Confirm email" is OFF.',
              details: errorDetails,
            });
            errorCount++;
            continue;
          }
        }

        // Update profile with user_id
        console.log('Updating profile with user_id...');
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ user_id: userId })
          .eq('id', profile.id);

        if (updateError) {
          console.error('❌ Profile update error:', updateError);
          results.push({
            email: profile.email,
            status: 'error',
            error: `Auth created (${method}) but profile update failed: ${updateError.message}`,
          });
          errorCount++;
          continue;
        }

        console.log(`✅ Successfully created user for ${profile.email} via ${method}`);
        results.push({
          email: profile.email,
          status: 'success',
          user_id: userId,
          method,
        });
        successCount++;
      } catch (error: any) {
        console.error(`❌ Unexpected error for ${profile.email}:`, error);
        console.error('Stack:', error.stack);
        results.push({
          email: profile.email,
          status: 'error',
          error: error.message || 'Unknown error',
          stack: error.stack,
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
    console.error('❌ Bulk create error:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal server error', stack: error.stack },
      { status: 500 }
    );
  }
}
