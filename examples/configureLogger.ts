import { createLibraryLoggerProvider, LibraryLoggerLevel } from "..";

// create logger provider
const logger = createLibraryLoggerProvider();

// set a custom console
logger.configureConsole({
  type: "console",
  console: console,
  // disable colorful styling
  style: false,
});

// disable console styling, and set default console
logger.configureConsole({
  type: "console",
  style: false,
});

// set your own keyed logger
logger.configureConsole({
  type: "keyed",
  keyed(nameAndKeys) {
    const prefix = nameAndKeys
      .map((a) => (a.key ? `${a.name}#${a.key}` : a.name))
      .join(" ");
    return {
      error(meta, message, args) {
        console.error(
          meta.audience,
          meta.category,
          LibraryLoggerLevel[meta.level],
          prefix,
          message,
          ...(args ? [args] : [])
        );
      },
      warn(meta, message, args) {
        console.warn(
          meta.audience,
          meta.category,
          LibraryLoggerLevel[meta.level],
          prefix,
          message,
          ...(args ? [args] : [])
        );
      },
      debug(meta, message, args) {
        console.info(
          meta.audience,
          meta.category,
          LibraryLoggerLevel[meta.level],
          prefix,
          message,
          ...(args ? [args] : [])
        );
      },
      trace(meta, message, args) {
        console.debug(
          meta.audience,
          meta.category,
          LibraryLoggerLevel[meta.level],
          prefix,
          message,
          ...(args ? [args] : [])
        );
      },
    };
  },
});

// or set your own named logger
logger.configureConsole({
  type: "named",
  named(names) {
    // named loggers do not have a separate "key" option.
    // the key option is concatenated into the name.
    const prefix = names.join(" ");
    return {
      error(meta, message, args) {
        console.error(
          meta.audience,
          meta.category,
          LibraryLoggerLevel[meta.level],
          prefix,
          message,
          ...(args ? [args] : [])
        );
      },
      warn(meta, message, args) {
        console.warn(
          meta.audience,
          meta.category,
          LibraryLoggerLevel[meta.level],
          prefix,
          message,
          ...(args ? [args] : [])
        );
      },
      debug(meta, message, args) {
        console.info(
          meta.audience,
          meta.category,
          LibraryLoggerLevel[meta.level],
          prefix,
          message,
          ...(args ? [args] : [])
        );
      },
      trace(meta, message, args) {
        console.debug(
          meta.audience,
          meta.category,
          LibraryLoggerLevel[meta.level],
          prefix,
          message,
          ...(args ? [args] : [])
        );
      },
    };
  },
});
