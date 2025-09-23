import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import colors from 'colors/safe';

@Injectable()
export class AppLogger implements LoggerService {
  constructor(private readonly options: { minLevel?: LogLevel } = {}) {
    colors.enable();
  }

  log(message: unknown, ...optionalParams: unknown[]) {
    if (
      optionalParams[0] === 'InstanceLoader' &&
      typeof message === 'string' &&
      message.endsWith(' dependencies initialized')
    ) {
      // Move InstanceLoader initialization messages to DEBUG so we can filter them out without discarding info messages.
      this.debug?.(message, ...optionalParams);
      return;
    }
    if (optionalParams[0] === 'RoutesResolver') {
      // Move router initialization messages to DEBUG so we can filter them out without discarding info messages.
      this.debug?.(message, ...optionalParams);
      return;
    }
    if (optionalParams[0] === 'RouterExplorer' && typeof message === 'string') {
      // Move router initialization messages to DEBUG so we can filter them out without discarding info messages.
      // We also add indentation to the message so that each controller's routes are neatly structured below its `RoutesResolver` message.
      this.debug?.(`   ${message}`, ...optionalParams);
      return;
    }
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

  fatal(message: unknown, ...optionalParams: unknown[]) {
    this.write(levels.fatal, message, optionalParams);
  }

  private hasLevel(level: LogLevel): boolean {
    if (this.options.minLevel === undefined) {
      return true;
    }
    return getLogLevelIndex(level) >= getLogLevelIndex(this.options.minLevel);
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

const getLogLevelIndex = (level: LogLevel): number => {
  switch (level) {
    case 'verbose':
      return 0;
    case 'debug':
      return 1;
    case 'log':
      return 2;
    case 'warn':
      return 3;
    case 'error':
      return 4;
    case 'fatal':
      return 5;
  }
};

const MAX_NAME_LENGTH = Math.max(...Object.values(levels).map((it) => it.name.length));
