import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Find user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError
    
    const user = users.find(u => u.email === 'divya.katakar@maleehouse.com')
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' })
    }

    const newPassword = 'Password@1234'
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword
    })
    if (authError) throw authError

    return NextResponse.json({ success: true, message: `Password reset to ${newPassword}` })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}
