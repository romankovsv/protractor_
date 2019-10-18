import {browser} from "protractor";
import matchers = require('jasmine-protractor-matchers');
let HtmlReporter = require('protractor-beautiful-reporter');
'use strict';
let log4js = require('log4js')
exports.config = {

    onPrepare: async () => {
        await browser.waitForAngularEnabled(true);
        browser.manage().window().maximize();
        browser.manage().timeouts().implicitlyWait(5000);

        const ConsoleReporter = require("jasmine2-reporter").Jasmine2Reporter;
        const console_reporter_options = {
            startingSpec: true
        };
        jasmine.getEnv().addReporter(new ConsoleReporter(console_reporter_options));

        beforeEach(() => {
            jasmine.addMatchers(matchers)
        });

        afterEach(async () => {
            // Clearing browser data after each test
            await browser.manage().deleteAllCookies();
            await browser.executeScript(
                "window.sessionStorage.clear(); window.localStorage.clear();"
            );
        });


        jasmine.getEnv().addReporter(new HtmlReporter({
            baseDirectory: 'tmp/reports'
            , screenshotsSubfolder: 'screenshots'
            , takeScreenShotsOnlyForFailedSpecs: true
            , docTitle: 'my reporter'
            , clientDefaults:{
                showTotalDurationIn: "header",
                totalDurationFormat: "hms"

            }
        }).getJasmine2Reporter());

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
   // specs: ['./test/specs/*[sS]pec.js'],
    specs: ['./test/specs/*[tT]ests.js'],
    SELENIUM_PROMISE_MANAGER: false,
    seleniumAddress: 'http://localhost:7777/wd/hub',
    noGlobals: false
};
