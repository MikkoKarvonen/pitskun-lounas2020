const express = require('express');
const port = process.env.PORT || 3000;
const app = express();
const redis = require("redis");
const fetch = require('node-fetch');
require('dotenv').config()

const client = require('redis').createClient(process.env.REDIS_URL);

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
            let html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>';
            html += `<table><tr>`
            let i = 1;
            if (index == 0) {
                html += '<tr><th>Päivä</th>'
                while (true) {
                    let course = data.courses[i]
                    if (course && (course.category != 'From the bean' && course.category != 'From the garden' && course.category != 'Green corner')) {
                        html += `<th>${course.category}</th>`
                    } else if (!course) {
                        break
                    }
                    i++
                }
                html += '</tr><tr>'
                i = 1;
            }
            html += `<td>${d.toLocaleDateString('fi-FI', { weekday: "short" })}</td>`
            while (true) {
                let course = data.courses[i]
                if (course && (course.category != 'From the bean' && course.category != 'From the garden' && course.category != 'Green corner')) {
                    html += `<td>${course.title_fi} (${course.properties})</td>`
                } else if (!course) {
                    html += '</tr></table>'
                    break
                }
                i++
            }
            html += '</body></html>'
            client.set(dParse, JSON.stringify(html));
        })
        .catch(err => {
            console.log(err)
        })
}

app.get('/', function (req, res) {
    client.get("2020-02-10", function (err, reply) {
        res.send(reply)
    });
});

app.listen(port, function () {
    console.log(`App listening on port ${port}`);
});