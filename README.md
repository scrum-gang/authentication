# authboiis

### Quick Start

```bash
npm install
npm start
```

### Heroku link

https://authboiis.herokuapp.com/

### Endpoints

- GET [/users](https://authboiis.herokuapp.com/users)
  Shows all users
- GET /users/:id
  Shows all user info
- PUT /users/:id
  updates provided fields
- DELETE (Protected) /users/:id
  Deletes user
- POST /signup
  Creates account {email, password, type}
- POST /login
  input: email, password
  output: jwt(id, email, type)
