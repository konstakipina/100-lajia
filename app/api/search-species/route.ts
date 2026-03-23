import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (q.length < 2) return NextResponse.json([]);

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json([]);

  const { data, error } = await supabase
    .from('species')
    .select('id, common_name, scientific_name, finnish_name, english_name, image_url')
    .or(`finnish_name.ilike.%${q}%,common_name.ilike.%${q}%,scientific_name.ilike.%${q}%`)
    .limit(5);

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data);
}
