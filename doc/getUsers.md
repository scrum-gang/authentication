# Get users

Return list of all users.

**URL :** `/users`

**Method :** `GET`

```json
"Content-type": "application/json"
"Authorization": "Bearer [valid Moderator token]"
```

## Success Reponse

**Code :** `200 OK`

**Body :**

```json
[
    {
        "_id": "5c6659554995bd0017faee8b",
        "email": "realperson@gmail.com",
        "password": "$2a$10$XIs/xj.K61ZPePyvT.Ha1eikd5W0eCHxXffQmAHKg9QiHFI4Uu/8m",
        "type": "Applicant",
        "verified": true,
        "__v": 0
    },
    {
        "_id": "5c66611f4995bd0017faee8c",
        "email": "realperson2@gmail.com",
        "password": "$2a$10$4YfEm.WnesRWyPafbwP.keY5Th0UnyGS6utADfgjpas.PavH0U7Uu",
        "type": "Applicant",
        "verified": true,
        "__v": 0
    },
    {
        "_id": "5c6662d14995bd0017faee8d",
        "email": "a246@realmail.com",
        "password": "$2a$10$eUQxLcx2sjCKRPQwj9GrBudTlFSInsgAreL7y8ImF3J8srURoZQN6",
        "type": "Applicant",
        "verified": false,
        "__v": 0
    }
]
```
