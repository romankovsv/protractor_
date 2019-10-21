import {BasePage} from "./BasePage";
import {WebElement} from "../../wrappers/WebElement";
import {$$, browser, By, element, ExpectedConditions} from "protractor";
import {Logger} from "../../helpers/Logger";
import {VendorPortalCompanyFields} from "./VendorPortalCompanyFields";

export class VendorContractConfirmPage extends BasePage {


    private checboxTermsOfUse: WebElement;
    private buttonProceed: WebElement;
    //private uploadProductData  = new WebElement(By.css(".button.button__upload"));
    //private nextButton = new WebElement(By.css(".vendor-contract--footer button[kind='primaryRaised']"));


    constructor() {
        super();
        this.checboxTermsOfUse = new WebElement(element(By.css(".modal-dialog .m-checkbox-inputIcon")))
        // this.buttonProceed = new WebElement(element(By.css(".send-email-modal--footer button")))
        // this.nextButton = new WebElement(By.css(".vendor-contract--footer button[kind='primaryRaised']"))
        //this.uploadProductData = new WebElement(By.css(".button.button__upload"))
    }

    public async acceptTerms(): Promise<VendorPortalCompanyFields> {
        await Logger.logs("Accept terms")
        await browser.wait(ExpectedConditions.elementToBeClickable(element(By.css(".m-checkbox svg"))), 30000)
        await browser.wait(ExpectedConditions.visibilityOf(element(By.css(".m-checkbox svg"))), 30000)
        await new WebElement(element(By.css(".m-checkbox svg"))).customClick();
        await this.condition.shouldBeClickable(element(By.css(".vendor-contract--footer button[kind='primaryRaised']")), 10);

        await this.condition.shouldBeVisible(element(By.css(".vendor-contract--footer button[kind='primaryRaised']")), 10);

        let scrolldown = await $$(".vendor-contract--footer button[kind='primaryRaised']").get(0);
        await browser.controlFlow().execute(async function () {
            await browser.executeScript('arguments[0].scrollIntoView(true)', scrolldown.getWebElement());
        });

        await element(By.css(".vendor-contract--footer button[kind='primaryRaised']")).click();
        return new VendorPortalCompanyFields();
    }

}