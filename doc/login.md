# Login existing user

Returns session token for existing User on succesful login.

**URL :** `/login`

**Method :** `POST`

**Input :**
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
    "iat": [Token issued at],
    "exp": [Token expiry],
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