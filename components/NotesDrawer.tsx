'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { addNote, deleteNote, getNotes } from '@/lib/actions';
import { displayName, fmtDate, type Note, type Profile, type TestCase } from '@/lib/types';

type Props = {
  testCase: Pick<TestCase, 'id' | 'case_code' | 'title'> | null;
  people: Profile[];
  me: Profile;
  onClose: () => void;
  onCountChange: (testCaseId: string, count: number) => void;
};

export default function NotesDrawer({ testCase, people, me, onClose, onCountChange }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  useEffect(() => {
    if (!testCase) return;
    setNotes([]);
    setBody('');
    setError(null);
    setLoading(true);
    getNotes(testCase.id)
      .then((res) => setNotes('notes' in res ? res.notes : []))
      .finally(() => setLoading(false));
  }, [testCase]);

  useEffect(() => {
    if (!testCase) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [testCase, onClose]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!testCase || !body.trim()) return;
    setSaving(true);
    setError(null);
    const res = await addNote(testCase.id, body).catch(() => ({ error: 'Network error. Please try again.' }));
    setSaving(false);
    if ('note' in res) {
      const next = [...notes, res.note];
      setNotes(next);
      onCountChange(testCase.id, next.length);
      setBody('');
    } else setError(res.error ?? 'Could not save.');
  }

  async function remove(id: string) {
    if (!testCase || !confirm('Delete this note? This cannot be undone.')) return;
    const res = await deleteNote(id).catch(() => ({ error: 'Network error. Please try again.' }));
    if ('error' in res && res.error) return setError(res.error);
    const next = notes.filter((x) => x.id !== id);
    setNotes(next);
    onCountChange(testCase.id, next.length);
  }

  return (
    <div className={`fixed inset-0 z-30 ${testCase ? '' : 'pointer-events-none'}`} aria-hidden={!testCase}>
      <div
        className={`absolute inset-0 bg-slate-900/30 transition-opacity ${testCase ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-200 ${
          testCase ? 'translate-x-0' : 'translate-x-full'
        }`}>
        {testCase && (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <div className="font-mono text-xs text-slate-500">{testCase.case_code}</div>
                <Link href={`/tests/${testCase.id}`} className="font-semibold text-slate-900 hover:text-brand-700 hover:underline">
                  {testCase.title}
                </Link>
              </div>
              <button onClick={onClose} aria-label="Close" className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                  <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <p className="px-5 py-4 text-sm text-slate-500">Loading notes…</p>
              ) : notes.length === 0 ? (
                <p className="px-5 py-4 text-sm text-slate-500">No notes yet. Add what you observed, bug IDs, environment details…</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {notes.map((n) => {
                    const canDelete = n.author_id === me.id || me.role === 'admin';
                    return (
                      <li key={n.id} className="px-5 py-3">
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span><span className="font-semibold text-slate-700">{displayName(peopleById.get(n.author_id))}</span> · {fmtDate(n.created_at)}</span>
                          {canDelete && <button onClick={() => remove(n.id)} className="text-red-600 hover:underline">Delete</button>}
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{n.body}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <form onSubmit={onAdd} className="space-y-2 border-t border-slate-200 bg-slate-50 p-4">
              <textarea className="input min-h-[90px]" placeholder="Add a note (actual result, bug link, browser, steps to reproduce…)"
                maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} autoFocus />
              {error && <p className="text-sm text-red-700">{error}</p>}
              <div className="flex justify-end">
                <button className="btn-primary" disabled={saving || !body.trim()}>{saving ? 'Saving…' : 'Add note'}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
