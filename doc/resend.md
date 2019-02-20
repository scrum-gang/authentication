# Resend verification email for user

Resends the verfication email for an unverified user.

**URL :** `/resend`

**Method :** `POST`

**Header :**

```json
"Content-type": "application/json"
```

**Input :**

```json
{
    "email": "[valid email]",
}
```

## Success Reponse

**Code :** `200 OK`

## Error Response

**Condition :** If user is already verified.

**Code :** `400 Bad Request`

**Body :**

```json
{
    "code": "BadRequest",
    "message": "User is already verified."
}
```

**Condition :** If user is does not exist.

**Code :** `400 Bad Request`

**Body :**

```json
{
    "code": "BadRequest",
    "message": "No user with given email"
}
```
