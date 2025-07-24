export type CssPropertyTuple = [property: string, value: string, prioroity?: string];

export function setCssCustomProperty(element: HTMLElement, property: CssPropertyTuple) {
  element.style.setProperty(normaliseCssPropertyName(property[0]), property[1], property[2]);
}

export function getCssCustomPropertyValue(wndw: Window, element: HTMLElement, propertyName: string): string {
  return wndw.getComputedStyle(element).getPropertyValue(normaliseCssPropertyName(propertyName));
}

export function getCssCustomPropertyNumberValue(wndw: Window, element: HTMLElement, propertyName: string) {
  return parseFloat(getCssCustomPropertyValue(wndw, element, propertyName));
}

export function normaliseCssPropertyName(name: string) {
  const firstCharIsDash = name[0] === '-';
  if (firstCharIsDash && name[1] === '-') return name;
  if (firstCharIsDash) return `-${name}`;
  return `--${name}`;
}
