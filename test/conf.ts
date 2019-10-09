// Because this file imports from  protractor, you'll need to have it as a
// project dependency. Please see the reference config: lib/config.ts for more
// information.
//
// Why you might want to create your config with typescript:
// Editors like Microsoft Visual Studio Code will have autocomplete and
// description hints.
//
// To run this example, first transpile it to javascript with `npm run tsc`,
// then run `protractor conf.js`.
import { $, browser, Config, protractor } from 'protractor';


export let config: Config = {
  framework: 'jasmine',
  capabilities: {
    browserName: 'chrome'
  },

  suites: {
    "first" : "./FirstTestSpec.js",
    "second" : "./SecondTestspec.js"
  },



  specs: [ './FirstTestSpec.js' ],
  seleniumAddress: 'http://localhost:7777/wd/hub',

  // You could set no globals to true to avoid jQuery '$' and protractor '$'
  // collisions on the global namespace.
  noGlobals: true
};
