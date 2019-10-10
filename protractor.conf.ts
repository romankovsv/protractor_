import {browser} from "protractor";


exports.config =  {
    onPrepare: async () => {
        await browser.waitForAngularEnabled(false);
    },

    framework: 'jasmine',
    capabilities: {
        browserName: 'chrome'
    },
    suites: {
        "first" : "./FirstTestSpec.js",
        "second" : "./SecondTestspec.js"
    },
    specs: [ './test/FirstTestSpec.js' ],
    SELENIUM_PROMISE_MANAGER: false,
    seleniumAddress: 'http://localhost:7777/wd/hub',
    // You could set no globals to true to avoid jQuery '$' and protractor '$'
    // collisions on the global namespace.
    noGlobals: true
};
