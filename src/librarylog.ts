/** @public configuration type */
export interface ILibraryLogger {
  error(level: ILibraryLogMeta, message: string, args?: LibraryLoggable): void;
  warn(level: ILibraryLogMeta, message: string, args?: LibraryLoggable): void;
  debug(level: ILibraryLogMeta, message: string, args?: LibraryLoggable): void;
  trace(level: ILibraryLogMeta, message: string, args?: LibraryLoggable): void;
}

/** Passed in when you configure your own logger endpoint via {@link ILibraryLogger} */
export type ILibraryLogMeta = Readonly<{
  audience: "public" | "dev" | "internal";
  category: "general" | "todo" | "troubleshooting";
  level: LibraryLoggerLevel;
}>;

/** @public configuration type */
export interface ILibraryConsoleLogger {
  /** ERROR level logs */
  error(message: string, ...args: any[]): void;
  /** WARN level logs */
  warn(message: string, ...args: any[]): void;
  /** DEBUG level logs */
  info(message: string, ...args: any[]): void;
  /** TRACE level logs */
  debug(message: string, ...args: any[]): void;
}

/**
 * "Downgraded" {@link ILogger} for passing down to utility functions.
 *
 * A util logger is usually back by some specific {@link _Audience}.
 */
export interface IUtilLogger {
  /** Usually equivalent to `console.error`. */
  error(message: string, args?: LibraryLoggable): void;
  /** Usually equivalent to `console.warn`. */
  warn(message: string, args?: LibraryLoggable): void;
  /** Usually equivalent to `console.info`. */
  debug(message: string, args?: LibraryLoggable): void;
  /** Usually equivalent to `console.debug`. */
  trace(message: string, args?: LibraryLoggable): void;
  named(name: string, key?: string): IUtilLogger;
}

type LibraryLoggable = Record<string, any>;
type LibraryLogFn = (message: string, args?: LibraryLoggable) => void;
/**
 * Allow for the arguments to only be computed if the level is included.
 * If the level is not included, then the fn will still be passed to the filtered
 * function.
 */
type LazyLibraryLogFn = (message: string, args: () => LibraryLoggable) => void;

function lazy(f: LibraryLogFn): LazyLibraryLogFn {
  return function lazyLogIncluded(m, lazyArg) {
    return f(m, lazyArg());
  };
}

export type _LibraryLogFns = Readonly<{
  [P in keyof typeof LEVELS]: LibraryLogFn;
}>;

export type _LibraryLazyLogFns = Readonly<{
  [P in keyof typeof LEVELS]: LazyLibraryLogFn;
}>;

/** Internal library logger */
export interface ILogger extends _LibraryLogFns {
  named(name: string, key?: string | number): ILogger;
  lazy: _LibraryLazyLogFns;
  readonly downgrade: {
    internal(): IUtilLogger;
    dev(): IUtilLogger;
    public(): IUtilLogger;
  };
}

export type ILibraryConsoleOutConfig =
  | /** default {@link console} */
  "console"
  | {
      type: "console";
      /** default `true` */
      style?: boolean;
      /** default {@link console} */
      console?: ILibraryConsoleLogger;
    }
  | {
      type: "named";
      named(names: string[]): ILibraryLogger;
    }
  | {
      type: "keyed";
      keyed(
        nameAndKeys: {
          name: string;
          key?: string | number;
        }[]
      ): ILibraryLogger;
    };

export type ILibraryLogSource = {
  names: { name: string; key?: number | string }[];
};

export type ILibraryLogIncludes = {
  /**
   * General information max level.
   * e.g. `Project imported might be corrupted`
   */
  min?: LibraryLoggerLevel;
  /**
   * Include logs meant for developers using Library.js
   * e.g. `Created new project 'Abc' with options {...}`
   *
   * defaults to `true` if `internal: true` or defaults to `false`.
   */
  dev?: boolean;
  /**
   * Include logs meant for internal development of Library.js
   * e.g. `Migrated project 'Abc' { duration_ms: 34, from_version: 1, to_version: 3, imported_settings: false }`
   *
   * defaults to `false`
   */
  internal?: boolean;
};

