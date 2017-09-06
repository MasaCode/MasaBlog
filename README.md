## MasaBlog
Sample Blog with Node.js (ExpressJS) and MySQL

### Installation
Step 1. Clone files from repository

Step 2. Create `environments` and `environments.js`

environments
```bash
MYSQL_DATABASE={Database Name}
MYSQL_USER={User}
MYSQL_PASSWORD={Password}
```
environments.js
```js
exports.MYSQL_DATABASE = "{Database Name}";
exports.MYSQL_USER = "{MySQL User}";
exports.MYSQL_PASSWORD = "{MySQL Password}";
    
exports.BLOG_NAME = '{Blog Name}';
exports.BLOG_HOME_DESC = '{Blog Description}';
    
exports.MAIL_PROVIDER = '{Mail Provider}';
exports.MAIL_SENDER_USER = '{Mail address that you want to use to send mail from}';
exports.MAIL_SENDER_PASSWORD = '{Password for Mail Sender}';
exports.MAIL_RECEIVER_USER = '{Mail address that you want to receive email}';
exports.MAIL_RECEIVER_PASSWORD = '{Password for Mail receiver}';
```

Step 3.Start MySQL by command below and Create Database from `docs/db_configuration.sql`
```bash
$ docker-compose up -d
```

Step 4. Run following command to start application
```bash
$ npm install
$ npm start
```

Step 5. Get your OpenWeather API Key from [OpenWeather](https://openweathermap.org/) and Set your location and key at [Profile page](http://localhost:3000/admin/profile)

Step 6. Enojoy!!

### Configuration
#### Initial Admin Login
```bash
Username: root
Password: admin
```

#### Gmail Integration (via gmail api)
##### **Turn on the Gmail API**
1. Use this [wizard](https://console.developers.google.com/flows/enableapi?apiid=gmail&hl=ja&pli=1) to create or select a project in the Google Developers Console and automatically turn on the API. Click **Continue**, then Go to **credentials**.
2. On the **Add credentials to your project page**, click the **Cancel** button.
3. At the top of the page, select the **OAuth consent screen** tab. Select an **Email address**, enter a **Product name** if not already set, and click the **Save** button.
4. Select the **Credentials** tab, click the **Create credentials** button and select **OAuth client ID**.
5. Select the application type **Web Application**, enter the name that you like, and click the **Create** button.
6. Click **OK** to dismiss the resulting dialog.
7. Click the :arrow_down: (Download JSON) button to the right of the **client ID**.

##### **Change admin settings to integrate with gmail**
1. Go to your admin potal's [Profile](http://localhost:3000/admin/profile) page and copy and past downloaded **client ID json** file.

##### **Authorize your google account**
1. After update your profile, you will see **Email** at side menu and click it.
2. Then you should see red button with **Authorize** text.
3. You click it and you will allow your google account to allow full permission

##### **After authorized your account**
1. After you that, you are good to go and you can read, writer and modify your email!