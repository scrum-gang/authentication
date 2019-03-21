# Get user from token

Returns corresponding user given JWT token.

**URL :** `/users/self`

**Method :** `GET`

**Header :**

```json
"Content-type": "application/json"
"Authorization": "Bearer [token]"
```

## Success Reponse

**Code :** `200 OK`

**Body :**

```json
{
    "_id": "[User ID]",
    "email": "[User email]",
    "password": "[User password]",
    "type": "[User type]",
    "verified": true
}
```

## Error Response

**Condition :** If token is wrong.

**Code :** `401 Unauthorized`

**Body :**

```json
{
    "code": "InvalidCredentials",
    "message": "caused by JsonWebTokenError: invalid signature"
}
```
