import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { testEmail } = await request.json()

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const results = {
      databaseConnection: { success: false, message: "", details: null },
      tableStructure: { success: false, message: "", details: null },
      userCreation: { success: false, message: "", details: null },
      cleanup: { success: false, message: "", details: null },
    }

    // Test 1: Database Connection
    try {
      const { data, error } = await supabaseAdmin.from("users").select("count").limit(1)
      if (error) {
        results.databaseConnection = {
          success: false,
          message: `Database connection failed: ${error.message}`,
          details: error,
        }
      } else {
        results.databaseConnection = {
          success: true,
          message: "Database connection successful",
          details: data,
        }
      }
    } catch (error: any) {
      results.databaseConnection = {
        success: false,
        message: `Connection error: ${error.message}`,
        details: error,
      }
    }

    // Test 2: Table Structure
    try {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("id, email, first_name, last_name, phone, membership_status, created_at, updated_at")
        .limit(1)

      if (error) {
        results.tableStructure = {
          success: false,
          message: `Table structure issue: ${error.message}`,
          details: error,
        }
      } else {
        results.tableStructure = {
          success: true,
          message: "Table structure is correct",
          details: "All required columns exist",
        }
      }
    } catch (error: any) {
      results.tableStructure = {
        success: false,
        message: `Table structure error: ${error.message}`,
        details: error,
      }
    }

    // Test 3: User Creation (if previous tests passed)
    if (results.databaseConnection.success && results.tableStructure.success) {
      try {
        const testUserEmail = testEmail || `test-${Date.now()}@example.com`

        // First, check if user already exists
        const { data: existingUser } = await supabaseAdmin.from("users").select("*").eq("email", testUserEmail).single()

        if (existingUser) {
          results.userCreation = {
            success: true,
            message: "Test user already exists (this is fine for testing)",
            details: existingUser,
          }
        } else {
          // Create test user
          const { data: newUser, error: createError } = await supabaseAdmin
            .from("users")
            .insert({
              email: testUserEmail,
              first_name: "Test",
              last_name: "User",
              phone: "+1234567890",
              membership_status: "free",
            })
            .select()
            .single()

          if (createError) {
            results.userCreation = {
              success: false,
              message: `User creation failed: ${createError.message}`,
              details: createError,
            }
          } else {
            results.userCreation = {
              success: true,
              message: "Test user created successfully",
              details: newUser,
            }

            // Test 4: Cleanup (delete test user)
            const { error: deleteError } = await supabaseAdmin.from("users").delete().eq("email", testUserEmail)

            if (deleteError) {
              results.cleanup = {
                success: false,
                message: `Cleanup failed: ${deleteError.message}`,
                details: deleteError,
              }
            } else {
              results.cleanup = {
                success: true,
                message: "Test user cleaned up successfully",
                details: "User deleted from database",
              }
            }
          }
        }
      } catch (error: any) {
        results.userCreation = {
          success: false,
          message: `User creation error: ${error.message}`,
          details: error,
        }
      }
    }

    const overallSuccess = Object.values(results).every((result) => result.success)

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess
        ? "All tests passed! Database setup is working correctly."
        : "Some tests failed. Check the details below.",
      results,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: `Test error: ${error.message}`,
        results: null,
      },
      { status: 500 },
    )
  }
}