export type ILibraryFilteringConfig = ILibraryLogIncludes & {
  /**
   * Override the level of logging on a per logger source basis.
   *
   * Return `void` to indicate that the settings for the root logger should be used
   */
  include?: (source: ILibraryLogSource) => ILibraryLogIncludes | void;
};

/** @internal */
enum _Category {
  GENERAL = 1 << 0,
  TODO = 1 << 1,
  TROUBLESHOOTING = 1 << 2,
}

/** @internal */
enum _Audience {
  /** Logs for developers of Library.js */
  INTERNAL = 1 << 3,
  /** Logs for developers using Library.js */
  DEV = 1 << 4,
  /** Logs for users of the app using Library.js */
  PUBLIC = 1 << 5,
}

export enum LibraryLoggerLevel {
  TRACE = 1 << 6,
  DEBUG = 1 << 7,
  WARN = 1 << 8,
  ERROR = 1 << 9,
}

/**
 * @internal Library internal "dev" levels are odd numbers
 *
 * You can check if a level is odd quickly by doing `level & 1 === 1`
 */
export enum _LoggerLevel {
  /** The highest logging level number. */
  ERROR_PUBLIC = LibraryLoggerLevel.ERROR | _Audience.PUBLIC | _Category.GENERAL,
  ERROR_DEV = LibraryLoggerLevel.ERROR | _Audience.DEV | _Category.GENERAL,
  /** @internal this was an unexpected event */
  _HMM = LibraryLoggerLevel.ERROR | _Audience.INTERNAL | _Category.TROUBLESHOOTING,
  _TODO = LibraryLoggerLevel.ERROR | _Audience.INTERNAL | _Category.TODO,
  _ERROR = LibraryLoggerLevel.ERROR | _Audience.INTERNAL | _Category.GENERAL,
  WARN_PUBLIC = LibraryLoggerLevel.WARN | _Audience.PUBLIC | _Category.GENERAL,
  WARN_DEV = LibraryLoggerLevel.WARN | _Audience.DEV | _Category.GENERAL,
  /** @internal surface this in this moment, but it probably shouldn't be left in the code after debugging. */
  _KAPOW = LibraryLoggerLevel.WARN | _Audience.INTERNAL | _Category.TROUBLESHOOTING,
  _WARN = LibraryLoggerLevel.WARN | _Audience.INTERNAL | _Category.GENERAL,
  DEBUG_DEV = LibraryLoggerLevel.DEBUG | _Audience.DEV | _Category.GENERAL,
  /** @internal debug logs for implementation details */
  _DEBUG = LibraryLoggerLevel.DEBUG | _Audience.INTERNAL | _Category.GENERAL,
  /** trace logs like when the project is saved */
  TRACE_DEV = LibraryLoggerLevel.TRACE | _Audience.DEV | _Category.GENERAL,
  /**
   * The lowest logging level number.
   * @internal trace logs for implementation details
   */
  _TRACE = LibraryLoggerLevel.TRACE | _Audience.INTERNAL | _Category.GENERAL,
}

const LEVELS = {
  _hmm: getLogMeta(_LoggerLevel._HMM),
  _todo: getLogMeta(_LoggerLevel._TODO),
  _error: getLogMeta(_LoggerLevel._ERROR),
  errorDev: getLogMeta(_LoggerLevel.ERROR_DEV),
  errorPublic: getLogMeta(_LoggerLevel.ERROR_PUBLIC),
  _kapow: getLogMeta(_LoggerLevel._KAPOW),
  _warn: getLogMeta(_LoggerLevel._WARN),
  warnDev: getLogMeta(_LoggerLevel.WARN_DEV),
  warnPublic: getLogMeta(_LoggerLevel.WARN_PUBLIC),
  _debug: getLogMeta(_LoggerLevel._DEBUG),
  debugDev: getLogMeta(_LoggerLevel.DEBUG_DEV),
  _trace: getLogMeta(_LoggerLevel._TRACE),
  traceDev: getLogMeta(_LoggerLevel.TRACE_DEV),
};

