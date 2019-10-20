import {Generator} from "../helpers/Generator";

export class Properties{

    static VendroCentralUrl:string = `https://sms:GHnRgg4G3qf43gvdsgds@www.qa.metro-vendorcentral.com`;
    static VendroQAEnv:string = `https://sms:GHnRgg4G3qf43gvdsgds@vendor.qa.metro-vendorcentral.com`;
    static Gmail_WithNumber:string = "autotest.metro+"+Generator.generateNumber()+"@gmail.com";
    static Gmail_email:string = "autotest.metro@gmail.com";
    static Gmail_password:string = "Metro!@#123";
    static VendorCentralEmail:string = "admin@sms.com";
    static VendorCentralPassword:string = "admin";
}