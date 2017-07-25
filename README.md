## MasaBlog
Sample Blog with Node.js (ExpressJS) and MySQL

### Installation
Step 1. Clone files from repository

Step 2. Create environments and environments.js
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

exports.MAIL_USER = "{Email address}";
exports.MAIL_PASSWORD = "{Email Password}";
```

Step 3.Start MySQL by command and Create Database from `docs/db_configuration.sql`
```bash
$ docker-compose up -d
```

Step 4. Run following command to start application
```bash
$ npm install
$ npm start
```

### Configuration
#### Admin Login
```bash
Username: root
Password: admin
```