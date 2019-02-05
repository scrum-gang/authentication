# authboiis

### Quick Start

```bash
git clone https://github.com/scrum-gang/authentication.git
cd authentication
npm install
npm start

```

### Heroku link

(login not working on heroku, i think its timing out, will look into it)
I can ngrok my computer for now if needed
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
