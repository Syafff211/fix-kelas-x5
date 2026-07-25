import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Helper function untuk delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function untuk retry dengan exponential backoff
async function retryWithBackoff(fn: () => Promise<any>, maxRetries = 3): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.message?.includes('rate limit') && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 5000; // 5s, 10s, 20s
        console.log(`Rate limit hit, waiting ${waitTime}ms before retry ${i + 1}/${maxRetries}`);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
}

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

    // Create auth user for each profile WITH LONG DELAY
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      
      try {
        // Add VERY LONG delay to avoid rate limit (3 seconds between each request)
        if (i > 0) {
          await delay(3000); // 3 seconds
        }

        console.log(`Processing ${i + 1}/${profiles.length}: ${profile.email}`);

        // Use retry logic for signUp
        const signUpResult = await retryWithBackoff(async () => {
          const { data, error } = await supabaseAdmin.auth.signUp({
            email: profile.email,
            password: DEFAULT_PASSWORD,
            options: {
              data: {
                full_name: profile.full_name,
                role: 'student',
              },
            },
          });
          
          if (error) throw error;
          return data;
        });

        let userId: string | null = null;

        if (signUpResult.user) {
          userId = signUpResult.user.id;
          
          // Confirm email with retry
          await retryWithBackoff(async () => {
            const { error } = await supabaseAdmin.auth.admin.updateUserById(userId!, { 
              email_confirm: true 
            });
            if (error) throw error;
          });
        } else {
          // Check if user already exists
          const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find(u => u.email === profile.email);
          
          if (existingUser) {
            userId = existingUser.id;
          } else {
            results.push({
              email: profile.email,
              status: 'error',
              error: 'Failed to create user and user not found',
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

        console.log(`✓ Success: ${profile.email}`);
        results.push({
          email: profile.email,
          status: 'success',
          user_id: userId,
        });
        successCount++;
      } catch (error: any) {
        console.error(`✗ Error for ${profile.email}:`, error.message);
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
