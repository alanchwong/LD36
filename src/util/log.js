let enabledModules = {};

// A set of constants used to specify a module for logging when
// enabling/disabling, and retrieving a logger function.
export const LOGGERMODULE = {
  LEVEL: "Level",
  ENEMY: "Enemy",
};

// Indicates the type of logging message supplied to the logger.
// KEYVALUE - A list of pairs containing a descriptive key and its value to output.
//  e.g. ["Key1", "Value1"], ["Key2", "Value2"], ...
// MESSAGE - A list of strings to output.
export const LOGMESSAGETYPE = {
  KEYVALUE: 0,
  MESSAGE: 1,
};

// Enables debug logging for a specified module.
export function enableLogging(module) {
  const moduleUpperCase = module.toUpperCase();
  if (!enabledModules[moduleUpperCase])
    console.log("Logging enabled for " + moduleUpperCase);
  enabledModules[moduleUpperCase] = true;
}

// Disables debug logging for a specified module.
export function disableLogging(module) {
  const moduleUpperCase = module.toUpperCase();
  if (enabledModules[moduleUpperCase])
    console.log("Logging disabled for " + moduleUpperCase);
  enabledModules[moduleUpperCase] = false;
}

// Returns a logging function for the specified module. The logging function
// accepts the following parameters:
//
//  logMessageType: A LOGMESSAGETYPE value specifying the type of log output.
//
//  ...args: A list of information to log, the form of which is determined by the 
//          value of logMessageType.
export function logger(module) {
  const moduleUpperCase = module.toUpperCase();
  return function(logMessageType, ...args) {
    if (enabledModules[moduleUpperCase]) {
      let outputString = moduleUpperCase + " - ";

      if (logMessageType === LOGMESSAGETYPE.KEYVALUE) {
        args.forEach( (value, index, array) => {
          outputString = outputString + value[0] + ": " + value[1];

          if (index !== array.length - 1)
            outputString += ", ";
          else
            outputString += " ";
        });
      }
      else {  // Behavior for LOGMESSAGETYPE.MESSAGE is same as unspecified case.
        args.forEach( (value, index, array) => {
          outputString += value;
          outputString += " ";
        });
      }

      console.log(outputString);
    }
  }
}