function getLogMeta(level: _LoggerLevel): ILibraryLogMeta {
  return Object.freeze({
    audience: hasFlag(level, _Audience.INTERNAL) ? "internal" : hasFlag(level, _Audience.DEV) ? "dev" : "public",
    category: hasFlag(level, _Category.TROUBLESHOOTING)
      ? "troubleshooting"
      : hasFlag(level, _Category.TODO)
      ? "todo"
      : "general",
    level:
      // I think this is equivalent... but I'm not using it until we have tests.
      // this code won't really impact performance much anyway, since it's just computed once
      // up front.
      // level &
      // (LibraryLoggerLevel.TRACE |
      //   LibraryLoggerLevel.DEBUG |
      //   LibraryLoggerLevel.WARN |
      //   LibraryLoggerLevel.ERROR),
      hasFlag(level, LibraryLoggerLevel.ERROR)
        ? LibraryLoggerLevel.ERROR
        : hasFlag(level, LibraryLoggerLevel.WARN)
        ? LibraryLoggerLevel.WARN
        : hasFlag(level, LibraryLoggerLevel.DEBUG)
        ? LibraryLoggerLevel.DEBUG
        : // no other option
          LibraryLoggerLevel.TRACE,
  });
}

/**
 * This is a helper function to determine whether the logger level has a bit flag set.
 *
 * Flags are interesting, because they give us an opportunity to very easily set up filtering
 * based on category and level. This is not available from public api, yet, but it's a good
 * start.
 */
function hasFlag(level: _LoggerLevel, flag: number): boolean {
  return (level & flag) === flag;
}

/**
 * @internal
 *
 * You'd think max, means number "max", but since we use this system of bit flags,
 * we actually need to go the other way, with comparisons being math less than.
 *
 * NOTE: Keep this in the same file as {@link _Audience} to ensure basic compilers
 * can inline the enum values.
 */
function shouldLog(includes: Required<ILibraryLogIncludes>, level: _LoggerLevel) {
  return (
    ((level & _Audience.PUBLIC) === _Audience.PUBLIC
      ? true
      : (level & _Audience.DEV) === _Audience.DEV
      ? includes.dev
      : (level & _Audience.INTERNAL) === _Audience.INTERNAL
      ? includes.internal
      : false) && includes.min <= level
  );
}

/** @internal */
export { shouldLog as _loggerShouldLog };

type InternalLoggerStyleRef = {
  italic?: RegExp;
  bold?: RegExp;
  color?: (name: string) => string;
  collapseOnRE: RegExp;
  cssMemo: Map<string, string>;
  css(this: InternalLoggerStyleRef, name: string): string;
  collapsed(this: InternalLoggerStyleRef, name: string): string;
};

type InternalLoggerRef = {
  consoleStyle: boolean;
  includes: Required<ILibraryLogIncludes>;
  filtered: (
    this: ILibraryLogSource,
    level: _LoggerLevel,
    message: string,
    args?: LibraryLoggable | (() => LibraryLoggable)
  ) => void;
  include: (obj: ILibraryLogSource) => ILibraryLogIncludes | void;
  create: (obj: ILibraryLogSource) => ILogger;
  creatExt: (obj: ILibraryLogSource) => ILibraryLogger;
  style: InternalLoggerStyleRef;
  named(this: InternalLoggerRef, parent: ILibraryLogSource, name: string, key?: number | string): ILogger;
};

