# Login existing user

Returns session token for existing User on succesful login.

**URL :** `/login`

**Method :** `POST`

**Header :**

```json
"Content-type": "application/json"
```

**Body :**

```json
{
    "email": "[valid email]",
    "password": "[valid password]"
}
```

## Success Reponse

**Code :** `200 OK`

**Body :**

```json
{
    "user": {
        "_id": "[user ID]",
        "email": "[email]",
        "password": "[hashed password]",
        "type": "[user type]",
        "verified": true,
        "created_at": "[account creation date]",
        "updated_at": "[last account update]",
        "__v": 0
    },
    "iat": "[Token issued at]",
    "exp": "[Token expiry]",
    "token": "[JWT token]"
}
```

## Error Response

**Condition :** If `username` or `password` is wrong.

**Code :** `401 Unauthorized`

**Body :**

```json
{
    "code": "Unauthorized",
    "message": "Authentication failed."
}
```

**Condition :** If user is unverified.

**Code :** `401 Unauthorized`

**Body :**

```json
{
    "code": "Unauthorized",
    "message": "Unverified user."
}
```
