import { NextRequest, NextResponse } from 'next/server';
import { updateProduct } from '@/app/vendor/products/edit/[id]/actions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const updateData = await request.json();

    // Get user from session (you'll need to implement proper session handling)
    const authHeader = request.headers.get('authorization');
    let userId = null;

    // For now, we'll need to get the user ID from the request
    // This is a simplified approach - you should implement proper JWT verification
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // This is where you'd verify the JWT token
      // For now, we'll extract it from a hypothetical user-id header
      userId = request.headers.get('user-id');
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User authentication required' },
        { status: 401 }
      );
    }

    const result = await updateProduct(productId, updateData);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('API error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
