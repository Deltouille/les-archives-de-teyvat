// Analyse des expressions de licence SPDX (spécification 2.3, annexe D), pour tests/licences.test.mjs.
// Grammaire : expression := terme (OR terme)* ; terme := facteur (AND facteur)* ;
//             facteur := « ( » expression « ) » | identifiant [WITH exception].
// Priorité : WITH > AND > OR. Toute expression malformée est refusée (D33).

/** @param {string} expression */
function jetons(expression) {
  return expression.match(/\(|\)|[^\s()]+/g) ?? [];
}

/**
 * L'expression autorise-t-elle un usage compatible ? `compatibles` : identifiants acceptés, et formes « X WITH Y »
 * acceptées telles quelles. Une erreur de syntaxe donne false : un garde-fou ne doit jamais accepter par défaut.
 * @param {string} expression
 * @param {Set<string>} compatibles
 */
export function compatibleSpdx(expression, compatibles) {
  const liste = jetons(expression);
  let i = 0;
  const lire = () => liste[i++];
  const voir = () => liste[i];
  const operateur = mot => /^(AND|OR|WITH)$/.test(mot ?? '');

  function expressionOu() {
    let valeur = expressionEt();
    while (voir() === 'OR') { lire(); valeur = expressionEt() || valeur; }
    return valeur;
  }
  function expressionEt() {
    let valeur = facteur();
    while (voir() === 'AND') { lire(); valeur = facteur() && valeur; }
    return valeur;
  }
  function facteur() {
    const jeton = lire();
    if (jeton === '(') {
      const valeur = expressionOu();
      if (lire() !== ')') throw new SyntaxError('parenthèse non fermée');
      return valeur;
    }
    if (jeton === undefined || jeton === ')' || operateur(jeton)) throw new SyntaxError(`identifiant attendu, trouvé « ${jeton ?? 'fin'} »`);
    if (voir() === 'WITH') {
      lire();
      const exception = lire();
      if (exception === undefined || exception === '(' || exception === ')' || operateur(exception)) throw new SyntaxError('exception attendue après WITH');
      return compatibles.has(`${jeton} WITH ${exception}`);
    }
    return compatibles.has(jeton);
  }

  try {
    const valeur = expressionOu();
    if (i !== liste.length) throw new SyntaxError(`jeton inattendu « ${voir()} »`);
    return valeur;
  } catch {
    return false;
  }
}
