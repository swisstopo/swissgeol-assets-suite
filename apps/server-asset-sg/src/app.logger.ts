import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import colors from 'colors/safe';

@Injectable()
export class AppLogger implements LoggerService {
  levels: Set<LogLevel> | null = null;

  constructor() {
    colors.enable();
  }

  log(message: unknown, ...optionalParams: unknown[]) {
    this.write(levels.log, message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    this.write(levels.error, message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    this.write(levels.warn, message, optionalParams);
  }

  debug?(message: unknown, ...optionalParams: unknown[]) {
    this.write(levels.debug, message, optionalParams);
  }

  verbose?(message: unknown, ...optionalParams: unknown[]) {
    this.write(levels.verbose, message, optionalParams);
  }

  fatal?(message: unknown, ...optionalParams: unknown[]) {
    this.write(levels.fatal, message, optionalParams);
  }

  setLogLevels?(levels: LogLevel[]) {
    this.levels = new Set(levels);
  }

  private hasLevel(level: LogLevel): boolean {
    return this.levels == null || this.levels.has(level);
  }

  private write(level: Level, message: unknown, params: unknown[]) {
    if (!this.hasLevel(level.key)) {
      return;
    }
    const lastParam = params[params.length - 1];
    let source = 'main';
    if (typeof lastParam === 'string') {
      source = lastParam;
      params = params.slice(0, params.length - 1);
    }

    const now = new Date();
    const nameSpacer = ' '.repeat(MAX_NAME_LENGTH - level.name.length);
    const prefix =
      colors.reset(` ${now.toISOString()} `) + nameSpacer + level.bgColor(` ${level.name} `) + '  ' + source;
    let output = ' ';
    if (!(message instanceof Error)) {
      output += level.color(`${message}`);
    }
    const suffix = [];
    if (params.length !== 0 && !(params.length === 1 && params[0] === undefined)) {
      let i = 0;
      while (typeof params[i] === 'string') {
        const line = params[i] as string;
        suffix.push(line);
        i += 1;
        if (i >= params.length || line.endsWith('\n')) {
          break;
        }
      }
      params = params.slice(i);
      if (params.length !== 0) {
        output += '  ' + stringify(params, level);
      }
    }
    const args: unknown[] = [`${prefix} ${output}`];
    if (message instanceof Error) {
      args.push(message);
    }
    if (suffix.length !== 0) {
      args.push(level.color(`\n${suffix.join('\n')}`));
    }
    console.log(...args);
  }
}

const stringify = (value: unknown, level: Level, options: { isNested?: boolean } = {}): string => {
  if (Array.isArray(value)) {
    return stringifyArray(value, level, options);
  }
  if (value instanceof Error) {
    return JSON.stringify(value.message);
  }
  if (value != null && typeof value === 'object') {
    return stringifyObject(value, level, options);
  }
  return level.color(JSON.stringify(value));
};

const stringifyArray = (value: unknown[], level: Level, options: { isNested?: boolean } = {}): string => {
  let output = '';
  for (const element of value) {
    if (output.length > 0) {
      output += ', ';
    }
    output += stringify(element, level, { isNested: true });
  }
  return options.isNested ? `[${output}]` : output;
};

const stringifyObject = (value: object, level: Level, options: { isNested?: boolean } = {}): string => {
  const valueString = value.toString();
  if (valueString !== '[object Object]') {
    return level.color(valueString);
  }

  let output = '';
  for (const [k, v] of Object.entries(value)) {
    if (output.length > 0) {
      output += ', ';
    }
    output += `${k}: ${stringify(v, level, { isNested: true })}`;
  }
  return options.isNested ? `[${output}]` : output;
};

interface Level {
  key: LogLevel;
  name: string;
  color: typeof colors.white;
  bgColor: typeof colors.bgWhite;
}

const levels: Record<LogLevel, Level> = {
  log: {
    key: 'log',
    name: 'INFO',
    color: colors.green,
    bgColor: colors.bgGreen,
  },
  error: {
    key: 'error',
    name: 'ERROR',
    color: colors.red,
    bgColor: colors.bgRed,
  },
  warn: {
    key: 'warn',
    name: 'WARN',
    color: colors.yellow,
    bgColor: colors.bgYellow,
  },
  debug: {
    key: 'debug',
    name: 'DEBUG',
    color: colors.blue,
    bgColor: colors.bgBlue,
  },
  verbose: {
    key: 'verbose',
    name: 'VERBOSE',
    color: colors.magenta,
    bgColor: colors.bgMagenta,
  },
  fatal: {
    key: 'fatal',
    name: 'FATAL',
    color: colors.red,
    bgColor: colors.bgRed,
  },
};

const MAX_NAME_LENGTH = Math.max(...Object.values(levels).map((it) => it.name.length));
