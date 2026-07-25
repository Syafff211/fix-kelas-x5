import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing env vars:', { hasUrl: !!supabaseUrl, hasKey: !!serviceRoleKey });
      return NextResponse.json(
        { error: 'Server configuration error. Hubungi administrator.' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { email, password, full_name, nisn, phone, address, parent_name, class_position } = body;

    console.log('📝 Creating student:', { email, full_name });

    // Validasi
    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Email, password, dan nama lengkap wajib diisi' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: `Email ${email} sudah terdaftar. Gunakan email lain.` },
        { status: 400 }
      );
    }

    // Create user with auth.signUp
    console.log('🔐 Creating auth user...');
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role: 'student',
        },
      },
    });

    if (signUpError) {
      console.error('❌ Sign up error:', signUpError);
      return NextResponse.json(
        { error: `Gagal membuat akun: ${signUpError.message}` },
        { status: 400 }
      );
    }

    if (!signUpData.user) {
      console.error('❌ No user returned');
      return NextResponse.json(
        { error: 'Gagal membuat akun: No user data' },
        { status: 500 }
      );
    }

    console.log('✅ Auth user created:', signUpData.user.id);

    // Confirm email
    console.log('📧 Confirming email...');
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
      signUpData.user.id,
      { email_confirm: true }
    );

    if (confirmError) {
      console.warn('⚠️ Email confirm warning:', confirmError.message);
    }

    // Wait for profile trigger
    console.log('⏳ Waiting for profile creation...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check if profile was created by trigger
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', signUpData.user.id)
      .maybeSingle();

    if (!profile) {
      console.log('⚠️ Profile not created by trigger, creating manually...');
      
      // Create profile manually
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: signUpData.user.id,
          email,
          full_name,
          nisn: nisn || null,
          phone: phone || null,
          address: address || null,
          parent_name: parent_name || null,
          class_position: class_position || null,
          role: 'student',
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Manual profile creation error:', createError);
        return NextResponse.json(
          { error: `Akun dibuat tapi gagal buat profile: ${createError.message}` },
          { status: 500 }
        );
      }

      console.log('✅ Profile created manually:', newProfile.id);

      return NextResponse.json({
        success: true,
        message: 'Siswa berhasil ditambahkan',
        data: {
          id: newProfile.id,
          email,
          full_name: newProfile.full_name,
        },
      });
    }

    // Update profile with complete data
    console.log('📝 Updating profile...');
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        nisn: nisn || null,
        phone: phone || null,
        address: address || null,
        parent_name: parent_name || null,
        class_position: class_position || null,
        role: 'student',
      })
      .eq('user_id', signUpData.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Profile update error:', updateError);
      return NextResponse.json(
        { error: `Akun dibuat tapi gagal update profile: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Profile updated:', updatedProfile.id);

    return NextResponse.json({
      success: true,
      message: 'Siswa berhasil ditambahkan',
      data: {
        id: updatedProfile.id,
        email,
        full_name: updatedProfile.full_name,
      },
    });
  } catch (error: any) {
    console.error('❌ Create student error:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
