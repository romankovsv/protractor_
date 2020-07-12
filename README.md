Protractor<br/>

1. Execute: <br/>
    webdriver-manager update<br/>
    webdriver-manager start
2. To run test:
npm run test
(this command will clean tmp and logs folders, than executes
protractor protractor.conf.js command to execute tests and automatically 
opens allure report in browser )

3. Which tests to run could be set in protractor.conf.ts

4. Report is in tmp/reports/report.html

5. Allure report could be generated either by allure serve or 
by allure generate allure open (report is stored in allure-report folder)
