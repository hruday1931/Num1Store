import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import type { Database } from '@/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()
    
    const store_name = formData.get('store_name') as string
    const phone_number = formData.get('phone_number') as string
    const description = formData.get('description') as string

    // Get current user - use getSession() for better reliability
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }
    
    const user = session.user

    // Check if user is already a vendor
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingVendor) {
      return NextResponse.json(
        { error: 'User is already registered as a vendor' },
        { status: 400 }
      )
    }

    // Create vendor record
    const vendorInsertData: Database['public']['Tables']['vendors']['Insert'] = {
      user_id: user.id,
      store_name: store_name.trim(),
      phone_number: phone_number.trim(),
      store_description: description?.trim() || undefined,
      is_approved: true,
      is_subscribed: false
    };

    const { data: vendor, error } = await supabase
      .from('vendors')
      .insert(vendorInsertData as any)
      .select()
      .single()

    if (error) {
      console.error('Vendor registration error:', error)
      return NextResponse.json(
        { error: 'Failed to register vendor' },
        { status: 500 }
      )
    }

    // Redirect to vendor dashboard
    return NextResponse.redirect(new URL('/vendor/dashboard', request.url), 303)

  } catch (error) {
    console.error('Vendor registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
