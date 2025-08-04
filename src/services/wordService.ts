
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

export async function getSavedWordExpansions(): Promise<{
  data: SavedExpansion[] | null;
  error: any;
}> {
  const { data, error } = await supabase
    .from('expanded_words')
    .select('*')
    .order('created_at', { ascending: false });

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
