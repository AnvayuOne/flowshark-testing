'use client';

import { useMemo, useState } from 'react';
import { addNote, deleteNote } from '@/lib/actions';
import { displayName, fmtDate, type Note, type Profile } from '@/lib/types';

type Props = { testCaseId: string; initialNotes: Note[]; people: Profile[]; me: Profile };

export default function NotesPanel({ testCaseId, initialNotes, people, me }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setError(null);
    const res = await addNote(testCaseId, body).catch(() => ({ error: 'Network error. Please try again.' }));
    setSaving(false);
    if ('note' in res) {
      setNotes((n) => [...n, res.note]);
      setBody('');
    } else setError(res.error ?? 'Could not save.');
  }

  async function remove(id: string) {
    if (!confirm('Delete this note? This cannot be undone.')) return;
    const res = await deleteNote(id).catch(() => ({ error: 'Network error. Please try again.' }));
    if ('error' in res && res.error) return setError(res.error);
    setNotes((n) => n.filter((x) => x.id !== id));
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-3 font-semibold">Notes ({notes.length})</div>
      <ul className="divide-y divide-slate-100">
        {notes.length === 0 && <li className="px-5 py-4 text-sm text-slate-500">No notes yet. Add what you observed, bug IDs, environment details…</li>}
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
      <form onSubmit={onAdd} className="space-y-2 border-t border-slate-200 bg-slate-50 p-4">
        <textarea className="input min-h-[90px]" placeholder="Add a note (actual result, bug link, browser, steps to reproduce…)"
          maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end">
          <button className="btn-primary" disabled={saving || !body.trim()}>{saving ? 'Saving…' : 'Add note'}</button>
        </div>
      </form>
    </div>
  );
}
