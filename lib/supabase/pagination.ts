/**
 * Supabase/PostgREST plafonne chaque requête à `db.max_rows` lignes (1000
 * par défaut), même sans `.limit()` explicite dans le code — un `.select()`
 * "sans limite" en apparence renvoie donc silencieusement au plus 1000
 * lignes. Au-delà de ce seuil, les lignes en trop ne sont ni supprimées ni
 * corrompues : elles existent toujours en base, elles ne sont simplement
 * pas renvoyées par cette requête.
 *
 * Cette fonction pagine avec `.range()` jusqu'à épuisement pour récupérer
 * l'intégralité des lignes, quel que soit le volume total.
 */

const PAGE_SIZE = 1000;

type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

export async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<{ data: T[]; error: { message: string } | null }> {
  const all: T[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) return { data: all, error };
    if (!data || data.length === 0) break;

    all.push(...data);
    if (data.length < PAGE_SIZE) break; // dernière page
    from += PAGE_SIZE;
  }

  return { data: all, error: null };
}
