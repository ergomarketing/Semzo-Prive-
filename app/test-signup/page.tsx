"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"

interface TestResult {
  test: string
  status: "pending" | "success" | "error" | "running"
  message: string
  details?: any
}

export default function TestSignupPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [formData, setFormData] = useState({
    email: `test${Date.now()}@example.com`,
    password: "test123456",
    firstName: "Test",
    lastName: "User",
    phone: "+1234567890",
  })

  const updateTestResult = (testName: string, status: TestResult["status"], message: string, details?: any) => {
    setTestResults((prev) => {
      const existing = prev.find((r) => r.test === testName)
      if (existing) {
        existing.status = status
        existing.message = message
        existing.details = details
        return [...prev]
      } else {
        return [...prev, { test: testName, status, message, details }]
      }
    })
  }

  const runTests = async () => {
    setIsRunning(true)
    setTestResults([])

    // Test 1: Database Connection
    updateTestResult("Database Connection", "running", "Testing Supabase connection...")
    try {
      const response = await fetch("/api/test-supabase")
      const result = await response.json()

      if (result.success) {
        updateTestResult("Database Connection", "success", "✅ Connected to Supabase successfully", result)
      } else {
        updateTestResult("Database Connection", "error", `❌ Database connection failed: ${result.message}`, result)
      }
    } catch (error: any) {
      updateTestResult("Database Connection", "error", `❌ Connection error: ${error.message}`)
    }

    // Test 2: Environment Variables
    updateTestResult("Environment Variables", "running", "Checking environment variables...")
    try {
      const response = await fetch("/api/debug-env")
      const result = await response.json()

      const requiredVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY"]
      const missingVars = requiredVars.filter((varName) => !result.env[varName])

      if (missingVars.length === 0) {
        updateTestResult(
          "Environment Variables",
          "success",
          "✅ All required environment variables are set",
          result.env,
        )
      } else {
        updateTestResult(
          "Environment Variables",
          "error",
          `❌ Missing variables: ${missingVars.join(", ")}`,
          result.env,
        )
      }
    } catch (error: any) {
      updateTestResult("Environment Variables", "error", `❌ Error checking env vars: ${error.message}`)
    }

    // Test 3: User Registration
    updateTestResult("User Registration", "running", "Testing user registration...")
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        updateTestResult("User Registration", "success", `✅ User registered successfully: ${result.message}`, result)
      } else {
        updateTestResult("User Registration", "error", `❌ Registration failed: ${result.message}`, result)
      }
    } catch (error: any) {
      updateTestResult("User Registration", "error", `❌ Registration error: ${error.message}`)
    }

    // Test 4: Database Query Test
    updateTestResult("Database Query", "running", "Testing database queries...")
    try {
      const response = await fetch("/api/debug-users")
      const result = await response.json()

      if (result.success) {
        updateTestResult(
          "Database Query",
          "success",
          `✅ Database queries working. Found ${result.users?.length || 0} users`,
          result,
        )
      } else {
        updateTestResult("Database Query", "error", `❌ Database query failed: ${result.message}`, result)
      }
    } catch (error: any) {
      updateTestResult("Database Query", "error", `❌ Query error: ${error.message}`)
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "running":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      case "running":
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Signup Functionality Test</CardTitle>
            <CardDescription>Comprehensive test of the user registration system and database setup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Test Email</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={runTests} disabled={isRunning} className="w-full">
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  "Run All Tests"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(result.status)}
                        <h3 className="font-semibold">{result.test}</h3>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{result.message}</p>

                    {result.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                          View Details
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Manual Registration Test</CardTitle>
            <CardDescription>Test the actual signup form manually</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You can also test the actual signup form at{" "}
                  <a href="/signup" className="text-blue-600 hover:underline">
                    /signup
                  </a>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Database Status</Label>
                  <div className="text-sm text-gray-600">Check if users table exists and has proper structure</div>
                </div>
                <div>
                  <Label>Auth Flow</Label>
                  <div className="text-sm text-gray-600">Verify Supabase Auth integration works correctly</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
