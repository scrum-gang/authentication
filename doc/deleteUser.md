# Delete user by id

Deletes a user with the corresponding ID.

**URL :** `/users/:id`

**Method :** `DELETE`

**Header :**

```json
"Content-type": "application/json"
"Authorization": "Bearer [valid Moderator token]"
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
