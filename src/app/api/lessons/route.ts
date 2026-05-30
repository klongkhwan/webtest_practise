import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, supabaseAdmin } from '@/lib/supabase/server';
import { createLessonSchema } from '@/lib/validation';

// GET /api/lessons?courseId=xxx - List lessons for a course
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      );
    }

    // Get lessons for course
    const { data: lessons, error } = await supabaseAdmin!
      .from('lessons')
      .select('*, quiz:quizzes(*)')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Fetch lessons error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lessons' },
        { status: 500 }
      );
    }

    return NextResponse.json({ lessons });
  } catch (error) {
    console.error('Lessons GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/lessons - Create a new lesson
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: user } = await supabaseAdmin!
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate input
    const body = await request.json();
    const validation = createLessonSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Check if user owns the course
    const { data: course } = await supabaseAdmin!
      .from('courses')
      .select('created_by')
      .eq('id', validation.data.course_id)
      .single();

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.created_by !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to add lessons to this course' },
        { status: 403 }
      );
    }

    // Prevent duplicate lesson title within the same course
    const normalizedTitle = validation.data.title.trim();
    const { data: duplicateLesson, error: duplicateCheckError } = await supabaseAdmin!
      .from('lessons')
      .select('id,title')
      .eq('course_id', validation.data.course_id)
      .ilike('title', normalizedTitle)
      .maybeSingle();

    if (duplicateCheckError && duplicateCheckError.code !== 'PGRST116') {
      console.error('Duplicate lesson title check error:', duplicateCheckError);
      return NextResponse.json(
        { error: 'Failed to validate lesson title' },
        { status: 500 }
      );
    }

    if (duplicateLesson) {
      return NextResponse.json(
        { error: 'Lesson title already exists' },
        { status: 409 }
      );
    }

    // Get next order index
    const { data: lastLesson } = await supabaseAdmin!
      .from('lessons')
      .select('order_index')
      .eq('course_id', validation.data.course_id)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const orderIndex = (lastLesson?.order_index ?? -1) + 1;

    // Create lesson
    const { data: lesson, error } = await supabaseAdmin!
      .from('lessons')
      .insert({
        ...validation.data,
        title: normalizedTitle,
        order_index: orderIndex,
      })
      .select()
      .single();

    if (error) {
      console.error('Create lesson error:', error);
      return NextResponse.json(
        { error: 'Failed to create lesson' },
        { status: 500 }
      );
    }

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    console.error('Lessons POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
