import { assetFixtures } from '../fixtures/asset.fixtures';
import { hasWorkflowSelectionChanged, WorkflowSelectionCategory } from './workflow';

describe('hasWorkflowSelectionChanged', () => {
  const original = { ...assetFixtures.minimal, kindCodes: ['report', 'map'] };

  it('detects added or removed types', () => {
    expect(
      hasWorkflowSelectionChanged(original, { ...original, kindCodes: ['report'] }, WorkflowSelectionCategory.General),
    ).toBe(true);
    expect(
      hasWorkflowSelectionChanged(
        original,
        { ...original, kindCodes: ['report', 'map', 'log'] },
        WorkflowSelectionCategory.General,
      ),
    ).toBe(true);
  });

  it('detects replaced types', () => {
    expect(
      hasWorkflowSelectionChanged(
        original,
        { ...original, kindCodes: ['report', 'log'] },
        WorkflowSelectionCategory.General,
      ),
    ).toBe(true);
  });

  it('ignores the order of types', () => {
    expect(
      hasWorkflowSelectionChanged(
        original,
        { ...original, kindCodes: ['map', 'report'] },
        WorkflowSelectionCategory.General,
      ),
    ).toBe(false);
  });

  it('reports no change for identical types', () => {
    expect(hasWorkflowSelectionChanged(original, { ...original }, WorkflowSelectionCategory.General)).toBe(false);
  });

  it('keeps the original types array unmodified', () => {
    hasWorkflowSelectionChanged(original, { ...original }, WorkflowSelectionCategory.General);
    expect(original.kindCodes).toEqual(['report', 'map']);
  });
});
