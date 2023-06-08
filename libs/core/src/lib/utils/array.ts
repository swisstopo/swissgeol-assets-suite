export const makePairs = <A>(as: Array<A>): Array<[A, A]> => {
    const bs: Array<[A, A]> = [];
    for (let i = 0; i + 1 < as.length; i += 2) {
        bs.push([as[i], as[i + 1]]);
    }
    return bs;
};

type ClassType = string | string[] | Set<string> | { [key: string]: unknown };

const addClass = (currentClass: ClassType, className: string): ClassType => {
    if (!currentClass) {
        return className;
    }
    if (typeof currentClass == 'string' && !currentClass.match(className)) {
        return `${currentClass} ${className}`;
    }
    if (Array.isArray(currentClass) && !currentClass.includes(className)) {
        return [...currentClass, className];
    }
    if (currentClass instanceof Set) {
        return currentClass.add(className);
    }
    if (typeof currentClass === 'object') {
        return { ...currentClass, [className]: true };
    }
    return currentClass;
};

const removeClass = (currentClass: ClassType, className: string): ClassType => {
    if (typeof currentClass == 'string' && !currentClass.match(className)) {
        return currentClass.replace(`\\s*${className}`, '');
    }
    if (Array.isArray(currentClass) && !currentClass.includes(className)) {
        return currentClass.filter(c => c !== className);
    }
    if (currentClass instanceof Set) {
        return currentClass.add(className);
    }
    if (typeof currentClass === 'object') {
        return { ...currentClass, [className]: true };
    }
    return currentClass;
};
