import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, supabaseAdmin } from '@/lib/supabase/server';
import { createCourseSchema, updateCourseSchema } from '@/lib/validation';

// GET /api/courses - List all published courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') || 'PUBLISHED';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check if user is instructor/admin to show all statuses
    const authUser = await getAuthUser(request);

    let userRole: string | null = null;
    if (authUser) {
      const { data: userProfile } = await supabaseAdmin!
        .from('users')
        .select('role')
        .eq('auth_id', authUser.id)
        .single();
      userRole = userProfile?.role || null;
    }

    // Use admin client to bypass RLS for course listing
    const client = supabaseAdmin!;
    const effectiveStatus = (userRole === 'INSTRUCTOR' || userRole === 'ADMIN') ? status : 'PUBLISHED';

    // Build query
    const statuses = effectiveStatus.split(',');
    let query = client
      .from('courses')
      .select('*, instructor:users(id,email,full_name), lessons(count), enrollments(count)')
      .in('status', statuses)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Search filter
    const search = searchParams.get('search');
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: courses, error } = await query;
    
    if (error) {
      console.error('Fetch courses error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch courses' },
        { status: 500 }
      );
    }

    // Map Supabase count format to flat fields
    const mapped = (courses || []).map(c => ({
      ...c,
      lessons_count: c.lessons?.[0]?.count ?? 0,
      enrollments_count: c.enrollments?.[0]?.count ?? 0,
      lessons: undefined,
      enrollments: undefined,
    }));
    
    return NextResponse.json({ courses: mapped });
  } catch (error) {
    console.error('Courses GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course (Instructor/Admin only)
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user profile to check role
    const { data: user } = await supabaseAdmin!
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single();
    
    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Only instructors can create courses' },
        { status: 403 }
      );
    }
    
    // Validate input
    const body = await request.json();
    const validation = createCourseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    // Prevent duplicate title
    const normalizedTitle = validation.data.title.trim();
    const { data: existingCourse, error: duplicateCheckError } = await supabaseAdmin!
      .from('courses')
      .select('id,title')
      .ilike('title', normalizedTitle)
      .maybeSingle();

    if (duplicateCheckError && duplicateCheckError.code !== 'PGRST116') {
      console.error('Duplicate title check error:', duplicateCheckError);
      return NextResponse.json(
        { error: 'Failed to validate course title' },
        { status: 500 }
      );
    }

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course title already exists' },
        { status: 409 }
      );
    }

    // Create course
    const { data: course, error } = await supabaseAdmin!
      .from('courses')
      .insert({
        ...validation.data,
        title: normalizedTitle,
        created_by: user.id,
        status: 'DRAFT',
      })
      .select('*, instructor:users(id,email,full_name)')
      .single();
    
    if (error) {
      console.error('Create course error:', error);
      return NextResponse.json(
        { error: 'Failed to create course' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error('Courses POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
