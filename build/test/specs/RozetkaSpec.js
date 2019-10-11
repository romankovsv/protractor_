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
        define(["require", "exports", "../../src/pageobjects/HomePage", "../../src/pageobjects/ProductFragmentPage"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const HomePage_1 = require("../../src/pageobjects/HomePage");
    const ProductFragmentPage_1 = require("../../src/pageobjects/ProductFragmentPage");
    describe("Suite", () => __awaiter(void 0, void 0, void 0, function* () {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            yield new HomePage_1.HomePage().open();
        }));
        it("Test rozetka search", () => __awaiter(void 0, void 0, void 0, function* () {
            console.log("Test on rozetka has been started");
            let homePage = new HomePage_1.HomePage();
            let productPage = new ProductFragmentPage_1.ProductFragmentPage();
            // await homePage.closeAdvert();
            yield homePage.search("Apple");
            yield productPage.getPriceForItem("\n" +
                "                                Apple MacBook Pro 15\" Space Gray (Z0V100048) 2018                             ");
        }));
    }));
});
//# sourceMappingURL=RozetkaSpec.js.map