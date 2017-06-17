'use strict';
let http = require('http');

function getWeatherInfo() {
    return new Promise(function (resolve, reject) {
        const LOCATION = "Vancouver,Ca";
        const UNITS = 'metric';
        const APIKEY = "8631c0cc9427f886008c85b4a9e45082";
        let URL = 'http://api.openweathermap.org/data/2.5/weather?q='+ LOCATION +'&units='+ UNITS +'&appid='+ APIKEY;

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