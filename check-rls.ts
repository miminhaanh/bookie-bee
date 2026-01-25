import { supabase } from "./src/integrations/supabase/client";

async function checkRLS() {
  try {
    console.log("🔍 Kiểm tra RLS status của bảng books...\n");

    // Thử insert một book test
    const testBook = {
      title: "Test Book RLS Check",
      author: "Test Author",
      description: "Testing RLS",
      cover_url: null,
      genre: null,
      format: "pdf" as const,
      file_url: "test-path/file.pdf",
      status: "to_read" as const,
      progress: 0,
      current_position: null,
      total_pages: null,
      current_page: 0,
      estimated_time_remaining: null,
      is_from_library: false,
      open_library_key: null,
      user_id: "test-user-id-12345",
    };

    console.log("📝 Attempting to insert test book...");
    const { data, error } = await supabase
      .from("books")
      .insert([testBook])
      .select()
      .single();

    if (error) {
      console.error("❌ Insert failed with error:");
      console.error("   Code:", error.code);
      console.error("   Message:", error.message);
      console.error("   Details:", error.details);
      console.error("\n⚠️  This suggests RLS is STILL BLOCKING inserts!");
    } else {
      console.log("✅ Insert succeeded!");
      console.log("   Inserted book:", data);
      
      // Clean up - delete the test book
      const { error: deleteError } = await supabase
        .from("books")
        .delete()
        .eq("id", data.id);
      
      if (!deleteError) {
        console.log("   Cleaned up test data");
      }
    }

    // Also check what the actual row security setting is
    console.log("\n🔍 Checking Supabase table metadata...");
    const { data: tables } = await supabase
      .from("information_schema.tables")
      .select("tablename, rowsecurity")
      .eq("table_schema", "public")
      .eq("tablename", "books");

    console.log("   Table info:", tables);

  } catch (error) {
    console.error("❌ Error during check:", error);
  }
}

checkRLS();
