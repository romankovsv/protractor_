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
exports.ProductFragmentPage = void 0;
const BaseFragment_1 = require("./BaseFragment");
const protractor_1 = require("protractor");
class ProductFragmentPage extends BaseFragment_1.BaseFragment {
    getPriceForItem(name) {
        return __awaiter(this, void 0, void 0, function* () {
            this.productTitles = yield protractor_1.$$("div[data-location='ProducerPage'] div[class*='title'] a");
            yield console.log(this.productTitles.map((elements) => {
                for (let i = 0; i < elements.length; i++) {
                    console.log(elements[i].getText());
                }
            }));
        });
    }
}
exports.ProductFragmentPage = ProductFragmentPage;
//# sourceMappingURL=ProductFragmentPage.js.map