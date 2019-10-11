import {browser} from "protractor";
import matchers = require('jasmine-protractor-matchers')

exports.config =  {
    onPrepare: async () => {
        await browser.waitForAngularEnabled(false);

        const ConsoleReporter = require("jasmine2-reporter").Jasmine2Reporter;
        const console_reporter_options = {
            startingSpec: true
        };
        jasmine.getEnv().addReporter(new ConsoleReporter(console_reporter_options));

        beforeEach(() => {
            // Adding .toAppear() and .toDisappear() into available matchers.
            // https://github.com/Xotabu4/jasmine-protractor-matchers
            jasmine.addMatchers(matchers)
        });

        afterEach(async () => {
            // Clearing browser data after each test
            await browser.manage().deleteAllCookies();
            await browser.executeScript(
                "window.sessionStorage.clear(); window.localStorage.clear();"
            );
        });
    },

    framework: 'jasmine',
    capabilities: {
        browserName: 'chrome'
    },
    suites: {
        "first" : "./FirstTestSpec.js",
        "second" : "./SecondTestspec.js"
    },
    specs: [ './test/specs/*[sS]pec.js' ],
    SELENIUM_PROMISE_MANAGER: false,
    seleniumAddress: 'http://localhost:7777/wd/hub',
    // You could set no globals to true to avoid jQuery '$' and protractor '$'
    // collisions on the global namespace.
    noGlobals: true
};
