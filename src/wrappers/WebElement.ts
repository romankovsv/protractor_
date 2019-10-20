import {BaseFragment} from 'protractor-element-extend'
import {browser, ExpectedConditions as EC, By} from 'protractor'
import {Condition} from "../../src/helpers/Condition";
import {Log} from "../../src/helpers/Log";

export class WebElement extends BaseFragment {

    private condition: Condition;

    public constructor(element) {
        super(element)
        this.condition = new Condition();
    }

    public async customClick() {
       await Log.log().debug("Inside customClick")

        await this.condition.shouldBeClickable(this, 60).catch(async ()=>{
            await Log.log().debug(`Element ${this.locator()} is not clickable`)
        });
        await this.click().then(async () => {
            await Log.log().debug(`Element ${this.locator()} is  clicked`)
        });
    }

    public async type(text: string) {
        Log.log().debug("Inside custom sendKeys");
        await this.condition.shouldBeVisible(this, 25)
            .catch(async ()=>{
            await Log.log().debug(`Element ${this.locator()} is not visible`)
        });

        await this.sendKeys(text).then(async () => {
            await Log.log().debug(`Element ${this.locator()} is successfully entered text:${text}`);
        });
    }

    public async selectByValue(value:string){
        await this.condition.shouldBeVisible(this, 10)
        this.element(By.css('option[value="' + value + '"]')).click()
    }

    public async selectByText(value:string){
        await this.condition.shouldBeVisible(this, 10)
        return this.element(By.xpath('option[.="' + value + '"]')).click();
    }

    public async selectByPartialText(value:string){
        await this.condition.shouldBeVisible(this, 10)
        return this.element(By.cssContainingText('option', value)).click();
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
}