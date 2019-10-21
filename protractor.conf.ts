import {browser} from "protractor";
import matchers = require('jasmine-protractor-matchers');
let HtmlReporter = require('protractor-beautiful-reporter');
'use strict';
let log4js = require('log4js')

exports.config = {

    baseUrl: 'https://testing-angular-applications.github.io',
    framework: 'jasmine2',
    capabilities: {
        browserName: 'chrome'
    },
    suites: {
        "first": "./FirstTestSpec.js",
        "second": "./SecondTestspec.js"
    },

    specs: ['./test/specs/*[sS]pecs.js'],
    //specs: ['./test/specs/*[tT]ests.js'],
    SELENIUM_PROMISE_MANAGER: false,
    seleniumAddress: 'http://localhost:7777/wd/hub',
    noGlobals: false,

    jasmineNodeOpts:{
        showColors:true,
        silent:true,
        defaultTimeoutInterval:60000,
        isVerbose: true,
    },

    onPrepare: async () => {
        await browser.waitForAngularEnabled(true);
        browser.manage().window().maximize();
        browser.manage().timeouts().implicitlyWait(5000);

        const ConsoleReporter = require("jasmine2-reporter").Jasmine2Reporter;
        const console_reporter_options = {
            startingSpec: true,
            displayStackTrace:true
        };
        jasmine.getEnv().addReporter(new ConsoleReporter(console_reporter_options));

        beforeEach(() => {
            jasmine.addMatchers(matchers)
        });

        afterEach(async () => {
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



};
