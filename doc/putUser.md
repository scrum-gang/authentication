# Update user by id

Updates a user with the corresponding ID.

**URL :** `/users/:id`

**Method :** `PUT`

**Header :**

```json
    "Content-Type": "application/json"
```

**Input :**

```json
{
	"email": "[new email]",
	"password": "[new password]",
	"type": "[new type]"
}
```

## Success Reponse

**Code :** `200 OK`

## Error Response

**Condition :** If user does not exist.

**Code :** `404 Not Found`

**Body :**

```json
{
    "code": "ResourceNotFound",
    "message": "There is no user with the id [id]"
}
}
```

**Condition :** Trying to change `verified` field.

**Code :** `401 Unauthorized`

**Body :**

```json
{
    "code": "Unauthorized",
    "message": "Cannot modify verified field."
}
}
```
