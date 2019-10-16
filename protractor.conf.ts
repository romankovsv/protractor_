import {browser} from "protractor";
import matchers = require('jasmine-protractor-matchers');
/*var AllureReporter = require('jasmine-allure-reporter');*/

exports.config = {
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




       /* var originalAddExpectationResult = jasmine.Spec.prototype.addExpectationResult;
        jasmine.Spec.prototype.addExpectationResult = function () {
            if (!arguments[0]) {
                browser.takeScreenshot().then(function (png) {
                    allure.createAttachment('Screenshot', function () {
                        return new Buffer(png, 'base64')
                    }, 'image/png')();
                })
            }
            return originalAddExpectationResult.apply(this, arguments);
        };*/


        /*  jasmine.getEnv().addReporter(new AllureReporter({
              resultsDir: 'allure-results'
          }));*/


        var AllureReporter = require('jasmine-allure-reporter');
        var reporter = new AllureReporter({
            allureReport : {
                resultsDir : 'allure-results'
            }
        });
   /*     jasmine.getEnv().afterEach(async function() {
            const png = await browser.takeScreenshot()
            await reporter.createAttachment('Screenshot', function () {
                return new Buffer(png, 'base64')
            }, 'image/png')();
        });
*/

    },

    baseUrl: 'https://testing-angular-applications.github.io',
    framework: 'jasmine2',
    capabilities: {
        browserName: 'chrome'
    },
    suites: {
        "first": "./FirstTestSpec.js",
        "second": "./SecondTestspec.js"
    },
    specs: ['./test/specs/*[sS]pec.js'],
    SELENIUM_PROMISE_MANAGER: false,
    seleniumAddress: 'http://localhost:7777/wd/hub',
    // You could set no globals to true to avoid jQuery '$' and protractor '$'
    // collisions on the global namespace.
    noGlobals: true
};
