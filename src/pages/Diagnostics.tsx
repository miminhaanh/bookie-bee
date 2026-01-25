import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const DiagnosticsPage = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setLogs([]);

    try {
      if (!user?.id) {
        addLog("❌ User not logged in");
        return;
      }

      addLog(`✅ Current user: ${user.id}`);
      addLog("---");

      // Test 1: Can we read existing books?
      addLog("📖 Test 1: Reading existing books...");
      const { data: existingBooks, error: readError } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (readError) {
        addLog(`❌ Read failed: ${readError.message}`);
      } else {
        addLog(`✅ Read succeeded! Found ${existingBooks?.length || 0} books`);
        if (existingBooks && existingBooks.length > 0) {
          addLog(`   First book: "${existingBooks[0].title}" by user ${existingBooks[0].user_id}`);
        }
      }

      addLog("---");

      // Test 2: Can we insert a test book?
      addLog("📝 Test 2: Attempting to INSERT a test book...");
      const testBookId = `test-${Date.now()}`;
      const { data: insertedBook, error: insertError } = await supabase
        .from("books")
        .insert([
          {
            id: testBookId,
            user_id: user.id,
            title: `Test Book - ${new Date().toLocaleTimeString()}`,
            author: "Test Author",
            format: "pdf",
            file_url: "test/path.pdf",
            status: "to_read",
            progress: 0,
            current_page: 0,
            is_from_library: false,
          },
        ])
        .select()
        .single();

      if (insertError) {
        addLog(`❌ INSERT failed with error:`);
        addLog(`   Code: ${insertError.code}`);
        addLog(`   Message: ${insertError.message}`);
        addLog(`   Details: ${insertError.details || "none"}`);
        if (insertError.message.includes("policy")) {
          addLog(`   ⚠️  This is a RLS POLICY error! RLS is BLOCKING inserts!`);
        }
      } else {
        addLog(`✅ INSERT succeeded!`);
        addLog(`   Inserted book ID: ${insertedBook?.id}`);

        // Clean up
        addLog("🧹 Cleaning up test data...");
        const { error: deleteError } = await supabase
          .from("books")
          .delete()
          .eq("id", testBookId);

        if (deleteError) {
          addLog(`❌ Could not clean up: ${deleteError.message}`);
        } else {
          addLog(`✅ Test data cleaned up`);
        }
      }

      addLog("---");
      addLog("✅ Diagnostics complete!");

    } catch (error: any) {
      addLog(`❌ Unexpected error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">📊 Book Upload Diagnostics</h1>
        
        <div className="mb-6">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning || !user}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? "Running..." : "Run Diagnostics"}
          </Button>
          {!user && <p className="text-red-400 mt-2">Please log in first</p>}
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h2 className="text-xl font-bold text-white mb-4">Logs:</h2>
          <div className="bg-gray-900 rounded p-4 font-mono text-sm text-gray-300 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">Click "Run Diagnostics" to start...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="py-1 whitespace-pre-wrap break-words">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