const DEFAULTS: InternalLoggerRef = {
  consoleStyle: true,
  includes: Object.freeze({
    internal: false,
    dev: false,
    min: LibraryLoggerLevel.WARN,
  }),
  filtered: function defaultFiltered() {},
  include: function defaultInclude() {
    return {};
  },
  create: null!,
  creatExt: null!,
  named(this: InternalLoggerRef, parent, name, key) {
    return this.create({
      names: [...parent.names, { name, key }],
    });
  },
  style: {
    bold: undefined, // /Service$/
    italic: undefined, // /Model$/
    cssMemo: new Map<string, string>([
      // handle empty names so we don't have to check for
      // name.length > 0 during this.css('')
      ["", ""],
      // bring a specific override
      // ["Marker", "color:#aea9ff;font-size:0.75em;text-transform:uppercase"]
    ]),
    collapseOnRE: /[a-z- ]+/g,
    color: undefined,
    // create collapsed name
    // insert collapsed name into cssMemo with original's style
    collapsed(this, name) {
      if (name.length < 5) return name;
      const collapsed = name.replace(this.collapseOnRE, "");
      if (!this.cssMemo.has(collapsed)) {
        this.cssMemo.set(collapsed, this.css(name));
      }
      return collapsed;
    },
    css(this, name): string {
      const found = this.cssMemo.get(name);
      if (found) return found;
      let css = `color:${
        this.color?.(name) ?? `hsl(${(name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % 360}, 100%, 60%)`
      }`;
      if (this.bold?.test(name)) {
        css += ";font-weight:600";
      }
      if (this.italic?.test(name)) {
        css += ";font-style:italic";
      }
      this.cssMemo.set(name, css);
      return css;
    },
  },
};

/** @public internal facing root logger */
export type ILibraryInternalLogger = {
  configureConsole(config: ILibraryConsoleOutConfig): void;
  configureFiltering(config: ILibraryFilteringConfig): void;
  getLogger(): ILogger;
};

export type ILibraryInternalLoggerOptions = {
  _error?: (message: string, args?: object) => void;
  _debug?: (message: string, args?: object) => void;
};

export function createLibraryLoggerProvider(
  useConsole: ILibraryConsoleLogger = console,
  // Not yet, used, but good pattern to have in case we want to log something
  // or report something interesting.
  _options: ILibraryInternalLoggerOptions = {}
): ILibraryInternalLogger {
  const ref: InternalLoggerRef = {
    ...DEFAULTS,
    includes: { ...DEFAULTS.includes },
  };
  const createConsole = {
    styled: createConsoleLoggerStyled.bind(ref, useConsole),
    noStyle: createConsoleLoggerNoStyle.bind(ref, useConsole),
  };
  const createExtBound = createExtLogger.bind(ref);
  function getConCreate() {
    return ref.consoleStyle ? createConsole.styled : createConsole.noStyle;
  }
  ref.create = getConCreate();

  return {
    configureConsole(config) {
      if (config === "console") {
        ref.consoleStyle = DEFAULTS.consoleStyle;
        ref.create = getConCreate();
      } else if (config.type === "console") {
        ref.consoleStyle = config.style ?? DEFAULTS.consoleStyle;
        ref.create = getConCreate();
      } else if (config.type === "keyed") {
        ref.creatExt = (source) => config.keyed(source.names);
        ref.create = createExtBound;
      } else if (config.type === "named") {
        ref.creatExt = configNamedToKeyed.bind(null, config.named);
        ref.create = createExtBound;
      }
    },
    configureFiltering(config) {
      ref.includes.dev = config.dev ?? DEFAULTS.includes.dev;
      ref.includes.internal = config.internal ?? DEFAULTS.includes.internal;
      ref.includes.min = config.min ?? DEFAULTS.includes.min;
      ref.include = config.include ?? DEFAULTS.include;
      ref.create = getConCreate();
    },
    getLogger() {
      return ref.create({ names: [] });
    },
  };
}

// make things accessible on the default export
createLibraryLoggerProvider.LibraryLoggerLevel = LibraryLoggerLevel;

export default createLibraryLoggerProvider;

/** used by `configureConsole` for `'named'` */
function configNamedToKeyed(namedFn: (names: string[]) => ILibraryLogger, source: ILibraryLogSource): ILibraryLogger {
  const names: string[] = [];
  for (let { name, key } of source.names) {
    names.push(key == null ? name : `${name} (${key})`);
  }
  return namedFn(names);
}

function createExtLogger(this: InternalLoggerRef, source: ILibraryLogSource): ILogger {
  const includes = { ...this.includes, ...this.include(source) };
  const f = this.filtered;
  const named = this.named.bind(this, source);
  const ext = this.creatExt(source);

  const _HMM = shouldLog(includes, _LoggerLevel._HMM);
  const _TODO = shouldLog(includes, _LoggerLevel._TODO);
  const _ERROR = shouldLog(includes, _LoggerLevel._ERROR);
  const ERROR_DEV = shouldLog(includes, _LoggerLevel.ERROR_DEV);
  const ERROR_PUBLIC = shouldLog(includes, _LoggerLevel.ERROR_PUBLIC);
  const _WARN = shouldLog(includes, _LoggerLevel._WARN);
  const _KAPOW = shouldLog(includes, _LoggerLevel._KAPOW);
  const WARN_DEV = shouldLog(includes, _LoggerLevel.WARN_DEV);
  const WARN_PUBLIC = shouldLog(includes, _LoggerLevel.WARN_PUBLIC);
  const _DEBUG = shouldLog(includes, _LoggerLevel._DEBUG);
  const DEBUG_DEV = shouldLog(includes, _LoggerLevel.DEBUG_DEV);
  const _TRACE = shouldLog(includes, _LoggerLevel._TRACE);
  const TRACE_DEV = shouldLog(includes, _LoggerLevel.TRACE_DEV);
  const _hmm = _HMM ? ext.error.bind(ext, LEVELS._hmm) : f.bind(source, _LoggerLevel._HMM);
  const _todo = _TODO ? ext.error.bind(ext, LEVELS._todo) : f.bind(source, _LoggerLevel._TODO);
  const _error = _ERROR ? ext.error.bind(ext, LEVELS._error) : f.bind(source, _LoggerLevel._ERROR);
  const errorDev = ERROR_DEV ? ext.error.bind(ext, LEVELS.errorDev) : f.bind(source, _LoggerLevel.ERROR_DEV);
  const errorPublic = ERROR_PUBLIC
    ? ext.error.bind(ext, LEVELS.errorPublic)
    : f.bind(source, _LoggerLevel.ERROR_PUBLIC);
  const _kapow = _KAPOW ? ext.warn.bind(ext, LEVELS._kapow) : f.bind(source, _LoggerLevel._KAPOW);
  const _warn = _WARN ? ext.warn.bind(ext, LEVELS._warn) : f.bind(source, _LoggerLevel._WARN);
  const warnDev = WARN_DEV ? ext.warn.bind(ext, LEVELS.warnDev) : f.bind(source, _LoggerLevel.WARN_DEV);
  const warnPublic = WARN_PUBLIC ? ext.warn.bind(ext, LEVELS.warnPublic) : f.bind(source, _LoggerLevel.WARN_DEV);
  const _debug = _DEBUG ? ext.debug.bind(ext, LEVELS._debug) : f.bind(source, _LoggerLevel._DEBUG);
  const debugDev = DEBUG_DEV ? ext.debug.bind(ext, LEVELS.debugDev) : f.bind(source, _LoggerLevel.DEBUG_DEV);
  const _trace = _TRACE ? ext.trace.bind(ext, LEVELS._trace) : f.bind(source, _LoggerLevel._TRACE);
  const traceDev = TRACE_DEV ? ext.trace.bind(ext, LEVELS.traceDev) : f.bind(source, _LoggerLevel.TRACE_DEV);
  const logger: ILogger = {
    _hmm,
    _todo,
    _error,
    errorDev,
    errorPublic,
    _kapow,
    _warn,
    warnDev,
    warnPublic,
    _debug,
    debugDev,
    _trace,
    traceDev,
    lazy: {
      _hmm: _HMM ? lazy(_hmm) : _hmm,
      _todo: _TODO ? lazy(_todo) : _todo,
      _error: _ERROR ? lazy(_error) : _error,
      errorDev: ERROR_DEV ? lazy(errorDev) : errorDev,
      errorPublic: ERROR_PUBLIC ? lazy(errorPublic) : errorPublic,
      _kapow: _KAPOW ? lazy(_kapow) : _kapow,
      _warn: _WARN ? lazy(_warn) : _warn,
      warnDev: WARN_DEV ? lazy(warnDev) : warnDev,
      warnPublic: WARN_PUBLIC ? lazy(warnPublic) : warnPublic,
      _debug: _DEBUG ? lazy(_debug) : _debug,
      debugDev: DEBUG_DEV ? lazy(debugDev) : debugDev,
      _trace: _TRACE ? lazy(_trace) : _trace,
      traceDev: TRACE_DEV ? lazy(traceDev) : traceDev,
    },
    //
    named,
    downgrade: {
      internal() {
        return {
          debug: logger._debug,
          error: logger._error,
          warn: logger._warn,
          trace: logger._trace,
          named(name, key) {
            return logger.named(name, key).downgrade.internal();
          },
        };
      },
      dev() {
        return {
          debug: logger.debugDev,
          error: logger.errorDev,
          warn: logger.warnDev,
          trace: logger.traceDev,
          named(name, key) {
            return logger.named(name, key).downgrade.dev();
          },
        };
      },
      public() {
        return {
          error: logger.errorPublic,
          warn: logger.warnPublic,
          debug(message, obj) {
            logger._warn(`(public "debug" filtered out) ${message}`, obj);
          },
          trace(message, obj) {
            logger._warn(`(public "trace" filtered out) ${message}`, obj);
          },
          named(name, key) {
            return logger.named(name, key).downgrade.public();
          },
        };
      },
    },
  };

  return logger;
}

function createConsoleLoggerStyled(
  this: InternalLoggerRef,
  con: ILibraryConsoleLogger,
  source: ILibraryLogSource
): ILogger {
  const includes = { ...this.includes, ...this.include(source) };

  const styleArgs: any[] = [];
  let prefix = "";
  for (let i = 0; i < source.names.length; i++) {
    const { name, key } = source.names[i];
    prefix += ` %c${name}`;
    styleArgs.push(this.style.css(name));
    if (key != null) {
      const keyStr = `%c#${key}`;
      prefix += keyStr;
      styleArgs.push(this.style.css(keyStr));
    }
  }

  const f = this.filtered;
  const named = this.named.bind(this, source);
  const prefixArr = [prefix, ...styleArgs];
  return _createConsoleLogger(f, source, includes, con, prefixArr, styledKapowPrefix(prefixArr), named);
}

function styledKapowPrefix(args: ReadonlyArray<string>): ReadonlyArray<string> {
  const start = args.slice(0);
  for (let i = 1; i < start.length; i++)
    // add big font to all part styles
    start[i] += ";background-color:#e0005a;padding:2px;color:white";
  return start;
}

function createConsoleLoggerNoStyle(
  this: InternalLoggerRef,
  con: ILibraryConsoleLogger,
  source: ILibraryLogSource
): ILogger {
  const includes = { ...this.includes, ...this.include(source) };

  let prefix = "";
  for (let i = 0; i < source.names.length; i++) {
    const { name, key } = source.names[i];
    prefix += ` ${name}`;
    if (key != null) {
      prefix += `#${key}`;
    }
  }

  const f = this.filtered;
  const named = this.named.bind(this, source);
  const prefixArr = [prefix];
  return _createConsoleLogger(f, source, includes, con, prefixArr, prefixArr, named);
}

/** Used by {@link createConsoleLoggerNoStyle} and {@link createConsoleLoggerStyled} */
function _createConsoleLogger(
  f: (this: ILibraryLogSource, level: _LoggerLevel, message: string, args?: object | undefined) => void,
  source: ILibraryLogSource,
  includes: { min: LibraryLoggerLevel; dev: boolean; internal: boolean },
  con: ILibraryConsoleLogger,
  prefix: ReadonlyArray<any>,
  kapowPrefix: ReadonlyArray<any>,
  named: (name: string, key?: string | number | undefined) => ILogger
) {
  const _HMM = shouldLog(includes, _LoggerLevel._HMM);
  const _TODO = shouldLog(includes, _LoggerLevel._TODO);
  const _ERROR = shouldLog(includes, _LoggerLevel._ERROR);
  const ERROR_DEV = shouldLog(includes, _LoggerLevel.ERROR_DEV);
  const ERROR_PUBLIC = shouldLog(includes, _LoggerLevel.ERROR_PUBLIC);
  const _WARN = shouldLog(includes, _LoggerLevel._WARN);
  const _KAPOW = shouldLog(includes, _LoggerLevel._KAPOW);
  const WARN_DEV = shouldLog(includes, _LoggerLevel.WARN_DEV);
  const WARN_PUBLIC = shouldLog(includes, _LoggerLevel.WARN_PUBLIC);
  const _DEBUG = shouldLog(includes, _LoggerLevel._DEBUG);
  const DEBUG_DEV = shouldLog(includes, _LoggerLevel.DEBUG_DEV);
  const _TRACE = shouldLog(includes, _LoggerLevel._TRACE);
  const TRACE_DEV = shouldLog(includes, _LoggerLevel.TRACE_DEV);
  const _hmm = _HMM ? con.error.bind(con, ...prefix) : f.bind(source, _LoggerLevel._HMM);
  const _todo = _TODO ? con.error.bind(con, ...prefix) : f.bind(source, _LoggerLevel._TODO);
  const _error = _ERROR ? con.error.bind(con, ...prefix) : f.bind(source, _LoggerLevel._ERROR);
  const errorDev = ERROR_DEV ? con.error.bind(con, ...prefix) : f.bind(source, _LoggerLevel.ERROR_DEV);
  const errorPublic = ERROR_PUBLIC ? con.error.bind(con, ...prefix) : f.bind(source, _LoggerLevel.ERROR_PUBLIC);
  const _kapow = _KAPOW ? con.warn.bind(con, ...kapowPrefix) : f.bind(source, _LoggerLevel._KAPOW);
  const _warn = _WARN ? con.warn.bind(con, ...prefix) : f.bind(source, _LoggerLevel._WARN);
  const warnDev = WARN_DEV ? con.warn.bind(con, ...prefix) : f.bind(source, _LoggerLevel.WARN_DEV);
  const warnPublic = WARN_PUBLIC ? con.warn.bind(con, ...prefix) : f.bind(source, _LoggerLevel.WARN_DEV);
  const _debug = _DEBUG ? con.info.bind(con, ...prefix) : f.bind(source, _LoggerLevel._DEBUG);
  const debugDev = DEBUG_DEV ? con.info.bind(con, ...prefix) : f.bind(source, _LoggerLevel.DEBUG_DEV);
  const _trace = _TRACE ? con.debug.bind(con, ...prefix) : f.bind(source, _LoggerLevel._TRACE);
  const traceDev = TRACE_DEV ? con.debug.bind(con, ...prefix) : f.bind(source, _LoggerLevel.TRACE_DEV);
  const logger: ILogger = {
    _hmm,
    _todo,
    _error,
    errorDev,
    errorPublic,
    _kapow,
    _warn,
    warnDev,
    warnPublic,
    _debug,
    debugDev,
    _trace,
    traceDev,
    lazy: {
      _hmm: _HMM ? lazy(_hmm) : _hmm,
      _todo: _TODO ? lazy(_todo) : _todo,
      _error: _ERROR ? lazy(_error) : _error,
      errorDev: ERROR_DEV ? lazy(errorDev) : errorDev,
      errorPublic: ERROR_PUBLIC ? lazy(errorPublic) : errorPublic,
      _kapow: _KAPOW ? lazy(_kapow) : _kapow,
      _warn: _WARN ? lazy(_warn) : _warn,
      warnDev: WARN_DEV ? lazy(warnDev) : warnDev,
      warnPublic: WARN_PUBLIC ? lazy(warnPublic) : warnPublic,
      _debug: _DEBUG ? lazy(_debug) : _debug,
      debugDev: DEBUG_DEV ? lazy(debugDev) : debugDev,
      _trace: _TRACE ? lazy(_trace) : _trace,
      traceDev: TRACE_DEV ? lazy(traceDev) : traceDev,
    },
    //
    named,
    downgrade: {
      internal() {
        return {
          debug: logger._debug,
          error: logger._error,
          warn: logger._warn,
          trace: logger._trace,
          named(name, key) {
            return logger.named(name, key).downgrade.internal();
          },
        };
      },
      dev() {
        return {
          debug: logger.debugDev,
          error: logger.errorDev,
          warn: logger.warnDev,
          trace: logger.traceDev,
          named(name, key) {
            return logger.named(name, key).downgrade.dev();
          },
        };
      },
      public() {
        return {
          error: logger.errorPublic,
          warn: logger.warnPublic,
          debug(message, obj) {
            logger._warn(`(public "debug" filtered out) ${message}`, obj);
          },
          trace(message, obj) {
            logger._warn(`(public "trace" filtered out) ${message}`, obj);
          },
          named(name, key) {
            return logger.named(name, key).downgrade.public();
          },
        };
      },
    },
  };

  return logger;
}
