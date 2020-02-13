const express = require('express');
const port = process.env.PORT || 3000;
const app = express();
const redis = require("redis");
const fetch = require('node-fetch');
require('dotenv').config()

const client = require('redis').createClient(process.env.REDIS_URL);

let skipped = 0;

let date = new Date();
if (date.getDay() == 0 || date.getDay() == 6) date.setDate(date.getDate() + 1);
console.log(date.toLocaleDateString([], { year: "numeric", month: "2-digit", day: "2-digit" }))
getMenu(date, 0)

function getMenu(d, index) {
    dParse = d.toLocaleDateString([], { year: "numeric", month: "2-digit", day: "2-digit" })
    fetch(`https://www.sodexo.fi/ruokalistat/output/daily_json/156/${dParse}`)
        .then(response => response.json())
        .then(data => {
            //console.log(data)
            let i = 1;
            arr1 = []
            if (index == 0) {
                while (true) {
                    let course = data.courses[i]
                    if (course && (course.category != 'From the bean' && course.category != 'From the garden' && course.category != 'Green corner')) {

                        arr1.push(course.category)
                    } else if (!course) {
                        break
                    }
                    i++
                }
                i = 1;
                client.set('courses', JSON.stringify(arr1));
            }

            arr = []
            arr.push(d.toLocaleDateString('fi-FI', { weekday: "short" }))
            if (data.courses) {
                skipped = 0;
                while (true) {
                    let course = data.courses[i]
                    if (course && (course.category != 'From the bean' && course.category != 'From the garden' && course.category != 'Green corner')) {
                        arr.push(`${course.title_fi} (${course.properties})`)
                    } else if (!course) {
                        break
                    }
                    i++
                }
                client.set(dParse, JSON.stringify(arr));
            } else {
                skipped++;
                if (skipped >= 3){
                    return true
                }
            }
        })
        .then((a) => {
            if (index < 20 && !a) {
                d.setDate(date.getDate() + 1)
                while (date.getDay() == 0 || date.getDay() == 6) {
                    d.setDate(date.getDate() + 1)
                }
                getMenu(d, index + 1)
            }
        })
        .catch(err => {
            console.log(err)
        })
}

app.get('/', function (req, res) {
    client.keys('*', function (err, keys) {
        if (err) return console.log(err);

        keys.sort()
        for (var i = 0, len = keys.length; i < len; i++) {
            console.log(keys[i]);
        }
    });
    client.get("2020-02-10", function (err, reply) {
        res.send(reply)
    });
});

app.listen(port, function () {
    console.log(`App listening on port ${port}`);
});