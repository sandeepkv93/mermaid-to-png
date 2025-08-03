import { describe, it, expect } from '@jest/globals';
import { fixMermaidSyntax, validateMermaidSyntax } from './mermaid-fixer';

describe('mermaid-fixer', () => {
  describe('fixMermaidSyntax', () => {
    it('should fix parentheses in node labels', () => {
      const input = `graph TB
        QSN --> SN[Shard N<br/>Videos (N-1)B-NB]`;

      const result = fixMermaidSyntax(input);

      expect(result.fixed).toContain('Videos N to 1B to NB');
      expect(result.changes.some(change => change.includes('problematic parentheses'))).toBe(true);
    });

    it('should fix mathematical expressions in parentheses', () => {
      const input = `graph TB
        A --> B[Result<br/>Value (X+Y)]`;

      const result = fixMermaidSyntax(input);

      expect(result.fixed).toContain('Value X+Y');
      expect(result.changes.some(change => change.includes('mathematical expressions') || change.includes('problematic parentheses'))).toBe(true);
    });

    it('should fix malformed arrows', () => {
      const input = `graph TB
        MS --> >API
        DB --> > Cache`;

      const result = fixMermaidSyntax(input);

      expect(result.fixed).toContain('MS --> API');
      expect(result.fixed).toContain('DB --> Cache');
      expect(result.changes).toContain('Fixed malformed arrow syntax');
    });

    it('should normalize arrow spacing', () => {
      const input = `graph TB
        A-->B
        C  -->  D`;

      const result = fixMermaidSyntax(input);

      expect(result.fixed).toContain('A --> B');
      expect(result.fixed).toContain('C --> D');
      expect(result.changes).toContain('Normalized arrow spacing');
    });

    it('should fix range notation in video contexts', () => {
      const input = `graph TB
        QS --> S[Shard 1<br/>Videos 1B-2B-3B]`;

      const result = fixMermaidSyntax(input);

      expect(result.fixed).toContain('Videos 1B to 2B to 3B');
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should return original content when no fixes needed', () => {
      const input = `graph TB
        A --> B[Simple Node]`;

      const result = fixMermaidSyntax(input);

      expect(result.fixed).toContain('A --> B[Simple Node]');
      // May have normalized spacing, so don't expect exactly 0 changes
    });
  });

  describe('validateMermaidSyntax', () => {
    it('should detect mathematical expressions in parentheses', () => {
      const input = `graph TB
        A --> B[Value (X-Y)]`;

      const issues = validateMermaidSyntax(input);

      expect(issues).toContain('Mathematical expressions in parentheses may cause parsing issues');
    });

    it('should detect parentheses with hyphens in node labels', () => {
      const input = `graph TB
        A --> B[Shard (N-1)]`;

      const issues = validateMermaidSyntax(input);

      expect(issues).toContain('Parentheses with hyphens in node labels may cause parsing issues');
    });

    it('should detect malformed arrows', () => {
      const input = `graph TB
        MS --> >API`;

      const issues = validateMermaidSyntax(input);

      expect(issues).toContain('Malformed arrow syntax detected');
    });

    it('should detect inconsistent arrow spacing', () => {
      const input = `graph TB
        A-->  B`;

      const issues = validateMermaidSyntax(input);

      expect(issues).toContain('Inconsistent spacing around arrows');
    });

    it('should return empty array for valid syntax', () => {
      const input = `graph TB
    A --> B[Valid Node]`;

      const issues = validateMermaidSyntax(input);

      expect(issues).toHaveLength(0);
    });
  });
});