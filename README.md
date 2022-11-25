# darklight-back-end

## Environment variables

```text
COOKIE_SESSION_SECRET=cookie-secret
REFRESH_TOKEN_SECRET=refresh-secret
ACCESS_TOKEN_SECRET=access-secret
REFRESH_TOKEN_EXPIRES_IN=1d
ACCESS_TOKEN_EXPIRES_IN=30m

FACEBOOK_OAUTH_CLIENT_ID=
FACEBOOK_OAUTH_CLIENT_SECRET=
FACEBOOK_OAUTH_CALLBACK_URL=http://localhost:5002/api/auth/signup/facebook/redirect
FACEBOOK_OAUTH_CALLBACK_URL_FOR_LOGIN=http://localhost:5002/api/auth/login/facebook/redirect

GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_CALLBACK_URL=http://localhost:5002/api/auth/signup/google/redirect
GOOGLE_OAUTH_CALLBACK_URL_FOR_LOGIN=http://localhost:5002/api/auth/login/google/redirect

TWITTER_OAUTH_CLIENT_KEY=
TWITTER_OAUTH_CLIENT_KEY_SECRET=
TWITTER_OAUTH_CALLBACK_URL=http://localhost:5002/api/auth/signup/twitter/redirect
TWITTER_OAUTH_CALLBACK_URL_FOR_LOGIN=http://localhost:5002/api/auth/login/twitter/redirect

OAUTH_SIGNUP_SUCCESS_REDIRECT_URL=http://localhost:3000/auth/signup
OAUTH_SIGNUP_FAILURE_REDIRECT_URL=http://localhost:3000/auth/signup
OAUTH_LOGIN_SUCCESS_REDIRECT_URL=http://localhost:3000
OAUTH_LOGIN_FAILURE_REDIRECT_URL=http://localhost:3000/auth/login

MONGODB_CONNECT_URL=

SMTP_HOST=
SMTP_PORT=
SMTP_USERNAME=
SMTP_PASSWORD=
FROM_EMAIL=

FRONTEND_BASE_URL=http://localhost:3000
```
