# Logout user

Logs out user given valid JWT token.

**URL :** `/logout`

**Method :** `POST`

**Header :**

```json
"Content-type": "application/json"
"Authorization": "Bearer [token]"
```

## Success Reponse

**Code :** `200 OK`

## Error Response

**Condition :** If token is invalid.

**Code :** `401 Unauthorized`

**Body :**

```json
{
    "code": "Unauthorized",
    "message": "Token expired. Please log back in."
}
```
