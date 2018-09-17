import React, { Component } from 'react';

let enabledModules = {};

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

// DebugLog higher-order React component to include
// in the React component tree to initialize and enable
// logging through the logger function. No state passed
// down to the wrapped component.
export function WithDebugLogging(BaseComponent) {
  initializeLogging();

  class DebugLogWrapper extends Component {
    render() {
      return (
        <BaseComponent />
      )
    };
  }

  return DebugLogWrapper;
}

/* 
  Returns a logging function to log debug output for the specified module.
  The logging function expects an object with at least one of the following
  properties.
    - title: a string
    - message: a string
    - valuesMap: an array of key-value pairs

  The console log output will take the form of:
    <module> - *[title]* [message] [valuesMap entries...]
*/
export default function logger(module) {
  const moduleUpperCase = module.toUpperCase();

  if (process.env.NODE_ENV !== 'production') {
    return function(logMessage) {
      if (enabledModules[moduleUpperCase]) {
        let outputString = moduleUpperCase + " - ";

        if ("title" in logMessage)
          outputString += "*" + logMessage.title + "* ";

        if ("message" in logMessage)
          outputString += logMessage.message + " ";

        if ("valuesMap" in logMessage) {
          outputString += logMessage.valuesMap.reduce(
            (previousValue, currentValue, currentIndex, array) => {
              return previousValue + currentValue[0] + ": " + currentValue[1] + (currentIndex !== array.length - 1 ? ", " : " ");
            }, ""
          );
        }

        console.log(outputString);
      }
    }
  }
  else
    return function() {};
}

// Parses the query string arguments for log=<module>,<module2>...
// to enable debug logging for the specified modules.
function initializeLogging() {
  // Parse query string parameters to enable logging.
  const queryStringArgs = window.location.search.replace('?', "").split('&');
  for (let i = 0; i < queryStringArgs.length; i++) {
    if (queryStringArgs[i].search(new RegExp("log=", "i")) !== -1) {
      queryStringArgs[i].substr(4).split(",").forEach( (value, index, array) => {
        enableLogging(value);
      });
    }
  }
}