
'use server';

import { supabase } from '@/lib/supabaseClient';

export type SavedExpansion = {
  id: number;
  created_at: string;
  word: string;
  expansion: string;
};

const EXPANSIONS_PER_PAGE = 10;

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

export async function getSavedWordExpansions(page: number = 1): Promise<{
  data: SavedExpansion[] | null;
  error: any;
}> {
  const from = (page - 1) * EXPANSIONS_PER_PAGE;
  const to = from + EXPANSIONS_PER_PAGE - 1;

  const { data, error } = await supabase
    .from('expanded_words')
    .select('*')
    .eq('language', 'latin')
    .order('created_at', { ascending: false })
    .range(from, to);

  return { data, error };
}

export async function getSavedWordExpansionsCount(): Promise<{ count: number | null; error: any }> {
    const { count, error } = await supabase
        .from('expanded_words')
        .select('*', { count: 'exact', head: true })
        .eq('language', 'latin');

    return { count, error };
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
