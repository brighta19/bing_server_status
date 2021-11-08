import fetch from "node-fetch";
import cheerio from "cheerio";

const ORIGIN_URL = "https://itstatus.binghamton.edu:8443";
const BING_EVENTS_URL = "https://itstatus.binghamton.edu:8443/search/events";
const WAIT_MS = 60000; // milliseconds
const EventType = {
    MAINTENANCE: "maintenance",
    INCIDENT: "incident",
};
const EventStatus = {
    PLANNING: "planning",
    COMPLETED: "completed",
    CLOSED: "closed",
}

let lastEvent = { id: 263 };


async function getServices() {
    let services = new Map();

    let result = await fetch(ORIGIN_URL);
    let html = await result.text();

    let $ = cheerio.load(html);
    let tbody = $("tbody")[0];
    let rows = tbody.children.filter(node => node.type === "tag" && node.name === "tr");

    for (let i = 1; i < rows.length; i++) {
        let cells = rows[i].children.filter(node => node.type === "tag" && node.name === "td");

        let span1 = cells[1].children.find(node => node.type === "tag" && node.name === "span");
        let service = span1.children[0].data;

        let span2 = cells[0].children.find(node => node.type === "tag" && node.name === "span");
        let status = span2.attribs.title;

        if (i==1) console.log(span2.attribs.class.search());


        services.set(service, {
            status: status === "Service is operating normally.",
            statusText: status
        });
    }

    return services;
}

async function getRecentEvents() {
    let recentEvents = [];

    let result = await fetch(BING_EVENTS_URL);
    let html = await result.text();
    let $ = cheerio.load(html);

    let body = $("body")[0];
    let divs = body.children.filter(child => {
        return child.type === "tag"
            && child.name === "div"
            && child.attribs.class === "row";
    });

    for (let i = 5; i < 15; i++) {
        let div = divs[i].children[1];

        let id = div.children[1].children[0].attribs.href.match(/id=(\d+)/)[1];
        let link = ORIGIN_URL + div.children[1].children[0].attribs.href;
        let date = div.children[1].children[0].children[0].data;
        let type = div.children[3].children[1].data.trim();
        let status = div.children[5].children[1].data.trim();
        let description = div.children[7].children[1].data.trim();

        recentEvents.push({ id, link, date, type, status, description });
    }

    return recentEvents;
}

function binarySearch(key, array, startingIndex = 0) {
    const index = Math.floor(array.length / 2);
    const mid = array[index];

    if (key == mid) {
        return startingIndex + index;
    }
    else if (array.length > 1) {
        if (key > mid) {
            return binarySearch(key, array.slice(0, index), startingIndex);
        }
        else {
            return binarySearch(key, array.slice(index + 1, array.length), startingIndex + index + 1);
        }
    }
    else {
        return -1;
    }
}

function update() {
    getRecentEvents().then(events => {
        let index = binarySearch(lastEvent.id, events.map(o => o.id));
        if (index >= 0) {
            let newEvents = events.slice(0, index);
            if (newEvents.length > 0) {
                onNewEvents(newEvents);
                lastEvent = newEvents[0];
            }
        }
    });
}

function onNewEvents(events) {
    console.log("New events!");
    console.log(JSON.stringify(events));
}

setInterval(update, WAIT_MS);
update();
