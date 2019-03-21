# User Model

Details all the fields available in the User model.

## User specified

- `email` - Type: `String`, Required: `true`
- `password` - Type: `String`, Required: `true`
- `type` - Type: `String`, Required: `true`, Allowed values: `Applicant, Recruiter, Moderator`
- `name` - Type: `String`, Required: `false`
- `address` - Type: `String`, Required: `false`
- `github` - Type: `String`, Required: `false`
- `linkedin` - Type: `String`, Required: `false`
- `stackoverflow` - Type: `String`, Required: `false`

## System specified

- `id` - Type: `String`, unique user ID
- `verified` - Type: `Boolean`, whether the user has verified their email
- `created_at` - Type: `Date`, account creation date
- `updated_at` - Type: `Date`, last account update
