let ClientSecret = {
  "web": {
    "client_id": "84402170629-hregoe4kevhm4brpr7cane4a2bufc6j5.apps.googleusercontent.com",
    "project_id": "searchaddress-1350",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://accounts.google.com/o/oauth2/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "VYEzvlQD3Sox3bSEpy8gaqCC",
    "redirect_uris": [
      "http://localhost:8080/callback",
      "http://officebob-order.herokuapp.com/callback"
    ],
    "javascript_origins": [
      "http://officebob-order.herokuapp.com",
      "http://localhost:8080"
    ]
  }
};

let request = require('request');

const REDIRECT_ENDPOINT = '/callback';
const SCOPE             = 'https://www.googleapis.com/auth/admin.directory.user.readonly https://www.googleapis.com/auth/admin.directory.group.readonly https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/plus.login profile email';

function LoginError(code, message) {
  this.code = code;
  this.message = message || 'Authentication error';
}

LoginError.prototype = new Error();
LoginError.prototype.constructor = LoginError;

function clientValidation(accessToken) {
  return Promise.resolve(accessToken);
}

function checkId(accessToken) {
  return new Promise((resolve, reject) => {
    request.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Contents-Type': 'application/json; charset=UTF-8',
        'Authorization': `Bearer ${accessToken}`
      }
    }, (err, response, body) => {
      console.log(body);
      if (err) {
        reject(err);
      } else if (response.statusCode == 200) {
        resolve({ accessToken: accessToken, profile: JSON.parse(body) });
      } else {
        reject(response.statusCode);
      }
    });
  });
}

function loginCallback(req, res) {
  let code = req.query.code || null;

  request.post('https://www.googleapis.com/oauth2/v4/token', {
    form: {
      code: code,
      client_id: ClientSecret.web.client_id,
      client_secret: ClientSecret.web.client_secret,
      redirect_uri: `http://${req.headers.host}${REDIRECT_ENDPOINT}`,
      grant_type: 'authorization_code'
    }
  }, (err, response, body) => {
    if (err) {
      return console.error(err);
    }

    let tokenInfo = JSON.parse(body);

    clientValidation(tokenInfo.access_token)
      .then(checkId)
      .then(data => {
        console.log('===>', req.session);
        req.session[global.AUTHENTICATE] = Object.assign({}, data.profile);
        // 사용자 프로필 정보 자장 로직
        res.redirect('/');
      })
      .catch(err => {
        if (!!err.code) {
          if (err.code == 401) {
            res.render('401');
          } else {
            res.sendStatus(err.code)
          }
        } else {
          res.sendStatus(500);
        }
      });
  });
}

function requestLogin(req, res) {
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${ClientSecret.web.client_id}&redirect_uri=http://${req.headers.host}${REDIRECT_ENDPOINT}&scope=${SCOPE}`);
}

function page(req, res) {
  res.render('login', { } );
}

module.exports = {
  page,
  requestLogin,
  loginCallback
};
