import { NextResponse } from 'next/server';
import { fetchProductsByCategoryPath } from '@/app/lib/data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const slugPath = slug.join('/');
    const products = await fetchProductsByCategoryPath(slugPath);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
