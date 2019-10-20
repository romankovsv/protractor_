import {User} from "./User";

export class UserBuilder{

    user:User;

    constructor(firstName:string){
        this.user = new User(firstName);
    }

    public setPassword(password:string){
        this.user.password = password;
        return this;
    }

    public setLastName(lastName:string){
        this.user.lastName = lastName;
        return this;
    }

    public setEmail(email:string){
        this.user.email = email;
        return this;
    }

    public setUserType(userType:string){
        this.user.userType = userType;
        return this;
    }

    public build():User{
        return this.user;
    }

}