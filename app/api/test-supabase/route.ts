import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Test with both clients
    const sbClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const results = {
      clientConnection: { success: false, message: "", error: null },
      adminConnection: { success: false, message: "", error: null },
      tableExists: { success: false, message: "", error: null },
      tableStructure: { success: false, message: "", columns: [] },
    }

    // Test 1: Client connection
    try {
      const { data, error } = await sbClient.from("users").select("count").limit(1)
      if (error) {
        results.clientConnection = {
          success: false,
          message: `Client connection failed: ${error.message}`,
          error: error,
        }
      } else {
        results.clientConnection = {
          success: true,
          message: "Client connection successful",
          error: null,
        }
      }
    } catch (error: any) {
      results.clientConnection = {
        success: false,
        message: `Client connection error: ${error.message}`,
        error: error,
      }
    }

    // Test 2: Admin connection
    try {
      const { data, error } = await supabaseAdmin.from("users").select("count").limit(1)
      if (error) {
        results.adminConnection = {
          success: false,
          message: `Admin connection failed: ${error.message}`,
          error: error,
        }
      } else {
        results.adminConnection = {
          success: true,
          message: "Admin connection successful",
          error: null,
        }
      }
    } catch (error: any) {
      results.adminConnection = {
        success: false,
        message: `Admin connection error: ${error.message}`,
        error: error,
      }
    }

    // Test 3: Check if users table exists
    try {
      const { data, error } = await supabaseAdmin.from("users").select("*").limit(1)
      if (error) {
        results.tableExists = {
          success: false,
          message: `Users table check failed: ${error.message}`,
          error: error,
        }
      } else {
        results.tableExists = {
          success: true,
          message: "Users table exists and is accessible",
          error: null,
        }
      }
    } catch (error: any) {
      results.tableExists = {
        success: false,
        message: `Table existence error: ${error.message}`,
        error: error,
      }
    }

    // Test 4: Check table structure
    if (results.tableExists.success) {
      try {
        // Try to select with all expected columns
        const { data, error } = await supabaseAdmin
          .from("users")
          .select(
            "id, email, first_name, last_name, phone, membership_status, email_confirmed, created_at, updated_at, last_login",
          )
          .limit(1)

        if (error) {
          results.tableStructure = {
            success: false,
            message: `Table structure issue: ${error.message}`,
            columns: [],
          }
        } else {
          const expectedColumns = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "membership_status",
            "email_confirmed",
            "created_at",
            "updated_at",
            "last_login",
          ]

          results.tableStructure = {
            success: true,
            message: "Table structure is correct",
            columns: expectedColumns,
          }
        }
      } catch (error: any) {
        results.tableStructure = {
          success: false,
          message: `Table structure error: ${error.message}`,
          columns: [],
        }
      }
    }

    const overallSuccess = Object.values(results).every((result) => result.success)

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess
        ? "✅ All Supabase tests passed! Database is ready."
        : "❌ Some Supabase tests failed. Check the details.",
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
        serviceKey: process.env.SUPABASE_SERVICE_KEY ? "✅ Set" : "❌ Missing",
      },
      results,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: `Supabase test error: ${error.message}`,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
