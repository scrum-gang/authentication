# Authentication - Jobhub

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/f193348b2004466ba69f53bec6f9de9a)](https://www.codacy.com/app/alexH2456/authentication?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=scrum-gang/authentication&amp;utm_campaign=Badge_Grade)
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

## [User Schema](doc/User.md)

Details all the fields in the User model.

## API Docs

- [Get users](doc/getUsers.md) : `GET /users`
- [Get user by id](doc/getUserID.md) : `GET /users/:id`
- [Update user by id](doc/putUser.md) : `PUT /users/:id`
- [Delete user by id](doc/deleteUser.md) : `DELETE /users/:id`
- [Signup new user](doc/signup.md) : `POST /signup`
- [Login existing user](doc/login.md) : `POST /login`
- [Logout user](doc/logout.md) : `POST /logout`
- [Get user from token](doc/selfGet.md) : `GET /users/self`
- [Update user from token](doc/selfPut.md) : `PUT /users/self`
- [Delete user from token](doc/selfDel.md) : `DELETE /users/self`
- [Resend verification email for unverified user](doc/resend.md) : `POST /resend`

## Endpoint Restrictions

All `users` endpoints except for `/users/self` are restricted to moderators only. Moderators have unrestricted access to all endpoints. Only a moderator can promote another user to a moderator role.

Note: Restrictions on endpoints can be bypassed by passing the `secret` header in the request. Ask someone on authentication for the secret or see pinned message on authentication channel on Discord.
