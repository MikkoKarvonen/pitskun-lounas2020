const express = require('express');
const port = process.env.PORT || 3000;
const app = express();
const redis = require("redis");
const fetch = require('node-fetch');
require('dotenv').config()

const client = require('redis').createClient(process.env.REDIS_URL);

let skipped = 0;
let courses = []
let dayData = []
let html = ''

let date = new Date();
while (date.getDay() == 0 || date.getDay() == 6) {
    date.setDate(date.getDate() + 1)
}
getMenu(date, 0)

function getMenu(d, index) {
    dParse = d.toLocaleDateString([], { year: "numeric", month: "2-digit", day: "2-digit" })
    fetch(`https://www.sodexo.fi/ruokalistat/output/daily_json/156/${dParse}`)
        .then(response => response.json())
        .then(data => {
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
                courses = arr1;
            }

            if (data.courses) {
                obj = {}
                arr = []
                obj.day = d.toLocaleDateString('fi-FI', { weekday: "short" })
                obj.date = d.getDay()
                obj.week = getWeekNumber(d)
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
                obj.meals = arr
                dayData.push(obj)
            } else {
                skipped++;
                if (skipped >= 3) {
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
            } else {
                html += `
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <style>
                html, body{
                    background: #F7EBEC;
                    font-family: sans-serif;
                    color: #1D1E2C;
                    overflow: autoa;
                }
                table {
                    padding: 15px;
                    border-spacing: 10px;
                    border-collapse: separate;
                }
                th, .day{
                    font-size: 22px;
                    font-weight: 700;
                }
                th, .day, td{
                    background: #F7EBEC;
                    padding: 10px;
                    display: flexx;
                    justify-content: centexr;
                    text-align: center;
                    align-items: centerx;
                    box-shadow: -2px -2px 5px rgba(255, 255, 255, 1),
                        3px 3px 5px rgba(0, 0, 0, 0.1);
                    border-radius: 10px;
                }
                td {
                    box-shadow: inset -2px -2px 5px rgba(255, 255, 255, 1),
                        inset 3px 3px 5px rgba(0, 0, 0, 0.1);
                    text-shadow: 1px 1px 3px #ccbabb;
                    font-weight: 500;
                }
                .none{
                    box-shadow: none;
                }
                .badge{
                    width: 40px;
                    heigth: 40px;
                    border-radius: 100px;
                }
                .bottom{
                    display: flex;
                    justify-content: center;
                }
                </style>
                <table><tr><td class="none"></td>`
                courses.map(a => {
                    html += `<th>${a}</th>`
                })
                html += '</tr>'
                let lastDay = 999;
                dayData.map(a => {
                    if (lastDay > a.date) {
                        html += `<tr><th colspan="6" class="day">Viikko ${a.week}</th>`
                    }
                    lastDay = a.date
                    html += `<tr><th class="day">${a.day}</th>`
                    a.meals.map(b => {
                        html += `<td>${b}</td>`
                    })
                    html += `</tr>`
                })

                html += `
                </table>
                <div class="bottom">
                    <div class="day badge">
                        <a href="https://github.com/MikkoKarvonen/pitskun-lounas2020">{}</a>
                    </div>
                </div>`
            }
        })
        .catch(err => {
            console.log(err)
        })
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

app.get('/', function (req, res) {
    res.send(html)
})

app.listen(port, function () {
    console.log(`App listening on port ${port}`);
});