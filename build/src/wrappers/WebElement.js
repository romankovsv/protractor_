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
const protractor_element_extend_1 = require("protractor-element-extend");
const protractor_1 = require("protractor");
const Condition_1 = require("../../src/helpers/Condition");
const Log_1 = require("../../src/helpers/Log");
class WebElement extends protractor_element_extend_1.BaseFragment {
    constructor(element) {
        super(element);
        this.condition = new Condition_1.Condition();
    }
    customClick() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Log_1.Log.log().debug("Inside customClick");
            yield this.condition.shouldBeClickable(this, 60).catch(() => __awaiter(this, void 0, void 0, function* () {
                yield Log_1.Log.log().debug(`Element ${this.locator()} is not clickable`);
            }));
            yield this.click().then(() => __awaiter(this, void 0, void 0, function* () {
                yield Log_1.Log.log().debug(`Element ${this.locator()} is  clicked`);
            }));
        });
    }
    type(text) {
        return __awaiter(this, void 0, void 0, function* () {
            Log_1.Log.log().debug("Inside custom sendKeys");
            yield this.condition.shouldBeVisible(this, 25)
                .catch(() => __awaiter(this, void 0, void 0, function* () {
                yield Log_1.Log.log().debug(`Element ${this.locator()} is not visible`);
            }));
            yield this.sendKeys(text).then(() => __awaiter(this, void 0, void 0, function* () {
                yield Log_1.Log.log().debug(`Element ${this.locator()} is successfully entered text:${text}`);
            }));
        });
    }
    selectByValue(value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.condition.shouldBeVisible(this, 10);
            this.element(protractor_1.By.css('option[value="' + value + '"]')).click();
        });
    }
    selectByText(value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.condition.shouldBeVisible(this, 10);
            return this.element(protractor_1.By.xpath('option[.="' + value + '"]')).click();
        });
    }
    selectByPartialText(value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.condition.shouldBeVisible(this, 10);
            return this.element(protractor_1.By.cssContainingText('option', value)).click();
        });
    }
    check() {
        return __awaiter(this, void 0, void 0, function* () {
            this.isSelected().then((selected) => __awaiter(this, void 0, void 0, function* () {
                if (!selected) {
                    yield this.click();
                    yield protractor_1.browser.wait(protractor_1.ExpectedConditions.elementToBeSelected(this), 5000, `Checkbox ${this.locator()} must became selected after click, but it wasn't`);
                }
                else {
                    yield console.warn(`Checkbox ${this.locator()} was already selected, skipping select`);
                }
            }));
        });
    }
    uncheck() {
        return __awaiter(this, void 0, void 0, function* () {
            this.isSelected().then((selected) => __awaiter(this, void 0, void 0, function* () {
                if (selected) {
                    yield this.click();
                    yield protractor_1.browser.wait(protractor_1.ExpectedConditions.not(protractor_1.ExpectedConditions.elementToBeSelected(this)), 5000, `Checkbox ${this.locator()} must became unselected after click, but it wasn't`);
                }
                else {
                    yield console.warn(`Checkbox ${this.locator()} was already unselected, skipping unselect`);
                }
            }));
        });
    }
}
exports.WebElement = WebElement;
//# sourceMappingURL=WebElement.js.map