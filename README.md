# authboiis

### Quick Start

```bash
git clone https://github.com/scrum-gang/authentication.git
cd authentication
npm install
npm start

```

### Heroku link

Heroku deployment working now, deploys on both staging and production environments:
- Staging: https://jobhub-authentication-staging.herokuapp.com/ 
- Production: https://jobhub-authentication.herokuapp.com/ 

Staging deploys from development branch, production from master.

### Endpoints

All endpoints require header "Content-type": "application/json"

1. GET [/users](https://authboiis.herokuapp.com/users)

- Output: [{"_id":"5c5b7085e0f33343ed802ac1","email":"davidritch96@gmail.com","password":"$2a$10$jhR96iulNg2hCqrkehyEK.08I.r1PCmEbqf1cZeKn97LOlteMaoyG","type":"account","verified":true,"__v":0},{"_id":"5c5b75ceb709531fb0e4031a","email":"llcec753@gmail.com","password":"$2a$10$Zn95.vQOTxQeo9pGAPA3JOR8v0rhl9nNdeNZk/7r.hoEOXv5ilgs6","type":"fjdals","verified":false,"__v":0}]

2. GET /users/:id

- Output: {"\_id":"5c5b7085e0f33343ed802ac1","email":"davidritch96@gmail.com","password":"$2a$10\$jhR96iulNg2hCqrkehyEK.08I.r1PCmEbqf1cZeKn97LOlteMaoyG","type":"account","verified":true,"\_\_v":0}

3. PUT /users/:id

- input: {"email": new_email, "password": new_password, "type": new_type, "git": new_git, "linkedin": new_linkedin}
- Any of the fileds can be omitted. "verified" cannot be modified from this endpoint.

4. DELETE (Protected) /users/:id

- Deletes user. Requires header "Authorization" : "Bearer [INSERT_JWT_FROM_/LOGIN_ENDPOINT]"

5. POST /signup

- input: {"email": email, "password": password, "type" : "Applicant" || "Recruiter"}

6. POST /login

- input: {"email": "tamere@enshorts.com", "password" : "ericklikes2Dgirls"}
- output: {"iat" : token issued at, "exp" : token expiration, "token": JWT containing user.id user.email user.type}
