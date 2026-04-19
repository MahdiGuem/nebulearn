"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

type SubjectItem = {
  id: string;
  name: string;
  description: string | null;
  _count: { courses: number; tracks: number };
};

type CourseItem = {
  id: string;
  title: string;
  pdf_url: string;
  pdf_filename: string | null;
  file_size: number | null;
  uploaded_at: string;
};

type TrackItem = {
  id: string;
  name: string;
  description: string | null;
  is_published: boolean;
  _count: { lessons: number };
};

type ClassInfo = {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  is_active: boolean;
};

export function ClassDetailClient({ classId }: { classId: string }) {
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);

  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [subjectError, setSubjectError] = useState<string | null>(null);

  const [showTrackForm, setShowTrackForm] = useState(false);
  const [trackName, setTrackName] = useState("");
  const [trackDescription, setTrackDescription] = useState("");
  const [creatingTrack, setCreatingTrack] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [classRes, subjectsRes] = await Promise.all([
          fetch(`/api/classes/${classId}`),
          fetch(`/api/classes/${classId}/subjects`),
        ]);
        const classData = await classRes.json();
        const subjectsData = await subjectsRes.json();
        if (classRes.ok) setClassInfo(classData.class);
        if (subjectsRes.ok) setSubjects(subjectsData.subjects || []);
      } catch {}
      setLoading(false);
    }
    fetchData();
  }, [classId]);

  const fetchTracks = useCallback(async (subjectId: string) => {
    setLoadingTracks(true);
    try {
      const res = await fetch(`/api/subjects/${subjectId}/tracks`);
      const data = await res.json();
      if (res.ok) setTracks(data.tracks || []);
    } catch {}
    setLoadingTracks(false);
  }, []);

  const selectSubject = (subjectId: string) => {
    if (selectedSubject === subjectId) {
      setSelectedSubject(null);
      setTracks([]);
    } else {
      setSelectedSubject(subjectId);
      fetchTracks(subjectId);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;

    setCreatingSubject(true);
    setSubjectError(null);

    try {
      const res = await fetch(`/api/classes/${classId}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: subjectName.trim(), description: subjectDescription.trim() || null }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubjectError(data.error || "Failed to create subject");
        return;
      }

      setSubjectName("");
      setSubjectDescription("");
      setShowSubjectForm(false);
      setSubjects((prev) => [...prev, data.subject]);
    } catch {
      setSubjectError("Something went wrong");
    } finally {
      setCreatingSubject(false);
    }
  };

  const handleCreateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackName.trim() || !selectedSubject) return;

    setCreatingTrack(true);
    setTrackError(null);

    try {
      const res = await fetch(`/api/subjects/${selectedSubject}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trackName.trim(), description: trackDescription.trim() || null }),
      });
      const data = await res.json();

      if (!res.ok) {
        setTrackError(data.error || "Failed to create track");
        return;
      }

      setTrackName("");
      setTrackDescription("");
      setShowTrackForm(false);
      setTracks((prev) => [...prev, data.track]);
    } catch {
      setTrackError("Something went wrong");
    } finally {
      setCreatingTrack(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-white/10 rounded-lg"></div>;
  }

  if (!classInfo) {
    return <div className="text-center text-purple-200">Class not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-bold">{classInfo.name}</h2>
        {classInfo.description && <p className="text-purple-200/60 mt-1">{classInfo.description}</p>}
        <p className="text-sm mt-2">
          Invite: <code className="bg-purple-500/20 px-2 py-1 rounded">{classInfo.invite_code}</code>
        </p>
        <Link href={`/teacher/classes/${classId}/analytics`} className="btn-arrow mt-4 inline-block">
          <span>Analytics</span>
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="title">Subjects</h3>
          <button
            onClick={() => setShowSubjectForm(!showSubjectForm)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
          >
            {showSubjectForm ? "Cancel" : "+ Add Subject"}
          </button>
        </div>

        {showSubjectForm && (
          <form onSubmit={handleCreateSubject} className="card mb-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm text-purple-200">Subject Name</label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Mathematics"
                  className="w-full mt-1 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded text-white placeholder:text-purple-300/30"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-purple-200">Description (optional)</label>
                <input
                  type="text"
                  value={subjectDescription}
                  onChange={(e) => setSubjectDescription(e.target.value)}
                  placeholder="Brief description"
                  className="w-full mt-1 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded text-white placeholder:text-purple-300/30"
                />
              </div>
              {subjectError && <p className="text-sm text-red-400">{subjectError}</p>}
              <button
                type="submit"
                disabled={creatingSubject || !subjectName.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm disabled:opacity-50"
              >
                {creatingSubject ? "Creating..." : "Create Subject"}
              </button>
            </div>
          </form>
        )}

        {subjects.length === 0 && !showSubjectForm ? (
          <p className="text-purple-200/50">No subjects yet. Click "Add Subject" to create one.</p>
        ) : (
          <div className="space-y-3">
            {subjects.map((subject) => (
              <div key={subject.id} className="card">
                <button onClick={() => selectSubject(subject.id)} className="w-full text-left flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{subject.name}</h4>
                    <p className="text-sm text-purple-200/50">
                      {subject._count?.tracks ?? 0} tracks · {subject._count?.courses ?? 0} courses
                    </p>
                  </div>
                  <span className="text-purple-300">{selectedSubject === subject.id ? "▼" : "▶"}</span>
                </button>
                
                {selectedSubject === subject.id && (
                  <div className="mt-4 pt-4 border-t border-purple-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-purple-200">Tracks</span>
                      <button
                        onClick={() => setShowTrackForm(!showTrackForm)}
                        className="text-xs text-purple-300 hover:text-white"
                      >
                        {showTrackForm ? "Cancel" : "+ Add Track"}
                      </button>
                    </div>

                    {showTrackForm && (
                      <form onSubmit={handleCreateTrack} className="mb-3 p-3 bg-purple-500/10 rounded space-y-2">
                        <input
                          type="text"
                          value={trackName}
                          onChange={(e) => setTrackName(e.target.value)}
                          placeholder="Track name"
                          className="w-full px-2 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded text-sm text-white placeholder:text-purple-300/30"
                          required
                        />
                        <input
                          type="text"
                          value={trackDescription}
                          onChange={(e) => setTrackDescription(e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full px-2 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded text-sm text-white placeholder:text-purple-300/30"
                        />
                        {trackError && <p className="text-xs text-red-400">{trackError}</p>}
                        <button
                          type="submit"
                          disabled={creatingTrack || !trackName.trim()}
                          className="w-full px-2 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm disabled:opacity-50"
                        >
                          {creatingTrack ? "Creating..." : "Create Track"}
                        </button>
                      </form>
                    )}

                    {loadingTracks ? (
                      <p className="text-purple-200/50">Loading tracks...</p>
                    ) : tracks.length === 0 && !showTrackForm ? (
                      <p className="text-purple-200/50">No tracks yet. Click "Add Track" to create one.</p>
                    ) : (
                      <div className="space-y-2">
                        {tracks.map((track) => (
                          <div key={track.id} className="flex justify-between items-center p-2 bg-purple-500/10 rounded">
                            <div>
                              <p className="font-medium">{track.name}</p>
                              <p className="text-xs text-purple-200/50">
                                {track._count?.lessons ?? 0} lessons · {track.is_published ? "Published" : "Draft"}
                              </p>
                            </div>
                            <Link href={`/teacher/tracks/${track.id}`} className="text-sm text-purple-300 hover:text-white">
                              Manage →
                            </Link>
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
    </div>
  );
}