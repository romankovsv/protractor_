import {WebElement} from "../../wrappers/WebElement";
import {Logger} from "../../helpers/Logger";
import {browser, By, element, ExpectedConditions} from "protractor";
import {ResetPasswordPage} from "./ResetPasswordPage";

export class GmailMainPage {


    private searchInPost: WebElement;
    private firstEmail: WebElement;
    private goToVendorOfficeButton: WebElement;

    constructor() {
        this.searchInPost = new WebElement(element(By.name("q")))
        this.firstEmail = new WebElement(element(By.xpath("(//tbody/tr[1]//span[1]/span[@name='Vendor Office'])[last()]")))
        this.goToVendorOfficeButton = new WebElement(element(By.xpath("(//a[contains(@href, 'grid')])[1]")))
    }

    public async activateAccount(): Promise<ResetPasswordPage> {
        await Logger.log().debug("Activate account")

        await browser.wait(ExpectedConditions.elementToBeClickable(element(By.xpath("(//tbody/tr[1]//span[1]/span[@name='Vendor Office'])[last()]"))))
        await element(By.xpath("(//tbody/tr[1]//span[1]/span[@name='Vendor Office'])[last()]")).click()
        // await this.firstEmail.click();
        await this.goToVendorOfficeButton.customClick();
        await browser.getAllWindowHandles().then(function (handles) {
            browser.switchTo().window(handles[1]).then(function () {

            });
        });
        return new ResetPasswordPage();
    }

}