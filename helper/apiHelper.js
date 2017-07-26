'use strict';
let http = require('http');

function getWeatherInfo(location, apiKey) {
    return new Promise(function (resolve, reject) {
        const UNITS = 'metric';
        let URL = 'http://api.openweathermap.org/data/2.5/weather?q='+ location +'&units='+ UNITS +'&appid='+ apiKey;

        http.get(URL, function(response) {
            let body = '';
            response.setEncoding('utf8');
            response.on('data', function(chunk) {
                body += chunk;
            });
            response.on('end', function () {
                let error;
                if (response.statusCode === 200) {
                    resolve(JSON.parse(body));
                } else {
                    error = new Error();
                    error.code = response.statusCode;
                    error.message = response.statusMessage;
                    error.innerError = JSON.parse(body.trim()).error;
                    reject(error);
                }
            });
        }).on('error', function(e) {
            reject(e);
        });
    });
}

exports.getWeatherInfo = getWeatherInfo;