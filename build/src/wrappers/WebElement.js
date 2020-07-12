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
exports.WebElement = void 0;
const protractor_element_extend_1 = require("protractor-element-extend");
const protractor_1 = require("protractor");
const Condition_1 = require("../../src/helpers/Condition");
const Logger_1 = require("../helpers/Logger");
class WebElement extends protractor_element_extend_1.BaseFragment {
    constructor(element) {
        super(element);
        this.condition = new Condition_1.Condition();
    }
    customClick() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Logger_1.Logger.logs("Inside customClick");
            yield this.condition.shouldBeClickable(this, 60).catch((error) => __awaiter(this, void 0, void 0, function* () {
                yield Logger_1.Logger.logs(`Element ${this.locator()} is not clickable`);
                error.message = `Element ${this.locator()} is not clickable`;
                throw error;
            }));
            yield this.highlightElementByClick(this);
            yield this.click().then(() => __awaiter(this, void 0, void 0, function* () {
                yield Logger_1.Logger.logs(`Element ${this.locator()} is  clicked`);
            }))
                .catch((error) => {
                error.message = `Element ${this.locator()} is not clickable`;
                throw error;
            });
        });
    }
    type(text) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.Logger.logs("Inside custom sendKeys");
            yield this.condition.shouldBeVisible(this, 25)
                .catch((err) => __awaiter(this, void 0, void 0, function* () {
                yield Logger_1.Logger.logs(`Element ${this.locator()} is not visible`);
                throw err;
            }));
            yield this.clear();
            yield this.highlightElementByType(this);
            yield this.sendKeys(text).then(() => __awaiter(this, void 0, void 0, function* () {
                yield Logger_1.Logger.logs(`Element ${this.locator()} is  entered text:${text}`);
            }));
            yield protractor_1.browser.wait(protractor_1.ExpectedConditions.textToBePresentInElementValue(this, text), 5000)
                .then(null, (err) => __awaiter(this, void 0, void 0, function* () {
                const value = yield this.getAttribute('value');
                err.message = `Timeout error waiting for input value contains: ${value}`;
                Logger_1.Logger.logs('text in method:' + value);
                throw err;
            }));
        });
    }
    selectByValue(value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.condition.shouldBeVisible(this, 10);
            yield this.element(protractor_1.By.css('option[value="' + value + '"]')).click();
        });
    }
    selectByText(value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.condition.shouldBeVisible(this, 10);
            return yield this.element(protractor_1.By.xpath('option[.="' + value + '"]')).click();
        });
    }
    selectByPartialText(value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.condition.shouldBeVisible(this, 10);
            return yield this.element(protractor_1.By.cssContainingText('option', value)).click();
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
    highlightElementByClick(element) {
        return __awaiter(this, void 0, void 0, function* () {
            yield protractor_1.browser.executeScript("arguments[0].style.border='3px solid red'", element);
            yield setTimeout(() => {
            }, 700);
        });
    }
    highlightElementByType(element) {
        return __awaiter(this, void 0, void 0, function* () {
            yield protractor_1.browser.executeScript("arguments[0].style.border='3px solid yellow'", element);
            yield setTimeout(() => {
            }, 500);
        });
    }
}
exports.WebElement = WebElement;
//# sourceMappingURL=WebElement.js.map