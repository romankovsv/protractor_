var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "protractor"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const protractor_1 = require("protractor");
    describe("Suite", () => __awaiter(void 0, void 0, void 0, function* () {
        it("Test rozetka", () => __awaiter(void 0, void 0, void 0, function* () {
            console.log("Test on rozetka has been started");
            var EC = protractor_1.protractor.ExpectedConditions;
            var searchField = protractor_1.$("input[name='search']");
            yield protractor_1.browser.get("https://rozetka.com.ua/");
            var isClickable = yield EC.visibilityOf(searchField);
            yield protractor_1.browser.wait(isClickable, 5000);
            yield searchField.sendKeys("Something");
            /* element(by.css(".js-app-search-suggest .search-form__submit")).getText().then(function (text) {
                console.log(text);
            })
             element.all(by.cssContainingText('.menu-categories__link',"Ноутбуки и компьютеры")).each(function(element, index) {
                 element.getText().then(function(text) {
                     console.log(text);
                 });
             });*/
        }));
        /* $$('.items li').filter(function(elem, index) {
                 return elem.getText().then(function(text) {
                     return text === 'Third';
                 });
             }).first().click();
    
             await <WebElement> $$("a.menu-categories__link");
         /!*    .filter(function (element) {
                 return element.getAttribute("href").then(function (text) {
                     return text+"".includes("computers-notebooks");
                 });
             }).first().click();*!/
    
             $(".menu-toggler__text").click();
             headings.getText().then((text)=>{
                 console.log("Heading: " + text + "\\n");
             })
             expect(true).toEqual(false);
     */
    }));
});
//# sourceMappingURL=RozetkaSpec.js.map