"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type ClassItem = {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  isActive: boolean;
  createdAt: string;
  _count: { enrollments: number };
};

type Member = {
  id: string;
  enrollment_type: string;
  joined_at: string;
  users: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
};

export function TeacherClassesClient() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Members panel state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      if (res.ok) setClasses(data.classes);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create class");
        return;
      }

      setName("");
      setDescription("");
      setShowForm(false);
      fetchClasses();
    } catch {
      setError("Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  const copyCode = (code: string, classId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(classId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- Edit handlers ---

  const startEditing = (c: ClassItem) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditDescription(c.description ?? "");
    setEditError(null);
    // Close members panel if open on another class
    if (expandedId !== c.id) setExpandedId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditError(null);
  };

  const handleSave = async (classId: string) => {
    setSaving(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || "Failed to update");
        return;
      }

      setEditingId(null);
      fetchClasses();
    } catch {
      setEditError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: ClassItem) => {
    try {
      const res = await fetch(`/api/classes/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      if (res.ok) fetchClasses();
    } catch {
      // ignore
    }
  };

  // --- Members handlers ---

  const toggleMembers = async (classId: string) => {
    if (expandedId === classId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(classId);
    setLoadingMembers(true);

    try {
      const res = await fetch(`/api/classes/${classId}`);
      const data = await res.json();
      if (res.ok) {
        setMembers(data.class.enrollments ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingMembers(false);
    }
  };

  const removeMember = async (classId: string, userId: string) => {
    setRemovingUserId(userId);

    try {
      const res = await fetch(`/api/classes/${classId}/members/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.users.id !== userId));
        fetchClasses(); // refresh counts
      }
    } catch {
      // ignore
    } finally {
      setRemovingUserId(null);
    }
  };

  // --- Render ---

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 rounded-lg border bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="title mb-6">Classes</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className={showForm ? "btn-arrow" : "btn-arrow"}
        >
          <span>{showForm ? "Cancel" : "Create Class"}</span>
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border p-4 space-y-4 bg-card">
          <div className="space-y-2">
            <label htmlFor="class-name" className="text-sm text-purple-200">Nebula Name</label>
            <input
              id="class-name"
              type="text"
              placeholder="e.g. Calculus I - Fall 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-underline w-full"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="class-desc" className="text-sm text-purple-200">Description (optional)</label>
            <input
              id="class-desc"
              placeholder="Brief description of the class"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-underline w-full"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={creating || !name.trim()} className="btn-arrow">
            <span>{creating ? "Creating..." : "Create"}</span>
          </button>
        </form>
      )}

      {/* Class List */}
      {classes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>No classes yet. Create your first class to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((c) => (
            <div key={c.id} className="rounded-lg border overflow-hidden">
              {/* Class Row */}
              {editingId === c.id ? (
                /* --- Editing Mode --- */
                <div className="p-4 space-y-3 bg-card">
                  <div className="space-y-2">
                    <label className="text-sm text-purple-200">Class Name</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input-underline w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-purple-200">Description</label>
                    <input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Optional description"
                      className="input-underline w-full"
                    />
                  </div>
                  {editError && <p className="text-sm text-red-500">{editError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(c.id)}
                      disabled={saving || !editName.trim()}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={cancelEditing} className="px-3 py-1.5 border rounded text-sm hover:bg-muted">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* --- Display Mode --- */
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{c.name}</h3>
                      {!c.isActive && (
                        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    {c.description && (
                      <p className="text-sm text-muted-foreground truncate">{c.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {c._count.enrollments} student{c._count.enrollments !== 1 ? "s" : ""} enrolled
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <code className="bg-muted px-3 py-1.5 rounded text-sm font-mono tracking-wider">
                      {c.inviteCode}
                    </code>
                    <button
                      className="px-3 py-1.5 border rounded text-sm hover:bg-muted"
                      onClick={() => copyCode(c.inviteCode, c.id)}
                    >
                      {copiedId === c.id ? "Copied!" : "Copy"}
                    </button>
                    <button className="px-3 py-1.5 border rounded text-sm hover:bg-muted" onClick={() => startEditing(c)}>
                      Edit
                    </button>
                    <button
                      className="px-3 py-1.5 border rounded text-sm hover:bg-muted"
                      onClick={() => router.push(`/teacher/classes/${c.id}`)}
                    >
                      Manage
                    </button>
                    <button
                      className="px-3 py-1.5 border rounded text-sm hover:bg-muted"
                      onClick={() => toggleMembers(c.id)}
                    >
                      {expandedId === c.id ? "Hide" : "Members"}
                    </button>
                    <button
                      className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => toggleActive(c)}
                    >
                      {c.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              )}

              {/* Members Panel */}
              {expandedId === c.id && (
                <div className="border-t px-4 py-3 bg-muted/30">
                  {loadingMembers ? (
                    <p className="text-sm text-muted-foreground">Loading members...</p>
                  ) : members.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Enrolled Students ({members.length})
                      </p>
                      {members.map((m) => (
                        <div
                          key={m.users.id}
                          className="flex items-center justify-between py-1.5"
                        >
                          <div>
                            <span className="text-sm font-medium">
                              {m.users.first_name} {m.users.last_name}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {m.users.email}
                            </span>
                          </div>
                          <button
                            className="text-xs text-red-500 hover:text-red-600"
                            onClick={() => removeMember(c.id, m.users.id)}
                            disabled={removingUserId === m.users.id}
                          >
                            {removingUserId === m.users.id ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
