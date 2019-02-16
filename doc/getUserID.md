# Get user by id

Return user with corresponding ID.

**URL :** `/users/:id`

**Method :** `GET`

## Success Reponse

**Code :** `200 OK`

**Body :**

```json
{
	"_id": "5c6659554995bd0017faee8b",
	"email": "realperson@gmail.com",
	"password": "$2a$10$XIs/xj.K61ZPePyvT.Ha1eikd5W0eCHxXffQmAHKg9QiHFI4Uu/8m",
	"type": "Applicant",
	"verified": true,
	"__v": 0
}
```

## Error Response

**Condition :** User does not exist.

**Code :** `404 Not Found`

**Body :**

```json
{
	"code": "ResourceNotFound",
	"message": "There is no user with the id 5c6659554995bd0017faee8b"
}
```
