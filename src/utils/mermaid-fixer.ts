export interface FixResult {
  fixed: string;
  changes: string[];
}

export function fixMermaidSyntax(mermaidCode: string): FixResult {
  let fixed = mermaidCode;
  const changes: string[] = [];

  // Fix 1: Replace problematic parentheses in node labels
  // Pattern: [Label<br/>Text (X-Y)More] -> [Label<br/>Text X-Y More]
  const parenthesesPattern = /(\[.*?<br\/>.*?)\(([^)]+)\)([^\]]*\])/g;
  const parenthesesMatches = [...fixed.matchAll(parenthesesPattern)];
  if (parenthesesMatches.length > 0) {
    fixed = fixed.replace(parenthesesPattern, '$1$2$3');
    changes.push(`Removed ${parenthesesMatches.length} problematic parentheses in node labels`);
  }

  // Fix 2: Replace mathematical expressions that cause parsing issues
  // Pattern: (N-1) -> N-1, (X+Y) -> X+Y in node labels
  const mathExprPattern = /(\[.*?)\(([A-Za-z0-9]+[-+*/][A-Za-z0-9]+)\)(.*?\])/g;
  const mathMatches = [...fixed.matchAll(mathExprPattern)];
  if (mathMatches.length > 0) {
    fixed = fixed.replace(mathExprPattern, '$1$2$3');
    changes.push(`Fixed ${mathMatches.length} mathematical expressions in node labels`);
  }

  // Fix 3: Replace "to" instead of "-" for ranges in node labels when it causes issues
  // Pattern: A-B-C -> A to B to C when A-B-C appears to be a range
  const rangePattern = /(\[.*?)\b([A-Za-z0-9]+)-([A-Za-z0-9]+)-([A-Za-z0-9]+)\b(.*?\])/g;
  const rangeMatches = [...fixed.matchAll(rangePattern)];
  if (rangeMatches.length > 0) {
    // Only fix if it looks like a range (contains "to" context or numbers)
    fixed = fixed.replace(rangePattern, (match, prefix, start, middle, end, suffix) => {
      if (match.toLowerCase().includes('video') || /\d/.test(start + middle + end)) {
        changes.push(`Converted range notation: ${start}-${middle}-${end} -> ${start} to ${middle} to ${end}`);
        return `${prefix}${start} to ${middle} to ${end}${suffix}`;
      }
      return match;
    });
  }

  // Fix 4: Fix malformed arrows (extra > characters)
  const malformedArrowPattern = /-->\s*>/g;
  if (malformedArrowPattern.test(fixed)) {
    fixed = fixed.replace(malformedArrowPattern, ' --> ');
    changes.push('Fixed malformed arrow syntax');
  }

  // Fix 5: Clean up extra spaces around arrows
  const arrowSpacePattern = /\s*-->\s*/g;
  if (arrowSpacePattern.test(fixed)) {
    fixed = fixed.replace(arrowSpacePattern, ' --> ');
    changes.push('Normalized arrow spacing');
  }

  // Fix 6: Fix common subgraph syntax issues
  const subgraphPattern = /subgraph\s+"([^"]*)"(\s*\n)/g;
  if (subgraphPattern.test(fixed)) {
    fixed = fixed.replace(subgraphPattern, 'subgraph "$1"$2');
    changes.push('Fixed subgraph quote formatting');
  }

  return { fixed, changes };
}

export function validateMermaidSyntax(mermaidCode: string): string[] {
  const issues: string[] = [];

  // Check for common problematic patterns
  if (/\([^)]*[-+*/][^)]*\)/.test(mermaidCode)) {
    issues.push('Mathematical expressions in parentheses may cause parsing issues');
  }

  if (/\[.*?\([^)]*-[^)]*\).*?\]/.test(mermaidCode)) {
    issues.push('Parentheses with hyphens in node labels may cause parsing issues');
  }

  // Check for malformed arrows
  if (/-->\s*>/.test(mermaidCode)) {
    issues.push('Malformed arrow syntax detected');
  }

  // Check for inconsistent arrow spacing - either no space or multiple spaces
  if (/-->[^\s]/.test(mermaidCode) || /-->\s{2,}/.test(mermaidCode)) {
    issues.push('Inconsistent spacing around arrows');
  }

  if (/subgraph\s+[^"\s]/.test(mermaidCode)) {
    issues.push('Subgraph labels should be quoted');
  }

  return issues;
}