
'use server';

import { supabase } from '@/lib/supabaseClient';

export type SavedExpansion = {
  id: number;
  created_at: string;
  word: string;
  expansion: string;
};

export async function saveWordExpansion(
  word: string,
  expansion: string
): Promise<{ data: SavedExpansion[] | null; error: any }> {
  const { data, error } = await supabase
    .from('expanded_words')
    .insert([{ word, expansion, language: 'latin' }])
    .select()
    .returns<SavedExpansion[]>();

  return { data, error };
}

export async function getHistoryIndex(): Promise<{
    data: { letter: string }[] | null;
    error: any;
  }> {
    const { data, error } = await supabase.rpc('get_distinct_first_letters');
    
    // The RPC returns lowercase, so we ensure it's consistent
    if (data) {
        return { data: data.map((d: { first_letter: string }) => ({ letter: d.first_letter.toUpperCase() })), error: null };
    }

    return { data, error };
}

export async function getWordsByLetter(letter: string): Promise<{
    data: SavedExpansion[] | null;
    error: any;
  }> {
    if (!letter) return { data: [], error: null };
  
    const { data, error } = await supabase
      .from('expanded_words')
      .select('*')
      .eq('language', 'latin')
      .ilike('word', `${letter}%`)
      .order('word', { ascending: true });
  
    return { data, error };
}


export async function updateWordExpansion(
    id: number,
    expansion: string
): Promise<{ data: any; error: any }> {
    const { data, error } = await supabase
        .from('expanded_words')
        .update({ expansion })
        .eq('id', id);

    return { data, error };
}

export async function searchWordExpansions(searchTerm: string): Promise<{
    data: SavedExpansion[] | null;
    error: any;
  }> {
    if (!searchTerm) {
        return { data: [], error: null };
    }
  
    const { data, error } = await supabase
      .from('expanded_words')
      .select('*')
      .eq('language', 'latin')
      .ilike('expansion', `%${searchTerm}%`)
      .order('created_at', { ascending: false });
  
    return { data, error };
  }
