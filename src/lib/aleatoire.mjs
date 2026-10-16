// Mélange de Fisher-Yates, sans modifier la liste d'origine. `tirage` est remplaçable pour les tests.
/**
 * @template T
 * @param {T[]} liste
 * @param {() => number} [tirage]
 * @returns {T[]}
 */
export function melanger(liste, tirage = Math.random) {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(tirage() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}
