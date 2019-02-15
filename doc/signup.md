# Signup new user

Creates new user with given email, password and type.

**URL :** `/signup`

**Method :** `POST`

**Input :**
```json
{
    "email": "[valid email]",
    "password": "[valid password]",
    "type": "[Applicant || Recruiter]"
}
```

## Success Reponse

**Code :** `201 Created`

**Body :**
```json
{
    "_id_": "[ID of new user]",
}
```