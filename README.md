# Authentication - Jobhub

[![Build Status](https://travis-ci.com/scrum-gang/authentication.svg?branch=master)](https://travis-ci.com/scrum-gang/authentication)
[![Coverage Status](https://coveralls.io/repos/github/scrum-gang/authentication/badge.svg?branch=master)](https://coveralls.io/github/scrum-gang/authentication?branch=master)

## Description

Provides authentication/user management for all jobhub microservices. Uses JWT for authentication.

Each user has the following attributes:

- `id`: A unique ID generated for each user.
- `email`: An email address used for login.
- `password`: The users password. All passwords are hashed using bcrypt.
- `type`: The type of user. Can be Applicant or Recruiter.
- `verified`: Whether the user has verfied their email after creating their account. Required to be able to login.

## Getting Started

```bash
git clone https://github.com/scrum-gang/authentication.git
cd authentication
npm install
npm start
```

## Deployment

Builds are automated using Travis and deployed on Heroku.

There are two Heroku deployments:

- Staging: <https://jobhub-authentication-staging.herokuapp.com/>
- Production: <https://jobhub-authentication.herokuapp.com/>

The staging deployment should be used for all development/testing purposes, in order to keep production from being poluted with test data.

Please note that any new builds on the **development** branch will **wipe** the staging database.

## Typical usage

1. Create user using `/signup`.
2. Verify new user by clicking link in email received.
3. Login using `/login`, keep JWT token.
4. Can get logged in user using `/users/self` and passing token in header.

## API Docs

- [Get users](doc/getUsers.md) : `GET /users`
- [Get user by id](doc/getUserID.md) : `GET /users/:id`
- [Update user by id](doc/putUser.md) : `PUT /users/:id`
- [Delete user by id](doc/deleteUser.md) : `DELETE /users/:id`
- [Signup new user](doc/signup.md) : `POST /signup`
- [Login existing user](doc/login.md) : `POST /login`
- [Logout user](doc/logout.md) : `POST /logout`
- [Get user from token](doc/self.md) : `GET /users/self`
- [Resend verification email for unverified user](doc/resend.md) : `POST /resend`
