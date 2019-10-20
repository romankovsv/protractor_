import {BasePage} from "./BasePage";
import {WebElement} from "../../wrappers/WebElement";
import {By, element, browser, ExpectedConditions as EC} from "protractor";
import {Log} from "../../helpers/Log";
import {VendorContractConfirmPage} from "./VendorContractConfirmPage";
import {Properties} from "../../properties/Properties";
import Expected = jasmine.Expected;
import {LocalStorage} from "../../helpers/LocalStorage";

export class ResetPasswordPage extends BasePage {

    private resetPasswordField: WebElement;
    private passordConfirmField: WebElement;
    private createPasswordButton: WebElement;

    constructor() {
        super()
        this.resetPasswordField = new WebElement(element(By.css("#reset_password_newPassword_first")))
        this.createPasswordButton = new WebElement(element(By.css("#submit_btn_cp")))
        this.passordConfirmField = new WebElement(element(By.css("#reset_password_newPassword_second")))
    }

    public async enterPassword(password:string): Promise<VendorContractConfirmPage> {
        await Log.log().debug("Enter passwrd: Auto1" + password);

        await browser.wait(EC.visibilityOf(this.resetPasswordField),10000)
        await this.navigateToWithDisabledAngularWait(Properties.VendroQAEnv)
        await browser.manage().getCookies().then(function(cookies) {
            console.log("Cookies Before")
            console.dir(cookies);
        });

        await browser.navigate().back();
        console.log(`${LocalStorage.getValue("sessionCookie")}`)
        await (browser.manage() as any).addCookie({ name: 'PHPSESSID',
            value: `'${LocalStorage.getValue("sessionCookie")}'`,httpOnly:true, domain: 'www.qa.metro-vendorcentral.com' });
        await browser.manage().getCookies().then(function(cookies) {
            console.log("Cookies After")
            console.dir(cookies);
        });
       // await browser.navigate().back();
        await this.resetPasswordField.type("Auto1"+password);
        await this.passordConfirmField.type("Auto1"+password);
        await this.createPasswordButton.customClick();
        return new VendorContractConfirmPage();
    }
}