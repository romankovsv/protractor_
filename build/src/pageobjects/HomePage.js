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
const BasePage_1 = require("./BasePage");
const protractor_1 = require("protractor");
const selenium_webdriver_1 = require("selenium-webdriver");
class HomePage extends BasePage_1.BasePage {
    constructor() {
        super();
        // protected searchField = $("input[name='search']");
        this.searchField = protractor_1.browser.driver.findElement(selenium_webdriver_1.By.css("input[name='search']"))
            .then((elem) => {
            return elem;
        });
        this.closeAdvertButton = protractor_1.$("span.exponea-close");
        /* this.searchButton = $(".search-form .search-form__submit");
         let isClickable = HomePage.EC.elementToBeClickable(this.searchButton);
         browser.wait(isClickable, 5000);*/
    }
    search(item) {
        return __awaiter(this, void 0, void 0, function* () {
            yield protractor_1.browser.driver.findElement(selenium_webdriver_1.By.css("input[name='search']")).sendKeys(item);
            yield protractor_1.browser.driver.findElement(selenium_webdriver_1.By.css(".search-form .search-form__submit")).click();
            //await this.searchButton.click();
        });
    }
    closeAdvert() {
        return __awaiter(this, void 0, void 0, function* () {
            let isClickableSPan = yield HomePage.EC.elementToBeClickable(this.closeAdvertButton);
            yield protractor_1.browser.wait(isClickableSPan, 5000);
            yield this.closeAdvertButton.click();
        });
    }
}
exports.HomePage = HomePage;
//# sourceMappingURL=HomePage.js.map