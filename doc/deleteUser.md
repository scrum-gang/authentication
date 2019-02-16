# Delete user by id

Deletes a user with the corresponding ID. Requires corresponding JWT token.

**URL :** `/users/:id`

**Method :** `DELETE`

**Header :**

```json
    "Authorization": "Bearer [token]"
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
