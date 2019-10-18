import {BaseFragment} from 'protractor-element-extend'
import {browser, ExpectedConditions as EC} from 'protractor'
import {Condition} from "../../src/helpers/Condition";
import {Log} from "../../src/helpers/Log";

export class Element extends BaseFragment {

    private condition: Condition;

    public constructor(element) {
        super(element)
        this.condition = new Condition();
    }

    public async customClick() {
       await Log.log().debug("Inside customClick")

        await this.condition.shouldBeClickable(this, 5);
        await browser.wait(EC.elementToBeClickable(this), 5000, `Element ${this.locator()} is not clickable`)
            .catch(async (error) => {
                await Log.log().debug(`Element ${this.locator()} is not clickable`)
            })
        await this.click().then(async () => {
            await Log.log().debug(`Element ${this.locator()} is  clicked`)
        });
    }

    public async sendKeys(text: string) {
        Log.log().debug("Inside custom sendKeys");

        browser.logger.debug("Some text")

        await  Log.log().debug("Some Message!!! on click()")
        await this.condition.shouldBeVisible(this, 5);
        await browser.wait(EC.visibilityOf(this), 5000, `Element ${this.locator()} is not visible`)
            .catch(async (error) => {
                await Log.log().debug(`Element ${this.locator()} is not clickable`)
            })
        await this.sendKeys(text).then(async () => {
            await expect(await this.getAttribute('value')).toContain(text);

            await Log.log().debug(`Element ${this.locator()} is successfully entered text:${text}`);
        });

    }

    public async select() {
        this.isSelected().then(async selected => {
            if (!selected) {
                await this.customClick()
                await browser.wait(EC.elementToBeSelected(this), 5000, `Checkbox ${this.locator()} must became selected after click, but it wasn't`)
            } else {
                await console.warn(`Checkbox ${this.locator()} was already selected, skipping select`)
            }
        })
    }

    public async unselect() {
        this.isSelected().then(async selected => {
            if (selected) {
                await this.customClick()
                await browser.wait(EC.not(EC.elementToBeSelected(this)), 5000, `Checkbox ${this.locator()} must became unselected after click, but it wasn't`)
            } else {
                await console.warn(`Checkbox ${this.locator()} was already unselected, skipping unselect`)
            }
        })
    }


}