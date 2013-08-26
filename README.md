# ChoreShare

A simple, collaborative task manager that helps delegate shared tasks between a group of people.

## Requirements
1. node (http://nodejs.org/)
2. geddy `sudo npm install -g geddy`
3. mongo (http://www.mongodb.org/)

## Getting Started
1. Run `npm install` to install required packages
2. Create `config/secrets.json` that contains api keys from required services
```
{
  "mailer": {
        "service": "Gmail",
        "auth": {
          "user": "XXXXXX",
          "pass": "XXXXXX"
        }
  },
  "passport": {
    "successRedirect": "/",
    "failureRedirect": "/login",
    "twitter": {
      "consumerKey": "XXXXX",
      "consumerSecret": "XXXXX"
    },
    "facebook": {
      "clientID": "XXXXX",
      "clientSecret": "XXXXX"
    },
  },
  "secret": "XXXXXXXXXXXXXXXXXX"
}
```
3. Run `geddy` to start the server