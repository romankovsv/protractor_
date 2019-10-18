import {Condition} from "../../helpers/Condition";
import {Element} from "../../wrappers/Element";
import {browser, By, element} from "protractor";
import {Generator} from "../../helpers/Generator";
import {User} from "../../models/User";

export class SMSHomePage {

    private condition: Condition;
    private sideBar_Suppliers_Menu: Element;
    private sidebar_suppliers_users: Element;
    private addUserButton: Element;
    private userTypeSelector: Element;
    private saveUserButton: Element;
    private firstNameField: Element;
    private lastNameField: Element;
    private emailField: Element;


    constructor() {
        this.condition = new Condition();
        this.sideBar_Suppliers_Menu = new Element(element(By.css("li[data-section-name='suppliers'] .menu-text")));
        this.sidebar_suppliers_users = new Element(element(By.xpath("//a[@data-name='pages.users']")))
        this.addUserButton = new Element(element(By.css("button[href='/profiles/add']")))
        this.userTypeSelector = new Element(element(By.id("new_user_type")))
        this.firstNameField = new Element(element(By.id("new_user_firstName")))
        this.lastNameField = new Element(element(By.id("new_user_lastName")))
        this.emailField = new Element(element(By.id("new_user_email")))
        this.saveUserButton = new Element(element(By.css("form[name='new_user'] .btn-success")))
        this.condition.shouldBeClickable(this.sideBar_Suppliers_Menu, 30)

    }

    public async clickAddNewUser(): Promise<SMSHomePage> {
        await this.sideBar_Suppliers_Menu.customClick();
        await this.sidebar_suppliers_users.customClick();
        await this.addUserButton.customClick()
        return this;
    }

    public async addNewUser(user:User): Promise<SMSHomePage> {
        await this.userTypeSelector.selectByValue(user.userType);
        await this.firstNameField.type(user.firstName);
        await this.lastNameField.type(user.lastName);
        await this.emailField.type(user.email);
        await this.saveUserButton.customClick();
        await browser.sleep(10000)

        return this;
    }


    /*

     public SMS_HomePage clickAddNewUser(){
        logToAllure("Click suppliers menu");

        sideBar_Suppliers_Menu.waitUntil(visible, 15000) ;
        sideBar_Suppliers_Menu.click();
        logToAllure("Click users on sidebar");
        sidebar_suppliers_users.waitUntil(visible, 5000) ;
        sidebar_suppliers_users.click();
        logToAllure("Click add new user button");
        addUserButton.click();
        return this;
    }
     @FindBy(xpath = "//a[@data-name='pages.users']")
    private SelenideElement sidebar_suppliers_users;

    @FindBy(css = "button[href='/profiles/add']")
    private SelenideElement addUserButton;

    @FindBy(css = "li[data-section-name='suppliers'] .menu-text")
    private SelenideElement sideBar_Suppliers_Menu;

    @FindBy(css = "form[name='new_user'] .btn-success")
    private SelenideElement saveUserButton;

    @FindBy(id = "new_user_email")
    private WebElement emailField;

    @FindBy(id = "new_user_firstName")
    private SelenideElement firstNameField;

    @FindBy(id = "new_user_lastName")
    private SelenideElement lastNameField;

    @FindBy(id = "new_user_type")
    private SelenideElement userTypeSelector;

    @FindBy(css  =".select2-results__option")
    private ElementsCollection rolesOptions;

    @FindBy(css = ".select2-search__field")
    private SelenideElement rolesField;

    @FindBy(css = ".callout-success")
    private SelenideElement successMessage;


     */


}