import {browser} from "protractor";
import matchers = require('jasmine-protractor-matchers');

let HtmlReporter = require('protractor-beautiful-reporter');
'use strict';
let log4js = require('log4js');
declare const allure: any;

exports.config = {

    baseUrl: 'https://testing-angular-applications.github.io',
    framework: 'jasmine2',
    seleniumAddress: 'http://localhost:4444/wd/hub',
    capabilities: {
        browserName: 'chrome',
        shardTestFiles: false,
        maxInstances: 2,
        idleTimeout: 120,
        locationContextEnabled: true,
        javascriptEnabled: true,
        acceptSslCerts: true,
        trustAllSSLCertificates: true,
        acceptInsecureCerts: true,
        ignoreUncaughtExceptions: true,
        handlesAlerts: true,
        chromeOptions: {
            args: [
                '--disable-popup-blocking',
                '--no-sandbox',
                '--test-type=browser',
                '--disable-infobars',
                '--start-maximized',
                '--ignore-certificate-errors',
                '--disable-web-security'
            ]
        }
    },
    suites: {
        "first": "./FirstTestSpec.js",
        "second": "./SecondTestspec.js"
    },

    //specs: ['./test/specs/*[sS]pecs.js'],
   // specs: ['./test/specs/*[tT]ests.js'],
    specs: ['./test/specs/*RozetkaSpec.js'],
    SELENIUM_PROMISE_MANAGER: false,

    noGlobals: false,

    jasmineNodeOpts: {
        showColors: true,
        silent: true,
        defaultTimeoutInterval: 120000,
        isVerbose: true,
    },

    onPrepare: async () => {
        await browser.waitForAngularEnabled(false);
        browser.manage().window().maximize();
        browser.manage().timeouts().implicitlyWait(5000);

        const ConsoleReporter = require("jasmine2-reporter").Jasmine2Reporter;
        const console_reporter_options = {
            startingSpec: true,
            displayStackTrace: true
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
            , clientDefaults: {
                showTotalDurationIn: "header",
                totalDurationFormat: "hms"
            }
        }).getJasmine2Reporter());

        let AllureReporter = require('jasmine-allure-reporter');
        jasmine.getEnv().addReporter(new AllureReporter({
            resultsDir: 'allure-results'
        }));

        jasmine.getEnv().addReporter(new AllureReporter());
        jasmine.getEnv().afterEach(function(done){
            browser.takeScreenshot().then(function (png) {
                allure.createAttachment('Screenshot', function () {
                    return new Buffer(png, 'base64')
                }, 'image/png')();
                done();
            })
        });

    },




};
