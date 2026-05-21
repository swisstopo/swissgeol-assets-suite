import { PageDimension } from '@asset-sg/shared/v2';
import { PageLayout, VIRTUAL_GAP, VIRTUAL_PADDING } from './pdf-viewer.models';

export function isRotationSwapped(rotation: number): boolean {
  return rotation === 90 || rotation === 270;
}

export function getBaseScale(pageDimensions: PageDimension[], containerWidth: number): number {
  const maxNativeWidth = Math.max(1, ...pageDimensions.map((dimension) => dimension.width));
  return containerWidth / maxNativeWidth;
}

export function getPageHeight(
  pageNum: number,
  pageDimensions: PageDimension[],
  baseScale: number,
  zoom: number,
  rotation: number,
): number {
  const dim = pageDimensions[pageNum - 1];
  if (!dim) return 300;

  const nativeHeight = isRotationSwapped(rotation) ? dim.width : dim.height;
  return Math.round(nativeHeight * baseScale * zoom);
}

export function getPageWidth(
  pageNum: number,
  pageDimensions: PageDimension[],
  baseScale: number,
  zoom: number,
  rotation: number,
): number {
  const dim = pageDimensions[pageNum - 1];
  if (!dim) return 300;

  const nativeWidth = isRotationSwapped(rotation) ? dim.height : dim.width;
  return Math.round(nativeWidth * baseScale * zoom);
}

export function getPageLayout(
  pageNum: number,
  pageCount: number,
  pageDimensions: PageDimension[],
  baseScale: number,
  zoom: number,
  rotation: number,
): PageLayout | null {
  if (pageNum < 1 || pageNum > pageCount) return null;

  const size = getPageHeight(pageNum, pageDimensions, baseScale, zoom, rotation);
  let start = VIRTUAL_PADDING;
  for (let i = 1; i < pageNum; i++) {
    start += getPageHeight(i, pageDimensions, baseScale, zoom, rotation) + VIRTUAL_GAP;
  }
  return { start, size };
}

export function findPageAtScrollOffset(
  offset: number,
  pageCount: number,
  pageDimensions: PageDimension[],
  baseScale: number,
  zoom: number,
  rotation: number,
): (PageLayout & { pageNum: number }) | null {
  if (pageCount <= 0) return null;

  let start = VIRTUAL_PADDING;
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const size = getPageHeight(pageNum, pageDimensions, baseScale, zoom, rotation);
    const end = start + size;
    if (offset < end || pageNum === pageCount) {
      return { pageNum, start, size };
    }
    start = end + VIRTUAL_GAP;
  }

  return null;
}

export function getDocumentHeight(
  pageCount: number,
  pageDimensions: PageDimension[],
  baseScale: number,
  zoom: number,
  rotation: number,
): number {
  if (pageCount <= 0) return 0;

  let total = VIRTUAL_PADDING * 2;
  for (let i = 1; i <= pageCount; i++) {
    total += getPageHeight(i, pageDimensions, baseScale, zoom, rotation);
  }
  total += VIRTUAL_GAP * Math.max(0, pageCount - 1);
  return total;
}

export function getDocumentWidth(
  pageDimensions: PageDimension[],
  containerWidth: number,
  baseScale: number,
  zoom: number,
  rotation: number,
): number {
  if (pageDimensions.length === 0) return containerWidth;

  const maxNativeWidth = Math.max(
    ...pageDimensions.map((dimension) => (isRotationSwapped(rotation) ? dimension.height : dimension.width)),
  );
  const contentWidth = maxNativeWidth * baseScale * zoom;
  return Math.max(containerWidth, Math.ceil(contentWidth));
}

export function getPageRenderPriority(pageNum: number, currentPage: number): number {
  if (pageNum === currentPage) return 0;
  if (pageNum === currentPage + 1) return 1;
  if (pageNum === currentPage - 1) return 2;
  return Math.abs(pageNum - currentPage) * 2 + (pageNum > currentPage ? 0 : 1);
}

export function getConfiguredInteger(value: number, fallback: number, min: number): number {
  return Number.isFinite(value) ? Math.max(min, Math.trunc(value)) : fallback;
}
