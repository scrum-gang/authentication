# Delete user by token

Deletes a user with the corresponding token.

**URL :** `/users/self`

**Method :** `DELETE`

**Header :**

```json
"Content-type": "application/json"
"Authorization": "Bearer [valid token]"
```

## Success Reponse

**Code :** `204 No Content`

## Error Response

**Condition :** Wrong token.

**Code :** `401 Unauthorized`

**Body :**

```json
{
    "code": "InvalidCredentials",
    "message": "caused by JsonWebTokenError: invalid signature"
}
```
