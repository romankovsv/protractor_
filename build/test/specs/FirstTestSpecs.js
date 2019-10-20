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
const email_1 = require("../../src/email");
const fs = require('fs');
const readline = require('readline');
describe("Suite", function () {
    return __awaiter(this, void 0, void 0, function* () {
        it("First Test on protractor", function () {
            return __awaiter(this, void 0, void 0, function* () {
                console.log("Test is started");
                fs.readFile('credentials.json', (err, content) => {
                    console.log("Method readFile has been called");
                    if (err)
                        return console.log('Error loading client secret file:', err);
                    email_1.authorize(JSON.parse(content), email_1.listMessages);
                });
                let EC = protractor_1.protractor.ExpectedConditions;
                let button = protractor_1.$('#xyz');
                let isClickable = EC.elementToBeClickable(button);
                yield protractor_1.browser.get("http://todomvc.com/examples/angular2/");
                let b = yield protractor_1.$(".new-todo");
                let clickable = yield EC.elementToBeClickable(b);
                yield protractor_1.browser.wait(clickable, 5000);
                yield b.sendKeys("My note is here");
            });
        });
    });
});
//# sourceMappingURL=FirstTestSpecs.js.map