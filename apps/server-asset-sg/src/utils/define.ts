
export const define = <T>(value: T): T => value;

export const satisfy = <Base>() => <T extends Base>(value: T): T => value;
