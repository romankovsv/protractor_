import {Generator} from "../helpers/Generator";

export class Properties{

    static VendroCentralUrl:string = ``;
    static VendroQAEnv:string = ``;
    static Gmail_WithNumber:string = "autotest.vendor+"+Generator.generateNumber()+"@gmail.com";
    static Gmail_email:string = "autotest.vendor@gmail.com";
    static Gmail_password:string = "";
    static VendorCentralEmail:string = "admin@gmail.com";
    static VendorCentralPassword:string = "";
    static Creds:string = "";
}
