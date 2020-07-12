"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const protractor_1 = require("protractor");
const matchers = require("jasmine-protractor-matchers");
let HtmlReporter = require('protractor-beautiful-reporter');
'use strict';
let log4js = require('log4js');
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
    onPrepare: () => __awaiter(void 0, void 0, void 0, function* () {
        yield protractor_1.browser.waitForAngularEnabled(false);
        protractor_1.browser.manage().window().maximize();
        protractor_1.browser.manage().timeouts().implicitlyWait(5000);
        const ConsoleReporter = require("jasmine2-reporter").Jasmine2Reporter;
        const console_reporter_options = {
            startingSpec: true,
            displayStackTrace: true
        };
        jasmine.getEnv().addReporter(new ConsoleReporter(console_reporter_options));
        beforeEach(() => {
            jasmine.addMatchers(matchers);
        });
        afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
            yield protractor_1.browser.manage().deleteAllCookies();
            yield protractor_1.browser.executeScript("window.sessionStorage.clear(); window.localStorage.clear();");
        }));
        jasmine.getEnv().addReporter(new HtmlReporter({
            baseDirectory: 'tmp/reports',
            screenshotsSubfolder: 'screenshots',
            takeScreenShotsOnlyForFailedSpecs: true,
            docTitle: 'my reporter',
            clientDefaults: {
                showTotalDurationIn: "header",
                totalDurationFormat: "hms"
            }
        }).getJasmine2Reporter());
        let AllureReporter = require('jasmine-allure-reporter');
        jasmine.getEnv().addReporter(new AllureReporter({
            resultsDir: 'allure-results'
        }));
        jasmine.getEnv().addReporter(new AllureReporter());
        jasmine.getEnv().afterEach(function (done) {
            protractor_1.browser.takeScreenshot().then(function (png) {
                allure.createAttachment('Screenshot', function () {
                    return new Buffer(png, 'base64');
                }, 'image/png')();
                done();
            });
        });
    }),
};
//# sourceMappingURL=protractor.conf.js.map