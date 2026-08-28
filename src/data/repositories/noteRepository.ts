import { supabase } from '../../shared/lib/supabaseClient'

export interface NoteRepository {
  getForDate(userId: string, date: string): Promise<string>
  save(userId: string, date: string, text: string): Promise<void>
}

class SupabaseNoteRepository implements NoteRepository {
  async getForDate(userId: string, date: string): Promise<string> {
    const { data, error } = await supabase
      .from('daily_notes')
      .select('note_text')
      .eq('user_id', userId)
      .eq('log_date', date)
      .maybeSingle()
    if (error) throw error
    return data?.note_text ?? ''
  }

  async save(userId: string, date: string, text: string): Promise<void> {
    const { error } = await supabase
      .from('daily_notes')
      .upsert(
        { user_id: userId, log_date: date, note_text: text, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,log_date' },
      )
    if (error) throw error
  }
}

export const noteRepository: NoteRepository = new SupabaseNoteRepository()
