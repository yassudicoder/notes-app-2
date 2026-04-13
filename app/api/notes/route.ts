import { supabase } from "@/lib/supabase";

// Helper: Get authenticated user from request
async function getAuthenticatedUser(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);
  return data?.user || null;
}

export async function GET(req: Request) {
  try {
    // Check authentication via session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      return Response.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get only this user's notes (RLS will also enforce this)
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase GET error:", error);
      return Response.json(
        { error: "Failed to fetch notes" },
        { status: 500 }
      );
    }

    return Response.json(data || []);
  } catch (err) {
    console.error("API GET error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      return Response.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body.note || body.note.trim() === "") {
      return Response.json(
        { error: "Note content cannot be empty" },
        { status: 400 }
      );
    }

    // Insert with user_id (RLS will enforce ownership)
    const { data, error } = await supabase
      .from("notes")
      .insert({
        content: body.note.trim(),
        user_id: user.id,
      })
      .select();

    if (error) {
      console.error("Supabase POST error:", error);
      return Response.json(
        { error: error.message || "Failed to create note" },
        { status: 500 }
      );
    }

    return Response.json(data?.[0], { status: 201 });
  } catch (err) {
    console.error("API POST error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      return Response.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body.id) {
      return Response.json(
        { error: "Note ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership before deleting (RLS also enforces this)
    const { data: note } = await supabase
      .from("notes")
      .select("user_id")
      .eq("id", body.id)
      .single();

    if (!note || note.user_id !== user.id) {
      return Response.json(
        { error: "Not authorized to delete this note" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", body.id);

    if (error) {
      console.error("Supabase DELETE error:", error);
      return Response.json(
        { error: "Failed to delete note" },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("API DELETE error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}