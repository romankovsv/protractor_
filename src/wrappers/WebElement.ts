import {BaseFragment} from 'protractor-element-extend'
import {browser, By, ElementFinder, ExpectedConditions as EC} from 'protractor'
import {Condition} from "../../src/helpers/Condition";
import {Logger} from "../helpers/Logger";

export class WebElement extends BaseFragment {

    private condition: Condition;

    public constructor(element) {
        super(element)
        this.condition = new Condition();
    }

    public async customClick() {
        await Logger.logs("Inside customClick")

        await this.condition.shouldBeClickable(this, 60).catch(async (error) => {
            await Logger.logs(`Element ${this.locator()} is not clickable`)
            error.message = `Element ${this.locator()} is not clickable`
            throw error;
        });


        await this. highlightElementByClick(this);

        await this.click().then(async () => {
            await Logger.logs(`Element ${this.locator()} is  clicked`)
        })
            .catch((error) => {
                error.message = `Element ${this.locator()} is not clickable`
                throw error;
            });
    }

    public async type(text: string) {
        Logger.logs("Inside custom sendKeys");
        await this.condition.shouldBeVisible(this, 25)
            .catch(async (err) => {
                await Logger.logs(`Element ${this.locator()} is not visible`)
                throw err;
            });

        await this.clear();
        await this.highlightElementByType(this);
        await this.sendKeys(text).then(async () => {
            await Logger.logs(`Element ${this.locator()} is  entered text:${text}`);
        });
        await browser.wait(EC.textToBePresentInElementValue(this, text), 5000)
            .then(null, async (err) => {
                const value = await this.getAttribute('value');
                err.message = `Timeout error waiting for input value contains: ${value}`;
                Logger.logs('text in method:' + value)
                throw err;
            });
    }

    public async selectByValue(value: string) {
        await this.condition.shouldBeVisible(this, 10)
        await this.element(By.css('option[value="' + value + '"]')).click()
    }

    public async selectByText(value: string) {
        await this.condition.shouldBeVisible(this, 10)
        return await this.element(By.xpath('option[.="' + value + '"]')).click();
    }

    public async selectByPartialText(value: string) {
        await this.condition.shouldBeVisible(this, 10)
        return await this.element(By.cssContainingText('option', value)).click();
    }

    public async check() {
        this.isSelected().then(async selected => {
            if (!selected) {
                await this.click()
                await browser.wait(EC.elementToBeSelected(this), 5000, `Checkbox ${this.locator()} must became selected after click, but it wasn't`)
            } else {
                await console.warn(`Checkbox ${this.locator()} was already selected, skipping select`)
            }
        })
    }

    public async uncheck() {
        this.isSelected().then(async selected => {
            if (selected) {
                await this.click()
                await browser.wait(EC.not(EC.elementToBeSelected(this)), 5000, `Checkbox ${this.locator()} must became unselected after click, but it wasn't`)
            } else {
                await console.warn(`Checkbox ${this.locator()} was already unselected, skipping unselect`)
            }
        })
    }

    private async highlightElementByClick(element: ElementFinder) {
        await browser.executeScript("arguments[0].style.border='3px solid red'", element);
        await setTimeout(() => {
        }, 700)
    }

    private async highlightElementByType(element: ElementFinder) {
        await browser.executeScript("arguments[0].style.border='3px solid yellow'", element);
        await setTimeout(() => {
        }, 500)
    }
}