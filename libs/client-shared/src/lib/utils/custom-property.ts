export type CssPropertyTuple = [property: string, value: string, prioroity?: string];

export function makeCssCustomProperties(...properties: (CssPropertyTuple | null)[]): CssPropertyTuple[] {
    return properties.filter((p): p is CssPropertyTuple => Array.isArray(p));
}

export function eqCssPropertyTupleKeyValue(a: CssPropertyTuple, b: CssPropertyTuple): boolean {
    return a[0] === b[0] && a[1] === b[1];
}

export function setCssCustomProperty(element: HTMLElement, property: CssPropertyTuple) {
    element.style.setProperty(normaliseCssPropertyName(property[0]), property[1], property[2]);
}

export function setCssCustomProperties(element: HTMLElement, ...properties: CssPropertyTuple[]) {
    properties.forEach(p => setCssCustomProperty(element, p));
}

export function getCssCustomPropertyValue(wndw: Window, element: HTMLElement, propertyName: string): string {
    return wndw.getComputedStyle(element).getPropertyValue(normaliseCssPropertyName(propertyName));
}

export function getCssCustomPropertyValues<T extends readonly string[]>(
    wndw: Window,
    element: HTMLElement,
    ...propertyNames: T
): {
    [Index in keyof T]: string;
} {
    const computedStyle = wndw.getComputedStyle(element);
    return propertyNames.map(
        propertyName => computedStyle.getPropertyValue(normaliseCssPropertyName(propertyName)).trim(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
}

export function getCssCustomPropertyNumberValue(wndw: Window, element: HTMLElement, propertyName: string) {
    return parseFloat(getCssCustomPropertyValue(wndw, element, propertyName));
}

export function getCssCustomPropertyNumberValues<T extends readonly string[]>(
    wndw: Window,
    element: HTMLElement,
    ...propertyNames: T
): {
    [Index in keyof T]: number;
} {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return getCssCustomPropertyValues(wndw, element, ...propertyNames).map(parseFloat) as any;
}

export function normaliseCssPropertyName(name: string) {
    const firstCharIsDash = name[0] === '-';
    if (firstCharIsDash && name[1] === '-') return name;
    if (firstCharIsDash) return `-${name}`;
    return `--${name}`;
}
