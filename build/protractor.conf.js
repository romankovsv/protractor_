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
    onPrepare: () => __awaiter(void 0, void 0, void 0, function* () {
        yield protractor_1.browser.waitForAngularEnabled(true);
        protractor_1.browser.manage().window().maximize();
        protractor_1.browser.manage().timeouts().implicitlyWait(5000);
        const ConsoleReporter = require("jasmine2-reporter").Jasmine2Reporter;
        const console_reporter_options = {
            startingSpec: true
        };
        jasmine.getEnv().addReporter(new ConsoleReporter(console_reporter_options));
        beforeEach(() => {
            jasmine.addMatchers(matchers);
        });
        afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Clearing browser data after each test
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
    }),
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
    noGlobals: false
};
//# sourceMappingURL=protractor.conf.js.map