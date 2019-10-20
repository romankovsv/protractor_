"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("./User");
class UserBuilder {
    constructor(firstName) {
        this.user = new User_1.User(firstName);
    }
    setPassword(password) {
        this.user.password = password;
        return this;
    }
    setLastName(lastName) {
        this.user.lastName = lastName;
        return this;
    }
    setEmail(email) {
        this.user.email = email;
        return this;
    }
    setUserType(userType) {
        this.user.userType = userType;
        return this;
    }
    build() {
        return this.user;
    }
}
exports.UserBuilder = UserBuilder;
//# sourceMappingURL=UserBuilder.js.map